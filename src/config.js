// -----------------------------------------------------------------------------
// Integration configuration: defaults (they mirror the `default` values of the
// manifest `config_schema`, see test/manifest.test.js) and normalization, so
// the rest of the code never deals with strings, blanks or `undefined`.
// -----------------------------------------------------------------------------

import { SOURCE_KEYS } from './sources.js';
import { wordsOf } from './text.js';

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

// Hours between two readings of the portals. The menus are published weeks
// ahead and seldom change: a few readings a day are plenty. The integration
// drives its own timer (devices are published with should_poll: false).
export const REFRESH_INTERVALS = ['3', '6', '12'];

export const DEFAULT_CONFIG = {
  cities: [],
  watched_words: '',
  refresh_interval: '6',
  language: 'fr',
};

/** The cities chosen: an array from the form, tolerating a JSON or comma-separated string. */
function citiesOf(value) {
  let list = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(',');
    }
  }
  if (!Array.isArray(list)) {
    return [];
  }
  const wanted = list.map((item) => String(item).trim());
  return SOURCE_KEYS.filter((key) => wanted.includes(key));
}

/**
 * @param {Record<string, unknown>} raw the configuration returned by the SDK
 */
export function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const interval = REFRESH_INTERVALS.includes(String(source.refresh_interval))
    ? String(source.refresh_interval)
    : DEFAULT_CONFIG.refresh_interval;
  return {
    cities: citiesOf(source.cities),
    words: wordsOf(source.watched_words),
    language: LANGUAGES.includes(source.language) ? source.language : DEFAULT_CONFIG.language,
    refreshMs: Number(interval) * 3600 * 1000,
  };
}
