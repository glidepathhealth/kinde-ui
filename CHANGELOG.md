# Changelog

All notable changes to the Glidepath Health Kinde custom UI.

## [0.1.1.0] - 2026-09-04

### Fixed

Everything below is one root cause. Kinde HTML-escapes the custom stylesheet
before serving it, and the `;` inside the resulting `&quot;` terminates whatever
CSS declaration it lands in. Single quotes are escaped too. Every quoted
construct in the stylesheet was therefore destroyed in transit, which on the dev
login page meant:

- **The font.** The stack ended in `"Segoe UI"`, so the declaration truncated
  mid-value and every page fell back to the browser default serif. It is now
  Figtree, matching the product app, with no quotable family in the stack.
- **Figtree never loaded anyway.** `format('woff2')` broke the `@font-face`
  rule, and the auth origin does not load cross-origin fonts, so the Google
  CDN URL could not have worked either. Figtree is now embedded as base64 woff2.
- **The Glide Path pattern.** It rode on a pseudo-element needing
  `content: ""`, which the escaping made invalid, so the layer never rendered at
  all — and its `url("data:…")` was reparsed as a relative URL. It is now a real
  element with an unquoted URL.
- **The link arrow and the social-button and RTL rules**, all of which used
  quoted strings or quoted attribute selectors.

`npm test` now fails on any quote character in the emitted CSS, and on a
`@font-face` that points at a remote URL.

## [0.1.0.0] - 2026-09-03

First Glidepath-branded release. Replaces the Evolve.ai starter theme the
repository was forked from.

### Added

- Glidepath Health branding on every hosted auth page: the brand gradient
  (Midnight through Dusk to Dawn with a Horizon wash), the Glide Path line
  pattern, and the horizontal logo in its inverse variant for dark backgrounds.
- Brand assets under `kindeSrc/assets/brand/` — logo, Glide Path pattern and
  gradient as SVG, plus the Figtree variable font. Copied from the official
  brand kit and never redrawn, which the brand guide requires for the logo and
  the pattern.
- Styling for Google and other social sign-in, so enabling a social connection
  in the Kinde dashboard produces an on-brand button and separator rather than
  an unstyled one.
- Footer carrying the copyright line and the Terms, Privacy and Security links.
- `npm test` — smoke tests covering the things that fail silently here: an
  invented `--kinde-*` setting name, a Kinde placeholder that never got
  substituted, generated brand assets drifting from their source SVGs,
  off-palette colour, and a stray backtick truncating the stylesheet.
- `npm run demo` — renders the auth pages to static HTML against Kinde's real
  stylesheet for local preview.
- `npm run assets` — regenerates the embedded brand assets from the source SVGs.

### Changed

- Design tokens are now the brand palette. Buttons and links use Dusk
  (`#18206C`) rather than the mockup's off-palette `#354599`, and field borders
  a documented 30% Dusk tint.
- Type is Area with a Figtree fallback, matching the brand guide's fallback
  chain. Area needs an Adobe Fonts web project to activate; Figtree renders
  until then.
- Widget styling goes through Kinde's documented style hooks and settings
  instead of its internal class names, so it survives Kinde changing its markup.

### Fixed

- The Kinde attribution is no longer painted white inside the white card, where
  it was invisible. Carried over from the starter theme, whose widget sat on a
  dark background.
- A long localised submit label no longer breaks out of the card and gives the
  page a horizontal scrollbar. Measured at 375px: the button now clamps and
  ellipsises instead of growing to 369px inside a 256px group.
- The submit button keeps its Dusk fill while a sign-in is in flight, instead of
  repainting to Kinde's default grey.
- Plan picker, org switcher and order summary keep their card separation. The
  card component had been switched off globally to stop it double-framing the
  login card, which flattened those flows into one run-on list.
- Error banners use the brand red, matching the inline field errors instead of
  showing a second unrelated red on the same page.
- The decorative arrow on the forgot-password link points the right way in
  right-to-left locales.
- The page canvas is Midnight rather than transparent, so iOS elastic overscroll
  no longer shows a white band against the gradient.
- `npm run demo` explains what to do when Kinde's stylesheet is missing instead
  of failing with a stack trace. It is not committed, so a fresh clone has to
  fetch it once; `npm test` needs nothing extra.
