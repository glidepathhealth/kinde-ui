# CLAUDE.md

Glidepath Health's branding for Kinde's hosted auth pages. Kinde compiles
`kindeSrc/` on its own servers via Git Sync and serves the result as the real
login page — there is no app to boot and no deploy step in this repo.

Read `README.md` for background, structure and local-preview setup. It agrees
with this file; where they ever diverge on branch choice, **the Branching
section below wins.**

## Branching — read before you commit or push anything

Three long-lived branches. They are **not** interchangeable.

- `main` — **production.** Kinde's Git Sync watches it; whatever lands here
  becomes the live hosted login page for real users (publish via Kinde admin:
  Settings > Design > Custom UI). Never push directly.
- `staging` — pre-production integration branch.
- `develop` — day-to-day integration branch. Feature work targets this.

Flow: `feature branch -> develop -> staging -> main`. Each promotion between the
three is its own PR.

**Never commit or ship from `develop`, `staging` or `main`. Branch first:
`git switch -c <name>`.**

**Every PR, including via `/ship` and `/land-and-deploy`: name the base branch in
your message before creating the PR, default to `develop` unless the user named
another, and always pass `--base` explicitly. Never let a tool choose the base.**

```sh
gh pr create --base develop ...   # always pass --base
```

The trap: the GitHub default branch is `main` and `origin/HEAD` points at `main`,
so `/ship`'s Step 0 base detection and any `gh pr create` without `--base`
silently target `main` — i.e. straight to production. It is not only the PR
target: `/ship` Step 3 runs `git merge origin/<base>` into your branch *before*
tests, and the version bump is classified against `<base>`. A wrong base mutates
your branch. Confirm the base at Step 0, not at PR-creation time.

Two more reasons the wrong base will not announce itself:

- Both existing PRs (#1, #2) targeted `main`, so git history reinforces the
  wrong default. Ignore it.
- Only `develop` and `main` exist on `origin` today, and they currently point at
  the same commit — no promotion PR has ever run — so merging the wrong base
  produces no conflict and no diff. Verify the base; do not infer it from a
  clean merge.

`staging` is part of the intended model but is not yet pushed to `origin`. **Do
not silently retarget to `main` because `staging` is missing — ask.** If it is
unclear which of the three a change should target, ask rather than guess.

## Commands

Run `npm install` first — `node_modules` is not checked in and `tsx` comes from it.

- `npm test` — run before every commit. 20 checks, all green on a clean tree, so
  a failure is yours. No watch mode and no single-check selection.
- `npm run typecheck` — `tsc --noEmit`. Does **not** cover
  `scripts/build-brand-assets.mjs` (`.mjs` is outside `include`).
- `npm run assets` — regenerates `kindeSrc/assets/brand-assets.ts`. Run **after**
  a deliberate edit under `kindeSrc/assets/brand/` or `kindeSrc/assets/ui/`,
  never "just to be safe" before `npm test` — it repairs the drift the test
  exists to detect.
- `npm run demo` — **exits 1 until you fetch Kinde's stylesheet** (deliberately
  uncommitted; see README). That is expected, not a broken repo. `KINDE_CSS`
  resolves against the process cwd, not the repo root.

No build, lint or CI. `tsconfig.json` still carries inert Next.js residue
(`plugins: [{name: "next"}]`, `@/*` paths, `next-env.d.ts` and `.next/types` in
`include`, `jsx: "preserve"`). None of it applies — there is no bundler here.

## Silent-failure constraints — the whole point of the test suite

1. **Zero quote characters in the emitted CSS**, single or double, outside CSS
   comments. Kinde HTML-escapes the stylesheet and the `;` inside `&quot;`
   terminates whatever declaration it lands in. No error anywhere — the rule
   just stops existing. Past casualties: the font stack, the entire Glide Path
   layer, the background image, every quoted attribute selector. So: no quoted
   font families, no `format('woff2')`, no `content: ""`, no quoted `url()`, no
   `[attr="value"]`. Caught by the check *the emitted CSS contains no quote
   characters at all*, whose reported line numbers are computed after
   comment-stripping — search for the printed snippet rather than trusting the
   number.
2. **Every subresource must be a `data:` URI or a `glidepathhealth.com` host.**
   The auth origin runs a strict CSP. `img-src` allows `'self'`,
   `glidepathhealth.com`, `*.glidepathhealth.com` and `data:`. `font-src` allows
   the same hosts but **not** `data:`. `style-src` adds `'unsafe-inline'`. Any
   other CDN — jsDelivr, Google Fonts, a bare CloudFront hostname — is blocked
   with no network error surfaced. A CDN behind `assets.glidepathhealth.com` is
   allowed; the vendor's own hostname is not. `@font-face` from such a host also
   needs `Access-Control-Allow-Origin`, since font fetches are CORS requests.
   **Fonts are mid-migration.** `data:` fonts violate `font-src`, so
   `@font-face` points at `FONT_HOST` with no fallback — an embedded copy is
   never a fallback here, it just adds weight and a console violation, and
   `npm test` now rejects one. `FONT_HOST` is not serving yet, so the type is
   Helvetica. Read the P0 in `TODOS.md` before touching fonts. For images,
   base64 not `;utf8,` — the latter leaves the SVG's own attribute quotes in the
   sheet, which constraint 1 then destroys. `npm test` now checks every `url()` in
   the emitted CSS and every `src`/`href` in the rendered HTML against this
   allowlist, and rejects `@import`. What it still cannot check: that the host
   actually serves, and that it sends CORS headers.
3. **`--kinde-*` names must exist.** An invented or typo'd setting renders as
   nothing and that spot silently falls back to Kinde stock. Every name used is
   checked against `scripts/kinde-settings.txt` (540 names). Inverse trap: a
   setting Kinde added *after* that snapshot fails `npm test` even though it
   works live — regenerate the list per `scripts/kinde-settings.README.md`, do
   not delete the declaration. The check validates the name only; a real name in
   the wrong place passes green. It does not strip comments, so write
   explanatory comments without the `--kinde-` prefix.
4. **`brand-assets.ts` is generated — never hand-edit it.** Editing an SVG
   without `npm run assets` changes nothing in the shipped page. `npm test`
   reports drift as `Command failed: node .../build-brand-assets.mjs --check`
   followed by ``brand-assets.ts is stale — run `npm run assets` and commit``.
   The file is one enormous line per asset (~31KB total), so its diff is
   unreadable: review the source SVG diff plus a passing `npm test` instead.
5. **Keep `gph-end-of-stylesheet` last in `styles.ts`.** It is the sentinel for
   the truncation check — a stray backtick in a CSS comment once silently killed
   the rest of the sheet. Rules added after the sentinel are unprotected.

## Styling

- Style only through Kinde's public API: `--kinde-*` custom properties on
  `:root`, and `[data-kinde-*]` attribute selectors. `.kinde-*` class names are
  internal API. The test only catches them when the selector *starts a line*, so
  `.gph-card .kinde-button {}` passes green — grep your own diff for `.kinde-`,
  and never copy selectors out of `scripts/demo-render.tsx`'s mock widget.
- `--gph-*` is our token namespace (convention only, untested). But `.gph-*`
  **class** names and rule shapes ARE string-matched by hard-coded regexes:
  renaming a class, or switching the `.gph-header img` width from `rem` to `px`,
  fails the suite even when rendering is unchanged.
- Colours are locked to an 11-hex palette hard-coded in `scripts/verify.tsx`. A
  new colour means editing that Set too, not just `styles.ts`.
  `hsl/color-mix/lab/lch/oklch/oklab` are rejected outright as unverifiable.
- The Glide Path pattern must stay a real `<div className="gph-page__pattern">`,
  never a `::before` (which needs an escapable `content: ""`). Any
  `.gph-page > *` rule setting `position` must carry `:not(.gph-page__pattern)`
  or the layer collapses to zero height.
- Login-only overrides must be scoped with `.gph-page--login`. An unscoped
  `[data-kinde-layout-button-group]` rule silently changes every other flow.
- Light scheme is pinned by `<meta name="color-scheme" content="light">` in
  `root.tsx`, not by CSS. No `--kinde-*-dark` tokens are set; nothing tests dark
  mode.

## Pages and route groups

- Each `kindeSrc/environment/pages/(kinde)/<group>/page.tsx` starts with
  `"use server"`, default-exports
  `async (event: KindePageEvent) => Promise<string>`, and calls `renderToString`
  itself — imported from **`react-dom/server.browser`**, not `react-dom/server`
  (the local scripts use the latter; the pages must not).
- No hooks, context, Suspense, hydration or `"use client"`: the component is
  invoked directly rather than rendered by React. All interactivity comes from
  `getKindeRequiredJS()`.
- `(default)` covers every Kinde flow without its own directory. Adding a
  directory under `(kinde)/` takes one over. The types cannot confirm a valid
  directory name and `npm test` accepts any — verify a new one in Kinde's own
  dashboard preview.
- Copy an existing `page.tsx` as the template; `npm test` requires every page to
  reference `DefaultLayout` and pass `logoAlt=`. Careful: the `variant="login"`
  exclusion is a hardcoded list of `(register)` and `(default)`, not a directory
  scan — copy `(login)/page.tsx` into a new flow and forget to drop
  `variant="login"` and the login-only button-row override silently applies
  there with all 20 checks green.
- Keep the inline `<style>` **after** `getKindeRequiredCSS()` in `root.tsx`'s
  `<head>`, or every `--kinde-*` override loses the cascade with no error.
- Kinde helpers return opaque `@<32 hex>@` placeholders substituted after your
  render. Never pass them through anything that escapes, encodes or splits
  strings.
- Page copy (`page_title`, `heading`, `description`, `logo_alt`) comes from
  `context.widget.content` and is edited in the Kinde dashboard, not in code.

## Brand

Read `kindeSrc/assets/brand/README.md` before changing any colour, the logo, or
type.

- Never redraw, AI-generate or recreate the logo or the Glide Path pattern;
  composite from the checked-in files. `logo-horizontal-inverse.svg` and
  `glide-path-white.svg` are byte-verified against their embedded base64.
- `kindeSrc/assets/ui/` glyphs are ours and may be edited — but they are
  hardcoded `#18206C` and a CSS-embedded SVG cannot inherit `currentColor`, so
  changing the link colour means editing both arrow SVGs and regenerating.
- Logo minimum width is 125px, enforced at every breakpoint (desktop + mobile
  `.gph-header img` rules must both exist).
- Do not "upgrade" to Area, the brand guide's primary typeface: subscription-
  licensed, not redistributable, and structurally unable to load on the auth
  origin. Figtree is the sanctioned fallback and must lead the stack.
- Two colours in the Figma frame are unratified and not in the palette —
  `#354599` and `#B8BCCC`. Pulling them from the mockup fails `npm test`.

## Version, changelog, commits

- `VERSION` holds four components (`0.1.1.0`, no `v`). `package.json` `version`
  must be the three-component truncation (`0.1.1`) — npm rejects four. `npm test`
  enforces that pair.
- **Never run `npm version`.** Edit `VERSION` and `package.json` together, then
  `npm install` so `package-lock.json` follows — nothing checks the lockfile, so
  that drift is silent. `/ship` does the bump for you; do not also hand-edit.
- `CHANGELOG.md`: `## [0.1.1.0] - YYYY-MM-DD` with the full four-component
  version, newest first, `### Added/Changed/Fixed`, prose bullets. No
  `[Unreleased]` section. There are no git tags — VERSION and CHANGELOG are the
  only release record.
- Commit subject: Conventional Commits, lowercase imperative, no scope, no
  trailing period. Version last, in parentheses, on the release commit only:
  `fix: survive Kinde's HTML escaping of the stylesheet (v0.1.1.0)`. Exactly one
  commit per release carries the version.
- PR title inverts it — version first:
  `v0.1.1.0 fix: survive Kinde's HTML escaping of the stylesheet`.
- Commit bodies are hard-wrapped prose at ~80 cols. PR bodies are untemplated
  but always carry root cause, measured evidence in a table, and which test
  guard was added.
- Track deliberate gaps in `TODOS.md` (`### Title`, `**Priority:** P0-P3`, prose
  citing the file); completed items move to `## Completed` with
  `**Completed:** v0.1.0.0 (YYYY-MM-DD)`.
- `TODOS.md` marks "Serve Area" **Blocked**, not P2. Do not pick it up: its
  Adobe Fonts stylesheet URL is exactly the cross-origin subresource CSP bans
  (constraint 2), and Figtree leading the stack is test-enforced. Unblocking it
  needs Kinde to change its CSP, which is a support request, not a code change.

## What nothing checks

`npm test` never executes the real `page.tsx` modules — it only greps them for
`variant="login"`, `DefaultLayout` and `logoAlt=`. `npm run typecheck` does type-
check them, so run both; it catches a bad import path but not a deleted default
export (nothing imports these files). Neither catches the load-bearing one:
`react-dom/server` and `react-dom/server.browser` type-check identically, so a
wrong-module import survives every local check and fails only on Kinde's builder.

Also uncovered: real browser rendering, colour contrast and accessibility (see
`TODOS.md` for the known failures), dark mode, HTML validity, whether Kinde's
builder accepts the source, and which fields Kinde actually renders per flow.
Use Kinde's own dashboard preview for those.
