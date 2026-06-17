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

## Données

L'app interroge l'API ODRÉ / OpenDataSoft du dataset RTE `eco2mix-national-tr` via `/api/live-mix`.

Si l'API ne répond pas, si les champs sont incomplets, ou si l'URL contient `?demo=1`, l'app affiche un fallback local marqué “Données de démonstration”.

## Publication

Déploiement recommandé :

```bash
npm run build
```

Puis publier le dossier sur Vercel.
