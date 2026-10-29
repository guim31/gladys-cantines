// -----------------------------------------------------------------------------
// The integration end to end, against the SDK's fake Gladys and the real
// answers of the portals: discovery, today's states, the days without a
// meal, the scene triggers in their windows, the scene action and the widget.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { RETRY_MS } from '../src/service.js';
import {
  action,
  create,
  createWorld,
  discovered,
  featureId,
  lastText,
  paris,
  tickAt,
} from './helpers/world.js';

const TOULOUSE = 'Toulouse · Élémentaire';
const NURSERY = 'Toulouse · Maternelle';
const RENNES = 'Rennes · secteur 1';
const NANTES = 'Nantes · Menu standard';

test('the menus of the ticked cities are offered, read-only texts, no polling', async (t) => {
  const world = await createWorld({ config: { cities: ['toulouse'] } });
  t.after(() => world.app.stop());
  assert.deepEqual(world.fake.discoveredDevices.map((d) => d.name).sort(), [NURSERY, TOULOUSE]);
  const device = discovered(world, TOULOUSE);
  assert.equal(device.should_poll, false);
  assert.deepEqual(
    device.features.map((f) => f.name),
    ['Entrée', 'Plat', 'Accompagnement', 'Laitage', 'Dessert', 'Mentions'],
  );
  assert.ok(device.features.every((f) => f.read_only && f.category === 'text'));
  // Only the ticked cities are read.
  assert.equal(world.network.calls.length, 1);
});

test("adding a menu publishes today's meal at once, course by course", async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, TOULOUSE);
  assert.equal(lastText(world, device, 'starter'), 'Salade coleslaw cc');
  assert.equal(lastText(world, device, 'main'), 'Veggi bolognaise sans soja ou Saute veau marengo');
  assert.equal(lastText(world, device, 'dessert'), 'Salade de fruit au sirop');
  assert.equal(lastText(world, device, 'mentions'), 'aucune mention');
  const rennes = await create(world, RENNES);
  assert.equal(lastText(world, rennes, 'dairy'), '—');
  assert.equal(lastText(world, rennes, 'mentions'), 'durable, bio · Vacances scolaires');
  const nantes = await create(world, NANTES);
  assert.deepEqual(
    nantes.features.map((f) => f.name),
    ['Menu du jour', 'Mentions'],
  );
  assert.match(lastText(world, nantes, 'menu'), /^Salade de pommes de terre bio/);
});

test('a day without a meal says so, and the next day publishes the new meal', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, TOULOUSE);
  // Saturday.
  await tickAt(world, '2026-10-31', '09:00');
  assert.equal(lastText(world, device, 'main'), "Pas de repas aujourd'hui");
  assert.equal(lastText(world, device, 'mentions'), '—');
  // Monday: lunch again.
  await tickAt(world, '2026-11-02', '00:05');
  assert.notEqual(lastText(world, device, 'main'), "Pas de repas aujourd'hui");
  // After the last day published: not out yet, rather than "no meal".
  world.clock.set(paris('2026-11-30', '09:00'));
  await world.service.refresh();
  assert.equal(lastText(world, device, 'main'), 'Menu pas encore publié');
});

test('the states are only sent again when they change (and on heartbeat)', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  await create(world, TOULOUSE);
  const before = world.fake.states.length;
  await tickAt(world, '2026-10-29', '12:10');
  await tickAt(world, '2026-10-29', '12:20');
  assert.equal(world.fake.states.length, before);
});

test('the portals are read every few hours, a failed one again after a delay', async (t) => {
  const world = await createWorld({ config: { cities: ['rennes'], refresh_interval: '3' } });
  t.after(() => world.app.stop());
  const device = await create(world, RENNES);
  assert.equal(world.network.calls.length, 1);
  await tickAt(world, '2026-10-29', '14:00');
  assert.equal(world.network.calls.length, 1);
  world.network.routes.rennes = 503;
  await tickAt(world, '2026-10-29', '15:10');
  assert.equal(world.network.calls.length, 2);
  // The menus already read stay on display.
  assert.match(lastText(world, device, 'main'), /^Sauté de poulet colombo/);
  world.clock.advance(RETRY_MS - 60000);
  await world.service.tick();
  assert.equal(world.network.calls.length, 2);
  world.clock.advance(60000);
  await world.service.tick();
  assert.equal(world.network.calls.length, 3);
  const report = await action(world, 'status');
  assert.match(report.fr, /Dernière erreur : data\.rennesmetropole\.fr: HTTP 503/);
});

test('vegetarian menu: tomorrow in the evening window, today in the morning, once', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const rennes = await create(world, RENNES);
  const nantes = await create(world, NANTES);
  await create(world, TOULOUSE);
  // Monday 2026-11-02 17:59: not yet.
  await tickAt(world, '2026-11-02', '17:59');
  assert.deepEqual(world.fake.sceneEvents, []);
  await tickAt(world, '2026-11-02', '18:00');
  const events = world.fake.sceneEvents.filter((e) => e.key === 'vegetarian_menu');
  assert.deepEqual(
    events.map((e) => e.data.menu).sort(),
    [rennes.external_id, nantes.external_id].sort(),
  );
  const event = events.find((e) => e.data.menu === rennes.external_id);
  assert.equal(event.data.day, 'tomorrow');
  assert.equal(event.data.date, '2026-11-03');
  assert.equal(event.data.menu_name, RENNES);
  assert.match(event.data.menu_text, /Tarte aux fromages/);
  // Not twice in the same window.
  await tickAt(world, '2026-11-02', '18:30');
  assert.equal(world.fake.sceneEvents.length, 2);
  // The morning after: "today".
  await tickAt(world, '2026-11-03', '07:10');
  assert.deepEqual(
    world.fake.sceneEvents.slice(2).map((e) => [e.key, e.data.day]),
    [
      ['vegetarian_menu', 'today'],
      ['vegetarian_menu', 'today'],
    ],
  );
});

test('watched dish: a word of the configuration found in a dish', async (t) => {
  const world = await createWorld({
    config: { cities: ['toulouse'], watched_words: 'Frites, pizza' },
  });
  t.after(() => world.app.stop());
  const nursery = await create(world, NURSERY);
  await create(world, TOULOUSE);
  // 2026-11-18: pizza at the nursery school; 2026-11-19: oven chips there.
  await tickAt(world, '2026-11-18', '08:00');
  await tickAt(world, '2026-11-18', '19:00');
  const dishes = world.fake.sceneEvents.map((e) => [e.key, e.data.day, e.data.word, e.data.dish]);
  assert.deepEqual(dishes, [
    ['watched_dish', 'today', 'pizza', 'Pizza'],
    ['watched_dish', 'tomorrow', 'frites', 'Frites au four'],
  ]);
  assert.equal(world.fake.sceneEvents[1].data.menu, nursery.external_id);
});

test('outside the windows nothing fires; a restart in a window does not fire twice', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'gladys-cantines-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const first = await createWorld({ dataDir: dir });
  const device = await create(first, RENNES);
  await tickAt(first, '2026-11-03', '06:59');
  assert.deepEqual(first.fake.sceneEvents, []);
  await tickAt(first, '2026-11-03', '07:00');
  assert.equal(first.fake.sceneEvents.length, 1);
  await first.app.stop();
  assert.ok(JSON.parse(await readFile(join(dir, 'fired.json'), 'utf8')).length === 1);

  const second = await createWorld({ dataDir: dir, devices: [device] });
  t.after(() => second.app.stop());
  await tickAt(second, '2026-11-03', '07:20');
  assert.deepEqual(second.fake.sceneEvents, []);
});

test('scene action: the menu of the day in a sentence, numbers for the conditions', async (t) => {
  const world = await createWorld({ clock: undefined });
  t.after(() => world.app.stop());
  const empty = await world.fake.sceneAction('menu_of_day', {});
  assert.equal(empty.success, false);
  const toulouse = await create(world, TOULOUSE);
  const rennes = await create(world, RENNES);
  const today = await world.fake.sceneAction('menu_of_day', { menu: toulouse.external_id });
  assert.equal(today.success, true);
  assert.equal(
    today.data.outputs.sentence,
    "Toulouse · Élémentaire, aujourd'hui : Salade coleslaw cc, Veggi bolognaise sans soja ou Saute veau marengo, Coquillettes grosses beurre, Fromage a tartiner president, Salade de fruit au sirop.",
  );
  assert.deepEqual([today.data.outputs.has_menu, today.data.outputs.vegetarian], [1, 0]);
  // Friday 30, tomorrow is Saturday.
  world.clock.set(paris('2026-10-30', '18:00'));
  const saturday = await world.fake.sceneAction('menu_of_day', {
    menu: rennes.external_id,
    day: 'tomorrow',
  });
  assert.equal(saturday.data.outputs.sentence, 'Rennes · secteur 1 : pas de repas demain.');
  assert.equal(saturday.data.outputs.has_menu, 0);
  const all = await world.fake.sceneAction('menu_of_day', {});
  assert.match(all.data.outputs.sentence, /^Toulouse · Élémentaire, aujourd'hui : .*\. Rennes/);
  const gone = await world.fake.sceneAction('menu_of_day', { menu: 'ext:x:menu:gone' });
  assert.equal(gone.success, false);
});

test("widget: today's and tomorrow's meals, a badge for vegetarian, hideable parts", async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const nothing = await world.fake.widgetGet('menus', { settings: {}, language: 'en' });
  assert.equal(nothing.data.content.components[0].type, 'text');
  const rennes = await create(world, RENNES);
  await create(world, NANTES);
  // Monday 2026-11-02: tomorrow is vegetarian in Rennes.
  world.clock.set(paris('2026-11-02', '12:00'));
  const ack = await world.fake.widgetGet('menus', { settings: {}, language: 'fr' });
  const content = ack.data.content;
  assert.deepEqual(validateWidgetContent(content), []);
  const [list] = content.components;
  assert.equal(list.type, 'card-list');
  assert.deepEqual(
    list.items.map((item) => item.title),
    [
      "Rennes · secteur 1 · Aujourd'hui",
      'Rennes · secteur 1 · Demain',
      "Nantes · Menu standard · Aujourd'hui",
      'Nantes · Menu standard · Demain',
    ],
  );
  assert.equal(list.items[0].subtitle, 'Curry de légumes');
  assert.equal(list.items[1].badge.text, 'Végé');
  assert.match(list.items[1].description, /^Entrée : Betterave et sardines\nPlat : Tarte/);
  assert.match(list.items[1].description, /\n\nvégétarien, bio$/);
  const short = await world.fake.widgetGet('menus', {
    settings: { menus: [rennes.external_id], show_tomorrow: false, show_mentions: false },
    language: 'en',
  });
  const items = short.data.content.components[0].items;
  assert.deepEqual(
    items.map((item) => item.title),
    ['Rennes · secteur 1 · Today'],
  );
  assert.doesNotMatch(items[0].description, /organic/);
});

test('status action and language change', async (t) => {
  const world = await createWorld({ config: { cities: ['toulouse'], watched_words: 'frites' } });
  t.after(() => world.app.stop());
  const device = await create(world, TOULOUSE);
  const report = await action(world, 'status');
  assert.match(report.fr, /■ Toulouse : 2 menus/);
  assert.match(report.fr, /Menus publiés jusqu'au 2026-11-20\./);
  assert.match(report.en, /Watched words: frites\./);
  await world.fake.configUpdated({ cities: ['toulouse'], language: 'en' });
  assert.equal(lastText(world, device, 'mentions'), 'no mention');
  assert.ok(featureId(device, 'main'));
});
