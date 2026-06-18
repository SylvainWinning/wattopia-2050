# Wattopia 2050

Mini-application web de hackathon : “Peux-tu alimenter la France en 2050 sans blackout ?”

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

## Publication

La publication se fait automatiquement via GitHub Pages à chaque push sur `main`.

Lien public :

[https://sylvainwinning.github.io/wattopia-2050/](https://sylvainwinning.github.io/wattopia-2050/)

Pour tester l'export localement :

```bash
npm run build:github
```
