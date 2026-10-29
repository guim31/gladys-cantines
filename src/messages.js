// -----------------------------------------------------------------------------
// Texts sent from the container (feature names, states, action messages,
// widget contents, scene outputs), in the four languages of the Gladys
// interface. Entries are strings or functions of one parameter object.
// German says "du", Spanish "usted". Dish names stay as the city wrote them,
// in French.
// -----------------------------------------------------------------------------

export const INIT_FAILED = {
  en: 'Initialization failed, check the integration logs.',
  fr: "L'initialisation a échoué, consultez les logs de l'intégration.",
  de: 'Initialisierung fehlgeschlagen, sieh dir die Protokolle der Integration an.',
  es: 'La inicialización ha fallado, consulte los registros de la integración.',
};

// Feature names, frozen when the device is created (configured language).
export const NAMES = {
  en: {
    starter: 'Starter',
    main: 'Main course',
    side: 'Side dish',
    dairy: 'Dairy',
    dessert: 'Dessert',
    menu: "Today's menu",
    mentions: 'Mentions',
  },
  fr: {
    starter: 'Entrée',
    main: 'Plat',
    side: 'Accompagnement',
    dairy: 'Laitage',
    dessert: 'Dessert',
    menu: 'Menu du jour',
    mentions: 'Mentions',
  },
  de: {
    starter: 'Vorspeise',
    main: 'Hauptgericht',
    side: 'Beilage',
    dairy: 'Milchprodukt',
    dessert: 'Nachtisch',
    menu: 'Heutiges Menü',
    mentions: 'Hinweise',
  },
  es: {
    starter: 'Entrante',
    main: 'Plato principal',
    side: 'Guarnición',
    dairy: 'Lácteo',
    dessert: 'Postre',
    menu: 'Menú del día',
    mentions: 'Menciones',
  },
};

// The mentions a source may give (src/sources.js `labels`).
export const LABELS = {
  en: {
    vegetarian: 'vegetarian',
    organic: 'organic',
    sustainable: 'sustainable',
    local: 'local',
    french_meat: 'French meat',
  },
  fr: {
    vegetarian: 'végétarien',
    organic: 'bio',
    sustainable: 'durable',
    local: 'local',
    french_meat: 'viande française',
  },
  de: {
    vegetarian: 'vegetarisch',
    organic: 'bio',
    sustainable: 'nachhaltig',
    local: 'regional',
    french_meat: 'französisches Fleisch',
  },
  es: {
    vegetarian: 'vegetariano',
    organic: 'ecológico',
    sustainable: 'sostenible',
    local: 'local',
    french_meat: 'carne francesa',
  },
};

// States, widget contents and scene outputs.
export const TEXT = {
  en: {
    or: 'or',
    none: '—',
    noMention: 'no mention',
    noMeal: 'No meal today',
    notPublished: 'Menu not published yet',
    today: 'Today',
    tomorrow: 'Tomorrow',
    vegetarianBadge: 'Veggie',
    noMealOn: ({ day }) => `no meal ${day}`,
    notPublishedOn: ({ day }) => `menu not published yet for ${day}`,
    dayToday: 'today',
    dayTomorrow: 'tomorrow',
    sentence: ({ name, day, meal }) => `${name}, ${day}: ${meal}.`,
    sentenceNone: ({ name, reason }) => `${name}: ${reason}.`,
    pickMenu: 'Add a menu in the Discover tab of the integration, then pick it here.',
    gone: 'This menu is no longer watched.',
    hidden: ({ count }) =>
      `${count} more menu${count === 1 ? '' : 's'}: pick fewer in the settings`,
    noMenu: 'No menu is watched: add one in the Discover tab of the integration.',
  },
  fr: {
    or: 'ou',
    none: '—',
    noMention: 'aucune mention',
    noMeal: "Pas de repas aujourd'hui",
    notPublished: 'Menu pas encore publié',
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    vegetarianBadge: 'Végé',
    noMealOn: ({ day }) => `pas de repas ${day}`,
    notPublishedOn: ({ day }) => `menu pas encore publié pour ${day}`,
    dayToday: "aujourd'hui",
    dayTomorrow: 'demain',
    sentence: ({ name, day, meal }) => `${name}, ${day} : ${meal}.`,
    sentenceNone: ({ name, reason }) => `${name} : ${reason}.`,
    pickMenu: "Ajoutez un menu dans l'onglet Découverte de l'intégration, puis choisissez-le ici.",
    gone: "Ce menu n'est plus suivi.",
    hidden: ({ count }) =>
      `${count} menu${count > 1 ? 's' : ''} de plus : choisissez-en moins dans les réglages`,
    noMenu: "Aucun menu n'est suivi : ajoutez-en un dans l'onglet Découverte de l'intégration.",
  },
  de: {
    or: 'oder',
    none: '—',
    noMention: 'kein Hinweis',
    noMeal: 'Heute kein Essen',
    notPublished: 'Menü noch nicht veröffentlicht',
    today: 'Heute',
    tomorrow: 'Morgen',
    vegetarianBadge: 'Veggie',
    noMealOn: ({ day }) => `${day} kein Essen`,
    notPublishedOn: ({ day }) => `Menü für ${day} noch nicht veröffentlicht`,
    dayToday: 'heute',
    dayTomorrow: 'morgen',
    sentence: ({ name, day, meal }) => `${name}, ${day}: ${meal}.`,
    sentenceNone: ({ name, reason }) => `${name}: ${reason}.`,
    pickMenu: 'Füge ein Menü im Tab „Entdecken“ der Integration hinzu und wähle es hier.',
    gone: 'Dieses Menü wird nicht mehr verfolgt.',
    hidden: ({ count }) =>
      `${count} weitere ${count === 1 ? 'Menü' : 'Menüs'}: wähle weniger in den Einstellungen`,
    noMenu: 'Kein Menü wird verfolgt: füge eines im Tab „Entdecken“ der Integration hinzu.',
  },
  es: {
    or: 'o',
    none: '—',
    noMention: 'sin mención',
    noMeal: 'Hoy no hay comida',
    notPublished: 'Menú aún no publicado',
    today: 'Hoy',
    tomorrow: 'Mañana',
    vegetarianBadge: 'Vegetariano',
    noMealOn: ({ day }) => `${day} no hay comida`,
    notPublishedOn: ({ day }) => `menú aún no publicado para ${day}`,
    dayToday: 'hoy',
    dayTomorrow: 'mañana',
    sentence: ({ name, day, meal }) => `${name}, ${day}: ${meal}.`,
    sentenceNone: ({ name, reason }) => `${name}: ${reason}.`,
    pickMenu: 'Añada un menú en la pestaña Descubrir de la integración y luego elíjalo aquí.',
    gone: 'Este menú ya no está vigilado.',
    hidden: ({ count }) => `${count} menú${count === 1 ? '' : 's'} más: elija menos en los ajustes`,
    noMenu: 'No se vigila ningún menú: añada uno en la pestaña Descubrir de la integración.',
  },
};

// Answer of the "Status" configuration action.
export const REPORTS = {
  en: {
    noSource: 'No city chosen: tick one or more cities above, then save.',
    source: ({ name, count }) => `■ ${name}: ${count} menu${count === 1 ? '' : 's'}`,
    read: ({ age }) => `Last reading ${age} min ago.`,
    waiting: 'Not read yet.',
    error: ({ error }) => `Last error: ${error}`,
    lastDate: ({ date }) => `Menus published until ${date}.`,
    watched: ({ count }) => `${count} menu${count === 1 ? '' : 's'} added to Gladys.`,
    words: ({ words }) => `Watched words: ${words}.`,
  },
  fr: {
    noSource: 'Aucune ville choisie : cochez une ou plusieurs villes ci-dessus, puis enregistrez.',
    source: ({ name, count }) => `■ ${name} : ${count} menu${count > 1 ? 's' : ''}`,
    read: ({ age }) => `Dernière lecture il y a ${age} min.`,
    waiting: 'Pas encore lu.',
    error: ({ error }) => `Dernière erreur : ${error}`,
    lastDate: ({ date }) => `Menus publiés jusqu'au ${date}.`,
    watched: ({ count }) =>
      `${count} menu${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''} à Gladys.`,
    words: ({ words }) => `Mots surveillés : ${words}.`,
  },
  de: {
    noSource: 'Keine Stadt gewählt: kreuze oben eine oder mehrere Städte an und speichere.',
    source: ({ name, count }) => `■ ${name}: ${count} ${count === 1 ? 'Menü' : 'Menüs'}`,
    read: ({ age }) => `Letzte Abfrage vor ${age} Min.`,
    waiting: 'Noch nicht abgefragt.',
    error: ({ error }) => `Letzter Fehler: ${error}`,
    lastDate: ({ date }) => `Menüs veröffentlicht bis ${date}.`,
    watched: ({ count }) => `${count} ${count === 1 ? 'Menü' : 'Menüs'} zu Gladys hinzugefügt.`,
    words: ({ words }) => `Überwachte Wörter: ${words}.`,
  },
  es: {
    noSource: 'Ninguna ciudad elegida: marque una o varias ciudades arriba y guarde.',
    source: ({ name, count }) => `■ ${name}: ${count} menú${count === 1 ? '' : 's'}`,
    read: ({ age }) => `Última lectura hace ${age} min.`,
    waiting: 'Aún no leído.',
    error: ({ error }) => `Último error: ${error}`,
    lastDate: ({ date }) => `Menús publicados hasta el ${date}.`,
    watched: ({ count }) =>
      `${count} menú${count === 1 ? '' : 's'} añadido${count === 1 ? '' : 's'} a Gladys.`,
    words: ({ words }) => `Palabras vigiladas: ${words}.`,
  },
};

/** One text of a table, in a language (English when missing). */
export function say(table, language, key, params = {}) {
  const entry = table[language]?.[key] ?? table.en[key];
  return typeof entry === 'function' ? entry(params) : entry;
}

/** The same text in every language of the table: `{ en, fr, de, es }`. */
export function render(table, key, params = {}) {
  return Object.fromEntries(
    Object.keys(table).map((language) => [language, say(table, language, key, params)]),
  );
}

/** Joins rendered messages (or plain strings), language by language, one per line. */
export function lines(...messages) {
  const languages = Object.keys(messages.find((m) => typeof m === 'object' && m) ?? { en: '' });
  return Object.fromEntries(
    languages.map((language) => [
      language,
      messages
        .filter((message) => message !== null && message !== undefined)
        .map((message) => (typeof message === 'string' ? message : message[language]))
        .join('\n'),
    ]),
  );
}
