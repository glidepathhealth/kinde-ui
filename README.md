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

Kinde watches this repository through its Git Sync feature, so `main` is
production: what lands there is what your users see when they log in. Open
Settings > Design > Custom UI in the Kinde admin to preview the new version and
publish it live.

There are three long-lived branches — `develop` for day-to-day work, `staging`
for pre-production, `main` for production — and work flows through them in that
order. Never push to any of the three directly: branch, then open a PR against
`develop`. Pass the base explicitly, because GitHub's default is `main`:

```sh
gh pr create --base develop
```

`CLAUDE.md` has the full rules, including the ways the wrong base branch slips
through unnoticed.

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
| `npm run assets` | Regenerates `kindeSrc/assets/brand-assets.ts` from the brand and UI SVGs |

`npm test` needs nothing beyond `npm install`. It catches the things that break
without an error anywhere: a `--kinde-*` setting name that does not exist (that
spot just renders unstyled), a Kinde placeholder that never got substituted, the
generated brand assets drifting from the SVGs they come from, an off-palette
colour, a subresource URL the CSP would block (in the stylesheet or the rendered
HTML), and a stray backtick truncating the stylesheet template literal.

Run `npm run assets` after editing anything under `kindeSrc/assets/brand/` or
`kindeSrc/assets/ui/`. Kinde does not host static assets, so the artwork travels
with the page as base64 data URIs in `brand-assets.ts`, and `npm test` fails when
that generated file falls out of step with its sources.

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
the typeface is Figtree, matching the product app, served from `FONT_HOST`
rather than embedded — see below.

Two constraints on `kindeSrc/styles/styles.ts` that are not obvious and that
`npm test` enforces:

- **No quote characters in the emitted CSS.** Kinde HTML-escapes the stylesheet
  before serving it, and the `;` inside the resulting `&quot;` terminates
  whatever declaration it lands in. Use unquoted `url(data:…)`, unquoted
  attribute selectors, and font families whose names need no quoting.
- **Subresources come from a data URI or a `glidepathhealth.com` host, nothing
  else.** Kinde serves the auth origin under a strict Content-Security-Policy,
  so any other URL is blocked outright: no network error you would notice, just
  a missing font or image. The policy on the live auth page is

  ```
  img-src   'self' glidepathhealth.com *.glidepathhealth.com data:
            gravatar.com www.gravatar.com wp.com js.stripe.com/v3/
            lh3.googleusercontent.com avatars.githubusercontent.com
  font-src  'self' glidepathhealth.com *.glidepathhealth.com
  style-src 'self' glidepathhealth.com *.glidepathhealth.com js.stripe.com
            maps.googleapis.com widgets.kinde.com 'unsafe-inline'
  script-src 'self' 'strict-dynamic' glidepathhealth.com *.glidepathhealth.com
            js.stripe.com 'nonce-...'
  ```

  Note `data:` appears in `img-src` but **not** in `font-src`. See "Assets, data
  URIs and the CDN option" below, which is the practical version of this.

## Assets, data URIs and the CDN option

The logo, the Glide Path pattern and the UI arrows are compiled into
`brand-assets.ts` as base64 data URIs. The Figtree webfont is not, and cannot
be, because the CSP treats the two asset types differently.

**A CDN does work, on one condition: it must answer on a `glidepathhealth.com`
host.** `font-src`, `img-src`, `style-src` and `script-src` all list
`glidepathhealth.com` and `*.glidepathhealth.com`, so a host such as
`assets.glidepathhealth.com` is permitted and a plain `<img src=…>` or an
`@font-face` pointing at it loads normally. Any other CDN (jsDelivr, Google
Fonts, a bare CloudFront or S3 hostname) is blocked. Put the CDN behind a
`glidepathhealth.com` subdomain and it is fine; point at the vendor's own
hostname and it is not.

Two consequences:

- **Images are fine as they are.** `img-src` includes `data:`, so the embedded
  artwork loads. Moving images to a `glidepathhealth.com` host is an option, not
  a fix — it would shrink the page and let the browser cache them, at the cost
  of a host to run.
- **Fonts are not.** `font-src` does **not** include `data:`, so the base64
  Figtree embedded in v0.1.1.0 is blocked and the page falls back to Helvetica.
  A `glidepathhealth.com` host is the only fix available, because `'self'` is the
  auth origin and Kinde does not host static assets for us.

`styles.ts` therefore points `@font-face` at `FONT_HOST`
(`assets.glidepathhealth.com`) at a stable path, with no `data:` fallback —
there is no point carrying one, since `font-src` rejects it every time.
**That host is not up yet**, so the type is currently Helvetica; see the P0 in
`TODOS.md`. Change `FONT_HOST` if a different host is chosen — any
`glidepathhealth.com` subdomain at any depth is permitted.

No font files live in this repo. They used to, and the copies were
byte-identical to the two subsets the product app already builds and ships, so
they were a duplicate of an artifact with a record elsewhere. The host is what
the login page reads; this repo only names the URL.

Two things to get right when standing it up. `@font-face` fetches are CORS
requests even when the CSP permits the host, so it has to return
`Access-Control-Allow-Origin` for the auth origin or the font still fails, with
a CORS error rather than a CSP one; `<img>` needs no such header. And the path
must be stable and published deliberately — not the app's Vite output, whose
filenames are per-build content hashes that already differ between environments.

Measured directly against the live policy rather than inferred; the probe
loaded real elements from each source and watched for `securitypolicyviolation`.

## Known gaps

`TODOS.md` tracks what is deliberately unfinished, including the accessibility
pass on the card and three known contrast failures inherited from the Figma
frame. `CHANGELOG.md` has what shipped in each version.

## License

The starter template this was forked from is MIT, from Kinde. The Glidepath
Health brand assets under `kindeSrc/assets/brand/` come from the official brand
kit and are not open. Figtree ships under the SIL Open Font License; it is not
distributed from this repo, so its licence travels with it wherever it is
served.

## Support

- [Kinde Custom UI documentation](https://docs.kinde.com)
- [Kinde Community](https://community.kinde.com)
