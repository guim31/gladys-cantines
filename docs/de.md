# Menus des cantines

Das Schulkantinen-Menü deiner Stadt in Gladys: Vorspeise, Hauptgericht,
Beilage, Milchprodukt und Nachtisch des Tages, die Hinweise der Stadt
(vegetarisch, bio, regional…), ein Dashboard-Widget mit heute und morgen,
eine Szenen-Aktion, die das Menü vorliest, und Auslöser für einen
vegetarischen Tag oder ein Gericht, auf das du wartest („Pommes!“).

Die Menüs kommen aus den Open-Data-Portalen der Städte: kein Konto, kein
Schlüssel. Diese Integration ist nicht mit den Städten oder ihren Caterern
verbunden.

## Was du bekommst

- Ein Gerät pro Menü, das die Stadt veröffentlicht: Toulouse (Vorschule,
  Grundschule), Rennes (die drei Sektoren der Zentralküche), Nantes
  Métropole (ein Menü pro Gemeinde und Menütyp: Standard, Vorschule,
  Grundschule, Alternative…).
- Text-Funktionen mit dem Essen **von heute**, wenige Minuten nach Mitternacht aktualisiert.
- Ein Dashboard-Widget mit dem Essen von heute und morgen.
- Eine Szenen-Aktion „Kantinen-Menü abrufen“ und zwei Szenen-Auslöser.

## Voraussetzungen

- Gladys Assistant 5.3.0 oder neuer.
- Internetzugang vom Gladys-Rechner (die Portale sind im Internet).
- Eine Schule in einer der unterstützten Städte (andere: siehe
  Einschränkungen).

## Installation

1. Öffne in Gladys **Integrationen → Von GitHub installieren**.
2. Füge `https://github.com/guim31/gladys-cantines` ein und installiere.
3. Öffne den Tab **Konfiguration** der Integration.

## Konfiguration

### Einstellungen

- **Städte**: kreuze die Stadt deiner Schule an. Rennes teilt seine Schulen
  in drei Sektoren: die Website der Stadt sagt dir, welcher deiner ist.
- **Überwachte Wörter**: Wörter, die in den Gerichten gesucht werden, durch
  Kommas getrennt (`frites, pizza, poisson`: die Gerichte sind französisch),
  für den Auslöser „Überwachtes Gericht im Menü“. Akzente und Groß- und
  Kleinschreibung spielen keine Rolle; ein Wort passt auf den Anfang eines
  Wortes (`frite` findet „Frites au four“, `riz` findet nicht „Chorizo“).
- **Aktualisierung**: wie oft die Portale gelesen werden (alle 3, 6 oder 12
  Stunden). Die Menüs erscheinen Wochen im Voraus: 6 Stunden reichen.
- **Sprache der Namen und Nachrichten**: Sprache der Funktionsnamen, der
  Zustände und der Szenen-Sätze. Die Namen werden beim Hinzufügen festgelegt.

### Menüs hinzufügen

Speichere die Konfiguration: die Menüs der angekreuzten Städte erscheinen im
Tab **Entdecken**. Füge deines zu Gladys hinzu und benenne es nach Belieben
um („Schule von Léa“): Widget und Szenen-Sätze verwenden diesen Namen.

### Prüfen

Die Aktion **Status** im Tab Konfiguration zeigt pro Stadt die gefundenen
Menüs, die Zeit der letzten Abfrage, den letzten veröffentlichten Tag und
den letzten Fehler.

## Geräte

Jede Funktion ist ein schreibgeschützter Text mit dem Wert **von heute**:

| Funktion                                                  | Inhalt                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Vorspeise, Hauptgericht, Beilage, Milchprodukt, Nachtisch | Toulouse und Rennes: das Gericht, zwei Auswahlmöglichkeiten mit „oder“ verbunden                                   |
| Heutiges Menü                                             | Nantes Métropole: das ganze Essen, wie die Gemeinde es schreibt                                                    |
| Hinweise                                                  | vegetarisch, bio, nachhaltig, regional, französisches Fleisch und der Tageskommentar der Stadt („Semaine du goût“) |

Ein nicht serviertes Gericht zeigt „—“. Ein Tag ohne Essen zeigt **Heute
kein Essen** (Wochenende, Ferien, Feiertag: die Städte sagen nicht, was),
oder **Menü noch nicht veröffentlicht** nach dem letzten veröffentlichten
Tag. Die Gerichte bleiben so, wie die Städte sie schreiben, auf Französisch.

## Dashboard-Widget

**Kantinen-Menüs**: eine Zeile pro Menü und Tag (heute, morgen), mit dem
Hauptgericht und einem „Veggie“-Abzeichen an einem vegetarischen Tag. Tippe
eine Zeile an für das ganze Essen und seine Hinweise. Einstellungen:
angezeigte Menüs (leer: alle, vier mit morgen, acht ohne), morgen anzeigen,
Hinweise anzeigen.

## Szenen-Auslöser

- **Vegetarisches Menü**: ein verfolgtes Menü ist vegetarisch, heute
  (ausgelöst zwischen 7 und 10 Uhr) oder morgen (zwischen 18 und 21 Uhr).
  Nur wenn die Stadt es angibt: Toulouse (nur als „plat sans viande“ codierte Hauptgerichte: ein Fisch- oder Eiertag wird nicht gemeldet), Rennes (Code, Kommentar oder ein einziges so benanntes Hauptgericht) und die Gemeinden von Nantes Métropole, die den Text mit „Menu
  végétarien“ beginnen.
- **Überwachtes Gericht im Menü**: ein Gericht enthält eines der überwachten
  Wörter, gleiche Zeitfenster. Der optionale Filter **Wort** vergleicht
  genau: schreibe es klein, wie in der Konfiguration.

Beide geben den Menünamen, das Datum und das ganze Essen weiter; der zweite
auch das Wort und das gefundene Gericht. Jedes Ereignis wird einmal pro
Menü, Tag und Wort ausgelöst, auch wenn die Integration im Zeitfenster neu
startet.

## Szenen-Aktion

**Kantinen-Menü abrufen** antwortet mit einem fertigen Satz für eine
Nachricht oder einen Lautsprecher: „Schule von Léa, morgen: Carottes
râpées, Poulet rôti, Frites, Yaourt, Pomme.“ Felder: das Menü (leer: alle
verfolgten Menüs) und der Tag (leer: heute). Ausgaben: der Satz,
`has_menu` (1, wenn ein Essen serviert wird) und `vegetarian` (1, wenn
jedes servierte Essen vegetarisch ist), für einen Schritt „Nur fortfahren,
wenn“.

## Szenen-Beispiele

- Um 19 Uhr an Schultagen: „Kantinen-Menü abrufen“ für morgen, dann den
  Satz an die Familie schicken.
- „Überwachtes Gericht im Menü“, Tag morgen, Wort `frites`: eine Nachricht
  auf das Tablet der Kinder.
- „Vegetarisches Menü“, Tag heute: abends Fleisch einplanen.

## Daten und Aktualisierung

| Stadt            | Portal                                                                     | Lizenz              | Veröffentlicht                                   |
| ---------------- | -------------------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| Toulouse         | data.toulouse-metropole.fr, „Menus des cantines – automatisés“             | Licence Ouverte 2.0 | etwa drei Wochen im Voraus, täglich aktualisiert |
| Rennes           | data.rennesmetropole.fr, „Menus des cantines des écoles“                   | ODbL                | mehrere Wochen im Voraus                         |
| Nantes Métropole | data.nantesmetropole.fr, „Menus des cantines scolaires à Nantes Métropole“ | Licence Ouverte     | eine bis acht Wochen im Voraus, je nach Gemeinde |

Eine Anfrage pro Stadt bei jeder Aktualisierung, für die Tage von zwei
Wochen zurück bis fünf Wochen voraus. Die Zustände von heute werden alle 10
Minuten neu berechnet: der neue Tag erscheint innerhalb von zehn Minuten nach Mitternacht
(Pariser Zeit).

## Fehlerbehebung

- **Mein Menü ist nicht im Tab Entdecken**: kreuze seine Stadt an und
  speichere; eine Gemeinde von Nantes Métropole, die seit Wochen nichts
  veröffentlicht hat, wird nicht aufgeführt.
- **„Menü noch nicht veröffentlicht“**: die Stadt hat diesen Tag noch nicht
  veröffentlicht; die Aktion Status zeigt den letzten veröffentlichten Tag.
- **Ein Auslöser kommt nicht**: prüfe die Zeitfenster, den Wortfilter in
  Kleinbuchstaben und dass das Menü zu Gladys hinzugefügt ist.
- Protokolle: `docker logs` des Containers der Integration,
  `LOG_LEVEL=debug` für jede Abfrage.

## Einschränkungen

- Bisher drei Städte. Andere veröffentlichen ihre Menüs als PDF oder gar
  nicht; eine Stadt mit Open-Data-API kann hinzugefügt werden: eröffne ein
  Issue.
- Keine Allergene: keines dieser Portale veröffentlicht sie pro Tag.
- Der Hinweis „vegetarisch“ ist nur so gut wie die Angaben der Stadt.
- Ohne Zugang zu einer Schule entwickelt: Rückmeldungen willkommen.

## Danksagung

Daten: Mairie de Toulouse (Licence Ouverte 2.0), Ville de Rennes / Rennes
Métropole (ODbL), Ville de Nantes und die Gemeinden von Nantes Métropole
(Licence Ouverte). Integration von guim31, Apache 2.0.
