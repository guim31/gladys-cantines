// -----------------------------------------------------------------------------
// The open data sources: one adapter per portal, each turning its own records
// into the same menus:
//
//   { id, name, meals: Map<'YYYY-MM-DD', meal> }
//
// and a meal is:
//
//   { courses: { starter, main, side, dairy, dessert } | null,
//     text: string | null,          the whole meal when the source does not
//                                   split it into courses (Nantes Métropole)
//     vegetarian: true | null,     null when the source does not say so
//     labels: ['organic', 'local', ...],
//     notes: ['Semaine du goût', ...] }  the city's own comments
//
// A day without a meal (week-end, holidays, public holiday) has no entry:
// nothing is ever invented. All three sources were checked live on
// 2026-10-29 (test/fixtures/sources holds those answers, Opendatasoft
// `exports/json`, no key). Source keys and menu ids are part of the device
// external ids: never rename one.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { getJson } from './http.js';
import { slug, tidy } from './text.js';

const MAX_BODY_BYTES = 5e6;
// Days read around today: the past ones keep a menu that is on a break
// (holidays) in the Discover tab, the next ones give "tomorrow" and the date
// of the last menu published.
export const DAYS_BEFORE = 14;
export const DAYS_AFTER = 35;

export const COURSES = ['starter', 'main', 'side', 'dairy', 'dessert'];

/** An Opendatasoft export of the records dated in the window around `today`. */
function odsUrl(host, dataset, field, today) {
  const where = `${field}>=date'${addDays(today, -DAYS_BEFORE)}' and ${field}<=date'${addDays(today, DAYS_AFTER)}'`;
  return `https://${host}/api/explore/v2.1/catalog/datasets/${dataset}/exports/json?where=${encodeURIComponent(where)}&timezone=UTC`;
}

async function readRecords(fetchImpl, url) {
  const records = await getJson(fetchImpl, url, { maxBytes: MAX_BODY_BYTES });
  if (!Array.isArray(records)) {
    throw new Error('unexpected answer (not a list of records)');
  }
  return records;
}

/** Adds a meal to a menu of the map, creating the menu on first sight. */
function put(menus, id, name, date, meal) {
  if (!menus.has(id)) {
    menus.set(id, { id, name, meals: new Map() });
  }
  menus.get(id).meals.set(date, meal);
}

const emptyCourses = () => Object.fromEntries(COURSES.map((course) => [course, null]));

// --- Toulouse -------------------------------------------------------------------
// One record per dish: date, course ("01-ENTREES"…), dish, target population.
// The children's lunch only: the adults' menus and the afternoon snacks are
// left out. A course may hold two dishes (a meat and a vegetarian choice).
// The dish codes of the city's kitchen start with "PSV" for the dishes
// without meat ("plat sans viande"): a day whose main courses all are is a
// vegetarian day.

const TOULOUSE_POPULATIONS = { '.Maternelle': 'maternelle', '.Primaire': 'elementaire' };
const TOULOUSE_NAMES = { maternelle: 'Maternelle', elementaire: 'Élémentaire' };
const TOULOUSE_COURSES = {
  '01': 'starter',
  '02': 'main',
  '03': 'side',
  '04': 'dairy',
  '05': 'dessert',
};
const meatless = (code, name) => /^PSV/i.test(code ?? '') || /v[ée]g[ée]|veggi/i.test(name);

export function parseToulouse(records) {
  const days = new Map(); // "<menu>|<date>" → { id, date, dishes: { course: [{ name, code }] } }
  for (const record of records) {
    const id = TOULOUSE_POPULATIONS[record.libelle_population_cible];
    const course = TOULOUSE_COURSES[String(record.libelle_ordre_plat ?? '').slice(0, 2)];
    const date = String(record.datemenu ?? '').slice(0, 10);
    const name = tidy(record.libelle_plat);
    if (
      !id ||
      !course ||
      record.libelle_repas !== 'REPAS MIDI' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !name
    ) {
      continue;
    }
    const key = `${id}|${date}`;
    if (!days.has(key)) {
      days.set(key, { id, date, dishes: {} });
    }
    const dishes = days.get(key).dishes;
    dishes[course] ??= [];
    if (!dishes[course].some((dish) => dish.name === name)) {
      dishes[course].push({ name, code: record.code_plat });
    }
  }
  const menus = new Map();
  for (const { id, date, dishes } of days.values()) {
    const courses = emptyCourses();
    for (const [course, list] of Object.entries(dishes)) {
      courses[course] = list.map((dish) => dish.name);
    }
    const mains = dishes.main ?? [];
    // True when the city says so, null otherwise: a fish or egg dish is not
    // coded "PSV", so "not vegetarian" is never asserted.
    const vegetarian =
      mains.length > 0 && mains.every((dish) => meatless(dish.code, dish.name)) ? true : null;
    put(menus, id, `Toulouse · ${TOULOUSE_NAMES[id]}`, date, {
      courses,
      text: null,
      vegetarian,
      labels: vegetarian ? ['vegetarian'] : [],
      notes: [],
    });
  }
  return menus;
}

// --- Rennes ---------------------------------------------------------------------
// One record per day and sector of the city's central kitchen (each public
// school belongs to one sector), the courses in columns, each with a code
// list ("BIO", "DUR", "VEGE", "LOC", "FR"…), plus a comment of the week
// (`type`) and of the day (`ouverture`). A "FERIE" code is a public holiday.

const RENNES_COLUMNS = {
  starter: 'entree',
  main: 'plat',
  side: 'legumes',
  dairy: 'laitage',
  dessert: 'dessert',
};
// The codes of the city (dataset description, 2021): AB/BIO organic, DUR
// sustainable (EGalim), LOC the local "Terre de Sources" brand, FR French
// meat, VEGE vegetarian. Other codes are ignored.
const RENNES_CODES = {
  BIO: 'organic',
  AB: 'organic',
  DUR: 'sustainable',
  LOC: 'local',
  FR: 'french_meat',
  VEGE: 'vegetarian',
};
const codesOf = (value) =>
  String(value ?? '')
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);

export function parseRennes(records) {
  const menus = new Map();
  for (const record of records) {
    const sector = Number(record.secteur);
    const date = String(record.date ?? '').slice(0, 10);
    if (!Number.isInteger(sector) || sector < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      continue;
    }
    const codes = Object.values(RENNES_COLUMNS).flatMap((column) =>
      codesOf(record[`code_${column}`]),
    );
    if (codes.includes('FERIE')) {
      continue;
    }
    const courses = emptyCourses();
    for (const [course, column] of Object.entries(RENNES_COLUMNS)) {
      // "Sauté de poulet OU Omelette": the choice, in the case of the rest.
      const dish = tidy(record[column])?.replace(/\s+OU\s+/g, ' ou ');
      courses[course] = dish ? [dish] : null;
    }
    if (COURSES.every((course) => courses[course] === null)) {
      continue;
    }
    const week = tidy(record.type);
    // The city's comment or code, or a single main course named so ("Lasagne
    // végé", "Chili sin carné"; not "Saucisse porc ou volaille ou végé").
    const main = courses.main?.[0] ?? '';
    const vegetarian =
      /^v[ée]g[ée]tarien$/i.test(week) ||
      codesOf(record.code_plat).includes('VEGE') ||
      (!/\sou\s/i.test(main) && /v[ée]g[ée]|veggi|sin carn/i.test(main))
        ? true
        : null;
    const labels = new Set(codes.map((code) => RENNES_CODES[code]).filter(Boolean));
    labels.delete('vegetarian');
    put(menus, `secteur-${sector}`, `Rennes · secteur ${sector}`, date, {
      courses,
      text: null,
      vegetarian,
      labels: [...(vegetarian ? ['vegetarian'] : []), ...labels],
      notes: [week, tidy(record.ouverture)].filter(
        (note) => note && !/^v[ée]g[ée]tarien$/i.test(note),
      ),
    });
  }
  return menus;
}

// --- Nantes Métropole -------------------------------------------------------------
// One record per day, town and menu type ("Menu standard", "Menu maternelle",
// "Menu alternatif"…), the whole meal in one free text written by each town
// in its own way: shown as it is, never split into courses. "Menu
// végétarien" at its start is the town saying so; otherwise the source does
// not say (null), it is not "not vegetarian".

export function parseNantes(records) {
  const menus = new Map();
  for (const record of records) {
    const town = tidy(record.commune);
    const type = tidy(record.type_menu);
    const typeId = slug(record.id_type_menu ?? type);
    const date = String(record.date ?? '').slice(0, 10);
    const text = tidy(record.repas);
    if (!town || !typeId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !text) {
      continue;
    }
    const vegetarian = /^menu v[ée]g[ée]tarien/i.test(text) ? true : null;
    put(menus, `${slug(town).toLowerCase()}-${typeId}`, `${town} · ${type}`, date, {
      courses: null,
      text,
      vegetarian,
      labels: [
        ...(vegetarian ? ['vegetarian'] : []),
        ...(/\bbio\b/i.test(text) ? ['organic'] : []),
      ],
      notes: [],
    });
  }
  return menus;
}

export const SOURCES = {
  toulouse: {
    name: 'Toulouse',
    split: true,
    url: (today) => odsUrl('data.toulouse-metropole.fr', 'menus', 'datemenu', today),
    parse: parseToulouse,
  },
  rennes: {
    name: 'Rennes',
    split: true,
    url: (today) => odsUrl('data.rennesmetropole.fr', 'menus-cantines', 'date', today),
    parse: parseRennes,
  },
  nantes: {
    name: 'Nantes Métropole',
    split: false,
    url: (today) =>
      odsUrl(
        'data.nantesmetropole.fr',
        '244400404_menus-cantines-scolaires-nantes-metropole',
        'date',
        today,
      ),
    parse: parseNantes,
  },
};

export const SOURCE_KEYS = Object.keys(SOURCES);

/** Reads a source: its menus, in a stable order. */
export async function readSource(key, fetchImpl, today) {
  const source = SOURCES[key];
  const menus = source.parse(await readRecords(fetchImpl, source.url(today)));
  return new Map([...menus.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
