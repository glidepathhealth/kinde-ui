/**
 * Smoke tests for the Kinde custom UI.
 *
 *   npm test
 *
 * Kinde renders these pages on its own servers, so there is no app to boot and
 * no DOM to drive locally. What CAN be checked here is everything that is silent
 * when it breaks:
 *
 *  - a `--kinde-*` setting name that does not exist (renders unstyled, no error)
 *  - a Kinde placeholder that never got substituted (ships a raw token to users)
 *  - brand-assets.ts drifting from the SVGs it is generated from
 *  - a colour that is not in the brand palette
 *  - the styles.ts template literal being terminated early by a stray backtick
 *
 * That last one is not hypothetical: a backtick inside a CSS comment silently
 * truncated the stylesheet during this component's development.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getKindeCSRF,
  getKindeRequiredCSS,
  getKindeRequiredJS,
  getKindeWidget,
  getSVGFaviconUrl,
  type KindePageEvent,
} from "@kinde/infrastructure";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as brandAssets from "../kindeSrc/assets/brand-assets";
import { DefaultLayout } from "../kindeSrc/layouts/default";
import { Widget } from "../kindeSrc/components/widget";
import { Root } from "../kindeSrc/root";
import { getStyles } from "../kindeSrc/styles/styles";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

let failed = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${(err as Error).message}`);
  }
};
const assert = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg);
};

const css = getStyles();

/**
 * What the auth origin's CSP will actually fetch.
 *
 *   img-src   'self' glidepathhealth.com *.glidepathhealth.com data: ...
 *   font-src  'self' glidepathhealth.com *.glidepathhealth.com
 *   style-src 'self' glidepathhealth.com *.glidepathhealth.com ... 'unsafe-inline'
 *
 * Anything else is blocked with no network error surfaced. The authority must
 * end at /, ?, # or end-of-string, so glidepathhealth.com.evil.com,
 * evilglidepathhealth.com and glidepathhealth.com@evil.com all fail while a
 * bare origin (what <link rel=preconnect> carries) passes. Case-insensitive:
 * hosts are, and rejecting a legal uppercase one is a false alarm. A single
 * leading slash is root-relative and covered by 'self'; two is
 * protocol-relative and resolves cross-origin. Fonts additionally reject data:,
 * which font-src omits — the font check handles that.
 */
const brandHost = /^https:\/\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*glidepathhealth\.com([/?#]|$)/i;
const allowedSubresource = new RegExp(
  `^(data:|/(?!/)|#|${brandHost.source.slice(1)})`,
  "i",
);
/**
 * Fonts are stricter than the rest. `'self'` and a root-relative path are
 * CSP-legal but useless here — Kinde serves no static files from this repo — and
 * a #fragment never fetches at all. Only an absolute brand host can actually
 * deliver the woff2, so the font check uses this, not allowedSubresource.
 */
const allowedFontSrc = brandHost;

const renderPage = (variant?: string, opts: { isRtl?: boolean } = {}) => {
  const context = {
    widget: {
      content: {
        page_title: "t",
        heading: "Sign in to your account",
        description: "",
        logo_alt: "Glidepath Health",
      },
    },
  } as unknown as KindePageEvent["context"];
  const request = {
    locale: { lang: "en", isRtl: opts.isRtl ?? false },
  } as unknown as KindePageEvent["request"];
  return renderToStaticMarkup(
    <Root context={context} request={request}>
      <DefaultLayout logoAlt="Glidepath Health" variant={variant}>
        <Widget heading="Sign in to your account" description="" />
      </DefaultLayout>
    </Root>,
  );
};

console.log("\nkinde custom ui — smoke tests\n");

check("every --kinde-* setting used actually exists", () => {
  const known = new Set(
    read("scripts/kinde-settings.txt").split("\n").filter(Boolean),
  );
  const used = [...new Set(css.match(/--kinde-[a-z0-9-]+/g) ?? [])];
  assert(used.length > 0, "no --kinde-* settings found; did styles.ts change shape?");
  const unknown = used.filter((u) => !known.has(u));
  assert(
    unknown.length === 0,
    `unknown Kinde settings (typo or invented): ${unknown.join(", ")}`,
  );
});

check("styles.ts template literal is not truncated by a stray backtick", () => {
  const src = read("kindeSrc/styles/styles.ts");
  const backticks = (src.match(/`/g) ?? []).length;
  assert(
    backticks % 2 === 0,
    `odd number of backticks (${backticks}) — a CSS comment probably contains one`,
  );
  // Anchor on a sentinel kept last in styles.ts. Asserting a rule that happens
  // to sit mid-sheet leaves everything after it unprotected — .gph-footer was
  // at 66% once the social sign-in and login rules landed below it.
  assert(
    css.includes("gph-end-of-stylesheet"),
    "stylesheet is truncated: the end-of-sheet sentinel is missing",
  );
  assert(css.length > 4000, `stylesheet suspiciously short (${css.length} chars)`);
});

check("no Kinde-internal class selectors (only documented style hooks)", () => {
  const internal = [...new Set(css.match(/^\s*\.kinde-[a-z-]+/gm) ?? [])];
  assert(
    internal.length === 0,
    `class selectors are internal API and may change: ${internal.join(", ")}`,
  );
});

check("brand-assets.ts is in sync with the source SVGs", () => {
  // --check compares without writing. Regenerating first would repair the drift
  // it is meant to detect, so the check passed on every run after the first.
  execFileSync("node", [resolve(root, "scripts/build-brand-assets.mjs"), "--check"], {
    stdio: "pipe",
  });
});

check("the official logo and Glide Path artwork are embedded, not redrawn", () => {
  // The brand guide forbids recreating either; they must be byte-identical to
  // the files in kindeSrc/assets/brand/.
  const pairs: Array<[string, string]> = [
    ["logo/logo-horizontal-inverse.svg", brandAssets.logoHorizontalInverse],
    ["pattern/glide-path-white.svg", brandAssets.glidePathWhite],
  ];
  for (const [file, uri] of pairs) {
    const onDisk = readFileSync(resolve(root, "kindeSrc/assets/brand", file));
    const embedded = Buffer.from(uri.split(",")[1] ?? "", "base64");
    assert(embedded.equals(onDisk), `${file} does not match its data URI`);
  }
});

check("stylesheet uses only brand palette colours", () => {
  const palette = new Set([
    "#f0704b", "#0a082c", "#18206c", "#6373c1", "#ffb45f", "#3c3c3c",
    "#c84423", "#babcd3", "#e2e4ee", "#fef1ed", "#ffffff",
  ]);
  // Strip data URIs (the official artwork carries its own colour) and CSS
  // comments (which legitimately name Kinde's defaults when explaining why a
  // setting is overridden). Only colours that actually render are in scope.
  const sheet = css
    .replace(/url\(\s*"?data:[^)]*"?\s*\)/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const norm = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

  const found = new Set<string>();
  // 6- and 3-digit hex (8-digit is 6-digit plus alpha, so the prefix matches).
  for (const h of sheet.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    const x = h.slice(1).toLowerCase();
    if (x.length === 3) found.add("#" + [...x].map((c) => c + c).join(""));
    else if (x.length >= 6) found.add("#" + x.slice(0, 6));
  }
  // rgb()/rgba() — alpha is ignored; fully transparent is not a colour choice.
  for (const m of sheet.matchAll(/rgba?\(([^)]*)\)/g)) {
    const parts = m[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    const [r, g, b, a] = parts;
    if ([r, g, b].some(Number.isNaN)) continue;
    if (a === 0) continue;
    found.add(norm(r, g, b));
  }
  // Anything else that renders a colour and would slip past the two above.
  const exotic = sheet.match(/\b(hsla?|color-mix|lab|lch|oklch|oklab)\(/g) ?? [];
  assert(
    exotic.length === 0,
    `unsupported colour syntax the palette check cannot verify: ${[...new Set(exotic)].join(", ")}`,
  );
  const named = sheet.match(/:\s*(red|blue|green|orange|purple|grey|gray|pink|yellow|teal|cyan|magenta)\s*[;!]/gi) ?? [];
  assert(named.length === 0, `named CSS colours are off-palette: ${named.join(", ")}`);

  const offPalette = [...found].filter((h) => !palette.has(h));
  assert(offPalette.length === 0, `off-palette colours: ${offPalette.join(", ")}`);
});

check("the emitted CSS contains no quote characters at all", () => {
  // The load-bearing check. Kinde HTML-escapes this stylesheet before serving
  // it, and the `;` inside the resulting `&quot;` terminates whatever
  // declaration it lands in. On dev that silently cost us the font (truncated
  // stack -> browser default serif), the entire Glide Path layer (`content: ""`
  // invalid, so the element never rendered), the background image
  // (url("data:...") reparsed as a relative URL), and every quoted attribute
  // selector. Single quotes are escaped too, so neither kind is safe.
  //
  // Comments are exempt: the parser consumes them whole, so an escaped quote
  // inside one cannot break a declaration.
  const functional = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const offenders = functional
    .split("\n")
    .map((l, i) => [i + 1, l] as const)
    .filter(([, l]) => /["']/.test(l));
  assert(
    offenders.length === 0,
    `quotes do not survive Kinde's escaping; found on line(s) ${offenders
      .map(([n, l]) => `${n}: ${l.trim().slice(0, 60)}`)
      .join(" | ")}`,
  );
});

check("Figtree leads the stack and loads from a CSP-allowed host", () => {
  const m = css.match(/--kinde-base-font-family:\s*([^;]+);/);
  assert(m, "--kinde-base-font-family not set");
  const stack = m![1];
  assert(/^\s*Figtree\s*,/.test(stack), `Figtree must lead the stack, got: ${stack}`);
  // Every family in the stack must be quote-free, or the declaration truncates.
  for (const family of stack.split(",").map((f) => f.trim())) {
    assert(
      /^[A-Za-z-][A-Za-z0-9 -]*$/.test(family),
      `font family needs quoting and so cannot be used here: ${family}`,
    );
  }
  // The auth origin's CSP is `font-src 'self' glidepathhealth.com
  // *.glidepathhealth.com`. It has no `data:`, so an embedded font is rejected;
  // and it lists no other host, so any third-party CDN is rejected too. This
  // check used to assert `url(data:font` — the exact thing CSP blocks — which
  // kept the suite green while the font did not render. Assert the CSP instead.
  // Strip comments before matching: a commented-out `src:` whose url() stayed
  // inside the comment satisfied this check while the face had no source.
  const faces = [
    ...css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/@font-face\s*\{[^}]*\}/gi),
  ].map((x) => x[0]);
  // Exactly two: the latin and latin-ext subsets. `>= 1` let the ext subset be
  // deleted, which drops every ä/ł/ś/ż/ő to Helvetica mid-word.
  assert(
    faces.length === 2,
    `expected the latin and latin-ext subsets, found ${faces.length} @font-face rules`,
  );
  const primaries: string[] = [];
  for (const face of faces) {
    // EVERY src descriptor, not the first. A later `src:` replaces the earlier
    // one outright in CSS, so reading only the first let a re-embedded data:
    // font ride along in a second descriptor and win — the exact regression the
    // per-url loop below exists to stop.
    const srcDecls = [...face.matchAll(/src:\s*([^;}]+)/gi)].map((x) => x[1]);
    assert(srcDecls.length > 0, `@font-face has no src descriptor: ${face.slice(0, 60)}`);
    assert(
      srcDecls.length === 1,
      `@font-face has ${srcDecls.length} src descriptors; the last one wins and the rest are dead`,
    );
    // Check the raw face for an embedded font before parsing srcs: a real
    // base64 URI contains `;base64`, and the descriptor capture stops at that
    // semicolon, so srcs comes back empty and the generic no-url() message
    // fires instead of the one naming the actual mistake.
    assert(
      !/url\(\s*data:/i.test(face),
      "@font-face cannot use a data: URI: CSP font-src has no data:, so it never loads. Serve it from a glidepathhealth.com host.",
    );
    const srcs = srcDecls.flatMap((d) =>
      [...d.matchAll(/url\(([^)]+)\)/gi)].map((x) => x[1].trim()),
    );
    assert(srcs.length > 0, `@font-face src has no url(): ${face.slice(0, 60)}`);
    // Every source, not just the first. A data: URI is not a usable fallback
    // here — font-src rejects it every time — so an embedded copy is pure page
    // weight plus a guaranteed console violation. Re-embedding is the specific
    // mistake this guards, since it looks like the safe option.
    for (const s of srcs) {
      assert(
        allowedFontSrc.test(s),
        `@font-face needs an absolute https://<host>.glidepathhealth.com URL — a root-relative path or #fragment passes CSP but fetches nothing here; got: ${s.slice(0, 70)}`,
      );
      const parsedFontUrl = new URL(s);
      assert(
        parsedFontUrl.pathname.endsWith(".woff2"),
        `@font-face src path is not a woff2: ${s.slice(0, 70)}`,
      );
    }
    primaries.push(srcs[0]);
    // format() needs a quoted string, which Kinde's escaping destroys.
    assert(!/format\(/i.test(face), "format() needs quotes and cannot be used here");
    assert(
      /font-display:\s*swap/i.test(face),
      "font-display: swap missing: login text stays invisible until the font arrives",
    );
    assert(
      /unicode-range:\s*U\+/i.test(face),
      "unicode-range missing: this subset claims every codepoint and the other never loads",
    );
    // The declared range has to keep matching the variable woff2 that gets
    // published. Narrowing it here, or publishing a static instance, faux-bolds
    // the 600 labels and the 700 heading with no console error.
    assert(
      /font-weight:\s*300\s+900/i.test(face),
      "font-weight must stay 300 900 to match the variable woff2 published at FONT_HOST",
    );
    // Bind the face to what the stack actually asks for. Two valid .woff2 URLs
    // under font-family: Other, or font-style: italic, satisfy every other
    // assertion here while the page still falls back to Helvetica.
    assert(
      /font-family:\s*Figtree\s*[;}]/i.test(face),
      "@font-face must declare font-family: Figtree, which is what the stack requests",
    );
    assert(
      /font-style:\s*normal\s*[;}]/i.test(face),
      "@font-face must declare font-style: normal; an italic face never matches the body text",
    );
    // Kinde HTML-escapes the sheet; & becomes &amp; and that ; terminates the
    // declaration. The .woff2(\?|#|$) allowance above invites query strings,
    // which is exactly where & shows up.
    assert(!/[&<]/.test(face), "& or < in an @font-face does not survive Kinde's escaping");
  }
  assert(
    new Set(primaries).size === primaries.length,
    `both @font-face rules share a src, so one subset never loads: ${primaries.join(", ")}`,
  );
});

check("every subresource in the sheet is a data: URI or a glidepathhealth.com host", () => {
  // The CSP that governs @font-face governs img-src and style-src too. A remote
  // background-image is blocked with no network error surfaced — the exact
  // silent failure this suite exists for, and previously unguarded: only
  // @font-face was checked. data: is allowed here because img-src lists it;
  // font-src does not, which the font check above handles separately.
  // Case-insensitive: CSS function names and at-keywords are ASCII
  // case-insensitive, so URL(...) and @IMPORT are valid and get fetched.
  const sheet = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const urls = [...sheet.matchAll(/url\(([^)]+)\)/gi)].map((m) => m[1].trim());
  assert(urls.length > 0, "no url() at all; did the artwork stop being embedded?");
  const blocked = urls.filter((u) => !allowedSubresource.test(u));
  assert(
    blocked.length === 0,
    `CSP blocks these subresources (data: or a glidepathhealth.com host only): ${blocked
      .map((u) => u.slice(0, 60))
      .join(" | ")}`,
  );
  assert(
    !/@import/i.test(sheet),
    "@import pulls a cross-origin stylesheet, which style-src blocks",
  );
});

check("every subresource in the rendered HTML is CSP-allowed", () => {
  // The stylesheet is not the only way a blocked URL gets in: header.tsx renders
  // the logo as an <img src>. Cover every carrier that triggers a fetch, not just
  // src/href — an inline style attribute is checked by nothing else, since the
  // sheet check only reads getStyles(). href is scoped to <link> and SVG
  // <use>/<image>: CSP does not govern <a> navigation, and flagging an outbound
  // link as a blocked subresource would be a false alarm with a wrong diagnosis.
  for (const variant of [undefined, "login"]) {
    const html = renderPage(variant);
    const candidates = [
      ...[...html.matchAll(/\ssrc="([^"]+)"/gi)].map((m) => m[1]),
      // srcset is a comma-separated candidate list; each URL is fetchable, so
      // validating the raw string would let a blocked candidate ride behind an
      // allowed first one.
      ...[...html.matchAll(/\ssrcset="([^"]+)"/gi)].flatMap((m) =>
        m[1]
          .split(",")
          .map((c) => c.trim().split(/\s+/)[0])
          .filter(Boolean),
      ),
      ...[...html.matchAll(/<(?:link|use|image)\b[^>]*\shref="([^"]+)"/gi)].map((m) => m[1]),
      ...[...html.matchAll(/<object\b[^>]*\sdata="([^"]+)"/gi)].map((m) => m[1]),
      // url() inside any inline style attribute.
      ...[...html.matchAll(/\sstyle="([^"]*)"/gi)].flatMap((m) =>
        [...m[1].matchAll(/url\(([^)]+)\)/gi)].map((u) => u[1].trim()),
      ),
    ];
    const blocked = candidates.filter(
      (u) => !(allowedSubresource.test(u) || /^@[0-9a-f]{32}@/.test(u)),
    );
    assert(
      blocked.length === 0,
      `CSP blocks these page subresources (variant=${variant}): ${blocked.join(", ")}`,
    );
  }
});

check("logo renders at or above the 125px brand minimum at every breakpoint", () => {
  // Every .gph-header img width, not just the first. The mobile override lives
  // in a media query further down, and mobile is exactly where a logo gets
  // shrunk toward the floor this check exists to defend.
  const widths = [...css.matchAll(/\.gph-header img\s*\{[^}]*?width:\s*([\d.]+)rem/g)].map(
    (m) => parseFloat(m[1]) * 16,
  );
  assert(widths.length >= 2, `expected a desktop and a mobile rule, found ${widths.length}`);
  const tooSmall = widths.filter((px) => px < 125);
  assert(
    tooSmall.length === 0,
    `logo drops to ${tooSmall.join(", ")}px; the brand minimum is 125px`,
  );
});

check("every Kinde placeholder in the output is one Kinde will substitute", () => {
  // Kinde replaces its own @...@ tokens server-side. Any token in the output
  // that is NOT one the infrastructure package handed us would ship to a user
  // as literal text.
  const expected = new Set(
    [
      getKindeWidget(),
      getKindeCSRF(),
      getKindeRequiredCSS(),
      getKindeRequiredJS(),
      ...(getSVGFaviconUrl().match(/@[0-9a-f]{32}@/g) ?? []),
    ].flatMap((v) => v.match(/@[0-9a-f]{32}@/g) ?? []),
  );
  for (const variant of [undefined, "login"]) {
    const html = renderPage(variant);
    assert(html.includes(getKindeWidget()), `widget placeholder missing (variant=${variant})`);
    const stray = [...new Set(html.match(/@[0-9a-f]{32}@/g) ?? [])].filter(
      (t) => !expected.has(t),
    );
    assert(stray.length === 0, `unknown placeholders would ship literally: ${stray.join(", ")}`);
    assert(html.includes("gph-card"), "card wrapper missing");
    assert(html.includes("gph-page__pattern"), "Glide Path layer missing from the markup");
    assert(html.includes('lang="en"'), "lang attribute missing");
  }
});

/** The class attribute on the page wrapper, ignoring the inline stylesheet. */
const pageClass = (variant?: string) =>
  renderPage(variant).match(/<div class="(gph-page[^"]*)"/)?.[1] ?? "";

check("the login row override is scoped to login only", () => {
  assert(
    css.includes(".gph-page--login [data-kinde-layout-button-group]"),
    "login button-row rule missing",
  );
  const unscoped = css.match(/^\s*\[data-kinde-layout-button-group\]\s*\{/m);
  assert(!unscoped, "button-group layout is being changed globally, not just on login");
  // Match the wrapper's class attribute, not the whole document — the inline
  // stylesheet naturally contains the string ".gph-page--login".
  assert(pageClass("login") === "gph-page gph-page--login", `login: got "${pageClass("login")}"`);
  assert(pageClass() === "gph-page", `default: got "${pageClass()}"`);
});

check("the fixes from the adversarial review stay fixed", () => {
  // Each of these guards a specific defect a reviewer found and measured.
  const token = (name: string) => css.match(new RegExp(`--kinde-${name}:\\s*([^;]+);`))?.[1]?.trim();

  // Long localised labels escaped the card until inline-size:auto got a clamp.
  const btn = css.match(/\.gph-page--login \[data-kinde-layout-button-group\] \[data-kinde-button\]\s*\{[^}]*\}/);
  assert(btn, "login button rule missing");
  assert(/inline-size:\s*auto/.test(btn![0]), "content-width button rule changed shape");
  assert(
    /max-inline-size:\s*100%/.test(btn![0]),
    "inline-size:auto without max-inline-size lets a long label overflow the card",
  );

  // In-flight submit repainted to Kinde's #ababab without these.
  for (const t of [
    "button-primary-background-color-loading",
    "button-primary-color-loading",
    "button-secondary-background-color-loading",
    "button-secondary-color-loading",
  ]) {
    assert(token(t), `--kinde-${t} unset: the loading state falls back to Kinde grey`);
  }

  // Zeroing the card flattened the plan picker and org switcher.
  assert(
    parseFloat(token("card-border-width") ?? "0") > 0,
    "card border zeroed again: plan picker and org switcher lose their separation",
  );
  assert(token("card-padding") !== "0", "card padding zeroed again");

  // Error banner was stock maroon beside branded inline field errors, and the
  // info variant overrides those colours with its own set — branding one and not
  // the other puts Kinde's stock blue on the same card as the branded red.
  for (const t of [
    "alert-banner-error-background-color",
    "alert-banner-error-border-color",
    "alert-banner-error-color",
    "alert-banner-info-background-color",
    "alert-banner-info-border-color",
    "alert-banner-info-color",
  ]) {
    assert(token(t), `--kinde-${t} unset: that banner variant reverts to Kinde's stock colours`);
  }

  // transparent left the canvas UA-white on overscroll and in print.
  assert(
    token("base-background-color") !== "transparent",
    "transparent canvas shows white on iOS overscroll and when printing",
  );

  // The Kinde attribution renders inside the white card; nothing may paint it white.
  assert(!/kinde-branding/.test(css), "styling Kinde's attribution made its logo invisible once");

  // The Glide Path layer must stay a real element. As a ::before it needed
  // content: "" and vanished entirely once Kinde escaped the quotes.
  assert(
    /\.gph-page__pattern\s*\{/.test(css),
    "the Glide Path layer lost its own rule",
  );
  assert(
    !/\.gph-page::before/.test(css),
    "the pattern moved back to a pseudo-element, which needs an escapable content",
  );
  // The pattern is absolutely positioned; a blanket child rule that also sets
  // position wins on source order and collapses it to zero height.
  const childRule = css.match(/\.gph-page > \*[^{]*\{[^}]*position[^}]*\}/);
  if (childRule) {
    assert(
      /:not\(\.gph-page__pattern\)/.test(childRule[0]),
      "a .gph-page > * rule sets position without excluding the pattern, which collapses it",
    );
  }
});

check("the RTL locale flips direction and the decorative arrow", () => {
  const html = renderPage(undefined, { isRtl: true });
  assert(/<html[^>]*dir="rtl"/.test(html), "dir=rtl not emitted for an RTL locale");
  assert(/<html[^>]*dir="ltr"/.test(renderPage()), "dir=ltr not emitted for an LTR locale");
  const rtlRule = css.match(/\[dir=rtl\][^{]*\{[^}]*\}/);
  assert(rtlRule, "no [dir=rtl] rule at all");
  const ltrRule = css.match(
    /\.gph-page--login \[data-kinde-layout-button-group\] \[data-kinde-text-link\]::after\s*\{[^}]*\}/,
  );
  assert(ltrRule, "no LTR arrow rule");
  const uri = (r: string) => r.match(/url\((data:[^)]*)\)/)?.[1];
  assert(uri(rtlRule![0]), "the RTL rule no longer swaps the arrow glyph");
  assert(
    uri(ltrRule![0]) !== uri(rtlRule![0]),
    "LTR and RTL use the same arrow glyph; one of them points the wrong way",
  );
});

check("Kinde's required CSS and JS both reach the page", () => {
  const html = renderPage();
  assert(html.includes(getKindeRequiredCSS()), "required CSS placeholder missing: widget renders unstyled");
  assert(html.includes(getKindeRequiredJS()), "required JS placeholder missing: widget will not function");
  assert(html.includes(getKindeCSRF()), "CSRF placeholder missing");
  // Our stylesheet has to load after Kinde's so it can override the settings.
  assert(
    html.indexOf(getKindeRequiredCSS()) < html.indexOf("--kinde-base-font-family"),
    "custom styles must come after getKindeRequiredCSS() to win the cascade",
  );
});

check("the login page actually asks for the login variant", () => {
  // renderPage() passes the variant directly, so it cannot catch the wiring
  // being deleted from the page component. Check the real source.
  const login = read("kindeSrc/environment/pages/(kinde)/(login)/page.tsx");
  assert(/variant="login"/.test(login), "login page no longer passes variant=login");
  for (const p of ["(register)", "(default)"]) {
    const src = read(`kindeSrc/environment/pages/(kinde)/${p}/page.tsx`);
    assert(!/variant="login"/.test(src), `${p} must not use the login variant`);
  }
});

check("VERSION and package.json describe the same release", () => {
  const v = read("VERSION").trim();
  assert(/^\d+\.\d+\.\d+\.\d+$/.test(v), `VERSION is not 4-digit: ${v}`);
  const pkg = JSON.parse(read("package.json")).version;
  // npm rejects 4 components, so package.json carries the 3-digit translation.
  assert(
    pkg === v.split(".").slice(0, 3).join("."),
    `package.json ${pkg} does not match VERSION ${v}`,
  );
});

check("every brand SVG referenced by the generator exists", () => {
  const gen = read("scripts/build-brand-assets.mjs");
  const refs = [...gen.matchAll(/"((?:logo|pattern)\/[^"]+\.svg)"/g)].map((m) => m[1]);
  assert(refs.length >= 4, `expected the generator to reference >=4 SVGs, saw ${refs.length}`);
  for (const r of refs) readFileSync(resolve(root, "kindeSrc/assets/brand", r));
});

check("every auth page shares the layout", () => {
  const dir = resolve(root, "kindeSrc/environment/pages/(kinde)");
  const pages = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  // Three directories today: (default), (login), (register). The check used to
  // be named for four and assert >= 3, which overstated what it covers. Adding a
  // directory is deliberate, so make it say so rather than pass silently.
  assert(
    pages.length === 3,
    `expected 3 page dirs, saw ${pages.length}: ${pages.join(", ")}. Adding a flow? Update this count and check the variant="login" exclusion list above.`,
  );
  for (const p of pages) {
    const src = read(`kindeSrc/environment/pages/(kinde)/${p}/page.tsx`);
    assert(src.includes("DefaultLayout"), `${p} does not use DefaultLayout`);
    assert(src.includes("logoAlt="), `${p} does not pass logoAlt`);
  }
});

console.log(
  failed === 0 ? "\nall checks passed\n" : `\n${failed} check(s) failed\n`,
);
process.exit(failed === 0 ? 0 : 1);
