# Design

## Visual Theme

Wattopia 2050 uses a clean product-interface register built around one sentence: "Stabilisez la France avant la coupure." The visual metaphor is a public Mission Control for the French grid in 2050: clear, luminous, civic, and visibly tense when the network approaches a blackout.

The interface should feel like a serious control room designed for citizens, not an expert-only RTE clone and not a neon sci-fi game. The drama comes from the consequences: risk rising, margin shrinking, hours turning critical, and the scenario becoming something people can debate.

## Product Scenes

### Mission Control

Mission Control is the main scene. It should combine a strong hero, command-room status, France energy map, current RTE snapshot, scenario score, and immediate CTA to simulate. The user must feel they are taking responsibility for the grid, not filling out a form.

Design notes:

- Use a spacious control-room composition with one strong visual surface, not many equal cards.
- Keep the current mix and 2050 scenario visually close so the comparison feels direct.
- Treat status pills as operational signals: live data, fallback data, crisis state, blackout risk.
- Keep the copy short and imperative: stabilize, test, adjust, debate.

### Blackout Simulator

Blackout Simulator is the visual consequence layer. It should make fragility legible through the 24h timeline, crisis cards, critical-hour count, minimum margin, risk meter, verdict, and map state.

Design notes:

- Blackout states should dim or harden the interface in a controlled way, never blank the page.
- Critical hours need both color and text labels for accessibility.
- The simulator should feel immediate: changing one slider should alter score, margin, risk, and advice without delay.
- Failure copy should be instructive, not punitive.

### Grand Débat

Grand Débat is the human compromise layer. It reframes the result as a public discussion rather than a one-player score chase.

Design notes:

- The scenario passport is the debate object: share link, PNG export, score, verdict, mix, crisis, and critical hours.
- Advice should expose tradeoffs: security, CO₂, cost, sobriety, flexibility, and political acceptability.
- Avoid implying there is a single perfect mix. The interface should make disagreement understandable.
- Future UI can make this more explicit with debate prompts or comparison labels, but the current docs should already name the concept.

## Color Palette

- Background: `oklch(1 0 0)`
- Surface: `oklch(0.985 0.006 260)`
- Surface strong: `oklch(0.965 0.012 260)`
- Ink: `oklch(0.18 0.035 260)`
- Muted: `oklch(0.46 0.035 260)`
- Line: `oklch(0.89 0.018 260)`
- Primary cobalt: `oklch(0.45 0.15 260)`
- Primary strong: `oklch(0.34 0.16 260)`
- Amber solar: `oklch(0.78 0.17 82)`
- Wind cyan: `oklch(0.72 0.12 218)`
- Hydro blue: `oklch(0.55 0.16 240)`
- Nuclear violet: `oklch(0.55 0.17 292)`
- Gas orange: `oklch(0.67 0.16 48)`
- Fossil red: `oklch(0.55 0.18 28)`
- Renewable green: `oklch(0.62 0.14 145)`
- Storage teal: `oklch(0.53 0.15 182)`

Use cobalt for control and primary actions, amber/cyan/violet/green/orange/red for energy semantics, and red only for actual fragility or blackout risk. Do not let the palette become a rainbow dashboard: the control room should stay restrained, with energy colors reserved for data and state.

## Typography

Use Geist Sans from Next as the main UI typeface. Headings are confident and compact; labels and chart chrome stay precise and readable. Product UI labels should stay practical and familiar. The main pitch can be bold, but controls, metrics, and explanations should not use display styling.

## Components

Primary components:

- Sticky header with Mission / Cockpit / Maintenant / Simulateur / Méthode / Sources.
- Hero Mission Control with pitch, launch CTA, current stakes, and France grid visual.
- Live RTE/ODRÉ data cards and source pill, including fallback state.
- Cockpit overview with verdict, score, CO₂, low-carbon share, minimum margin, and max risk.
- Today-vs-2050 comparator.
- Scenario sliders for solar, wind, hydro, nuclear, storage, sobriety, and gas backup.
- Crisis selector for normal conditions, night without wind, winter peak, solar day, cold wave, reactor outage, and import limits.
- Blackout Simulator timeline with demand, supply, margin, critical hours, and playback.
- Scenario passport with share-link and PNG export actions.
- Advice list that explains tradeoffs rather than just optimizing a score.
- Source links for RTE éCO2mix, ODRÉ / OpenDataSoft, and RTE Futurs énergétiques 2050.

## Motion

Motion is stateful and purposeful: energy line flow, node pulse, hour-by-hour simulation playback, score transitions, button feedback, and crisis-state changes. Blackout Simulator motion should communicate cause and consequence, not decorate the page.

Avoid stacking expensive filters; respect `prefers-reduced-motion`. Reduced-motion users should still see verdicts, warnings, critical-hour labels, and margin changes instantly.

## Copy & Tone

- Lead with the mission: "Stabilisez la France avant la coupure."
- Use French, short sentences, and active verbs.
- Make the stakes concrete: lights on, margin, critical hours, risk, CO₂.
- Make the compromise explicit: every energy choice has a cost, benefit, and debate.
- Avoid official-sounding claims, fake authority, and moralizing.

## Responsive Rules

Desktop can feel like a Mission Control wall: map, cockpit metrics, timeline, and passport can sit in a denser composition. Mobile should prioritize the mission, one primary action, readable metrics, then the simulator. Do not let repeated CTAs, sticky UI, or large visuals hide the sliders and verdict.

## Data & Source States

The design must preserve a visible distinction between:

- "RTE éCO2mix temps réel" when live data is usable.
- "Données de démonstration" when the fallback snapshot is used.
- Loading or refresh states while the ODRÉ / OpenDataSoft request is pending.

Do not hide fallback mode behind a decorative badge. It is part of trust and must remain readable.
