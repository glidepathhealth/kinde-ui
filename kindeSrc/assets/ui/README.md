# ui/

Interface glyphs this repo draws itself. Not brand assets — the brand kit lives
in `../brand/` and its logo and Glide Path pattern must never be redrawn.

`arrow-right.svg` / `arrow-left.svg` are the trailing arrow on the
forgot-password link in the Figma login frame. They exist as files, rather than
as a `content: "→"` string, because Kinde HTML-escapes the stylesheet: a quoted
CSS string is destroyed in transit, while an unquoted `url(data:…)` survives.
`arrow-left` is the right-to-left mirror.

They are stroked in Dusk `#18206C` to match the link colour. A CSS-embedded SVG
cannot inherit `currentColor`, so if the link colour changes these change too.
