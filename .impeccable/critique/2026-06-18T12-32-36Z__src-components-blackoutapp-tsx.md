---
target: BLACKOUT
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-06-18T12-32-36Z
slug: src-components-blackoutapp-tsx
---
# BLACKOUT Design Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | HUD, jauges, source badge et verdict rendent l etat clair. |
| 2 | Match System / Real World | 4 | Le vocabulaire reseau/operateur est coherent et pedagogique. |
| 3 | User Control and Freedom | 3 | Rejouer et copier existent; retour/annulation decision absents mais acceptables pour mini-jeu. |
| 4 | Consistency and Standards | 3 | Vocabulaire visuel coherent; densite de cartes elevee dans certains panneaux. |
| 5 | Error Prevention | 3 | Choix limites et feedback immediat; la sequence force 5 decisions sans confirmation. |
| 6 | Recognition Rather Than Recall | 4 | Effets, tags tactiques, villes et jauges rendent les consequences visibles. |
| 7 | Flexibility and Efficiency | 3 | Mode demo rapide et partage; pas de raccourcis clavier. |
| 8 | Aesthetic and Minimalist Design | 3 | Rendu premium et immersif; quelques zones restent tres denses en fin de mission. |
| 9 | Error Recovery | 3 | Fallback donnees et rejouer; peu de recovery dedie si clipboard echoue hors fallback texte. |
| 10 | Help and Documentation | 4 | Section pedagogique et sources visibles, simulation simplifiee explicite. |
| **Total** | | **34/40** | **Tres solide pour demo hackathon** |

## Anti-Patterns Verdict

LLM assessment: BLACKOUT ne lit pas comme une app generique. La carte, le HUD et les scenarios creent une identite forte. Le risque principal est la densite de cockpit: beaucoup d elements crient en meme temps apres 5 decisions.

Deterministic scan: detect.mjs sur src/public retourne clean. Pas de gradient text, stripes, over-rounding majeur, ni pattern obvious AI detecte.

Visual evidence: Playwright desktop/mobile confirme zero overflow, zero console error, et flows Paris/2050 jouables jusqu au verdict.

## Overall Impression

BLACKOUT a franchi le seuil presentation jury: c est maintenant une experience jouable, visuelle, contextualisee et partageable. La plus grosse faiblesse trouvee etait le scroll du verdict apres la cinquieme decision, corrige pendant le polish.

## What Works

- La premiere impression est forte: titre clair, carte de France, risque blackout et CTA visibles.
- Les modes Paris et 2050 ont une personnalite visuelle et narrative distincte.
- Le verdict fait payoff de jeu: score, grade, XP, carte et conseils.

## Priority Issues

- [P2] Verdict pas toujours amene au haut du viewport apres la cinquieme decision.
  Why it matters: le payoff peut arriver partiellement hors champ, donc le moment le plus important perd son impact.
  Fix: scroll apres rendu DOM quand phase=result. Corrige.
  Suggested command: $impeccable polish

- [P3] Hero mobile dense avant la carte.
  Why it matters: le concept reste clair, mais le signal carte arrive tard sur petits ecrans.
  Fix: compacter les espacements hero mobile. Corrige partiellement.
  Suggested command: $impeccable adapt

- [P3] Densite de cockpit en fin de mission.
  Why it matters: plusieurs panneaux restent visibles avant le verdict et peuvent voler l attention.
  Fix: a terme, ajouter une transition plus nette mission verrouillee -> verdict.
  Suggested command: $impeccable distill

## Persona Red Flags

Jordan, first-timer: comprend le but, mais peut etre intimide par la densite HUD + bonus + jauges + actions. Le CTA et la contrainte 5 decisions compensent bien.

Alex, power user: voudra rejouer vite et comparer les strategies. Le partage encode les actions, mais il manque un recap strategique plus compact avant rejouer.

Camille, jury hackathon: verra le concept en moins de 10 secondes et peut tester sans explication orale. Le verdict doit rester le moment le plus net; correction de scroll importante.

## Minor Observations

- Le badge donnees demo est bien visible, peut etre repete dans la page mais sans confusion.
- Les animations sont utiles mais proches du seuil de densite; garder reduced-motion et eviter d ajouter plus de motion permanente.
- Les CTA principaux sont assez grands et lisibles sur mobile.

## Questions to Consider

- Le verdict devrait-il devenir un ecran plein plus cinematographique apres 5 decisions?
- Faut-il masquer les panneaux de mission une fois la mission verrouillee pour laisser respirer le resultat?
- La prochaine evolution doit-elle etre plus de gameplay ou plus de lisibilite jury?
