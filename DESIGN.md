# Design

## Visual Theme

BLACKOUT is a dark, premium product experience that feels like a civic energy control room crossed with a restrained strategy video game. The physical scene is a solo hackathon judge opening the app on a laptop or phone under time pressure; they must understand the threat, play fast, and remember the visual story.

The interface should be operational and game-like rather than decorative: France, grid tension, five decisions, visible consequences, mission HUD, bonus objectives, final verdict.

## Product Scenes

### Intro

The first viewport carries the brand: BLACKOUT, "Empêche la France de s'éteindre", a stylized France grid, city lights, live/fallback data badge, and a blackout risk gauge.

### Mission

The mission scene places the map and narrative log beside a crisis panel. It should not feel like a settings dashboard. Each scene has an hour, an operator radio message, a threatened city corridor and three tactical choices. Each click changes stability, CO2, budget, citizen trust, blackout risk, lights on and city states, then gives immediate impact feedback.

### Verdict

The verdict is the payoff: the map state, score, grade, XP, trophies, cascade replay, result title, operator profile, fragile/off cities, best decision angle, biggest compromise, tips and copy action. It must work as a jury slide without extra explanation.

## Color Palette

- Background: `oklch(0.09 0.032 255)`
- App surface: `oklch(0.13 0.038 252)`
- Panel: `oklch(0.17 0.04 253)`
- Ink: `oklch(0.97 0.012 250)`
- Muted: `oklch(0.77 0.035 250)`
- Electric blue: `oklch(0.75 0.15 225)`
- Cyan: `oklch(0.79 0.13 196)`
- Green: `oklch(0.75 0.15 152)`
- Amber: `oklch(0.82 0.15 76)`
- Orange: `oklch(0.72 0.17 42)`
- Red: `oklch(0.62 0.2 27)`
- Violet: `oklch(0.68 0.17 292)`

Use electric blue for control and primary action, amber/red only for tension, green/cyan for stabilized states. Data colors should explain state, not decorate the page.

## Typography

Use Geist Sans for all UI. BLACKOUT can use a large compact heading, but letter spacing stays at `0` for readability across small screens. Product labels, meters and action cards stay familiar and readable.

## Components

- Sticky header with compact brand, navigation, and one CTA.
- Intro hero with source badge, launch CTA, France grid and risk console.
- Mode selector for Mission France, Paris 19h42, and 2050 nuit sans vent.
- Game HUD with clock, threat level, order progression, combo label, rank and XP.
- France map with a more realistic mainland silhouette, Corsica, city states and animated energy lines.
- Five-decision mission engine with dedicated crisis-scene arcs for Mission France, Paris 19h42 and 2050 nuit sans vent.
- Bonus objectives, tactical tags and impact burst after each decision.
- Narrative/radio log with deterministic events.
- Final verdict with grade, achievements, cascade replay and share action.
- Live data panel with RTE/ODRÉ/fallback state.
- Education section and source footer.

## Motion

Motion communicates network state: line flow, frequency trace, blackout alert, city relight, Paris metro stress, 2050 storage pressure, combo/grade feedback, button arming and result reveal. Respect `prefers-reduced-motion`; no critical information should depend on animation.

## Copy & Tone

French, short, active. The tone is tense but not alarmist, civic but not official. Always name the simplified model where scientific authority could be inferred.

## Responsive Rules

Desktop can feel like a control-room wall: map and decisions side by side. Mobile is one clear column: hero, modes, map, decisions, meters, verdict. No sticky element should hide the mission controls.

## Data & Source States

The source badge must distinguish:

- "RTE éCO2mix temps réel" when live data is usable.
- "Données de démonstration" when fallback is active.
- Loading text while ODRÉ is pending.

Fallback mode is a trust signal, not a hidden implementation detail.
