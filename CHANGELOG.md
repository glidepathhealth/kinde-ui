# Changelog

All notable changes to the Glidepath Health Kinde custom UI.

## [0.1.3.0] - 2026-09-04

### Security

Cleared all 22 Dependabot alerts (14 high, 6 moderate, 2 low). Every one traced
to a single upstream packaging bug rather than to anything this repo imports:
`@kinde/infrastructure@0.2.2` declares its build tooling — `vite-plugin-dts`,
`prettier`, `@types/node` — as *runtime* `dependencies`. That drags in
`@microsoft/api-extractor`, `@vue/language-core` and `@rollup/pluginutils`, about
89 packages we never execute, and every CVE in that subtree gets reported against
this repo with `runtime` scope.

None of the four direct dependencies was flagged. The alerts were ReDoS and glob
matching issues in `lodash`, `minimatch`, `picomatch`, `brace-expansion` and
`ajv`.

- `overrides` in `package.json` pin the affected packages forward, scoped per
  major so both live lines stay on their own track: `minimatch` resolves 3.1.5
  and 9.0.9, `brace-expansion` 1.1.18 and 2.1.4. `npm audit` and `npm audit`
  after a clean `npm ci` both report 0 vulnerabilities.
- `@types/node` is now a direct devDependency. It had been arriving by accident
  through the same `@kinde/infrastructure` subtree, so the scripts' `node:*`
  imports and `process`/`Buffer` types depended on an upstream packaging mistake.

### Added

- `npm test` grew a 21st check: *package.json security overrides are honoured by
  the lockfile*. Nothing else reads `package-lock.json`, so an `npm install` that
  drops or stops matching an override silently reintroduces the vulnerable
  version and the alerts only reappear on the next push. The check is offline and
  reads whatever overrides `package.json` declares, so it does not go stale when
  they change. Verified against three drift modes: a reverted lockfile entry, a
  deleted `overrides` block, and a regression confined to one major line.

### Notes

Not taken: `@kinde/infrastructure@0.11.1` has zero runtime dependencies and would
delete this whole problem rather than pin around it. It renames `WidgetContent`
to camelCase with no snake_case fallback (`logo_alt` to `logoAlt`, `page_title`
to `pageTitle`), which is a runtime contract change with Kinde's servers in the
files `npm test` never executes. `kinde.json` pins the API version at
`2024-12-09`; if that runtime still sends snake_case, the rename yields undefined
alt text and an empty title with no error anywhere. Tracked in `TODOS.md` as P2,
gated on a real Kinde dashboard preview.

## [0.1.2.0] - 2026-09-04

### Fixed

The Figtree webfont never loaded in production, and v0.1.1.0's fix could not have
made it load. That release correctly identified Kinde's HTML-escaping of the
stylesheet and embedded the font as a base64 `data:` URI to avoid a quoted
`format()` and a cross-origin CDN. Both problems were real. But the auth origin
serves a Content-Security-Policy whose `font-src` is

```
font-src 'self' glidepathhealth.com *.glidepathhealth.com
```

with no `data:`, so the embedded copy was rejected on every page load and the
login page fell back to Helvetica — the same visible symptom v0.1.1.0 set out to
fix, one step further down. Measured against the live policy: a `data:` font and
a `fonts.gstatic.com` font both raise a `font-src` violation, while a URL on a
`glidepathhealth.com` host is allowed at any subdomain depth.

- `@font-face` now points at `FONT_HOST` (`assets.glidepathhealth.com`) with no
  `data:` fallback. A fallback CSP rejects every time is not a fallback; it was
  ~41KB on every page load plus a guaranteed console violation.
- The font files were removed from the repo. They were byte-identical to the two
  subsets the product app already builds and ships, so this repo held a second
  copy of an artifact with a record elsewhere. `brand-assets.ts` drops from 72KB
  to 31KB.
- `<link rel=preconnect>` for the font host, since the font is only discovered
  once the inline stylesheet parses.

**`FONT_HOST` is not serving yet, so the page still renders Helvetica.** That is
unchanged from before this release rather than a regression — the embedded font
was already blocked. Standing up the host, its CORS header and the OFL licence
is tracked in `TODOS.md` and in GN-129.

### Changed

- `npm test` grew from 18 checks to 20 and no longer asserts the bug. The old
  `@font-face` check required `src: url(data:font…)` — precisely what the CSP
  blocks — so it stayed green while the font did not render. It now enforces the
  CSP: every `@font-face` source must be an absolute `glidepathhealth.com` URL,
  and two new checks extend that to every `url()` in the emitted stylesheet and
  every subresource in the rendered HTML.
- Added `CLAUDE.md`: the branch model (`develop` → `staging` → `main`, with
  `main` being production via Kinde Git Sync), the silent-failure constraints,
  and the release conventions.

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
