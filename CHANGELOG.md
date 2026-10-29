# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

### Added

- The school canteen menus of Toulouse (nursery and primary schools), Rennes
  (three school sectors) and Nantes Métropole (one menu per town and menu
  type), read from their open data portals, without any account or key.
- One device per menu, with today's starter, main course, side dish, dairy
  and dessert (or the whole meal for Nantes Métropole) and the mentions the
  city gives (vegetarian, organic, sustainable, local, comment of the day).
  A day without a meal says so: "No meal today" or "Menu not published yet".
- Dashboard widget "Canteen menus": today's and tomorrow's meals, a badge on
  vegetarian days, the whole meal on tap.
- Scene action "Get the canteen menu": today's or tomorrow's menu in a
  sentence ready to send or to say.
- Scene triggers "Vegetarian menu" and "Watched dish on the menu" (words of
  your choice, such as "frites"), for today in the morning or tomorrow in the
  evening.
- Feature names and messages in English, French, German and Spanish;
  documentation in the four languages.

[Unreleased]: https://github.com/guim31/gladys-cantines/commits/main
