# kinde-settings.txt

Every `--kinde-*` custom property Kinde's shipped widget stylesheet defines, one
per line. It is a derived list of names only, not Kinde's CSS.

`scripts/verify.tsx` checks every setting used in `kindeSrc/styles/styles.ts`
against this list. A typo'd or invented setting name is silent at build time and
silent in the browser: the page just renders unstyled in that one spot. This
catches it.

Regenerate when Kinde ships new settings:

```sh
curl -s https://<your-kinde-domain>/dist/end_user_ui/assets/css/style.css \
  | grep -oE -- '--kinde-[a-z0-9-]+' | sort -u > scripts/kinde-settings.txt
```
