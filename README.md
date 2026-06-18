# BLACKOUT

Empêche la France de s'éteindre.

BLACKOUT est une mini-application web de hackathon sur le thème de l'énergie. L'utilisateur devient opérateur du réseau électrique français et prend 5 décisions pour éviter un blackout, stabiliser la carte de France, limiter le CO2, préserver le budget et garder la confiance citoyenne.

L'expérience utilise un instantané public RTE éCO2mix via ODRÉ quand il est disponible. Si l'API ne répond pas ou si l'URL contient `?demo=1`, l'application bascule sur des données locales clairement marquées "Données de démonstration".

## Expérience

- Hero immersif BLACKOUT avec carte de France plus réaliste, villes lumineuses et jauge de risque.
- Trois modes sur le même moteur : Mission France, Paris 19h42, 2050 nuit sans vent.
- Mission jouable en 5 décisions sous forme de scènes de crise horaires.
- Choix contextualisés : batteries, gaz de secours, sobriété, imports, services essentiels, industrie, hydraulique.
- Cascade simplifiée par ville : chaque arbitrage protège ou fragilise des zones visibles.
- HUD de mission façon cockpit : chrono, niveau de menace, progression, combo, grade et XP crise.
- Objectifs bonus, tags tactiques, feedback d'impact après chaque ordre, trophées et replay de cascade.
- Jauges stabilité, risque blackout, CO2, budget et confiance citoyenne.
- Messages radio opérateur et événements narratifs déterministes.
- Verdict final avec score, grade, XP, profil opérateur, trophées, villes fragiles/coupées, conseils pédagogiques et bouton "Copier mon résultat".
- Section courte "Ce que BLACKOUT montre" et sources RTE/ODRÉ.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Forcer le fallback :

```text
http://localhost:3000?demo=1
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build:github
```

## Publication GitHub Pages

Le repo conserve la compatibilité export statique GitHub Pages :

```bash
npm run build:github
```

Lien historique :

https://sylvainwinning.github.io/wattopia-2050/

## Sources

- RTE éCO2mix : https://www.rte-france.com/donnees-publications/eco2mix-donnees-temps-reel
- ODRÉ eco2mix-national-tr : https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/
- RTE Futurs énergétiques 2050 : https://www.rte-france.com/donnees-publications/etudes-prospectives/futurs-energetique-2050
- Natural Earth : https://www.naturalearthdata.com/

## Limites connues

- Simulation volontairement simplifiée pour hackathon, non officielle et non prédictive.
- Score normalisé 0-100, pas une métrique RTE.
- Données temps réel dépendantes de la disponibilité ODRÉ et des champs exploitables.
- Les scénarios Paris et 2050 utilisent le même moteur que Mission France avec des conditions initiales et événements dédiés.

## Pitch jury 30 secondes

BLACKOUT est une expérience interactive qui transforme les données réelles du réseau électrique français en mission de crise. L'utilisateur devient opérateur du réseau et doit éviter un blackout en prenant 5 décisions : activer du stockage, importer de l'électricité, réduire la demande ou lancer du gaz de secours. Chaque choix rallume ou fragilise la carte de France et montre les compromis entre stabilité, CO2, coût et acceptabilité. L'objectif est de rendre les enjeux énergétiques compréhensibles en quelques minutes, avec une expérience visuelle et partageable.

## Idées d'amélioration

- Ajouter une animation de blackout plus cinématique au verdict.
- Générer une carte résultat PNG dédiée au partage social.
- Ajouter un mode duel entre deux stratégies.
- Créer des scènes dédiées complètes pour Paris 19h42 et 2050.
- Ajouter des scénarios régionaux plus fins si des données régionales sont intégrées.
