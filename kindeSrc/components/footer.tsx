"use server";
import React from "react";

export const Footer = () => {
  return (
    <footer className="gph-footer">
      <span>
        &copy; {new Date().getFullYear()} Glidepath Health. All rights reserved.
      </span>
    </footer>
  );
};
