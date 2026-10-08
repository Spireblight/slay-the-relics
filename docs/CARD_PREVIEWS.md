# Embedded card previews

Every card PNG in `assets/sts1/card-images` and `assets/sts2/card-images` gets a
small transparent WebP preview, encoded as a base64 data URL and bundled directly
into the extension's JavaScript. Once the extension has loaded, opening a deck
requires **no preview image requests**. Mounted decks decode their previews ahead
of time; visible cards replace them with the original GitHub PNG only after it
has downloaded and decoded. Failed originals leave the preview visible. Cards
added after an extension release fall back to the original URL until a rebuild.

Run the following commands from `slay-the-relics-extension/`.

`yarn dev`, `yarn build`, `yarn test`, and `yarn lint` regenerate the manifest
automatically.
Run `yarn generate:card-previews` to regenerate it manually (also do this before
running TypeScript directly on a fresh checkout). Add or replace the source PNGs
as usual, then rebuild. `src/generated/card-previews.json` is gitignored; the
production bundle in `dist` and `build.zip` contains the data. Use `yarn build`
instead of `vite build` directly so generation is not skipped.

Previews preserve aspect ratio and transparency, with a maximum width of 96 px,
WebP quality 35, and alpha quality 60. This trades a larger initial extension
bundle for immediate previews on deck clicks. Sharp requires Node.js 20.9+;
Vitest also requires a supported Node.js version.

`yarn test` covers caching, visibility, card/upgrade changes, and failures. For a
manual check, delay or block GitHub card PNG requests in browser devtools: decks
should still display embedded previews, then switch to originals when unblocked.
Check both games, enlarged cards, and upgrade toggles. Twitch's [image content
security policy](https://dev.twitch.tv/docs/extensions/#restrictions-on-content)
allows `data:` images.
