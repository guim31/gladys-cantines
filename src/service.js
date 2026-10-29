// -----------------------------------------------------------------------------
// The integration at runtime: the sources read, their menus, the timer, the
// devices offered in the Discover tab, the states of the menus added to
// Gladys, and the scene triggers.
//
// Data flow: every city ticked in the configuration, plus every city with a
// menu added to Gladys, is read every few hours (one request per city).
// Every menu of the ticked cities is offered in the Discover tab; the ones
// the user adds are the "watched" menus: states, widget, triggers and scene
// action. A short tick recomputes today's states (the day changes at
// midnight, Paris time) and fires the triggers in their time windows.
// -----------------------------------------------------------------------------

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createLogger } from '@gladysassistant/integration-sdk';
import { DEFAULT_CONFIG, normalizeConfig } from './config.js';
import { addDays, parisDate, parisMinutes } from './dates.js';
import {
  MENU_TYPE,
  buildMenuDevice,
  dishText,
  mealText,
  menuPlatformId,
  menuStates,
  noMealReason,
} from './devices.js';
import { REPORTS, TEXT, lines, render, say } from './messages.js';
import { COURSES, SOURCES, SOURCE_KEYS, readSource } from './sources.js';
import { clip, hasWord } from './text.js';

const logger = createLogger({ name: 'cantines' });

// Today's states are recomputed this often (the day changes at midnight).
export const TICK_MS = 10 * 60 * 1000;
// A source that failed is read again after this delay, not at every tick.
export const RETRY_MS = 30 * 60 * 1000;
// Unchanged states (a menu with no meal all week-end) are sent again this
// often, or the dashboard shows "no recent value" after 48 hours.
export const HEARTBEAT_MS = 6 * 3600 * 1000;

export const TRIGGERS = {
  VEGETARIAN: 'vegetarian_menu',
  WATCHED_DISH: 'watched_dish',
};
// When the triggers fire, in minutes since midnight (Paris): today's menu in
// the morning, tomorrow's in the evening. A container started inside a
// window fires what it has not fired yet (remembered in /data).
export const WINDOWS = [
  { day: 'today', offset: 0, from: 7 * 60, to: 10 * 60 },
  { day: 'tomorrow', offset: 1, from: 18 * 60, to: 21 * 60 },
];
export const DAYS = WINDOWS.map((window) => window.day);

export const WIDGET_KEY = 'menus';
const FIRED_FILE = 'fired.json';

/** One source at runtime: its menus, and how its last readings went. */
class Source {
  constructor(key) {
    this.key = key;
    this.source = SOURCES[key];
    this.menus = null; // Map menu id → { id, name, meals, lastDate }
    this.okAt = null;
    this.failedAt = null;
    this.error = null;
  }
}

export class Canteens {
  /**
   * @param {object} options
   * @param {object} options.gladys GladysIntegration (or the SDK's fake)
   * @param {typeof fetch} [options.fetch]
   * @param {() => number} [options.now]
   * @param {boolean} [options.timers] false in the tests: they call tick()
   * @param {string|null} [options.dataDir] where the fired triggers are remembered
   */
  constructor({
    gladys,
    fetch = globalThis.fetch,
    now = Date.now,
    timers = true,
    dataDir = '/data',
  }) {
    this.gladys = gladys;
    this.fetch = fetch;
    this.now = now;
    this.useTimers = timers;
    this.dataDir = dataDir;
    this.config = normalizeConfig(DEFAULT_CONFIG);
    this.sources = new Map(); // key → Source
    this.fired = new Set();
    this.discoveredSignature = null;
    this.publishFailed = false;
    this.discoveryFailed = false;
    this.fireFailed = false;
    this.saveFailed = false;
    this.timer = null;
    this.stopped = false;
    this.running = null;
    this.loading = Promise.resolve();
  }

  // --- lifecycle --------------------------------------------------------------

  async start(config) {
    this.config = config;
    await this.loadFired();
    this.schedule();
    logger.info(
      `Started: ${config.cities.length} city(ies) chosen, ${this.watched().length} menu(s) added`,
    );
    // The first reading in the background: the widget and the scene action
    // wait for it.
    this.loading = this.refresh({ discover: true });
  }

  /** Gladys restarted: everything again, the states included. */
  async resync(config) {
    this.config = config;
    this.gladys.forgetPublishedStates?.();
    await this.refresh({ discover: true });
  }

  async reconfigure(config) {
    const languageChanged = config.language !== this.config.language;
    this.config = config;
    if (languageChanged) {
      // The state texts follow the language.
      this.gladys.forgetPublishedStates?.();
    }
    await this.refresh({ discover: true });
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.timer);
    await this.running;
  }

  schedule() {
    if (!this.useTimers || this.stopped) {
      return;
    }
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.timer.unref?.();
  }

  // --- devices ----------------------------------------------------------------

  deviceId(sourceKey, menuId) {
    return this.gladys.externalIds(MENU_TYPE, menuPlatformId(sourceKey, menuId)).device;
  }

  /** The source key of a device created in Gladys, from its params or its external id. */
  sourceOfDevice(device) {
    const param = device?.params?.find?.((p) => p.name === 'source')?.value;
    if (SOURCE_KEYS.includes(param)) {
      return param;
    }
    const id = String(device?.external_id ?? '');
    return SOURCE_KEYS.find((key) => id.includes(`:${key}-`)) ?? null;
  }

  /** The menus added to Gladys: `{ deviceId, key, name }[]`. */
  watched() {
    return (this.gladys.devices ?? [])
      .map((device) => ({
        deviceId: device.external_id,
        key: this.sourceOfDevice(device),
        name: device.name,
      }))
      .filter((entry) => entry.key);
  }

  /** The sources to read: the ones ticked, and the ones of the menus added. */
  activeKeys() {
    const keys = new Set([...this.config.cities, ...this.watched().map((entry) => entry.key)]);
    return SOURCE_KEYS.filter((key) => keys.has(key));
  }

  source(key) {
    if (!this.sources.has(key)) {
      this.sources.set(key, new Source(key));
    }
    return this.sources.get(key);
  }

  /**
   * The menu of a device: `{ source, menu }`. `menu` is null while its
   * source has never been read; a menu the source no longer lists is empty
   * (no meal published).
   */
  lookup(deviceId) {
    const entry = this.watched().find((w) => w.deviceId === deviceId);
    const key = entry?.key ?? SOURCE_KEYS.find((k) => String(deviceId).includes(`:${k}-`));
    if (!key) {
      return null;
    }
    const source = this.source(key);
    if (!source.menus) {
      return { source, menu: null };
    }
    for (const menu of source.menus.values()) {
      if (this.deviceId(key, menu.id) === deviceId) {
        return { source, menu };
      }
    }
    return { source, menu: { id: null, meals: new Map(), lastDate: null } };
  }

  today() {
    return parisDate(this.now());
  }

  /** Waits for the first reading (at most `ms`), for a widget or a scene action asked at start. */
  async firstReading(ms = 15000) {
    let timer;
    await Promise.race([
      this.loading,
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      }),
    ]);
    clearTimeout(timer);
  }

  async publishDiscovered({ force = false } = {}) {
    const devices = [];
    for (const key of this.config.cities) {
      const source = this.sources.get(key);
      for (const menu of source?.menus?.values() ?? []) {
        devices.push(buildMenuDevice(this.gladys, key, source.source, menu, this.config.language));
      }
    }
    const signature = JSON.stringify(devices.map((d) => [d.external_id, d.name, d.features]));
    if (!force && signature === this.discoveredSignature) {
      return;
    }
    try {
      await this.gladys.publishDiscoveredDevices(devices);
      this.discoveredSignature = signature;
      if (this.discoveryFailed) {
        this.discoveryFailed = false;
        logger.info('Discovered menus published again');
      }
    } catch (err) {
      if (!this.discoveryFailed) {
        logger.warn(`Cannot publish the discovered menus: ${err.message}`);
      }
      this.discoveryFailed = true;
    }
  }

  async publish(states) {
    if (states.length === 0) {
      return;
    }
    try {
      await this.gladys.publishChangedStates(states, { heartbeat: HEARTBEAT_MS });
      if (this.publishFailed) {
        this.publishFailed = false;
        logger.info('States published again');
      }
    } catch (err) {
      // Gladys restarting: said once, the next tick sends them again.
      if (!this.publishFailed) {
        logger.warn(`Cannot publish ${states.length} state(s): ${err.message}`);
      }
      this.publishFailed = true;
    }
  }

  statesOf(source, menu) {
    return menuStates(
      this.gladys,
      source.key,
      source.source,
      menu,
      this.today(),
      this.config.language,
    );
  }

  refreshWidget() {
    this.gladys.requestWidgetRefresh?.(WIDGET_KEY)?.catch?.(() => {});
  }

  /** A device was just added in Gladys: its states, all of them, now. */
  async onDeviceCreated(device) {
    const found = this.lookup(device?.external_id);
    if (found?.menu) {
      await this.publish(this.statesOf(found.source, found.menu));
    }
    this.refreshWidget();
  }

  // --- reading ------------------------------------------------------------------

  /** Reads every active source now (start, scan, new configuration). */
  refresh({ discover = false } = {}) {
    return this.run(() => this.cycle({ readAll: true, discover }));
  }

  /** The timer: reads the sources that are due, then states and triggers. */
  tick() {
    return this.run(() => this.cycle({ readAll: false, discover: false }));
  }

  /** One cycle at a time; a cycle asked during another one runs right after it. */
  run(work) {
    const previous = this.running ?? Promise.resolve();
    const next = previous.then(work).catch((err) => logger.warn(`Refresh failed: ${err.message}`));
    this.running = next;
    next.finally(() => {
      if (this.running === next) {
        this.running = null;
      }
    });
    return next;
  }

  isDue(source) {
    const now = this.now();
    if (source.okAt === null && source.failedAt === null) {
      return true;
    }
    if (source.error) {
      return now - source.failedAt >= RETRY_MS;
    }
    return now - source.okAt >= this.config.refreshMs;
  }

  async cycle({ readAll, discover }) {
    let read = false;
    for (const key of this.activeKeys()) {
      const source = this.source(key);
      if (readAll || this.isDue(source)) {
        read = (await this.readOne(source)) || read;
      }
    }
    if (read || discover) {
      await this.publishDiscovered({ force: discover });
    }
    const states = [];
    for (const entry of this.watched()) {
      const found = this.lookup(entry.deviceId);
      if (found?.menu) {
        states.push(...this.statesOf(found.source, found.menu));
      }
    }
    await this.publish(states);
    await this.fireTriggers();
  }

  /** Reads a source; a failure is logged once, until it works again. */
  async readOne(source) {
    try {
      const menus = await readSource(source.key, this.fetch, this.today());
      for (const menu of menus.values()) {
        menu.lastDate = [...menu.meals.keys()].sort().at(-1) ?? null;
      }
      source.menus = menus;
      source.okAt = this.now();
      if (source.error) {
        logger.info(`${source.source.name}: data back`);
      }
      source.error = null;
      source.failedAt = null;
      logger.debug(`${source.source.name}: ${menus.size} menus read`);
      return true;
    } catch (err) {
      if (!source.error) {
        logger.warn(`${source.source.name}: data unavailable: ${err.message}`);
      }
      source.error = err.message;
      source.failedAt = this.now();
      return false;
    }
  }

  // --- scene triggers -------------------------------------------------------------

  /** The meal of a watched menu on a day ('today' or 'tomorrow'): `{ found, date, meal }`. */
  mealOn(deviceId, day) {
    const window = WINDOWS.find((w) => w.day === day) ?? WINDOWS[0];
    const date = addDays(this.today(), window.offset);
    const found = this.lookup(deviceId);
    return { found, date, meal: found?.menu?.meals.get(date) ?? null };
  }

  /** The events of one watched menu for one day. */
  menuEvents(entry, day) {
    const { date, meal } = this.mealOn(entry.deviceId, day);
    if (!meal) {
      return [];
    }
    const language = this.config.language;
    const base = {
      menu: entry.deviceId,
      day,
      menu_name: entry.name,
      date,
      menu_text: clip(mealText(meal, language), 1000),
    };
    const events = [];
    if (meal.vegetarian === true) {
      events.push({ key: TRIGGERS.VEGETARIAN, data: base });
    }
    const dishes = meal.courses
      ? COURSES.flatMap((course) => meal.courses[course] ?? [])
      : [meal.text];
    for (const word of this.config.words) {
      const dish = dishes.find((name) => hasWord(name, word));
      if (dish) {
        events.push({
          key: TRIGGERS.WATCHED_DISH,
          data: { ...base, word, dish: clip(dish, 1000) },
        });
      }
    }
    return events.map((event) => ({
      ...event,
      id: `${event.key}|${entry.deviceId}|${date}|${day}|${event.data.word ?? ''}`,
    }));
  }

  async fireTriggers() {
    const minutes = parisMinutes(this.now());
    const open = WINDOWS.filter((w) => minutes >= w.from && minutes < w.to);
    if (open.length === 0) {
      return;
    }
    let fired = false;
    for (const window of open) {
      for (const entry of this.watched()) {
        const found = this.lookup(entry.deviceId);
        if (!found?.menu) {
          continue;
        }
        for (const event of this.menuEvents(entry, window.day)) {
          if (this.fired.has(event.id)) {
            continue;
          }
          if (await this.fire(event.key, event.data)) {
            this.fired.add(event.id);
            fired = true;
          }
        }
      }
    }
    if (fired) {
      await this.saveFired();
    }
  }

  async fire(key, data) {
    try {
      await this.gladys.publishSceneEvent(key, data);
      if (this.fireFailed) {
        this.fireFailed = false;
        logger.info('Scene triggers fired again');
      }
      return true;
    } catch (err) {
      if (!this.fireFailed) {
        logger.warn(`Cannot fire the ${key} trigger: ${err.message}`);
      }
      this.fireFailed = true;
      return false;
    }
  }

  /** The triggers already fired, so that a restart in a window does not fire them twice. */
  async loadFired() {
    if (!this.dataDir) {
      return;
    }
    try {
      const saved = JSON.parse(await readFile(join(this.dataDir, FIRED_FILE), 'utf8'));
      this.fired = new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      this.fired = new Set();
    }
  }

  async saveFired() {
    // Only the last days matter.
    const oldest = addDays(this.today(), -2);
    this.fired = new Set([...this.fired].filter((id) => (id.split('|')[2] ?? '') >= oldest));
    if (!this.dataDir) {
      return;
    }
    try {
      await mkdir(this.dataDir, { recursive: true });
      const file = join(this.dataDir, FIRED_FILE);
      await writeFile(`${file}.tmp`, JSON.stringify([...this.fired]));
      await rename(`${file}.tmp`, file);
      this.saveFailed = false;
    } catch (err) {
      if (!this.saveFailed) {
        logger.warn(`Cannot remember the fired triggers: ${err.message}`);
      }
      this.saveFailed = true;
    }
  }

  // --- texts ------------------------------------------------------------------

  /** "Toulouse · Maternelle, aujourd'hui : Salade, Sauté de veau ou …" */
  sentence(entry, day, language) {
    const { found, date, meal } = this.mealOn(entry.deviceId, day);
    const dayText = say(TEXT, language, day === 'tomorrow' ? 'dayTomorrow' : 'dayToday');
    if (meal) {
      return say(TEXT, language, 'sentence', {
        name: entry.name,
        day: dayText,
        meal: mealText(meal, language),
      });
    }
    const reasonKey = noMealReason(found?.menu, date) === 'noMeal' ? 'noMealOn' : 'notPublishedOn';
    return say(TEXT, language, 'sentenceNone', {
      name: entry.name,
      reason: say(TEXT, language, reasonKey, { day: dayText }),
    });
  }

  /** The main course(s) of a meal, or its first words: a subtitle. */
  headline(meal, language) {
    return dishText(meal, 'main', language) ?? mealText(meal, language);
  }

  // --- configuration action -----------------------------------------------------

  status() {
    const now = this.now();
    const blocks = [];
    if (this.config.cities.length === 0) {
      blocks.push(render(REPORTS, 'noSource'));
    }
    for (const key of this.activeKeys()) {
      const source = this.source(key);
      const last = [...(source.menus?.values() ?? [])]
        .map((menu) => menu.lastDate)
        .filter(Boolean)
        .sort()
        .at(-1);
      blocks.push(
        render(REPORTS, 'source', { name: source.source.name, count: source.menus?.size ?? 0 }),
        source.okAt === null
          ? render(REPORTS, 'waiting')
          : render(REPORTS, 'read', { age: Math.round((now - source.okAt) / 60000) }),
        last ? render(REPORTS, 'lastDate', { date: last }) : null,
        source.error ? render(REPORTS, 'error', { error: source.error }) : null,
      );
    }
    blocks.push(render(REPORTS, 'watched', { count: this.watched().length }));
    if (this.config.words.length > 0) {
      blocks.push(render(REPORTS, 'words', { words: this.config.words.join(', ') }));
    }
    return lines(...blocks);
  }
}
