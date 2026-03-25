# Retro Room Studio

This is a separate productized rebuild of the original retro camera prototype. It keeps the original root HTML files untouched and moves the new work into a modular static app.

## What it includes

- Room modes for `event`, `journal`, and `brand` monetization paths
- Local-first room persistence with invite codes and share links
- Camera capture, import flow, timer, aspect ratio, film packs, and frame styles
- Drag-and-arrange retro stage with editable captions and back notes
- Gallery history plus export flows for collage, single polaroid, strip, share card, and print guestbook
- Monetization panel for package positioning and add-on toggles
- QR-based invite modal for demoable event-style sharing

## Folder layout

- `index.html`: standalone entry point
- `styles/app.css`: full visual system and responsive layout
- `scripts/data.js`: product constants, presets, templates, and factories
- `scripts/store.js`: local storage and state helpers
- `scripts/camera.js`: camera lifecycle, import handling, and demo image generation
- `scripts/exporters.js`: canvas rendering and export helpers
- `scripts/main.js`: app orchestration, rendering, and interaction logic

## Run locally

From the repo root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/revamp/index.html
```

For the built-in smoke test:

```text
http://127.0.0.1:4173/revamp/index.html?autotest=1
```

## Notes

- Rooms are persisted in `localStorage` today. The room model and invite flows are structured so you can replace the local adapter with a real backend later.
- QR images are generated from the share link for demoability in this static build.
