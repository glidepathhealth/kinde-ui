# TODOS

## Brand / Auth UI

### Confirm the footer legal URLs

**Priority:** P1

`kindeSrc/components/footer.tsx` links to `glidepathhealth.com/terms`,
`/privacy` and `/security`. Those paths are assumed — the site is still a
GoDaddy placeholder, so none of them were verified. Confirm the real URLs
before this reaches users.

### Verify the login button row against a real Kinde preview

**Priority:** P1

The Figma frame puts "Forgot password?" and the Sign in button on one row.
Kinde's button group stacks in a column by default, so `styles.ts` overrides it
for the login page only. The override assumes Kinde renders the
forgot-password link *inside* the button group. If it renders outside, the rule
is harmless but does nothing. Check on Kinde's own preview and adjust.

### Serve Area, the primary brand typeface

**Priority:** Blocked — do not attempt as written

The brand guide's primary typeface is Area, licensed through Adobe Fonts and
not redistributable, so it cannot live in this repo. Figtree renders today and
leads the font stack; `npm test` requires that it does.

The original plan here was to add an Adobe Fonts web project and drop in its
stylesheet URL. That does not work as written. The auth origin's CSP allows
`'self'` and `glidepathhealth.com`/`*.glidepathhealth.com` for both `style-src`
and `font-src`, and nothing else relevant — `use.typekit.net` is not on the list,
so the Typekit stylesheet and the font files it points at are both blocked.

Serving Area from `assets.glidepathhealth.com`, which the CSP *would* allow, is
not an option either: Adobe's licence covers delivery through their own network
and forbids self-hosting or proxying the files.

So this needs Kinde to add the Adobe Fonts hosts to the CSP for this tenant. The
policy already carries tenant-specific entries, so it is presumably configurable,
but that is a support request rather than a code change. Until then Figtree is
the answer, and `npm test` requires it to lead the stack.

### Serve Figtree from a glidepathhealth.com host — the embedded font is blocked

**Priority:** P0
**Tracked:** GN-129 — https://glidepathhealth.atlassian.net/browse/GN-129

The CSP on the live auth page is

```
font-src 'self' glidepathhealth.com *.glidepathhealth.com
```

with no `data:`. The base64 woff2 that v0.1.1.0 embedded is therefore blocked,
and the login page falls back to Helvetica. That is the same visible symptom
v0.1.1.0 was written to fix, from a different cause: the escaping bug was real
and is fixed, but the font it unblocked is being stopped one step later.
Confirmed by loading a `data:` font under this exact policy and catching the
`font-src` violation.

`img-src` *does* list `data:`, so the logo, pattern and arrows are unaffected.
This is fonts only.

The fix is the one this TODO originally proposed, before it was briefly and
wrongly closed as done: serve the two Figtree woff2 subsets from a
`glidepathhealth.com` host, which `*.glidepathhealth.com` explicitly allows.

**Done in this repo** (see `CHANGELOG.md`): `styles.ts` loads Figtree from
`FONT_HOST` at a stable path with no `data:` fallback, the font files and their
embedding are gone, and `scripts/verify.tsx` enforces the CSP allowlist instead
of the `url(data:font…)` assertion that used to pin the bug green.

**Remaining, and this is the part that makes the font render:**

1. Stand up the host and publish the two woff2 subsets at
   `/brand/figtree-latin.woff2` and `/brand/figtree-latin-ext.woff2`. Take the
   files from the product app, which already ships exactly these bytes, or from
   Google Fonts. It **must be the wght 300-900 variable woff2**, not a static
   instance: `styles.ts` declares `font-weight: 300 900`, and a static file is
   accepted as covering that range and then faux-bolded at 600 and 700 with no
   console error and all checks green. Verify what you publish against the bytes
   this repo used to carry:

   ```
   figtree-latin.woff2      sha256 8330490a01c60c196eae00b823de8102275aaa5862e7b76a7af21b8745338928
   figtree-latin-ext.woff2  sha256 f153aa07c1b16fbb12391c2512860c97819a0a9fd014f338b2b3f12496479d13
   ```

   `@font-face` has no Subresource Integrity, so this checksum at publish time is
   the only integrity pin available. Publish `OFL.txt` alongside the woff2 files:
   Figtree is SIL Open Font License, which requires the licence to accompany the
   font in any distribution including binary, and this repo no longer carries a
   copy. Any `glidepathhealth.com` depth works:
   `*.glidepathhealth.com` matches `app.dev.`, `app.staging.` and `app.` alike
   (verified against the live policy; a `cdn.jsdelivr.net` control was blocked in
   the same run). If a different host is chosen, change `FONT_HOST` to match.
2. Return `Access-Control-Allow-Origin` for the auth origin. `@font-face` is a
   CORS fetch even when the CSP allows the host, so without this the font still
   fails, just with a CORS error instead of a CSP one. The app hosts send no
   such header today.

   Provision it as part of this work, not after. `assets.glidepathhealth.com` is
   NXDOMAIN today, so nobody can claim it — but the CSP allows
   `*.glidepathhealth.com` for `script-src` as well as `font-src`, which means a
   dangling CNAME on *any* subdomain in the zone is script execution on the live
   login page, not just a swapped font. Prefer an origin you control over a CNAME
   to a vendor hostname, add a CAA record (the zone publishes none), and put
   `*.glidepathhealth.com` into a periodic dangling-CNAME sweep.
3. Confirm the dev Kinde environment's CSP carries the same
   `*.glidepathhealth.com` entry. Only the production auth page was read; the dev
   environment was reachable but only via an error page, which omits the
   tenant-specific entries.
4. Confirm the font actually renders once the host is live. **Do not use
   `getComputedStyle(document.body).fontFamily`** — it returns the declared
   stack whether or not Figtree loaded, so it reads as a pass right now, under
   NXDOMAIN. Use:

   ```js
   await document.fonts.ready; document.fonts.check(`16px Figtree`)
   ```

   or DevTools > Elements > Computed > Rendered Fonts, which also exposes the
   faux-bold case in step 1. Check the console for `font-src` violations too.

Do **not** point `FONT_HOST` at the app's Vite build output, e.g.
`app.dev.glidepathhealth.com/assets/figtree-latin-CEHu_veL.woff2`. That filename
is a content hash, served `immutable`, and it already differs per environment:
that exact path is 200 on dev and staging and 403 on prod. Hardcoding it couples
the login page's type to another repo's bundle hash and breaks silently on the
next app deploy, and nothing here can catch it — the smoke tests never touch the
network.

One URL is deliberately used by every Kinde environment. The font is brand and
identical everywhere, so there is nothing to isolate, and a single URL avoids
detecting the environment at render time. There is no clean signal for that
anyway: `domains.kindeDomain` exists only on Kinde workflow events, not page
events, and `request.authUrlParams` (which carries `clientId` and `redirectUri`)
is not populated on every route — `route.path` can be `account` or `/`.

### Move to @kinde/infrastructure 0.11.x

**Priority:** P2

We are pinned to `0.2.2`. `0.11.1` has **zero runtime dependencies**, which would
delete ~89 packages and the entire CVE surface the `overrides` block currently
holds back — that block, and the lockfile check guarding it, both exist only to
work around 0.2.2 declaring build tooling as runtime dependencies.

It is not a drop-in. `WidgetContent` was renamed to camelCase with no snake_case
fallback:

| 0.2.2 | 0.11.1 |
|---|---|
| `content.logo_alt` | `content.logoAlt` |
| `content.page_title` | `content.pageTitle` |

That touches all three `page.tsx` files and `root.tsx` — the code `npm test` never
executes. `npm run typecheck` does flag every site, so the rename itself is
mechanical and safe to make.

The risk is the runtime, not the types. `kinde.json` pins Kinde's API version at
`2024-12-09`. If the runtime at that version still sends snake_case, renaming the
code yields `undefined` alt text and an empty `<title>` with no error anywhere.
**Verify against a real Kinde dashboard preview before landing**, and check
whether `kinde.json` needs to move in lockstep. Confirmed already: all six
symbols we import (`getKindeWidget`, `getKindeCSRF`, `getKindeRequiredCSS`,
`getKindeRequiredJS`, `getSVGFaviconUrl`, `KindePageEvent`) still exist in
0.11.1, and `npm install` + `npm audit` come back clean on it.

### Drop the two unused brand-asset exports

**Priority:** P3

`logoHorizontalFullColor` (~12.8KB) and `brandGradient` (~2.3KB) are generated
into `brand-assets.ts` but nothing under `kindeSrc/` imports them — 15KB of the
remaining 31KB. Whether that reaches the wire depends on whether Kinde's builder
tree-shakes unused ES module exports, which nothing local can verify. Check the
shipped HTML in Kinde's dashboard preview: if the full-colour logo string is in
there, drop both from the `assets` map in `build-brand-assets.mjs` and
regenerate. If it tree-shakes, leave a comment saying so.

### Replace the Kinde favicon with the brand icon

**Priority:** P3

`root.tsx` still uses `getSVGFaviconUrl()`, Kinde's favicon. The brand guide
designates the secondary boxed-icon logo for favicon and platform identity;
the file is in the brand kit but not yet wired up.

### Delete the orphaned Evolve.ai screenshot

**Priority:** P3

`image.png` in the repo root is the Evolve.ai starter template's screenshot, 2MB
of a theme that no longer exists here. The README stopped referencing it in
v0.1.0.0, so nothing points at it. Delete it, or replace it with a current
screenshot of the branded login page and reference that from the README.

### Accessibility pass on the card

**Priority:** P2

Deferred deliberately for the first release. Three known contrast failures
against WCAG 2.1 AA, all inherited from the Figma frame: the required-field
asterisk in Horizon on white is 2.95:1, placeholder text in the 30% Dusk tint
is 1.89:1, and both fail AA. `--gph-horizon-accessible` (`#C84423`, 4.88:1) is
already defined for the asterisk.

## Completed

### Brand the hosted auth pages

**Priority:** P0
**Completed:** v0.1.0.0 (2026-09-03)

Replaced the Evolve.ai starter theme with Glidepath Health branding across the
login, register and default auth pages.
