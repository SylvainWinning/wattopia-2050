# Product

## Register

product

## Pitch

BLACKOUT: "Empêche la France de s'éteindre."

BLACKOUT est une mini-expérience de hackathon où l'utilisateur devient opérateur du réseau électrique français. À partir d'un signal RTE éCO2mix quand il est disponible, il doit prendre 5 décisions pour éviter un blackout, stabiliser le réseau, limiter le CO2, préserver le budget et garder l'acceptabilité citoyenne.

## Users

Hackathon judges, curious citizens, students, and energy-interested users who need to understand electricity tradeoffs quickly, visually, and without technical prerequisites. The experience should work in a 5-minute jury demo and be shareable by a single link.

## Product Purpose

BLACKOUT turns energy-system complexity into a short playable crisis. The user sees France under stress, chooses a mission, takes 5 constrained decisions, watches the map and meters react, then receives a verdict and a shareable result.

Success means the user understands in under 10 seconds that a blackout threatens France, that decisions are needed, and that every choice has visible consequences across stability, CO2, cost and social trust.

## Experience Model

### 1. Immersive Intro

A dark, premium control-room opening: BLACKOUT, France partially lit, animated grid lines, risk gauge, and the CTA "Prendre le contrôle".

### 2. Mission Engine

The main game is a 5-decision mission. Mission France is complete and primary. Paris 19h42 and 2050, nuit sans vent use the same engine with different starting tension, events and narrative framing.

### 3. Final Verdict

The result shows whether the blackout was avoided, partial, or national. The map state, score, best strategic point, biggest compromise, tips and share action make the scenario easy to present to a jury.

## Brand Personality

Tense, civic, premium, clear, and energetic. The experience should feel like a public Mission Control for an energy crisis: serious enough to trust, dramatic enough to remember, simple enough to play immediately.

## Anti-references

Avoid expert-only dashboards, generic slider toys, fake official RTE branding, neon clutter, moralizing copy, fake scientific authority, and any claim that the score is an official forecast.

## Design Principles

- Make the blackout threat visible before explaining the model.
- Make each decision change the map and meters immediately.
- Prioritize Mission France, polish and clarity over simulation complexity.
- Keep the model honest and clearly simplified.
- Use live public data as an anchor, but make fallback mode first-class.
- Make the final result easy to copy, pitch and discuss.

## Data & Trust

The app uses RTE éCO2mix data through the ODRÉ / OpenDataSoft `eco2mix-national-tr` dataset when available. If the API is unavailable, incomplete, quota-limited, CORS-blocked, or the URL contains `?demo=1`, the product remains usable with a local fallback clearly labeled "Données de démonstration".

The experience can use RTE Futurs énergétiques 2050 as public context and inspiration, but must avoid fake official branding or claims that BLACKOUT's score is scientifically authoritative.

## Deployment Constraint

The project should remain compatible with both Vercel static deployment and GitHub Pages static export. Vercel uses `npm run build`; GitHub Pages uses `npm run build:github`.

## Accessibility & Inclusion

Target readable French copy, strong contrast, keyboard-usable controls, meaningful labels, reduced-motion support, and responsive layouts from 320px phones to desktop. Blackout states must never depend only on color or motion; text labels and stable metrics must always communicate the state.
