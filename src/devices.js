// -----------------------------------------------------------------------------
// The Gladys device of a canteen menu and its states: one device per menu a
// source publishes (Toulouse: nursery / primary school; Rennes: a sector of
// the central kitchen; Nantes Métropole: a town and a menu type). Every
// feature is a read-only text (`text/text`) holding today's value:
//
//   starter, main, side, dairy, dessert   sources that split the meal
//   menu                                  sources that publish one text
//   mentions                              vegetarian, organic, local… and the
//                                         city's comment of the day
//
// A day without a meal says so ("No meal today", "Menu not published yet"):
// a text state is never empty, and never invented. No polling: the
// integration reads the portals on its own timer (src/service.js).
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES as C,
  DEVICE_FEATURE_TYPES as T,
} from '@gladysassistant/integration-sdk';
import { LABELS, NAMES, TEXT, say } from './messages.js';
import { COURSES } from './sources.js';
import { clip, slug } from './text.js';

export const MENU_TYPE = 'menu';
export const MAX_DEVICE_NAME = 80;
// A text state long enough for a whole meal, short enough for a tile.
export const MAX_STATE = 500;

/** The platform id of a menu: "<source key>-<menu id of the source>". */
export const menuPlatformId = (sourceKey, menuId) => `${sourceKey}-${slug(menuId)}`;

/** The feature keys of a menu of this source. */
export const featureKeys = (source) => [...(source.split ? COURSES : ['menu']), 'mentions'];

/** "Sauté de veau ou Veggi bolognaise", or null when the course is not served. */
export function dishText(meal, course, language) {
  const dishes = meal?.courses?.[course];
  return dishes?.length ? dishes.join(` ${say(TEXT, language, 'or')} `) : null;
}

/** The whole meal in one line: the courses served, or the city's text. */
export function mealText(meal, language) {
  if (!meal) {
    return null;
  }
  if (meal.text) {
    return meal.text;
  }
  return COURSES.map((course) => dishText(meal, course, language))
    .filter(Boolean)
    .join(', ');
}

/** "végétarien, bio · Semaine du goût", or null without any. */
export function mentionsText(meal, language) {
  const labels = (meal?.labels ?? []).map((label) => say(LABELS, language, label));
  const parts = [labels.join(', '), ...(meal?.notes ?? [])].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Why there is no meal on `date`: after the last day published (or without
 * any day published), the menu is not out yet; before, the canteen is closed
 * (week-end, holidays, public holiday: the sources do not say which).
 */
export const noMealReason = (menu, date) =>
  !menu?.lastDate || date > menu.lastDate ? 'notPublished' : 'noMeal';

/**
 * The device of a menu.
 * @param {object} gladys
 * @param {string} sourceKey
 * @param {object} source an entry of SOURCES
 * @param {{ id: string, name: string }} menu
 * @param {string} language
 */
export function buildMenuDevice(gladys, sourceKey, source, menu, language) {
  const ids = gladys.externalIds(MENU_TYPE, menuPlatformId(sourceKey, menu.id));
  const names = NAMES[language] ?? NAMES.en;
  return {
    name: clip(menu.name, MAX_DEVICE_NAME),
    external_id: ids.device,
    should_poll: false,
    params: [
      { name: 'source', value: sourceKey },
      { name: 'menu_id', value: menu.id },
    ],
    features: featureKeys(source).map((key) => ({
      name: names[key],
      external_id: ids.feature(key),
      category: C.TEXT,
      type: T.TEXT.TEXT,
      min: 0,
      max: 0,
      read_only: true,
      has_feedback: false,
    })),
  };
}

/**
 * The states of a menu device on `date` (today in Paris).
 * @param {object} menu `{ id, meals, lastDate }`
 */
export function menuStates(gladys, sourceKey, source, menu, date, language) {
  const ids = gladys.externalIds(MENU_TYPE, menuPlatformId(sourceKey, menu.id));
  const meal = menu.meals?.get(date) ?? null;
  const none = say(TEXT, language, 'none');
  const reason = say(TEXT, language, noMealReason(menu, date));
  const value = (key) => {
    if (!meal) {
      return key === 'mentions' ? none : reason;
    }
    if (key === 'mentions') {
      return mentionsText(meal, language) ?? say(TEXT, language, 'noMention');
    }
    if (key === 'menu') {
      return mealText(meal, language);
    }
    return dishText(meal, key, language) ?? none;
  };
  return featureKeys(source).map((key) => ({
    device_feature_external_id: ids.feature(key),
    text: clip(value(key), MAX_STATE),
  }));
}
