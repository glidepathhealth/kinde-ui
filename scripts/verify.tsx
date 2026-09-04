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

const renderPage = (variant?: string) => {
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
    locale: { lang: "en", isRtl: false },
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
  // The last rule in the sheet must survive to the end.
  assert(
    css.includes(".gph-footer"),
    "stylesheet is truncated: .gph-footer missing from getStyles() output",
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
  const before = read("kindeSrc/assets/brand-assets.ts");
  execFileSync("node", [resolve(root, "scripts/build-brand-assets.mjs")], {
    stdio: "pipe",
  });
  assert(
    read("kindeSrc/assets/brand-assets.ts") === before,
    "brand-assets.ts is stale — run `node scripts/build-brand-assets.mjs` and commit",
  );
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
  const hexes = [...new Set((sheet.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase()))];
  const offPalette = hexes.filter((h) => !palette.has(h));
  assert(offPalette.length === 0, `off-palette colours: ${offPalette.join(", ")}`);
});

check("Area leads the font stack, Figtree is the fallback", () => {
  const m = css.match(/--kinde-base-font-family:\s*([^;]+);/);
  assert(m, "--kinde-base-font-family not set");
  const stack = m![1];
  assert(/^\s*Area\s*,/.test(stack), `Area must lead the stack, got: ${stack}`);
  assert(/Figtree/.test(stack), "Figtree fallback missing from the stack");
});

check("logo renders at or above the 125px brand minimum", () => {
  const m = css.match(/\.gph-header img\s*\{[^}]*?width:\s*([\d.]+)rem/);
  assert(m, ".gph-header img width not found");
  const px = parseFloat(m![1]) * 16;
  assert(px >= 125, `logo is ${px}px wide, brand minimum is 125px`);
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

check("every brand SVG referenced by the generator exists", () => {
  const gen = read("scripts/build-brand-assets.mjs");
  const refs = [...gen.matchAll(/"((?:logo|pattern)\/[^"]+\.svg)"/g)].map((m) => m[1]);
  assert(refs.length >= 4, `expected the generator to reference >=4 SVGs, saw ${refs.length}`);
  for (const r of refs) readFileSync(resolve(root, "kindeSrc/assets/brand", r));
});

check("all four auth pages share the layout", () => {
  const dir = resolve(root, "kindeSrc/environment/pages/(kinde)");
  const pages = readdirSync(dir);
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
