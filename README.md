# Menus des cantines — Gladys Assistant integration

The **school canteen menus** published in open data by French cities, in
[Gladys Assistant](https://gladysassistant.com): today's starter, main
course, side dish, dairy and dessert as text features, the mentions the city
gives (vegetarian, organic, local…), a dashboard widget with today and
tomorrow, a scene action that reads the menu out, and scene triggers for a
vegetarian day or a watched dish.

Supported cities (October 2026): **Toulouse** (nursery and primary schools),
**Rennes** (the three sectors of the central kitchen), **Nantes Métropole**
(Nantes, Rezé, Orvault, Saint-Herblain, Carquefou, Couëron… one menu per town
and menu type).

Developed without access to a school canteen: feedback welcome.

## Requirements

- Gladys Assistant **5.3.0** or later.
- Internet access from the Gladys host. No account, no API key.

## Installation

In Gladys, **Integrations → Install from GitHub**, then paste:

```
https://github.com/guim31/gladys-cantines
```

Tick your city in the Configuration tab and save, then add your menu from the
Discover tab. The full guide: [English](docs/en.md), [français](docs/fr.md),
[Deutsch](docs/de.md), [español](docs/es.md).

## Data sources

| City             | Dataset                                                                                                                                                 | Licence             | Published ahead                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------- |
| Toulouse         | [Menus des cantines – automatisés](https://data.toulouse-metropole.fr/explore/dataset/menus/)                                                           | Licence Ouverte 2.0 | about 3 weeks, updated daily        |
| Rennes           | [Menus des cantines des écoles](https://data.rennesmetropole.fr/explore/dataset/menus-cantines/)                                                        | ODbL                | several weeks                       |
| Nantes Métropole | [Menus des cantines scolaires à Nantes Métropole](https://data.nantesmetropole.fr/explore/dataset/244400404_menus-cantines-scolaires-nantes-metropole/) | Licence Ouverte     | 1 to 8 weeks, depending on the town |

One request per city every few hours (3, 6 or 12, configurable), on the
public Opendatasoft API, without any key.

## Limitations

- Three cities so far: other cities publish their menus as PDF files, or as
  datasets no longer updated (Marseille, Mulhouse…). A city with an open data
  API can be added: open an issue.
- No allergens: none of these portals publishes them per day (the Toulouse
  recipe dataset is a year old).
- The vegetarian mention is what the city publishes: Toulouse (dishes coded
  without meat), Rennes (code and comment of the day), the towns of Nantes
  Métropole that start the text with "Menu végétarien".
- Dish names stay in French, as the cities write them.

## Development

```bash
npm ci
npm run format:check && npm run lint && npm test
npx -y github:GladysAssistant/integration-store --skip-image-check .
```

See [CLAUDE.md](CLAUDE.md) for the architecture and the rules of the project.

## Credits

- Data: Mairie de Toulouse, Ville de Rennes / Rennes Métropole, Ville de
  Nantes and the towns of Nantes Métropole, under the licences above.
- Built on the official
  [integration template](https://github.com/GladysAssistant/integration-template-js)
  and [SDK](https://github.com/GladysAssistant/integration-sdk-js) of Gladys
  Assistant.

This integration is not affiliated with the cities, their caterers or
Opendatasoft.

## License

[Apache 2.0](LICENSE)
