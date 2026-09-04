/**
 * Renders the auth pages to static HTML for local preview.
 *
 *   npx tsx scripts/demo-render.tsx
 *
 * Kinde renders the real pages on its own servers, so two things are stubbed:
 *
 *  - `getKindeRequiredCSS()` is replaced with Kinde's actual shipped stylesheet,
 *    downloaded to .context/kinde/kinde-required.css. Real file, real settings.
 *  - `getKindeWidget()` is replaced with a stand-in form that uses Kinde's real
 *    class names and style hooks, taken from the style-hooks docs. Kinde's own
 *    CSS therefore styles it exactly as it would in production.
 *
 * What this preview canNOT tell you is which fields and buttons Kinde chooses to
 * render for a given flow, or how it orders them. Use Kinde's own preview for
 * that. This is for checking the brand layer.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getKindeCSRF,
  getKindeRequiredCSS,
  getKindeRequiredJS,
  getKindeWidget,
  type KindePageEvent,
} from "@kinde/infrastructure";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Widget } from "../kindeSrc/components/widget";
import { DefaultLayout } from "../kindeSrc/layouts/default";
import { Root } from "../kindeSrc/root";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, ".context/demo");
mkdirSync(out, { recursive: true });

const kindeCss = readFileSync(
  resolve(root, ".context/kinde/kinde-required.css"),
  "utf8",
);

/**
 * Google's official "G" mark. Kinde supplies the real one at runtime; this copy
 * exists only so the preview shows a representative button.
 */
const googleMark = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

/** Kinde's real login markup: real classes plus the documented style hooks. */
const mockWidget = `
<div class="kinde-layout-auth-buttons" data-kinde-layout-auth-buttons="true">
  <a class="kinde-button kinde-button-variant-secondary" data-kinde-button="true" data-kinde-button-variant="secondary" href="#">
    ${googleMark}<span class="kinde-button-text" data-kinde-button-text="true">Continue with Google</span>
  </a>
</div>
<p class="kinde-choice-separator" data-kinde-choice-separator="true">or</p>
<form class="kinde-layout-widget-content" method="post" onsubmit="return false">
  <div class="kinde-form-field kinde-form-field-variant-select-text" data-kinde-form-field="true" data-kinde-form-field-variant="select-text">
    <label class="kinde-control-label" data-kinde-control-label="true" for="credentials_email">Email<abbr title="required">*</abbr></label>
    <input class="kinde-control-select-text" data-kinde-control-select-text="true" data-kinde-control-select-text-variant="text" id="credentials_email" name="p_email" type="email" placeholder="email@info.com" autocomplete="email" />
  </div>
  <div class="kinde-form-field kinde-form-field-variant-select-text" data-kinde-form-field="true" data-kinde-form-field-variant="select-text">
    <label class="kinde-control-label" data-kinde-control-label="true" for="credentials_password">Password<abbr title="required">*</abbr></label>
    <input class="kinde-control-select-text" data-kinde-control-select-text="true" data-kinde-control-select-text-variant="text" id="credentials_password" name="p_password" type="password" placeholder="Your password" autocomplete="current-password" />
  </div>
  <div class="kinde-layout-button-group" data-kinde-layout-button-group="true">
    <button class="kinde-button kinde-button-variant-primary" data-kinde-button="true" data-kinde-button-variant="primary" type="submit">
      <span class="kinde-button-text" data-kinde-button-text="true">Sign in</span>
    </button>
    <a class="kinde-text-link" data-kinde-text-link="true" href="#">Forgot password?</a>
  </div>
</form>`;

const event = (heading: string, description: string): KindePageEvent =>
  ({
    context: {
      widget: {
        content: {
          page_title: "Glidepath Health",
          heading,
          description,
          logo_alt: "Glidepath Health",
        },
      },
    },
    request: { locale: { lang: "en", isRtl: false } },
  }) as unknown as KindePageEvent;

const pages: Array<{file:string;heading:string;description:string;variant?:string}> = [
  { file: "login.html", heading: "Sign in to your account", description: "", variant: "login" },
  {
    file: "register.html",
    heading: "Create your account",
    description: "Set up access to your Glidepath Health workspace.",
  },
];

for (const { file, heading, description, variant } of pages) {
  const ev = event(heading, description);
  const html = renderToStaticMarkup(
    <Root context={ev.context} request={ev.request}>
      <DefaultLayout logoAlt={ev.context.widget.content.logo_alt} variant={variant}>
        <Widget heading={heading} description={description} />
      </DefaultLayout>
    </Root>,
  )
    .replace(getKindeRequiredCSS(), `<style>${kindeCss}</style>`)
    .replace(getKindeRequiredJS(), "")
    .replace(getKindeWidget(), mockWidget)
    .replace(getKindeCSRF(), "demo");

  writeFileSync(resolve(out, file), `<!doctype html>${html}`);
  console.log(`wrote .context/demo/${file}`);
}
