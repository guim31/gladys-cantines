# Menus des cantines

The school canteen menu of your city in Gladys: today's starter, main course,
side dish, dairy and dessert, the mentions the city gives (vegetarian,
organic, local…), a dashboard widget with today and tomorrow, a scene action
that reads the menu out, and triggers for a vegetarian day or a dish you
watch for ("frites!").

The menus come from the open data portals of the cities: no account, no key.
This integration is not affiliated with the cities or their caterers.

## What you get

- One device per menu the city publishes: Toulouse (nursery school, primary
  school), Rennes (the three sectors of the central kitchen), Nantes
  Métropole (one menu per town and menu type: standard, nursery, primary,
  alternative…).
- Text features with **today's** meal, updated at midnight.
- A dashboard widget with today's and tomorrow's meals.
- A scene action "Get the canteen menu" and two scene triggers.

## Requirements

- Gladys Assistant 5.3.0 or later.
- Internet access from the Gladys host (the portals are on the internet).
- A school among the cities supported (see Limitations for the others).

## Installation

1. In Gladys, open **Integrations → Install from GitHub**.
2. Paste `https://github.com/guim31/gladys-cantines` and install.
3. Open the integration's **Configuration** tab.

## Configuration

### Settings

- **Cities**: tick the city of your school. Rennes splits its schools into
  three sectors: the city's website tells which one is yours.
- **Watched words**: words to look for in the dishes, separated by commas
  (`frites, pizza, poisson`: the dishes are in French), for the "Watched
  dish on the menu" trigger. Accents and case do not matter; a word matches
  the start of a word (`frite` finds "Frites au four", `riz` does not find
  "Chorizo").
- **Refresh**: how often the portals are read (every 3, 6 or 12 hours). The
  menus are published weeks ahead: 6 hours is plenty.
- **Language of names and messages**: the language of the feature names, the
  states and the scene sentences. Feature names are fixed when a device is
  added.

### Adding menus

Save the configuration: the menus of the ticked cities appear in the
**Discover** tab. Add yours to Gladys, rename it as you like ("Léa's
school"): the widget and the scene sentences use that name.

### Checking

The **Status** action of the Configuration tab lists, per city, the menus
found, the time of the last reading, the last day published and the last
error.

## Devices

Every feature is a read-only text holding **today's** value:

| Feature                                         | Content                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Starter, Main course, Side dish, Dairy, Dessert | Toulouse and Rennes: the dish, two choices joined by "or"                                                   |
| Today's menu                                    | Nantes Métropole: the whole meal as the town wrote it                                                       |
| Mentions                                        | vegetarian, organic, sustainable, local, French meat, and the city's comment of the day ("Semaine du goût") |

A course that is not served shows "—". A day without a meal shows **No meal
today** (week-end, holidays, public holiday: the cities do not say which),
or **Menu not published yet** after the last day the city published. Dish
names stay as the cities write them, in French.

## Dashboard widget

**Canteen menus**: one row per menu and day (today, tomorrow), with the main
course and a "Veggie" badge on a vegetarian day. Tap a row for the whole
meal and its mentions. Settings: the menus shown (empty: all of them, four
with tomorrow, eight without), show tomorrow, show the mentions.

## Scene triggers

- **Vegetarian menu**: a watched menu is vegetarian, today (fired between
  7:00 and 10:00) or tomorrow (between 18:00 and 21:00). Only when the city
  says so: Toulouse (dishes coded without meat), Rennes, and the towns of
  Nantes Métropole that start the text with "Menu végétarien".
- **Watched dish on the menu**: a dish contains one of the watched words,
  same windows. The optional **Word** filter compares exactly: write it in
  lower case, as in the configuration.

Both pass on the menu name, the date and the whole meal; the second also
the word and the dish found. Each event fires once per menu, day and word,
even if the integration restarts in the window.

## Scene action

**Get the canteen menu** answers with a sentence ready for a message or a
speaker: "Léa's school, tomorrow: Carottes râpées, Poulet rôti, Frites,
Yaourt, Pomme." Fields: the menu (empty: every watched menu) and the day
(empty: today). Outputs: the sentence, `has_menu` (1 when a meal is
served) and `vegetarian` (1 when every meal served is vegetarian), for a
"Continue only if" step.

## Scene examples

- At 19:00 on school days: "Get the canteen menu" for tomorrow, then send
  the sentence to the family.
- "Watched dish on the menu", day tomorrow, word `frites`: a message to the
  children's tablet.
- "Vegetarian menu", day today: plan a meat dinner.

## Data and refresh

| City             | Portal                                                                     | Licence             | Published                                            |
| ---------------- | -------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------- |
| Toulouse         | data.toulouse-metropole.fr, "Menus des cantines – automatisés"             | Licence Ouverte 2.0 | about three weeks ahead, updated daily               |
| Rennes           | data.rennesmetropole.fr, "Menus des cantines des écoles"                   | ODbL                | several weeks ahead                                  |
| Nantes Métropole | data.nantesmetropole.fr, "Menus des cantines scolaires à Nantes Métropole" | Licence Ouverte     | from one to eight weeks ahead, depending on the town |

One request per city at each refresh, for the days from two weeks back to
five weeks ahead. Today's states are recomputed every 10 minutes, so the
new day shows right after midnight (Paris time).

## Troubleshooting

- **My menu is not in the Discover tab**: tick its city and save; a town of
  Nantes Métropole that published nothing for weeks is not listed.
- **"Menu not published yet"**: the city has not published that day yet;
  the Status action shows the last day published.
- **A trigger does not fire**: check the time windows, the word filter in
  lower case, and that the menu is added to Gladys.
- Logs: `docker logs` of the integration container, `LOG_LEVEL=debug` for
  each reading.

## Limitations

- Three cities so far. Others publish menus as PDF files or not at all; a
  city with an open data API can be added: open an issue.
- No allergens: none of these portals publishes them per day.
- The vegetarian mention is only as good as what the city publishes.
- Developed without access to a school: feedback welcome.

## Credits

Data: Mairie de Toulouse (Licence Ouverte 2.0), Ville de Rennes / Rennes
Métropole (ODbL), Ville de Nantes and the towns of Nantes Métropole
(Licence Ouverte). Integration by guim31, Apache 2.0.
