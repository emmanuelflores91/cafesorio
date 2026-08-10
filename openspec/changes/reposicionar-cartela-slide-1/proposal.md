# Proposal — Reposition and resize the yellow caption of comic-intro slide 1

- **Change name:** `reposicionar-cartela-slide-1` ("Reposicionar y redimensionar cartela amarilla del slide 1 del comic-intro")
- **Topic key:** `sdd/reposicionar-cartela-slide-1/proposal`
- **Type:** cosmetic CSS-only, single slide, low risk
- **Builds on:** `sdd/reposicionar-cartela-slide-1/explore`

---

## 1. Intent

### Problem

On slide 1 of the comic intro sequence, the yellow caption ("cartela") currently renders as a
near-square block pinned fully inside the top-left corner of the panel art
(`top: 15px; left: 15px; max-width: 240px`). With no `font-size` override it inherits the body
`1rem / 1.5`, so the 52-character line

> `DOS CAMINOS QUE SE UNIERON PARA CREAR UN BLEND ÚNICO`

wraps into roughly 4 lines inside a ~196px content column. The result is a tall, boxy caption that
reads as a generic overlay label rather than a comic-book cartela, and it sits timidly inside the
frame instead of breaking the panel edge the way the reference art does.

### Why now

The intro sequence is the first thing a visitor sees; slide 1 sets the visual tone for the whole
comic. The user has a concrete target composition (before/after screenshots) and the gap is a
handful of CSS declarations away. Fixing it now is cheap; deferring it leaves the weakest-looking
frame as the entry point.

### Success looks like

On slide 1, at desktop and mobile:

1. The caption hangs partially over/off the **left edge** of the panel image instead of sitting
   fully inside it.
2. The caption box is visibly **wider and shorter** than today's near-square block.
3. The caption text wraps into **2–3 lines** instead of ~4.
4. The comic/premium identity is untouched: same yellow `#fffb9d`, same `2px solid #000000`
   border, same `'Segoe Print', 'Comic Sans MS', cursive` family, same uppercase, same `z-index: 2`.
5. Slides 2–5 render **pixel-identically** to today.
6. Nothing is clipped by the viewport edge on narrow phones.

---

## 2. Scope

### In scope

- **`css/layout.css` only.** One new rule block scoped to slide 1, added after the shared
  `.comic-slide__caption` rule (currently lines 163–176).
- Properties touched on slide 1's caption only: `left`, `top`, `max-width`, `width`, `padding`,
  `font-size`, `line-height`.

### Out of scope — explicitly unchanged

- **The base image.** No re-export, no crop, no swap of `assets/images/vi-1-web-nv.webp`.
- **`index.html` markup structure.** The recommended approach needs zero HTML edits. The only
  HTML change this proposal ever authorizes is the fallback in §3.2: adding one modifier class to
  the single `<div>` at line 67. No new wrappers, no new elements, no reordering.
- **`js/modules/IntroController.js`.** No JS involvement. Verified: the controller only toggles
  `is-active` / `is-past` classes and queries `.comic-slide` as a click target; it never reorders,
  clones, or re-renders slides inside `.comic-track`.
- **The shared `.comic-slide__caption` base rule.** It stays exactly as-is so slides 2–5 are
  untouched. Slide 1's rule overrides, it does not rewrite the base.
- **Gallery / carousel architecture**, transition timing, `.comic-track` sizing math,
  `.comic-controls`, and all responsive breakpoints.
- **New CSS variables.** Extracting `#fffb9d` or caption spacing into `css/variables.css` is a
  tempting adjacent cleanup and is deliberately deferred — it would touch shared tokens for a
  single-slide cosmetic fix.
- **Slides 2–5 captions**, even though they have the same 4-line-wrap characteristic. If the
  result is liked, generalizing it is a separate follow-up change.

---

## 3. Approach

### 3.1 Recommended: CSS-only `:first-child` scoping

Add one descendant rule scoped through the first `.comic-slide`:

```
.comic-slide:first-child .comic-slide__caption { ... }
```

**Verified as safe:**

- `index.html:64-68` — slide 1 (`<div class="comic-slide is-active">`) is genuinely the *first
  child* of `.comic-track`; there is no sibling element before it.
- The DOM order is static. `IntroController` never mutates the track's children (its one
  `innerHTML = ''` is on the pagination-dots wrapper, not the track), so `:first-child` cannot
  drift onto another slide at runtime.
- Specificity `0,3,0` beats the base rule's `0,1,0`, and the new block sits later in the file, so
  the override is unambiguous without any `!important`.

**Why this over the alternative:** zero HTML diff, zero risk of the class and the CSS drifting
apart, and the whole change stays reviewable in one file.

### 3.2 Fallback: explicit modifier class

If a named hook is preferred over a positional selector (e.g. because slide order might change
later, or because the team's convention is explicit BEM modifiers), then instead:

- `index.html:67` — one-line change:
  `<div class="comic-slide__caption comic-slide__caption--intro">`
- `css/layout.css` — same declarations, selector `.comic-slide__caption--intro` (specificity
  `0,1,0`, tie with the base rule, resolved by source order — so it **must** be placed after the
  base rule).

This is a strict either/or with §3.1. Do not ship both.

### 3.3 Planned CSS property changes

Target geometry, derived from the current box (border-box sizing is global — `css/reset.css:4`):

| Property | Today (inherited) | Planned for slide 1 | Rationale |
|---|---|---|---|
| `max-width` | `240px` | `none` | **Load-bearing.** Without resetting it, any new `width` is silently capped at 240px and the caption never gets wider. |
| `width` | *(auto, capped 240px)* | `min(360px, 78vw)` | Wider box → fewer wraps. The `78vw` arm keeps it inside the panel on narrow phones. |
| `left` | `15px` | `clamp(-48px, -3.5%, 0px)` | Negative → hangs off the left panel edge; percentage resolves against the slide width so the overhang scales down automatically on small screens; `-48px` caps it on very wide screens. |
| `top` | `15px` | `15px` (unchanged) | The target composition moves the caption horizontally, not vertically. Left as an explicit tuning knob. |
| `padding` | `16px 20px` | `12px 18px` | Trims vertical bulk, contributing to "shorter". |
| `font-size` | *(inherited `1rem`)* | `clamp(0.75rem, 1.6vw, 0.95rem)` | Smaller type packs more characters per line → 2–3 lines instead of 4. Fluid so mobile does not regress to 4+ lines. |
| `line-height` | *(inherited `1.5`)* | `1.25` | Tightens a multi-line uppercase comic caption; 1.5 is a body-copy value. |

Unchanged and inherited from the base rule: `position: absolute`, `background-color: #fffb9d`,
`border: 2px solid #000000`, `font-family`, `text-transform: uppercase`, `text-align: center`,
`white-space: normal`, `z-index: 2`.

**Expected outcome at desktop:** content column ≈ `360 − 36 (padding) − 4 (border) = 320px`; at
~15px uppercase comic type that fits the 52-character string in **2 lines**; box height drops from
~132px to ~70px. Wider *and* shorter, as specified.

### 3.4 Sketch (plan, not final code)

```css
/* Slide 1 only — cartela ampliada que desborda el borde izquierdo */
.comic-slide:first-child .comic-slide__caption {
    top: 15px;
    left: clamp(-48px, -3.5%, 0px);
    max-width: none;
    width: min(360px, 78vw);
    padding: 12px 18px;
    font-size: clamp(0.75rem, 1.6vw, 0.95rem);
    line-height: 1.25;
}
```

All seven numbers are starting values to be validated against the target screenshot during apply,
not fixed contractual constants.

---

## 4. Risks and open questions

### R1 — Viewport clipping on narrow screens (flagged in exploration; mitigated, not dismissed)

Neither `.comic-slide` nor `.comic-track` clips overflow; the only clipping ancestor is
`.comic-sequence` (`overflow: hidden`, `layout.css:110-124`). So a negative `left` bleeds toward
the viewport edge, and on narrow screens there is very little slack:

- `.comic-track` width is `min(calc(100vw - 32px), ...)` (`layout.css:133`), so on a phone the
  track is centered with only **16px** between its left edge and the viewport edge.
- A single fixed `left: -40px` would therefore push ~24px of the caption off-screen and it would
  be visibly guillotined.

This is exactly why the plan uses a **percentage-based clamp** rather than a fixed offset:
`-3.5%` of a 343px track (375px viewport) is `-12px`, which stays inside the 16px gutter with
~4px to spare; on a 1000px-wide track it becomes `-35px`, a proper comic overhang. The clamp is
self-protecting across the range. **This still requires visual verification at ~360–390px width
during apply**; if it proves tight, the fallback is a `@media (max-width: 1023px)` override
pinning `left: 0`.

### R2 — Vertical collision with `.comic-controls`

Assessed as **not a risk**. `.comic-controls` is `position: fixed; bottom: 12px`
(`layout.css:222-232`) and the caption stays anchored at `top: 15px`, so they never meet. Recorded
here only to close the question raised during exploration.

### R3 — `:first-child` is a positional selector

Correct today (verified in §3.1) but it encodes "slide 1" as a position rather than a name. If a
future change ever prepends an element to `.comic-track` or reorders slides, the styling silently
jumps to the wrong caption. Accepted for a cosmetic change with a one-line escape hatch (§3.2).

### R4 — Font metrics are estimated, not measured

The 2-line prediction assumes ~0.55em average glyph width for uppercase `Segoe Print`. Actual
rendering varies by platform, and `Segoe Print` is Windows-only — other platforms fall back to
`Comic Sans MS` or a generic `cursive` with different metrics. The line count must be confirmed
visually; if it lands at 3 lines it still satisfies the stated 2–3 line target.

### Open questions (non-blocking; defaults chosen)

- **OQ1:** Is 2 lines strictly required, or is 3 acceptable? *Assumed: 2–3 both acceptable, per the
  stated target.*
- **OQ2:** Should the caption also shift vertically? *Assumed no — `top: 15px` preserved.*
- **OQ3:** `:first-child` vs. modifier class? *Assumed `:first-child` per the exploration
  recommendation.*

---

## 5. Proposal question round

This phase ran without an interactive channel to the user, so the following questions are recorded
here for review instead of being asked live. Answering them is optional — each already has a
working default, and the proposal is actionable as-is.

1. **Product outcome / fidelity.** In the target screenshot, roughly how much of the caption hangs
   past the panel's left edge — a small nibble (~10% of the box) or a substantial overhang (~25%+)?
   The `-3.5%` value assumes a modest, tasteful overhang.
   *Assumption if unanswered: modest overhang that scales with panel size.*

2. **Scope boundary.** Is slide 1 intentionally the odd one out, or is it a pilot for restyling all
   five captions later? This does not change the work, but it decides whether the fallback modifier
   class (§3.2) is the better long-term shape.
   *Assumption if unanswered: slide 1 only, deliberately, as a one-off.*

3. **Edge case / mobile.** On a phone, is a caption that overhangs less (nearly flush at `left: 0`)
   acceptable, or must the overhang read clearly at every width even at the cost of a tighter fit
   against the viewport edge?
   *Assumption if unanswered: readability and no-clipping win; the overhang may shrink to near
   zero on the smallest screens.*

4. **Business risk / tradeoff.** If the wider caption ends up covering more of the panel artwork
   than expected, which is preferred — a narrower box with 3 lines, or smaller type to keep the
   wide-and-short silhouette?
   *Assumption if unanswered: keep the wide-and-short silhouette; reduce `font-size` before
   reducing `width`.*

The user may answer these, skip them, correct the framing, or request a second question round
before spec/design proceed.

---

## 6. Next phases

`sdd-spec` and `sdd-design` can run in parallel from this proposal. Given the size of the change,
both should stay minimal — the design phase in particular should not introduce new tokens,
new breakpoints, or a caption component abstraction.
