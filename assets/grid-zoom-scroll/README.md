# Grid Zoom, on scroll

> Your opinions were made for you.

A scroll-driven piece after Edward Bernays' *Propaganda* (1928). A plain page of very large type gives way to four artworks. Each one grows from a small tile into a full frame, reads its passage, then folds back into an uneven collage laid out with the golden ratio. No clicks, only scroll.

## The three beats

1. **Statement.** A pinned screen of huge type. The words light up one by one as you scroll. "for you." is 1.618 times the size of the other lines.
2. **Sequence.** One pinned stage. Four chapters play in order: Masses, Invisible, Mechanism, Millions. Each card appears at its place, opens, shows heading and text, then returns. Earlier cards stay as faint pieces behind.
3. **Question.** "Who made yours?" rises into view.

## Files

```
index.html     markup: hero, stage, outro, back link
scroll.css     type, layout, responsive rules
scroll.js      the whole animation (GSAP ScrollTrigger)
img/           original generated artwork
```

## How it works

- `gsap` and `ScrollTrigger` are loaded from a CDN.
- The stage is one pinned, scrubbed timeline built from the `chapters` array at the top of `scroll.js`.
- Each chapter has a `rest` rectangle (where its card lives in the collage), an `open` rectangle (its large size) and a `text` position. Values are in `vw` for left and width, and in `vh` for top and height, mapped into the middle 80% of the screen so there is always room at the top and bottom.
- Desktop and phone have their own rectangles (`d` and `m`), switched with `gsap.matchMedia`.
- Heading size is fitted to its column so long words never clip.
- Triggers are created top to bottom (hero, stage, outro) with `refreshPriority` so pin spacing is measured in page order.

## Customise

- **Change a chapter:** edit its `n`, `h`, `p` and `img` in `chapters`.
- **Move a card:** change its `rest`, `open` or `text` numbers. Keep a gap between `rest` rectangles so the final collage does not overlap.
- **Scroll length:** `end` on the stage trigger is `chapters.length * 140%`. Raise 140 for a slower read.
- **Colours and type:** CSS variables at the top of `scroll.css`.

## Artwork

All four images are generated, not photographed: a dot field, veil lines, turning squares and a halftone moon. Replace any file in `img/` and keep the name in the `img` field.

## Tags

scroll-triggered, scrollytelling, GSAP, ScrollTrigger, pinned timeline, typographic, editorial, minimal, golden ratio, asymmetric layout, generative art, halftone, responsive

## Credits

- Excerpts from *Propaganda* (1928) by Edward Bernays.
- Inspired by the Grid Zoom effect from Codrops. This page is written from scratch and shares none of its code or images.
- Animation by [GSAP](https://gsap.com).
