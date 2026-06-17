# Design

## Visual Theme

Wattopia 2050 uses a clean product-interface register: white canvas, cobalt control-room accents, energy colors for data, and restrained motion. The visual metaphor is a future French grid control room: clear, luminous, and calm.

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

Primary components: sticky header, hero control-room visual, live data cards, chart panel, scenario sliders, challenge segmented buttons, score gauge, metric meters, advice list, source links.

## Motion

Motion is stateful and subtle: energy line flow, node pulse, score transitions, button feedback, and section entrance. Respect `prefers-reduced-motion`.
