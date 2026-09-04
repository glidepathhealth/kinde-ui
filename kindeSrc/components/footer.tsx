"use server";
import React from "react";

/**
 * Footer links as they appear in the Figma login frame.
 *
 * TODO: confirm these URLs. glidepathhealth.com is still a placeholder site, so
 * the paths below are assumed, not verified.
 */
const links = [
  { label: "Terms and Conditions", href: "https://glidepathhealth.com/terms" },
  { label: "Privacy Policy", href: "https://glidepathhealth.com/privacy" },
  { label: "Security", href: "https://glidepathhealth.com/security" },
] as const;

export const Footer = () => {
  return (
    <footer className="gph-footer">
      <span>
        &copy; {new Date().getFullYear()} Glidepath Health. All rights reserved.
      </span>
      <nav>
        {links.map(({ label, href }) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
};
