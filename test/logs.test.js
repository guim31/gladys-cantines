// -----------------------------------------------------------------------------
// What the integration writes to `docker logs`: at info, only the lifecycle
// (the start, a portal lost and back), never one line per reading; a failure
// that repeats is logged once, plus one line when it is over.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureLogs, create, createWorld } from './helpers/world.js';

const strip = (line) => line.text.replace(/^\[[^\]]+\] /, '');

test('the start is one info line', async (t) => {
  const lines = captureLogs(t, 'info');
  const world = await createWorld();
  t.after(() => world.app.stop());
  assert.deepEqual(lines.map(strip), [
    '[INFO] [cantines] Started: 3 city(ies) chosen, 0 menu(s) added',
  ]);
});

test('normal cycles write nothing at info, one line per reading at debug', async (t) => {
  const world = await createWorld({ config: { cities: ['rennes'] } });
  t.after(() => world.app.stop());
  await create(world, 'Rennes · secteur 1');
  const lines = captureLogs(t, 'info');
  for (let i = 0; i < 6; i += 1) {
    world.clock.advance(2 * 3600 * 1000);
    await world.service.tick();
  }
  assert.deepEqual(lines, []);
  const debug = captureLogs(t, 'debug');
  await world.service.refresh();
  assert.deepEqual(debug.map(strip), ['[DEBUG] [cantines] Rennes: 3 menus read']);
});

test('a portal down: one warning, then one line at recovery', async (t) => {
  const world = await createWorld({ config: { cities: ['nantes'] } });
  t.after(() => world.app.stop());
  const saved = world.network.routes.nantes;
  const lines = captureLogs(t, 'info');
  world.network.routes.nantes = new TypeError('fetch failed');
  for (let i = 0; i < 4; i += 1) {
    await world.service.refresh();
  }
  world.network.routes.nantes = saved;
  await world.service.refresh();
  assert.deepEqual(lines.map(strip), [
    '[WARN] [cantines] Nantes Métropole: data unavailable: data.nantesmetropole.fr: fetch failed',
    '[INFO] [cantines] Nantes Métropole: data back',
  ]);
});
