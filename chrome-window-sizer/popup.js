'use strict';

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 700;
const MAX_NAME_LENGTH = 48;

const form = document.getElementById('window-form');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const openButton = document.getElementById('open-window');
const saveButton = document.getElementById('save-preset');
const captureButton = document.getElementById('use-current-window');
const status = document.getElementById('status');
const presetList = document.getElementById('preset-list');
const emptyPresets = document.getElementById('empty-presets');

const saveDialog = document.getElementById('save-dialog');
const saveForm = document.getElementById('save-form');
const presetNameInput = document.getElementById('preset-name');
const saveDescription = document.getElementById('save-description');
const saveError = document.getElementById('save-error');
const confirmSave = document.getElementById('confirm-save');

const deleteDialog = document.getElementById('delete-dialog');
const deleteDescription = document.getElementById('delete-description');
const deleteError = document.getElementById('delete-error');
const confirmDelete = document.getElementById('confirm-delete');

let presets = [];
let pendingOverwrite = null;
let pendingDelete = null;

function validDimensions(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) &&
    width >= 1 && height >= 1 && width <= 10000 && height <= 10000;
}

function enteredDimensions() {
  const width = Number(widthInput.value);
  const height = Number(heightInput.value);
  if (!widthInput.value || !heightInput.value || !validDimensions(width, height)) {
    showStatus('Enter a valid whole-number width and height.');
    return null;
  }
  return { width, height };
}

function showStatus(message, success = false) {
  status.textContent = message;
  status.classList.toggle('success', success);
}

function findPreset(name) {
  return presets.find(preset => preset.name.toLocaleLowerCase() === name.toLocaleLowerCase());
}

function renderPresets() {
  presetList.replaceChildren();
  emptyPresets.hidden = presets.length > 0;

  for (const preset of presets) {
    const row = document.createElement('div');
    row.className = 'preset-row';

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'preset-open';
    open.title = `Open ${preset.name} (${preset.width} × ${preset.height})`;

    const name = document.createElement('span');
    name.className = 'preset-name';
    name.textContent = preset.name;

    const size = document.createElement('span');
    size.className = 'preset-size';
    size.textContent = `${preset.width} × ${preset.height}`;

    open.append(name, size);
    open.addEventListener('click', async () => {
      widthInput.value = preset.width;
      heightInput.value = preset.height;
      await openWindow(preset.width, preset.height, open);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preset-delete';
    remove.textContent = '×';
    remove.title = `Delete ${preset.name}`;
    remove.setAttribute('aria-label', `Delete ${preset.name}`);
    remove.addEventListener('click', () => {
      pendingDelete = preset.name;
      deleteDescription.textContent = `Remove “${preset.name}” (${preset.width} × ${preset.height})?`;
      deleteError.textContent = '';
      deleteDialog.showModal();
    });

    row.append(open, remove);
    presetList.append(row);
  }
}

async function loadSettings() {
  saveButton.disabled = true;
  try {
    // The original width/height keys remain unchanged for seamless upgrades.
    const saved = await chrome.storage.local.get({
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      presets: []
    });

    const width = Number(saved.width);
    const height = Number(saved.height);
    widthInput.value = validDimensions(width, height) ? width : DEFAULT_WIDTH;
    heightInput.value = validDimensions(width, height) ? height : DEFAULT_HEIGHT;

    const seen = new Set();
    presets = (Array.isArray(saved.presets) ? saved.presets : []).filter(preset => {
      if (!preset || typeof preset.name !== 'string' ||
          !preset.name.trim() || preset.name.length > MAX_NAME_LENGTH ||
          !validDimensions(preset.width, preset.height)) {
        return false;
      }
      const key = preset.name.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    renderPresets();
  } catch (error) {
    widthInput.value = DEFAULT_WIDTH;
    heightInput.value = DEFAULT_HEIGHT;
    showStatus('Could not load saved settings.');
    console.warn('Could not load settings:', error);
  } finally {
    saveButton.disabled = false;
  }
}

async function openWindow(width, height, button) {
  if (!validDimensions(width, height)) {
    showStatus('Enter a valid whole-number width and height.');
    return;
  }

  showStatus('');
  button.disabled = true;
  try {
    // Save before opening: the popup closes when the new window gets focus.
    try {
      await chrome.storage.local.set({ width, height });
    } catch (error) {
      console.warn('Could not remember last dimensions:', error);
    }

    const created = await chrome.windows.create({
      type: 'normal',
      state: 'normal',
      focused: true,
      width,
      height
    });
    if (!created) throw new Error('Chrome did not create the window.');
    window.close();
  } catch (error) {
    showStatus(`Could not open the window: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

captureButton.addEventListener('click', async () => {
  captureButton.disabled = true;
  showStatus('');
  try {
    // The extension popup belongs to the Chrome window it was opened from.
    // Query the browser window, not the popup document's own outerWidth/outerHeight.
    const current = await chrome.windows.getCurrent({ windowTypes: ['normal'] });
    if (!current || !validDimensions(current.width, current.height)) {
      throw new Error('Chrome did not provide valid window dimensions.');
    }
    widthInput.value = current.width;
    heightInput.value = current.height;
    showStatus(`Loaded current window: ${current.width} × ${current.height}.`, true);
  } catch (error) {
    showStatus(`Could not read the current window size: ${error.message}`);
  } finally {
    captureButton.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dimensions = enteredDimensions();
  if (dimensions) await openWindow(dimensions.width, dimensions.height, openButton);
});

saveButton.addEventListener('click', () => {
  const dimensions = enteredDimensions();
  if (!dimensions) return;

  saveDescription.textContent = `${dimensions.width} × ${dimensions.height} pixels`;
  presetNameInput.value = '';
  saveError.textContent = '';
  confirmSave.textContent = 'Save';
  pendingOverwrite = null;
  saveDialog.showModal();
  presetNameInput.focus();
});

presetNameInput.addEventListener('input', () => {
  pendingOverwrite = null;
  confirmSave.textContent = 'Save';
  saveError.textContent = '';
});

saveForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = presetNameInput.value.trim();
  const dimensions = enteredDimensions();
  if (!dimensions || !name || name.length > MAX_NAME_LENGTH) {
    saveError.textContent = 'Enter a name (up to 48 characters) and valid dimensions.';
    return;
  }

  const existing = findPreset(name);
  if (existing && pendingOverwrite !== existing.name) {
    pendingOverwrite = existing.name;
    confirmSave.textContent = 'Replace preset';
    saveError.textContent = `“${existing.name}” already exists. Click Replace preset to update it.`;
    return;
  }

  const updated = existing
    ? presets.map(preset => preset === existing ? { name: existing.name, ...dimensions } : preset)
    : [...presets, { name, ...dimensions }];

  confirmSave.disabled = true;
  try {
    await chrome.storage.local.set({ presets: updated });
    presets = updated;
    renderPresets();
    saveDialog.close();
    showStatus(existing ? `Updated “${existing.name}”.` : `Saved “${name}”.`, true);
  } catch (error) {
    saveError.textContent = `Could not save preset: ${error.message}`;
  } finally {
    confirmSave.disabled = false;
  }
});

document.getElementById('cancel-save').addEventListener('click', () => saveDialog.close());
document.getElementById('cancel-delete').addEventListener('click', () => deleteDialog.close());

deleteDialog.addEventListener('close', () => { pendingDelete = null; });
saveDialog.addEventListener('close', () => { pendingOverwrite = null; });

confirmDelete.addEventListener('click', async () => {
  if (!pendingDelete) return;
  const name = pendingDelete;
  const updated = presets.filter(preset => preset.name !== name);
  confirmDelete.disabled = true;
  try {
    await chrome.storage.local.set({ presets: updated });
    presets = updated;
    renderPresets();
    deleteDialog.close();
    showStatus(`Deleted “${name}”.`, true);
  } catch (error) {
    deleteError.textContent = `Could not delete preset: ${error.message}`;
  } finally {
    confirmDelete.disabled = false;
  }
});

loadSettings();
