# Assets

Minimal shelf of web animation assets. Static site, no build step.

## Add an asset
1. Create `assets/<slug>/index.html` (self-contained; add a `<a href="../../">← Assets</a>` link back).
2. Add an entry to `assets.json` (`slug`, `title`, `kind`, `tech`, `cover`).

Run locally: `python -m http.server` in this folder.
