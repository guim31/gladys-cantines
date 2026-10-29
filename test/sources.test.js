// -----------------------------------------------------------------------------
// The three adapters, on the real answers of the portals (2026-10-29).
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, parisDate, parisMinutes } from '../src/dates.js';
import { parseNantes, parseRennes, parseToulouse, SOURCES } from '../src/sources.js';
import { hasWord, tidy, wordsOf } from '../src/text.js';
import { fixtureJson, paris } from './helpers/world.js';

test('Toulouse: the children lunch only, two choices of main course, vegetarian days', () => {
  const menus = parseToulouse(fixtureJson('toulouse.json'));
  assert.deepEqual([...menus.keys()].sort(), ['elementaire', 'maternelle']);
  const primary = menus.get('elementaire');
  assert.equal(primary.name, 'Toulouse · Élémentaire');
  const thursday = primary.meals.get('2026-10-29');
  assert.deepEqual(thursday.courses, {
    starter: ['Salade coleslaw cc'],
    main: ['Veggi bolognaise sans soja', 'Saute veau marengo'],
    side: ['Coquillettes grosses beurre'],
    dairy: ['Fromage a tartiner president'],
    dessert: ['Salade de fruit au sirop'],
  });
  // A meat choice next to the vegetarian one: not a vegetarian day.
  assert.equal(thursday.vegetarian, false);
  // 2026-11-20 at the nursery school: only the "PSV" (meatless) main course.
  const nursery = menus.get('maternelle').meals.get('2026-11-20');
  assert.deepEqual(nursery.courses.main, ['Loubia vegetarienne']);
  assert.equal(nursery.vegetarian, true);
  assert.deepEqual(nursery.labels, ['vegetarian']);
  // Snacks and bread are not courses; no meal on a Saturday.
  assert.equal(primary.meals.has('2026-10-31'), false);
});

test('Rennes: one menu per sector, the codes as mentions, the comments as notes', () => {
  const menus = parseRennes(fixtureJson('rennes.json'));
  assert.deepEqual([...menus.keys()].sort(), ['secteur-1', 'secteur-2', 'secteur-3']);
  const sector = menus.get('secteur-1');
  assert.equal(sector.name, 'Rennes · secteur 1');
  const thursday = sector.meals.get('2026-10-29');
  assert.deepEqual(thursday.courses.main, [
    'Sauté de poulet colombo ou Aiguillettes de blé carottes',
  ]);
  assert.equal(thursday.courses.dairy, null);
  assert.deepEqual(thursday.labels, ['sustainable', 'organic']);
  assert.deepEqual(thursday.notes, ['Vacances scolaires']);
  assert.equal(thursday.vegetarian, false);
  // The "Végétarien" week comment makes the day vegetarian, not a note.
  const vegetarian = sector.meals.get('2026-11-03');
  assert.equal(vegetarian.vegetarian, true);
  assert.deepEqual(vegetarian.notes, []);
  assert.equal(vegetarian.labels[0], 'vegetarian');
});

test('Rennes: a public holiday ("FERIE") is no meal', () => {
  const record = {
    date: '2026-11-11',
    secteur: 1,
    code_entree: 'FERIE',
    entree: 'Férié',
    code_plat: 'FERIE',
    plat: 'Férié',
  };
  assert.equal(parseRennes([record]).size, 0);
});

test('Nantes Métropole: one menu per town and type, the text as written', () => {
  const menus = parseNantes(fixtureJson('nantes.json'));
  assert.equal(menus.size, 19);
  const nantes = menus.get('nantes-1');
  assert.equal(nantes.name, 'Nantes · Menu standard');
  assert.equal(menus.get('reze-4').name, 'Rezé · Menu maternelle');
  assert.equal(menus.get('coueron-1').name, 'Couëron · Menu standard');
  const thursday = nantes.meals.get('2026-10-29');
  assert.equal(thursday.courses, null);
  assert.match(thursday.text, /^Salade de pommes de terre bio et sardines Pilon de poulet/);
  // The town says nothing about it: unknown, not "not vegetarian".
  assert.equal(thursday.vegetarian, null);
  assert.deepEqual(thursday.labels, ['organic']);
  const vegetarian = nantes.meals.get('2026-11-03');
  assert.equal(vegetarian.vegetarian, true);
  // "b?uf" in the export: the "œ" is back.
  const texts = [...menus.values()].flatMap((menu) => [...menu.meals.values()].map((m) => m.text));
  assert.ok(texts.some((text) => text.includes('bœuf')));
  assert.ok(!texts.some((text) => /\p{L}\?\p{L}/u.test(text)));
});

test('the requests ask for a window of days around today, without any key', () => {
  const url = new URL(SOURCES.toulouse.url('2026-10-29'));
  assert.equal(url.host, 'data.toulouse-metropole.fr');
  assert.match(url.pathname, /\/datasets\/menus\/exports\/json$/);
  assert.equal(
    url.searchParams.get('where'),
    "datemenu>=date'2026-10-15' and datemenu<=date'2026-12-03'",
  );
  assert.equal(new URL(SOURCES.rennes.url('2026-10-29')).host, 'data.rennesmetropole.fr');
  assert.equal(new URL(SOURCES.nantes.url('2026-10-29')).host, 'data.nantesmetropole.fr');
});

test('text helpers: capitals, HTML, watched words', () => {
  assert.equal(tidy('FRITES   AU FOUR'), 'Frites au four');
  assert.equal(tidy('<p>Menu <b>végétarien</b></p>'), 'Menu végétarien');
  assert.equal(tidy('Rôti de b?uf, sardines à l?huile'), 'Rôti de bœuf, sardines à l’huile');
  assert.equal(tidy('   '), null);
  assert.deepEqual(wordsOf(' Frites, pizza;; frites\nPoisson pané , x'), [
    'frites',
    'pizza',
    'poisson pané',
  ]);
  assert.ok(hasWord('Frites au four', 'frite'));
  assert.ok(hasWord('Pâtes au beurre', 'pate'));
  assert.ok(hasWord('Poisson pané cuit', 'poisson pane'));
  assert.ok(!hasWord('Chorizo', 'riz'));
});

test('dates: the day in Paris, whatever the host time zone', () => {
  // 23:30 UTC on the 28th is already the 29th in Paris.
  assert.equal(parisDate(Date.UTC(2026, 9, 28, 23, 30)), '2026-10-29');
  assert.equal(parisMinutes(paris('2026-10-29', '07:05')), 7 * 60 + 5);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});
