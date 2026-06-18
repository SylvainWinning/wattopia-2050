# Wattopia 2050

Mini-application web de hackathon : "Stabilisez la France avant la coupure."

Wattopia 2050 transforme le mix électrique français en expérience Mission Control. L'utilisateur part d'un instantané RTE éCO2mix, construit un scénario 2050, lance des crises, puis voit si la France reste stable ou bascule vers des heures critiques.

## Pivot hackathon

La refonte s'organise autour de trois scènes :

1. **Mission Control** - une salle de contrôle claire et spectaculaire pour comprendre immédiatement la mission : garder la France alimentée.
2. **Blackout Simulator** - une simulation visuelle des conséquences : risque, marge minimale, heures critiques, timeline 24h et verdict.
3. **Grand Débat** - un objet de discussion humain : chaque scénario révèle un compromis entre CO₂, coût, sobriété, renouvelables, nucléaire, stockage et sécurité d'approvisionnement.

## Expérience

- Cockpit Mission Control avec statut réseau, CO₂, marge minimale et risque max sur 24h
- Carte énergétique stylisée de la France, réactive au scénario choisi
- Simulation 24h accélérée avec courbes demande / production / marge
- Scénarios de crise : nuit sans vent, pic hivernal, vague de froid, réacteurs indisponibles, importations limitées
- Carte de scénario partageable pour le Grand Débat, avec score, verdict, mix et heures critiques, exportable en image PNG
- Snapshot temps réel du mix électrique français via RTE éCO2mix / ODRÉ

Le modèle est volontairement simplifié pour le hackathon. Il sert à rendre les compromis visibles et discutables, pas à produire une prévision officielle du réseau français.

## Lancer en local

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` : serveur local
- `npm run lint` : vérification ESLint
- `npm run build` : build de production
- `npm run build:github` : export statique pour GitHub Pages

## Données

L'app interroge depuis le navigateur l'API ODRÉ / OpenDataSoft du dataset RTE `eco2mix-national-tr`.

Si l'API ne répond pas, si les champs sont incomplets, ou si l'URL contient `?demo=1`, l'app affiche un fallback local marqué “Données de démonstration”.

Les sources affichées doivent rester explicites : RTE éCO2mix pour le snapshot temps réel, ODRÉ / OpenDataSoft pour l'accès API, et RTE Futurs énergétiques 2050 comme contexte public. Wattopia ne doit pas se présenter comme un outil officiel RTE.

## Publication

La publication se fait automatiquement via GitHub Pages à chaque push sur `main`.

Lien public :

[https://sylvainwinning.github.io/wattopia-2050/](https://sylvainwinning.github.io/wattopia-2050/)

Pour tester l'export localement :

```bash
npm run build:github
```
