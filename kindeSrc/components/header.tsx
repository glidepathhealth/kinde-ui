"use server";
import React from "react";

import { logoHorizontalInverse } from "../assets/brand-assets";

/**
 * The horizontal primary logo, inverse variant — orange icon, white wordmark,
 * which is the pairing the brand guide specifies for dark backgrounds.
 *
 * The artwork is the official SVG inlined as a data URI. The brand guide is
 * explicit that the logo is only ever composited from the official files, never
 * redrawn, and Kinde does not host static assets, so this is the way to get the
 * real file onto the page.
 */
export const Header = ({ logoAlt }: { logoAlt: string }) => {
  return (
    <header className="gph-header">
      <img alt={logoAlt} src={logoHorizontalInverse} />
    </header>
  );
};
