# Design

## Visual Theme

Wattopia 2050 uses a clean product-interface register: white canvas, cobalt control-room accents, energy colors for data, and restrained motion. The visual metaphor is a future French grid control room: clear, luminous, calm, and visibly alive when a crisis scenario is triggered.

## Color Palette

- Background: `oklch(1 0 0)`
- Surface: `oklch(0.985 0.006 260)`
- Ink: `oklch(0.18 0.035 260)`
- Muted: `oklch(0.46 0.035 260)`
- Primary cobalt: `oklch(0.45 0.15 260)`
- Amber solar: `oklch(0.78 0.17 82)`
- Wind cyan: `oklch(0.72 0.12 218)`
- Hydro blue: `oklch(0.55 0.16 240)`
- Nuclear violet: `oklch(0.55 0.17 292)`
- Gas orange: `oklch(0.67 0.16 48)`
- Fossil red: `oklch(0.55 0.18 28)`
- Renewable green: `oklch(0.62 0.14 145)`

## Typography

Use Geist Sans from Next as the main UI typeface. Headings are confident and compact; labels and chart chrome stay precise and readable.

## Components

Primary components: sticky header, hero control-room visual, live data cards, cockpit overview, today-vs-2050 comparator, scenario sliders, cinematic challenge cards, dynamic France energy map, 24h simulation timeline, score gauge, metric meters, scenario passport, advice list, source links.

## Motion

Motion is stateful and purposeful: energy line flow, node pulse, hour-by-hour simulation playback, score transitions, button feedback, and crisis-state changes. Avoid stacking expensive filters; respect `prefers-reduced-motion`.
