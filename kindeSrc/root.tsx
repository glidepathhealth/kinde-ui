"use server";

import {
  getKindeCSRF,
  getKindeRequiredCSS,
  getKindeRequiredJS,
  getSVGFaviconUrl,
  type KindePageEvent,
} from "@kinde/infrastructure";
import React from "react";
import { FONT_HOST, getStyles } from "./styles/styles";
interface RootProps extends KindePageEvent {
  children: React.ReactNode;
}

export const Root = ({
  children,
  context,
  request,
}: RootProps): React.JSX.Element => {
  return (
    <html dir={request.locale.isRtl ? "rtl" : "ltr"} lang={request.locale.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <meta content="noindex" name="robots" />
        <meta content={getKindeCSRF()} name="csrf-token" />
        <meta content="light" name="color-scheme" />
        <meta content="nopagereadaloud" name="google" />
        <title>{context.widget.content.page_title}</title>

        <link href={getSVGFaviconUrl()} rel="icon" type="image/svg+xml" />
        {/*
          * The font lives on another origin and is only discovered once the
          * inline stylesheet parses, so its first byte waits on a cold DNS +
          * TCP + TLS handshake. preconnect overlaps that with HTML parse.
          * Not preload: that would force the latin-ext subset on every user,
          * which unicode-range otherwise avoids. crossOrigin is required —
          * font fetches are CORS requests, and without it this warms the
          * wrong connection and the font fetches twice.
          */}
        <link crossOrigin="anonymous" href={FONT_HOST} rel="preconnect" />
        {getKindeRequiredCSS()}
        {getKindeRequiredJS()}
        {/*
          * dangerouslySetInnerHTML, not a text child: it is the correct way to
          * inline CSS in React and keeps the stylesheet out of any escaping
          * path. Kinde escapes the served HTML regardless, which is why
          * styles.ts is written without a single quote character.
          */}
        <style dangerouslySetInnerHTML={{ __html: getStyles() }} />
      </head>

      <body>
        <div data-kinde-root="true">{children}</div>
      </body>
    </html>
  );
};
