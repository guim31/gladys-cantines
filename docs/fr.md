# Menus des cantines

Le menu de la cantine scolaire de votre ville dans Gladys : entrée, plat,
accompagnement, laitage et dessert du jour, les mentions données par la
ville (végétarien, bio, local…), un widget avec aujourd'hui et demain, une
action de scène qui lit le menu, et des déclencheurs pour un jour végétarien
ou un plat que vous guettez (« frites ! »).

Les menus viennent des portails open data des villes : sans compte ni clé.
Cette intégration n'est pas affiliée aux villes ni à leurs prestataires.

## Ce que vous obtenez

- Un appareil par menu publié par la ville : Toulouse (maternelle,
  élémentaire), Rennes (les trois secteurs de la cuisine centrale), Nantes
  Métropole (un menu par commune et par type : standard, maternelle,
  élémentaire, alternatif…).
- Des fonctionnalités texte avec le repas **du jour**, mises à jour à minuit.
- Un widget du tableau de bord avec les repas du jour et de demain.
- Une action de scène « Obtenir le menu de la cantine » et deux déclencheurs.

## Prérequis

- Gladys Assistant 5.3.0 ou plus récent.
- Un accès internet depuis la machine Gladys (les portails sont en ligne).
- Une école dans une des villes prises en charge (voir Limites pour les
  autres).

## Installation

1. Dans Gladys, ouvrez **Intégrations → Installer depuis GitHub**.
2. Collez `https://github.com/guim31/gladys-cantines` et installez.
3. Ouvrez l'onglet **Configuration** de l'intégration.

## Configuration

### Réglages

- **Villes** : cochez la ville de votre école. Rennes répartit ses écoles en
  trois secteurs : le site de la ville indique le vôtre.
- **Mots surveillés** : mots à chercher dans les plats, séparés par des
  virgules (`frites, pizza, poisson`), pour le déclencheur « Plat surveillé
  au menu ». Accents et majuscules sans importance ; un mot correspond au
  début d'un mot (`frite` trouve « Frites au four », `riz` ne trouve pas
  « Chorizo »).
- **Rafraîchissement** : fréquence de lecture des portails (toutes les 3, 6
  ou 12 heures). Les menus sont publiés des semaines à l'avance : 6 heures
  suffisent.
- **Langue des noms et messages** : langue des noms de fonctionnalités, des
  états et des phrases de scène. Les noms sont figés à l'ajout de l'appareil.

### Ajouter des menus

Enregistrez la configuration : les menus des villes cochées apparaissent
dans l'onglet **Découverte**. Ajoutez le vôtre à Gladys et renommez-le à
votre guise (« École de Léa ») : le widget et les phrases de scène
reprennent ce nom.

### Vérifier

L'action **État** de l'onglet Configuration liste, par ville, les menus
trouvés, l'heure de la dernière lecture, le dernier jour publié et la
dernière erreur.

## Appareils

Chaque fonctionnalité est un texte en lecture seule, valeur **du jour** :

| Fonctionnalité                                 | Contenu                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Entrée, Plat, Accompagnement, Laitage, Dessert | Toulouse et Rennes : le plat, deux choix reliés par « ou »                                                     |
| Menu du jour                                   | Nantes Métropole : le repas complet tel que la commune l'écrit                                                 |
| Mentions                                       | végétarien, bio, durable, local, viande française, et le commentaire du jour de la ville (« Semaine du goût ») |

Un plat non servi affiche « — ». Un jour sans repas affiche **Pas de repas
aujourd'hui** (week-end, vacances, jour férié : les villes ne disent pas
lequel), ou **Menu pas encore publié** après le dernier jour publié par la
ville. Les plats gardent l'écriture de la ville.

## Widget du tableau de bord

**Menus de la cantine** : une ligne par menu et par jour (aujourd'hui,
demain), avec le plat principal et une pastille « Végé » un jour
végétarien. Touchez une ligne pour le repas complet et ses mentions.
Réglages : menus affichés (vide : tous, quatre avec demain, huit sans),
afficher demain, afficher les mentions.

## Déclencheurs de scène

- **Menu végétarien** : un menu suivi est végétarien, aujourd'hui (envoyé
  entre 7 h et 10 h) ou demain (entre 18 h et 21 h). Seulement quand la
  ville l'indique : Toulouse (plats codés sans viande), Rennes, et les
  communes de Nantes Métropole qui commencent le texte par « Menu
  végétarien ».
- **Plat surveillé au menu** : un plat contient un des mots surveillés,
  mêmes créneaux. Le filtre facultatif **Mot** compare à l'identique :
  écrivez-le en minuscules, comme dans la configuration.

Les deux transmettent le nom du menu, la date et le repas complet ; le
second aussi le mot et le plat trouvé. Chaque événement part une fois par
menu, jour et mot, même si l'intégration redémarre dans le créneau.

## Action de scène

**Obtenir le menu de la cantine** répond par une phrase prête à envoyer ou
à faire lire : « École de Léa, demain : Carottes râpées, Poulet rôti,
Frites, Yaourt, Pomme. » Champs : le menu (vide : tous les menus suivis) et
le jour (vide : aujourd'hui). Sorties : la phrase, `has_menu` (1 si un
repas est servi) et `vegetarian` (1 si tous les repas servis sont
végétariens), pour une étape « Continuer seulement si ».

## Exemples de scènes

- À 19 h les jours d'école : « Obtenir le menu de la cantine » pour demain,
  puis envoyer la phrase à la famille.
- « Plat surveillé au menu », jour demain, mot `frites` : un message sur la
  tablette des enfants.
- « Menu végétarien », jour aujourd'hui : prévoir de la viande le soir.

## Données et rafraîchissement

| Ville            | Portail                                                                      | Licence             | Publication                                                |
| ---------------- | ---------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------- |
| Toulouse         | data.toulouse-metropole.fr, « Menus des cantines – automatisés »             | Licence Ouverte 2.0 | environ trois semaines à l'avance, mise à jour quotidienne |
| Rennes           | data.rennesmetropole.fr, « Menus des cantines des écoles »                   | ODbL                | plusieurs semaines à l'avance                              |
| Nantes Métropole | data.nantesmetropole.fr, « Menus des cantines scolaires à Nantes Métropole » | Licence Ouverte     | d'une à huit semaines à l'avance selon la commune          |

Une requête par ville à chaque rafraîchissement, pour les jours de deux
semaines en arrière à cinq semaines en avant. Les états du jour sont
recalculés toutes les 10 minutes : le nouveau jour s'affiche juste après
minuit (heure de Paris).

## Dépannage

- **Mon menu n'est pas dans l'onglet Découverte** : cochez sa ville et
  enregistrez ; une commune de Nantes Métropole qui n'a rien publié depuis
  des semaines n'est pas listée.
- **« Menu pas encore publié »** : la ville n'a pas encore publié ce jour ;
  l'action État donne le dernier jour publié.
- **Un déclencheur ne part pas** : vérifiez les créneaux horaires, le filtre
  de mot en minuscules, et que le menu est ajouté à Gladys.
- Journaux : `docker logs` du conteneur de l'intégration, `LOG_LEVEL=debug`
  pour chaque lecture.

## Limites

- Trois villes pour l'instant. D'autres publient leurs menus en PDF ou pas
  du tout ; une ville dotée d'une API open data peut être ajoutée : ouvrez
  une issue.
- Pas d'allergènes : aucun de ces portails ne les publie jour par jour.
- La mention végétarienne ne vaut que ce que la ville publie.
- Développée sans accès à une école : vos retours sont les bienvenus.

## Crédits

Données : Mairie de Toulouse (Licence Ouverte 2.0), Ville de Rennes /
Rennes Métropole (ODbL), Ville de Nantes et communes de Nantes Métropole
(Licence Ouverte). Intégration par guim31, Apache 2.0.
