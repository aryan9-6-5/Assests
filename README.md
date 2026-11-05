# Assets

A small shelf of web animation pieces. Open one and watch it run.

Live: https://site-five-delta-76.vercel.app

Static site. No build step, no framework. HTML, CSS and a little JavaScript.

## What is here

| Asset | What it is | Built with |
|---|---|---|
| [Grid Zoom, on scroll](assets/grid-zoom-scroll/) | Giant type gives way to four images that open one after another as you scroll | GSAP, ScrollTrigger |

## Structure

```
index.html        the shelf (home page)
style.css         home page styles
app.js            reads assets.json and renders the cards
assets.json       the list of assets
assets/<slug>/    one self-contained folder per asset
```

## Add an asset

1. Create `assets/<slug>/index.html`. Keep it self-contained (its own CSS, JS and images) and add a link back: `<a href="../../">&larr; Assets</a>`.
2. Add an entry to `assets.json`:

```json
{
  "slug": "my-asset",
  "title": "My asset",
  "kind": "Scroll animation",
  "tech": "GSAP",
  "cover": "assets/my-asset/img/cover.jpg"
}
```

3. Push. The home page shows it automatically.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

```bash
npx vercel deploy --prod
```

## Notes

- Only add images you have the right to use.
- Respects `prefers-reduced-motion` and works from phone width upward.
