# Product

## Register

product

## Pitch

"Stabilisez la France avant la coupure."

Wattopia 2050 doit se comprendre comme une scène de hackathon en trois actes : Mission Control pour prendre les commandes, Blackout Simulator pour voir les conséquences, Grand Débat pour comprendre que chaque mix énergétique est un compromis humain.

## Users

Hackathon judges, curious citizens, students, and energy-interested users who need to understand the tradeoffs of a 2050 French electricity mix quickly, visually, and without technical prerequisites. The experience should work for people who have no energy-sector background but can feel the tension of keeping a country powered.

## Product Purpose

Wattopia 2050 is a French interactive mini-app where the user enters a public energy control room and tries to keep France stable in 2050 before a blackout. It starts from a live snapshot of the current French electricity mix, then lets users build and stress-test a simplified 2050 scenario with sliders, crises, a 24h simulation, and a shareable scenario passport.

Success means the user understands the core compromises between low-carbon production, renewables, storage, sobriety, cost, and supply security in under a minute, then has a clear scenario to discuss with someone else.

## Experience Model

### 1. Mission Control

The first scene is the control room: a strong hero, live network status, France energy map, current mix snapshot, and clear mission framing. The user should immediately understand the job: stabilize the country, not merely move sliders.

### 2. Blackout Simulator

The second scene makes consequences visual. Crisis cards, timeline playback, margin warnings, blackout hours, and risk signals should show what breaks when a scenario is too fragile. A blackout is not a generic error state; it is the dramatic consequence that makes the tradeoff memorable.

### 3. Grand Débat

The third scene turns the result into a human compromise. The scenario passport, advice, score explanation, and share actions should help users debate choices: more nuclear, more renewables, more storage, more sobriety, more gas backup, or more cost. The product should make disagreement legible rather than pretending there is one perfect answer.

## Product Promise

- In 5 seconds: the user understands the mission and the blackout stakes.
- In 30 seconds: the user has changed the mix and seen a visible consequence.
- In 60 seconds: the user can explain at least one energy compromise.
- At the end: the user can copy or export a scenario and use it as a debate object.

## Brand Personality

Clear, intelligent, tense, and civic. The experience should feel premium and modern, like a public Mission Control for energy choices: serious enough to trust, dramatic enough to remember, playful enough to explore.

## Anti-references

Avoid cold developer demos, dense expert-only dashboards, dark neon sci-fi interfaces, fake official RTE branding, generic SaaS card grids, exaggerated gamification, moralizing copy, and any copy that implies the score is scientifically official. Do not present the simplified model as a forecast or an official RTE result.

## Design Principles

- Make the mission visible before the model.
- Make the tradeoff visible before explaining it.
- Show consequences through the Blackout Simulator, not through abstract warnings alone.
- Treat the Grand Débat as the payoff: every result should be discussable.
- Reward exploration with immediate feedback.
- Keep the model honest and clearly simplified.
- Use a few strong visual signals rather than decorative clutter.
- Let live public data anchor the experience in reality.

## Data & Trust

The app uses RTE éCO2mix data through the ODRÉ / OpenDataSoft `eco2mix-national-tr` dataset when available. If the API is unavailable, incomplete, or the URL contains `?demo=1`, the product must remain usable with a local fallback clearly labeled "Données de démonstration".

The experience can use RTE Futurs énergétiques 2050 as public context and inspiration, but must avoid fake official branding or claims that Wattopia's score is scientifically authoritative.

## Deployment Constraint

The project should stay compatible with GitHub Pages static export. Documentation, routing, and future implementation choices should preserve `npm run build:github` and the public GitHub Pages delivery path.

## Accessibility & Inclusion

Target readable French copy, strong color contrast, keyboard-usable controls, meaningful labels, reduced-motion support, and responsive layouts from small phones to desktop screens. The blackout drama must never depend only on color or motion; text labels and stable metrics should always communicate the state.
