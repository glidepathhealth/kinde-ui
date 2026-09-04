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
    .replace(/url\("data:[^"]*"\)/g, "")
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

check("Area leads the font stack, Figtree is the fallback", () => {
  const m = css.match(/--kinde-base-font-family:\s*([^;]+);/);
  assert(m, "--kinde-base-font-family not set");
  const stack = m![1];
  assert(/^\s*Area\s*,/.test(stack), `Area must lead the stack, got: ${stack}`);
  assert(/Figtree/.test(stack), "Figtree fallback missing from the stack");
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
});

check("the RTL locale flips direction and the decorative arrow", () => {
  const html = renderPage(undefined, { isRtl: true });
  assert(/<html[^>]*dir="rtl"/.test(html), "dir=rtl not emitted for an RTL locale");
  assert(/<html[^>]*dir="ltr"/.test(renderPage()), "dir=ltr not emitted for an LTR locale");
  assert(
    css.includes('[dir="rtl"]') && css.includes("\\2190"),
    "no RTL rule flipping the link arrow, which otherwise points into the text",
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

check("all four auth pages share the layout", () => {
  const dir = resolve(root, "kindeSrc/environment/pages/(kinde)");
  const pages = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  assert(pages.length >= 3, `expected >=3 page dirs, saw ${pages.join(", ")}`);
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
