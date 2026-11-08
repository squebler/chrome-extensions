# Window Sizer

A small Chrome Manifest V3 extension that opens a new Chrome window
at a width and height you specify. Save your favorite window sizes under names
such as **ChatGPT** or **Default**, then click a preset to open its window.

## Install locally (Windows / Chrome)

1. In Chrome, open `chrome://extensions`.
2. Turn on **Developer mode** (upper-right).
3. Click **Load unpacked**.
4. Choose the `chrome-window-sizer` folder containing `manifest.json`.
5. Pin **Window Sizer** from the extensions (puzzle-piece) menu if desired.

### Updating an existing installation

Replace the contents of your previously loaded `chrome-window-sizer` folder
with the new files. Then open `chrome://extensions` and click the **Reload**
button on Window Sizer. Your saved dimensions are retained; presets are kept in
Chrome extension storage (not the folder).

## Use

- Enter **Width** and **Height** (pixels), then click **Open window** (or press
  Enter). The most recently opened size is remembered automatically.
- Click **Use current window** to populate Width and Height with the dimensions
  of the Chrome window from which you opened the extension. Then click
  **Save…** to name and store that size. This also works with maximized windows,
  though Chrome may constrain the size of any newly created window.
- To save dimensions manually, click **Save…**, enter a name, and click **Save**.
- Click a name in **Saved sizes** to open a new window at that preset's size.
- Click the **×** next to a preset to delete it (with confirmation).
- To change a preset, enter the new dimensions, click **Save…**, enter the
  existing preset name, and confirm **Replace preset**.

Presets and the last used dimensions are saved using `chrome.storage.local` and
persist across Chrome restarts. Existing installations retain their last used
width and height when upgraded.

Chrome's width and height refer to the **whole window, including title bar,
tabs, and borders**, not the webpage's inner viewport. Chrome or the OS may
clamp requested sizes to minimums or the available display area.

## Files

- `manifest.json` - extension metadata and storage permission
- `popup.html` / `popup.css` - interface, automatically follows light/dark mode
- `popup.js` - reads current window dimensions, opens windows, and manages named presets
- `icons/` - toolbar icons

No build process, external dependencies, host permissions, or network calls.
