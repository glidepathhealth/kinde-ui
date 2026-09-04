import {
  arrowLeft,
  arrowRight,
  figtreeLatin,
  figtreeLatinExt,
  glidePathWhite,
} from "../assets/brand-assets";

/**
 * Glidepath Health design tokens.
 *
 * Values come from the AI-Ready Brand Guide (Brand Summary V.01, Brand at a
 * Glance V1.0). Only palette colours and approved tints appear here — the guide
 * forbids off-palette colour. See kindeSrc/assets/brand/README.md for the
 * measured Figma spec and the two places the mockup drifted off-palette.
 */
const brand = {
  horizon: "#F0704B",
  midnight: "#0A082C",
  dusk: "#18206C",
  dawn: "#6373C1",
  glint: "#FFB45F",
  stratus: "#3C3C3C",
  /** Accessibility Horizon — swap in for Horizon where text/UI contrast is short. */
  horizonAccessible: "#C84423",
  /** 30% Dusk on white. Field borders and placeholder ink. */
  duskTint30: "#BABCD3",
  /** 12% Dusk on white. Hairlines inside the card. */
  duskTint12: "#E2E4EE",
  /** 10% Horizon on white. Error banner fill. */
  horizonTint10: "#FEF1ED",
  white: "#FFFFFF",
} as const;

/**
 * Figtree, matching the product app.
 *
 * No quoted family names, and no family whose name needs quoting. Kinde
 * HTML-escapes this stylesheet before serving it, and the `;` inside the
 * resulting `&quot;` terminates the declaration early — a stack ending in
 * "Segoe UI" truncated mid-value and every page fell back to the browser
 * default serif. scripts/verify.tsx now fails on any quote in the output.
 *
 * Area is the brand guide's primary typeface but ships via Adobe Fonts, and the
 * auth origin does not load cross-origin fonts, so it cannot be served here at
 * all. Figtree is the guide's sanctioned fallback.
 */
const fontStack = `Figtree, Helvetica, Arial, sans-serif`;

const scale = {
  heading: "2rem", // 32px — guide's web H1 range is 32-36px
  body: "1rem", // 16px
  control: "1rem", // 16px — labels, inputs, buttons
  micro: "0.875rem", // 14px — footer, legal
} as const;

export const getStyles = (): string => `
  /*
   * Figtree, embedded. The Kinde auth origin does not load cross-origin
   * subresources — a FontFace pointing at fonts.gstatic.com fails there and the
   * same load succeeds from any other origin — so a hotlinked CDN font silently
   * leaves the page on the browser default serif.
   *
   * No format() descriptor: it requires a quoted string and browsers sniff the
   * format from the data URI anyway.
   */
  @font-face {
    font-family: Figtree;
    font-style: normal;
    font-weight: 300 900;
    font-display: swap;
    src: url(${figtreeLatin});
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: Figtree;
    font-style: normal;
    font-weight: 300 900;
    font-display: swap;
    src: url(${figtreeLatinExt});
    unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }

  :root {
    /* Brand palette */
    --gph-horizon: ${brand.horizon};
    --gph-midnight: ${brand.midnight};
    --gph-dusk: ${brand.dusk};
    --gph-dawn: ${brand.dawn};
    --gph-glint: ${brand.glint};
    --gph-stratus: ${brand.stratus};
    --gph-horizon-accessible: ${brand.horizonAccessible};
    --gph-dusk-30: ${brand.duskTint30};
    --gph-dusk-12: ${brand.duskTint12};

    /* Layout constants, measured from the Figma login frame (node 1-851) */
    --gph-card-width: 39.25rem;   /* 628px */
    --gph-card-padding: 3rem;     /* 48px  */
    --gph-gutter: 5rem;           /* 80px  */
    --gph-control-height: 3.25rem;/* 52px  */

    /* --- Kinde settings, mapped onto the brand tokens ---
     * Every name below was checked against Kinde's shipped stylesheet
     * (.context/kinde/kinde-required.css, 540 settings). Kinde's own component
     * CSS reads these, so setting the variable is preferred over overriding the
     * rule with a style hook — no specificity fight, and it survives internal
     * markup changes.
     */
    --kinde-base-font-family: ${fontStack};
    --kinde-base-color: ${brand.midnight};
    /* Midnight, not transparent: transparent leaves the canvas UA-white, which
     * shows on iOS elastic overscroll and when printing. The gradient paints on
     * .gph-page above this. */
    --kinde-base-background-color: ${brand.midnight};
    --kinde-base-font-size: ${scale.body};
    --kinde-base-focus-outline-color: ${brand.dawn};

    --kinde-heading-color: ${brand.midnight};
    --kinde-heading-font-family: ${fontStack};
    --kinde-heading-font-weight: 700;
    --kinde-heading-line-height: 1.25;

    --kinde-control-label-color: ${brand.midnight};
    --kinde-control-label-font-size: ${scale.control};
    --kinde-control-label-font-weight: 600;
    --kinde-control-label-spacing: 0.75rem;

    --kinde-control-select-text-background-color: ${brand.white};
    --kinde-control-select-text-block-size: var(--gph-control-height);
    --kinde-control-select-text-border-color: ${brand.duskTint30};
    --kinde-control-select-text-border-color-hover: ${brand.dawn};
    --kinde-control-select-text-border-color-focus: ${brand.dusk};
    --kinde-control-select-text-border-color-invalid: ${brand.horizonAccessible};
    --kinde-control-select-text-border-radius: 0.25rem;
    --kinde-control-select-text-border-style: solid;
    --kinde-control-select-text-border-width: 0.0625rem;
    --kinde-control-select-text-color: ${brand.midnight};
    --kinde-control-select-text-inline-size: 100%;
    --kinde-control-select-text-padding: 0.875rem;

    --kinde-button-block-size: 2.75rem; /* 44px, matches the Figma button */
    --kinde-button-border-radius: 0.25rem;
    --kinde-button-font-size: ${scale.control};
    --kinde-button-font-weight: 600;
    --kinde-button-padding-inline: 1.5rem;
    --kinde-button-primary-background-color: ${brand.dusk};
    --kinde-button-primary-background-color-hover: ${brand.midnight};
    --kinde-button-primary-background-color-focus: ${brand.midnight};
    --kinde-button-primary-background-color-active: ${brand.midnight};
    --kinde-button-primary-border-width: 0;
    --kinde-button-primary-color: ${brand.white};
    --kinde-button-primary-color-hover: ${brand.white};
    /* Without these the in-flight submit repaints the CTA Kinde grey (#ababab). */
    --kinde-button-primary-background-color-loading: ${brand.dusk};
    --kinde-button-primary-color-loading: ${brand.white};

    --kinde-button-secondary-background-color: transparent;
    --kinde-button-secondary-background-color-hover: ${brand.duskTint12};
    --kinde-button-secondary-border-color: ${brand.duskTint30};
    --kinde-button-secondary-border-style: solid;
    --kinde-button-secondary-border-width: 0.0625rem;
    --kinde-button-secondary-color: ${brand.dusk};
    --kinde-button-secondary-background-color-loading: ${brand.duskTint12};
    --kinde-button-secondary-color-loading: ${brand.dusk};

    --kinde-text-link-color: ${brand.dusk};
    --kinde-text-link-color-hover: ${brand.midnight};
    --kinde-text-link-color-visited: ${brand.dusk};
    --kinde-text-link-font-weight: 500;

    /*
     * Kinde's Card is a real component in the plan picker, org switcher and
     * order summary, where it is what separates one option from the next.
     * Zeroing it flattened those flows into one run-on list, so it gets brand
     * values rather than being switched off. It sits inside the white
     * .gph-card, so it reads as a nested panel, not a second page card.
     */
    --kinde-card-background-color: transparent;
    --kinde-card-border-color: ${brand.duskTint30};
    --kinde-card-border-width: 0.0625rem;
    --kinde-card-border-style: solid;
    --kinde-card-border-radius: 0.25rem;
    --kinde-card-padding: 1.25rem;
    --kinde-card-element-divider-color: ${brand.duskTint12};

    /* Vertical rhythm inside the widget, measured off the Figma frame. */
    --kinde-layout-widget-spacing-content: 1.75rem;
    --kinde-form-field-spacing-content: 0.75rem;
    --kinde-layout-button-group-gap: 1rem;

    /* One red for every error surface: the banner matched Kinde's stock maroon
     * while inline field errors were already Accessibility Horizon. */
    --kinde-alert-banner-error-background-color: ${brand.horizonTint10};
    --kinde-alert-banner-error-border-color: ${brand.horizon};
    --kinde-alert-banner-error-color: ${brand.horizonAccessible};
    --kinde-alert-banner-border-radius: 0.25rem;
    /* The info variant overrides the error colours with its own set. Branding
     * only the error one left "we sent you a code" rendering in Kinde's stock
     * blue while carrying the new radius — half-branded rather than deliberate. */
    --kinde-alert-banner-info-background-color: ${brand.duskTint12};
    --kinde-alert-banner-info-border-color: ${brand.duskTint30};
    --kinde-alert-banner-info-color: ${brand.midnight};

    --kinde-shared-color-invalid: ${brand.horizonAccessible};
    --kinde-shared-color-text-label: ${brand.midnight};
    --kinde-shared-color-text-caption: ${brand.stratus};
    --kinde-designer-base-link-color: ${brand.dusk};
  }

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: ${fontStack};
    color: ${brand.white};
    -webkit-font-smoothing: antialiased;
  }

  /* ---------------------------------------------------------------- page --
   * Brand gradient (Midnight -> Dusk -> Dawn, with a Horizon wash rising from
   * the bottom) under the Glide Path line pattern.
   *
   * The gradient is CSS rather than gradient-digital.svg on purpose. That file
   * is a fixed 1920x1080 with the default preserveAspectRatio, so any
   * background-size other than an exact 16:9 letterboxes it, and "cover" on a
   * tall phone viewport crops sideways and drags the loud Horizon end of the
   * ramp up into view. A CSS gradient re-anchored on the palette hexes holds the
   * same ramp at every aspect ratio. Stops were fitted to the Figma frame
   * (node 1-851) and then snapped back onto brand colours: #0A082C is Midnight
   * exactly, #18206C is Dusk exactly, and the tail runs toward Dawn.
   *
   * The Glide Path pattern is a different matter — the brand guide forbids
   * redrawing it, so it stays the official SVG, inlined byte-for-byte.
   */
  .gph-page {
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: ${brand.midnight};
    background-image:
      linear-gradient(180deg, rgba(240, 112, 75, 0) 74%, rgba(240, 112, 75, 0.3) 100%),
      linear-gradient(180deg, ${brand.midnight} 0%, ${brand.dusk} 48%, ${brand.dawn} 145%);
    background-repeat: no-repeat;
  }

  /*
   * A real element, not ::before. The pseudo-element needed content: "" and the
   * escaped &quot;&quot; made that declaration invalid, so the whole layer never
   * rendered and the page showed a bare gradient with no Glide Path lines.
   */
  .gph-page__pattern {
    position: absolute;
    inset: 0;
    background-image: url(${glidePathWhite});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.14;
    pointer-events: none;
  }

  /*
   * Lifts the content above the pattern layer. It must exclude the pattern
   * itself: same specificity and later in source, so it was winning and
   * collapsing the absolutely-positioned layer to zero height.
   */
  .gph-page > *:not(.gph-page__pattern) { position: relative; }

  /* -------------------------------------------------------------- header -- */
  .gph-header {
    padding: 2.5rem var(--gph-gutter) 0;
  }

  /*
   * 206px matches the Figma lockup and clears the guide's 125px minimum. The
   * logo keeps its own aspect ratio; never set both width and height.
   */
  .gph-header img {
    display: block;
    width: 12.875rem;
    height: auto;
  }

  /* ---------------------------------------------------------------- card -- */
  .gph-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
  }

  .gph-card {
    width: 100%;
    max-width: var(--gph-card-width);
    background: ${brand.white};
    border-radius: 0.5rem;
    padding: var(--gph-card-padding);
    color: ${brand.midnight};
  }

  .gph-card__heading {
    margin: 0 0 2rem;
    font-size: ${scale.heading};
    font-weight: 700;
    line-height: 1.25; /* guide: headings 120-135% */
    letter-spacing: -0.01em;
    color: ${brand.midnight};
  }

  .gph-card__description {
    /* Negative top margin pulls the description back up under the heading; the
     * heading keeps its 2rem bottom margin so the spacing is correct either way,
     * including when Kinde sends an empty description and :empty hides this. */
    margin: -1.5rem 0 2rem;
    font-size: ${scale.body};
    font-weight: 400;
    line-height: 1.5; /* guide: body 145-160% */
    color: ${brand.stratus};
  }

  .gph-card__description:empty { display: none; }

  /* -------------------------------------------------------------- footer -- */
  .gph-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--gph-gutter) 1.75rem;
    font-size: ${scale.micro};
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.82);
  }

  .gph-footer nav {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
  }

  .gph-footer a {
    color: inherit;
    text-decoration: none;
  }

  .gph-footer a:hover,
  .gph-footer a:focus-visible {
    color: ${brand.white};
    text-decoration: underline;
  }

  /* ------------------------------------------------- Kinde widget hooks --
   * Style hooks are Kinde's stable external styling API; class names are
   * internal and must not be targeted. Anything not covered here falls back to
   * the :root settings above.
   */
  /*
   * Placeholder ink. Kinde ships no setting for ::placeholder, so this is one of
   * the few things that genuinely needs a hook.
   */
  [data-kinde-control-select-text]::placeholder {
    color: ${brand.duskTint30};
  }

  /*
   * The required-field marker, Horizon per the Figma frame. Kinde ships neither
   * a setting nor a documented hook for it, so this leans on the generic markup
   * inside the label — confirm against the live widget in DevTools.
   *
   * Horizon on white is 2.95:1, which fails WCAG AA. Deliberate for now; swap to
   * var(--gph-horizon-accessible) (4.88:1) when accessibility is picked up.
   */
  [data-kinde-control-label] abbr,
  [data-kinde-control-label] span {
    color: ${brand.horizon};
    text-decoration: none;
  }

  /*
   * No rule for the Kinde attribution on purpose. It is part of the widget
   * layout (.kinde-layout-widget-branding), so getKindeWidget() renders it
   * inside the white .gph-card, not on the dark page. Kinde paints the mark with
   * currentColor defaulting to #000, which is already correct there. The starter
   * this repo came from forced it white because its widget sat on a dark
   * background; carrying that over made the logo invisible against the card.
   * It is also a trademark, so it does not get recoloured to a brand colour.
   */

  /* ------------------------------------------------ social sign-in --
   * Google and any other social connection are rendered by Kinde inside
   * getKindeWidget(); they are switched on in the Kinde dashboard under
   * Authentication, not added here. This repo only styles them.
   *
   * Kinde emits them as secondary buttons in a grid, with a "choice separator"
   * ("or") between the social block and the email form. Secondary is the right
   * variant on a white card: Dusk text and a tint border, so the primary Dusk
   * Sign in button stays the single strongest thing in the card, per the guide's
   * 60/30/10 emphasis.
   */
  [data-kinde-layout-auth-buttons] {
    gap: 0.75rem;
  }

  [data-kinde-button-variant=secondary] {
    font-weight: 600;
  }

  [data-kinde-button-variant=secondary]:hover {
    border-color: ${brand.dawn};
  }

  /*
   * Provider icons are supplied by Kinde and are trademarked marks — Google's
   * brand terms require their own mark, unmodified. Size it, never restyle it.
   */
  [data-kinde-button] svg,
  [data-kinde-button] img {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    flex: none;
  }

  [data-kinde-choice-separator] {
    color: ${brand.stratus};
    font-size: ${scale.micro};
    /* margin-block rather than margin so it does not fight an RTL/vertical
     * writing mode, and so it collapses predictably against Kinde's own spacing. */
    margin-block: 1rem;
  }

  /*
   * Login only: the Figma frame puts "Forgot password?" and the Sign in button
   * on one row, link left, button right. Kinde's button group stacks in a column
   * by default, which is the right default for register and MFA — so this is
   * scoped to the login page rather than applied globally.
   *
   * Positioning uses order + auto margin rather than a fixed flex-direction, so
   * it does not depend on the order Kinde emits the children in, and the button
   * still sits right if the link is absent (registrations disabled, say).
   *
   * UNVERIFIED: this assumes Kinde puts the forgot-password link inside the
   * button group. Confirm on a real Kinde preview; if the link renders outside
   * the group, this rule is harmless but achieves nothing.
   */
  .gph-page--login [data-kinde-layout-button-group] {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.5rem;
  }

  .gph-page--login [data-kinde-layout-button-group] [data-kinde-button] {
    order: 1;
    margin-inline-start: auto;
    /*
     * inline-size:auto without the clamp lets Kinde's white-space:nowrap grow
     * the button past the card — a long localised label ("Anmeldung fortsetzen
     * und Konto bestatigen") overflowed a 375px viewport. max-inline-size
     * restores the constraint Kinde's own .kinde-button-is-content-width pairs
     * with auto, so the label ellipsises instead.
     */
    inline-size: auto;
    max-inline-size: 100%;
  }

  /* The trailing arrow on the link, as drawn in the Figma frame. Decorative, so
   * it is a pseudo-element rather than link text a screen reader would announce.
   *
   * An SVG rather than content: "\\2192" because a quoted CSS string does not
   * survive Kinde's HTML escaping. url(data:...) unquoted does. */
  .gph-page--login [data-kinde-layout-button-group] [data-kinde-text-link]::after {
    content: url(${arrowRight});
    display: inline-block;
    vertical-align: -0.125em;
    margin-inline-start: 0.5rem;
  }

  /* The arrow points away from the text, so it has to flip with the text.
   * root.tsx sets dir on <html> from request.locale.isRtl. */
  [dir=rtl] .gph-page--login [data-kinde-layout-button-group] [data-kinde-text-link]::after {
    content: url(${arrowLeft});
  }

  /* ------------------------------------------------------------- mobile -- */
  @media (max-width: 47.9375rem) {
    :root {
      --gph-gutter: 1.5rem;
      --gph-card-padding: 1.75rem;
    }

    .gph-header { padding-top: 1.75rem; }
    .gph-header img { width: 10.25rem; }
    .gph-main { padding: 2rem 1.5rem; }
    .gph-card { border-radius: 0.5rem; }
    .gph-card__heading { font-size: 1.625rem; }
    .gph-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .gph-footer nav { gap: 1.25rem; }
  }

  /* gph-end-of-stylesheet — the truncation canary in scripts/verify.tsx asserts
   * this marker survives. Keep it last. A stray backtick in a comment above will
   * terminate the template literal and drop everything after it. */
`;
