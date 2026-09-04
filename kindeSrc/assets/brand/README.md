# Glidepath Health brand assets

Copied from the official brand kit at
`OneDrive-GlidepathHealth/AI-Ready Brand Guide` (Brand Summary V.01 07.08.2026 /
Brand at a Glance V1.0 07.02.2026). These are the production files — the guide
forbids AI-generating or redrawing the logo and the Glide Path pattern, so
always composite from these.

```
logo/
  logo-horizontal-inverse.svg      orange icon + white wordmark — use on the dark login bg
  logo-horizontal-full-color.svg   orange icon + navy wordmark — light backgrounds
  logo-horizontal-navy.svg         one-color navy   (only when full colour isn't possible)
  logo-horizontal-white.svg        one-color white  (only when full colour isn't possible)
  icon-full-color.svg              icon alone — small spaces
  logo-secondary-horizontal.svg    boxed icon — favicon / platform identity
pattern/
  gradient-digital.svg             brand gradient, Midnight -> Dusk -> Dawn -> Horizon
  glide-path-white.svg             Glide Path line pattern, white strokes
  glide-path-midnight.svg          Glide Path line pattern, midnight strokes
fonts/
  Figtree-latin.woff2              embedded into the stylesheet by npm run assets
  Figtree-latin-ext.woff2
  Figtree-VariableFont_wght.ttf    full variable font, for design tools
  Figtree-Italic-VariableFont_wght.ttf
  OFL.txt                          Figtree's licence
```

`../ui/` holds interface glyphs this repo draws itself (the link arrow). Those
are not brand assets and are not covered by the no-redraw rule.

## Colour tokens

| Token | Name | Hex |
|---|---|---|
| Core | Horizon | `#F0704B` |
| Core | Midnight | `#0A082C` |
| Secondary | Dusk | `#18206C` |
| Secondary | Dawn | `#6373C1` |
| Accent | Glint | `#FFB45F` |
| Neutral | Stratus | `#3C3C3C` |
| Accessibility only | Accessibility Horizon | `#C84423` |

60/30/10 proportion (core / secondary / accent). Tints are allowed if they stay
WCAG 2.1 AA. Substitute Accessibility Horizon for Horizon on text and UI where
contrast is short.

## Type

**Figtree**, matching the product app, embedded as base64 woff2.

The brand guide's primary typeface is **Area** (Adobe Fonts, subscription, not
redistributable). It cannot be used on the hosted auth pages at all: those pages
do not load cross-origin subresources, so an Adobe Fonts web project would never
resolve. Figtree is the guide's sanctioned fallback and is what renders.

Two constraints the CSS has to respect, both measured against the live dev page:

- **The font must be embedded, not hotlinked.** A `FontFace` pointing at
  `fonts.gstatic.com` fails on the auth origin and succeeds from anywhere else.
  A CDN URL leaves the page on the browser default serif.
- **No quote characters anywhere in the stylesheet.** Kinde HTML-escapes it, and
  the `;` inside the resulting `&quot;` terminates whatever declaration it lands
  in. That means no quoted family names (so no `"Segoe UI"`), no `format('woff2')`,
  no `content: "→"`, no quoted `url()`, and no quoted attribute selectors.
  `npm test` fails on any quote in the output.

Headings: ExtraBold/Bold, Title Case, leading 120–135%. Body: Regular/Medium,
Sentence case, leading 145–160%. Web starting points: H1 32–36px, body 16–18px,
buttons/labels 14–16px, microcopy 11–14px.

## Logo rules

- Horizontal is the preferred lockup; full colour before one-colour.
- Clear space on all sides = the width of the "G". Minimum width 125px digital.
- Never stretch, rotate, recolour, add effects, or place on a busy/low-contrast
  background.

## Measured spec — Figma login frame (node `1-851`)

Frame is **1440 × 800**. Measured off a 2× capture of the prototype, so values
are accurate to ~0.5px.

| Element | Value |
|---|---|
| Logo | 206 × 40 at (80, 40) — matches the horizontal SVG's 5.144 aspect |
| Card | 628 × 450 at (406, 175), horizontally centred, white, ~8px radius |
| Card padding | ~48–51px |
| Heading | "Sign in to your account", ~32px regular, ink `#0A082C` |
| Field label | 16px semibold, ink `#0A082C`; required `*` in `#F0704B` |
| Input | 526 × 53, 1px border `#B8BCCC`, placeholder `#B8BCCC` |
| Primary button | 102 × 44, fill `#354599`, white label, right-aligned |
| "Forgot password? →" | `#354599`, left-aligned on the same row as the button |
| Background | brand gradient (Midnight `#0A082C` top → mauve `#6D5282` bottom) + Glide Path lines |
| Behind-card midtone | `#18206B` ≈ Dusk `#18206C` |
| Footer | © line left, Terms / Privacy / Security right, light ink over the gradient |

### Two colours in the mockup are off-palette

- `#354599` (primary button + link) is not a brand colour. It sits between Dusk
  `#18206C` and Dawn `#6373C1`. Needs a call: snap to Dusk, or ratify `#354599`
  as an approved tint.
- `#B8BCCC` (input borders + placeholder) is not a brand colour either, and as
  placeholder text on white it measures **1.89:1** — well below WCAG AA (4.5:1).
  Darkening it for the placeholder while keeping it as the border colour fixes
  that.

Contrast check on the rest of the card (computed, not estimated):

| Pair | Ratio | Verdict |
|---|---|---|
| `#0A082C` heading/label on white | 19.37:1 | pass |
| `#354599` link on white | 8.53:1 | pass |
| white label on `#354599` button | 8.53:1 | pass |
| `#F0704B` required asterisk on white | 2.95:1 | **fails AA and AA-large** |
| `#B8BCCC` placeholder on white | 1.89:1 | **fails** |
| `#C84423` (Accessibility Horizon) on white | 4.88:1 | pass — use this for the asterisk |
