import React from "react";

import { Footer } from "../components/footer";
import { Header } from "../components/header";

type LayoutProps = {
  children: React.ReactNode;
  logoAlt: string;
  /**
   * Adds a `gph-page--{variant}` class so a single flow can adjust widget layout
   * without that change leaking into every other auth page. Only "login" uses
   * this today, to put the submit button and the forgot-password link on one row.
   */
  variant?: string;
};

/**
 * Header / content / footer over the brand gradient. The gradient and the Glide
 * Path line pattern are applied in styles.ts via `.gph-page`.
 */
export const DefaultLayout: React.FC<LayoutProps> = ({
  children,
  logoAlt,
  variant,
}) => {
  return (
    <div className={variant ? `gph-page gph-page--${variant}` : "gph-page"}>
      {/*
       * The Glide Path pattern is a real element rather than a ::before, because
       * a pseudo-element needs `content: ""` and Kinde HTML-escapes the
       * stylesheet — the escaped quotes made that declaration invalid and the
       * whole layer silently vanished.
       */}
      <div className="gph-page__pattern" aria-hidden="true" />
      <Header logoAlt={logoAlt} />
      <main className="gph-main">{children}</main>
      <Footer />
    </div>
  );
};
