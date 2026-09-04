"use server";

import { getKindeWidget } from "@kinde/infrastructure";
import React from "react";

/**
 * The white card. Heading and description strings come from Kinde
 * (`context.widget.content`) and are edited in the Kinde dashboard under
 * Design > Content, not here — so casing is set there, not in code.
 *
 * `getKindeWidget()` renders the form itself. It is styled through the style
 * hooks in styles.ts rather than from this component.
 */
export const Widget = (props: { heading: string; description: string }) => {
  return (
    <div className="gph-card">
      <h1 className="gph-card__heading">{props.heading}</h1>
      <p className="gph-card__description">{props.description}</p>
      {getKindeWidget()}
    </div>
  );
};
