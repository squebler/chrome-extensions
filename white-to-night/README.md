# White to Night

A small Chrome Manifest V3 extension that applies a charcoal-colored theme to
the Google Docs document editor. It injects a CSS stylesheet when you click its
toolbar button; it does not modify the document itself.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `white-to-night` folder containing `manifest.json`.
5. Optionally pin **White to Night** from the Extensions menu.

## Use

1. Open a Google Docs **document** (not the Docs home page).
2. Click the **White to Night** toolbar button to apply the dark styling.
3. Reload the document page to restore its original appearance.

## Limitations

- Only Google Docs document pages (`docs.google.com/document/...`) are supported.
  The Google Docs home page is not supported.
- The theme is applied on demand; it is not automatically applied when you open
  a document or reload the page.
- The styles depend on Google Docs' internal CSS. Changes to Google Docs may
  cause parts of the theme to stop working or look incorrect.
- Clicking the button again is not a toggle; reload the page to remove the theme.

## Files

- `manifest.json` — extension metadata and permissions.
- `content.js` — handles the toolbar click and injects the stylesheet.
- `styles.css` — dark-theme styling for Google Docs.

No build step or external dependencies.
