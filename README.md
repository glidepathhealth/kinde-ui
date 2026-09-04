# Glidepath Health hosted auth UI

The Glidepath Health branding for Kinde's hosted sign-in, sign-up and account
pages. Kinde renders these pages on its own servers from React Server
Components in this repo, so what lands on `main` is what your users see when
they log in.

Built on Kinde's Custom UI feature. It started as Kinde's Evolve.ai starter
template; nothing of that theme remains.

## What you get

- Brand gradient (Midnight through Dusk to Dawn with a Horizon wash), the Glide
  Path line pattern and the horizontal logo, on every auth page
- Brand palette wired into Kinde's own design tokens, so the widget Kinde
  renders comes out on-brand without fighting its markup
- Styled social sign-in, so turning on Google in the Kinde dashboard produces an
  on-brand button instead of an unstyled one
- Footer with the copyright line and the Terms, Privacy and Security links
- Smoke tests for the failures that are silent here (see [Checks](#checks))

## Prerequisites

- Node 18+ and npm (`tsx`, which runs the scripts below, needs it)
- A Kinde account with Custom UI enabled

## Quick start

```sh
git clone https://github.com/glidepathhealth/kinde-ui.git
cd kinde-ui
npm install
```

Kinde watches this repository through its Git Sync feature. Push to `main` and
Kinde picks up the change; open Settings > Design > Custom UI in the Kinde admin
to preview the new version and publish it live. Work on a branch and open a PR
so a push does not go straight to the live login page.

## Local preview

Kinde renders the real pages, so there is no server to boot. `npm run demo`
renders them to static HTML in `.context/demo/` instead, against Kinde's own
shipped stylesheet, which is enough to check the brand layer.

That stylesheet is Kinde's, not ours, so it is not committed. Fetch it once:

```sh
mkdir -p .context/kinde
curl -s https://<your-kinde-domain>/dist/end_user_ui/assets/css/style.css \
  > .context/kinde/kinde-required.css
npm run demo
```

Point `KINDE_CSS` at another copy to override that path. The preview cannot tell
you which fields and buttons Kinde chooses to render for a given flow, or in
what order. Use Kinde's own preview for that.

## Checks

| Command | What it does |
|---|---|
| `npm test` | Smoke tests (`scripts/verify.tsx`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run demo` | Renders the auth pages to static HTML for local preview |
| `npm run assets` | Regenerates `kindeSrc/assets/brand-assets.ts` from the brand SVGs |

`npm test` needs nothing beyond `npm install`. It catches the things that break
without an error anywhere: a `--kinde-*` setting name that does not exist (that
spot just renders unstyled), a Kinde placeholder that never got substituted, the
generated brand assets drifting from the SVGs they come from, an off-palette
colour, and a stray backtick truncating the stylesheet template literal.

Run `npm run assets` after editing anything under `kindeSrc/assets/brand/`.
Kinde does not host static assets, so the artwork travels with the page as
base64 data URIs in `brand-assets.ts`, and `npm test` fails when that generated
file falls out of step with its sources.

## Project structure

```
kindeSrc/
  root.tsx                  html shell, head, global styles
  layouts/default.tsx       gradient + pattern background, header, card, footer
  components/               header, footer, widget wrapper
  styles/styles.ts          brand tokens and Kinde setting overrides
  assets/
    brand/                  official brand kit (see its README)
    brand-assets.ts         generated: brand SVGs as data URIs
  environment/pages/(kinde)/
    (default)/page.tsx      every flow without its own page
    (login)/page.tsx        sign in
    (register)/page.tsx     sign up
scripts/
  verify.tsx                npm test
  demo-render.tsx           npm run demo
  build-brand-assets.mjs    npm run assets
  kinde-settings.txt        every --kinde-* setting Kinde defines (see its README)
kinde.json                  tells Kinde the source root is kindeSrc
```

`(default)/page.tsx` covers every flow Kinde offers that has no page of its own:
password reset, email verification, MFA, social auth, error pages and the rest.
Adding a directory under `(kinde)/` takes over one of them.

## Brand

`kindeSrc/assets/brand/README.md` is the working reference: the colour tokens
with hex values, the type rules, the logo rules, the measured Figma login spec,
and the known contrast failures. Read it before changing a colour.

Two rules worth repeating here. The logo and the Glide Path pattern are never
redrawn or AI-generated, only composited from the files in that directory. And
the typeface is Figtree, matching the product app, embedded in the stylesheet as
base64 woff2.

Two constraints on `kindeSrc/styles/styles.ts` that are not obvious and that
`npm test` enforces:

- **No quote characters in the emitted CSS.** Kinde HTML-escapes the stylesheet
  before serving it, and the `;` inside the resulting `&quot;` terminates
  whatever declaration it lands in. Use unquoted `url(data:…)`, unquoted
  attribute selectors, and font families whose names need no quoting.
- **Subresources must be embedded, not linked.** The auth origin does not load
  cross-origin fonts, images, or stylesheets, so a CDN URL silently fails.

## Known gaps

`TODOS.md` tracks what is deliberately unfinished, including the accessibility
pass on the card and three known contrast failures inherited from the Figma
frame. `CHANGELOG.md` has what shipped in each version.

## License

The starter template this was forked from is MIT, from Kinde. The Glidepath
Health brand assets under `kindeSrc/assets/brand/` come from the official brand
kit and are not open. Figtree ships under the SIL Open Font License, see
`kindeSrc/assets/brand/fonts/OFL.txt`.

## Support

- [Kinde Custom UI documentation](https://docs.kinde.com)
- [Kinde Community](https://community.kinde.com)
