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

**Priority:** P2

The brand guide's primary typeface is Area, licensed through Adobe Fonts and
not redistributable, so it cannot live in this repo. Figtree renders today.
Area already leads the font stack, so adding an Adobe Fonts web project and its
stylesheet URL upgrades every page with no code change.

### Self-host the Figtree webfont

**Priority:** P3

`styles.ts` loads Figtree from `fonts.gstatic.com`. Kinde does not host static
assets and recommends serving them from a host that shares the auth domain.
Move it to `assets.glidepathhealth.com` when that exists.

### Replace the Kinde favicon with the brand icon

**Priority:** P3

`root.tsx` still uses `getSVGFaviconUrl()`, Kinde's favicon. The brand guide
designates the secondary boxed-icon logo for favicon and platform identity;
the file is in the brand kit but not yet wired up.

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
