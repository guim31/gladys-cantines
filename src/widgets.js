// -----------------------------------------------------------------------------
// Dashboard widget (manifest `widgets`, Gladys 5.1+).
//
// - menus: today's and tomorrow's meal of the watched menus, one row each in
//   a `card-list` ("Toulouse · Maternelle · Aujourd'hui" / "Poulet rôti ou
//   Pépites végétales", a "Veggie" badge); tapping a row opens the whole
//   meal and its mentions. Tomorrow and the mentions can be hidden.
//
// Budget of the core: 8 components, 2 texts; a `list` holds 8 rows: 4 menus
// with tomorrow, 8 without.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { COURSES } from './sources.js';
import { dishText, mentionsText, noMealReason } from './devices.js';
import { NAMES, TEXT, say } from './messages.js';
import { parisMinutes } from './dates.js';
import { WIDGET_KEY } from './service.js';
import { clip } from './text.js';

export const MAX_ROWS = 8;

/** The detail panel: one line per course (or the city's text), then the mentions. */
function details(meal, language, { mentions }) {
  const names = NAMES[language] ?? NAMES.en;
  const colon = language === 'fr' ? ' : ' : ': ';
  const body = meal.courses
    ? COURSES.map((course) => {
        const dish = dishText(meal, course, language);
        return dish ? `${names[course]}${colon}${dish}` : null;
      }).filter(Boolean)
    : [meal.text];
  const extra = mentions ? mentionsText(meal, language) : null;
  return clip([...body, ...(extra ? ['', extra] : [])].join('\n'), 2000);
}

function row(service, entry, day, language, settings) {
  const { found, date, meal } = service.mealOn(entry.deviceId, day);
  const title = clip(`${entry.name} · ${say(TEXT, language, day)}`, 60);
  if (!meal) {
    return {
      title,
      subtitle: say(TEXT, language, noMealReason(found?.menu, date)),
    };
  }
  return {
    title,
    subtitle: clip(service.headline(meal, language), 60),
    ...(meal.vegetarian === true
      ? { badge: { text: say(TEXT, language, 'vegetarianBadge'), color: WIDGET_COLORS.SUCCESS } }
      : {}),
    description: details(meal, language, settings),
  };
}

async function menusContent(service, { settings, language }) {
  await service.firstReading();
  const watched = service.watched();
  const chosen = Array.isArray(settings?.menus) ? settings.menus.map(String) : [];
  let days = settings?.show_tomorrow === false ? ['today'] : ['today', 'tomorrow'];
  const options = { mentions: settings?.show_mentions !== false };
  const entries =
    chosen.length > 0
      ? chosen.map((id) => watched.find((entry) => entry.deviceId === id)).filter(Boolean)
      : watched;
  // Half an hour, but never past midnight (Paris): "today" changes then.
  const toMidnight = (1440 - parisMinutes(service.now())) * 60;
  const ttl = Math.max(60, Math.min(1800, toMidnight + 60));
  if (entries.length === 0) {
    const key = chosen.length > 0 ? 'gone' : 'pickMenu';
    return { ttl_seconds: ttl, components: [{ type: 'text', text: say(TEXT, language, key) }] };
  }
  // Too many rows: today only for every menu, before leaving menus out.
  if (entries.length * days.length > MAX_ROWS) {
    days = ['today'];
  }
  const shown = entries.slice(0, MAX_ROWS);
  const items = shown.flatMap((entry) =>
    days.map((day) => row(service, entry, day, language, options)),
  );
  const hidden = entries.length - shown.length;
  return {
    ttl_seconds: ttl,
    components: [
      { type: 'card-list', display: 'list', items },
      ...(hidden > 0
        ? [
            {
              type: 'text',
              variant: 'caption',
              text: say(TEXT, language, 'hidden', { count: hidden }),
            },
          ]
        : []),
    ],
  };
}

export const WIDGETS = {
  [WIDGET_KEY]: { get: menusContent },
};
