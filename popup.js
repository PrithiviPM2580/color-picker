// popup.js — ColorPick Pro
'use strict';

// ═══════════════════════════════════════════════════
// COLOR CONVERTER — all math, no external libraries
// ═══════════════════════════════════════════════════
const ColorConverter = {

  toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  },

  toRgb(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
  },

  toRgbNorm(r, g, b) {
    return `rgb(${(r / 255).toFixed(4)}, ${(g / 255).toFixed(4)}, ${(b / 255).toFixed(4)})`;
  },

  _rgbToHslVals(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  toHsl(r, g, b) {
    const { h, s, l } = this._rgbToHslVals(r, g, b);
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  },

  hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    };
    return { r: f(0), g: f(8), b: f(4) };
  },

  hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  },

  // sRGB → Linear sRGB
  _linearize(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  },

  // Full OKLCH pipeline: sRGB → Linear → XYZ D65 → OKLab → OKLCH
  toOklch(r, g, b) {
    const rl = this._linearize(r), gl = this._linearize(g), bl = this._linearize(b);

    // Linear sRGB → XYZ D65
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

    // XYZ → LMS (Oklab M1 matrix)
    const lm =  0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
    const mm =  0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
    const sm =  0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z;

    // Cube root
    const cbrt = v => Math.sign(v) * Math.pow(Math.abs(v), 1 / 3);
    const l_ = cbrt(lm), m_ = cbrt(mm), s_ = cbrt(sm);

    // LMS → OKLab (M2 matrix)
    const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const bk =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    // OKLab → OKLCH
    const C = Math.sqrt(a * a + bk * bk);
    let H = Math.atan2(bk, a) * (180 / Math.PI);
    if (H < 0) H += 360;

    return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${H.toFixed(2)})`;
  },

  toOklchValues(r, g, b) {
    const rl = this._linearize(r), gl = this._linearize(g), bl = this._linearize(b);
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
    const lm = 0.8189330101*X + 0.3618667424*Y - 0.1288597137*Z;
    const mm = 0.0329845436*X + 0.9293118715*Y + 0.0361456387*Z;
    const sm = 0.0482003018*X + 0.2643662691*Y + 0.6338517070*Z;
    const cbrt = v => Math.sign(v) * Math.pow(Math.abs(v), 1/3);
    const l_ = cbrt(lm), m_ = cbrt(mm), s_ = cbrt(sm);
    const L  = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
    const a  = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
    const bk = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
    const C = Math.sqrt(a * a + bk * bk);
    let H = Math.atan2(bk, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    return { l: L * 100, c: C, h: H };
  }
};

// ═══════════════════════════════════════════════════
// WCAG CONTRAST CHECKER
// ═══════════════════════════════════════════════════
const WCAGChecker = {
  _luminance(r, g, b) {
    const lin = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  },

  ratio(c1, c2) {
    const l1 = this._luminance(c1.r, c1.g, c1.b);
    const l2 = this._luminance(c2.r, c2.g, c2.b);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  evaluate(ratio) {
    return {
      aa:     ratio >= 4.5,
      aaa:    ratio >= 7.0,
      aaLg:   ratio >= 3.0,
      aaaLg:  ratio >= 4.5
    };
  }
};

// ═══════════════════════════════════════════════════
// THEME GENERATOR
// ═══════════════════════════════════════════════════
const ThemeGenerator = {
  _mix(c, target, t) {
    return {
      r: Math.round(c.r + (target - c.r) * t),
      g: Math.round(c.g + (target - c.g) * t),
      b: Math.round(c.b + (target - c.b) * t)
    };
  },

  generate(r, g, b) {
    const base = { r, g, b };
    const { h, s, l } = ColorConverter._rgbToHslVals(r, g, b);

    // Tints: mix toward white
    const tints = [0.15, 0.35, 0.55, 0.72, 0.87].map(t =>
      this._mix(base, 255, t)
    );

    // Shades: mix toward black
    const shades = [0.85, 0.65, 0.45, 0.28, 0.13].map(t =>
      this._mix(base, 0, 1 - t)
    );

    // Harmonies via HSL
    const harmony = (dh) => ColorConverter.hslToRgb(((h + dh) % 360 + 360) % 360, s, l);

    return {
      base,
      tints,
      shades,
      complementary: [harmony(180)],
      triadic:        [harmony(120), harmony(240)],
      analogous:      [harmony(-30), harmony(30), harmony(60)],
      splitComp:      [harmony(150), harmony(210)]
    };
  },

  toCssVars(palette, name = 'color') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    const lines = [':root {', `  --${name}: ${hex(palette.base)};`];
    palette.tints.forEach((c, i) =>  lines.push(`  --${name}-${100 + i * 100}: ${hex(c)};`));
    // Insert base at 500
    lines.splice(7, 0, `  --${name}-500: ${hex(palette.base)};`);
    palette.shades.forEach((c, i) => lines.push(`  --${name}-${600 + i * 100}: ${hex(c)};`));
    palette.complementary.forEach(c => lines.push(`  --${name}-complementary: ${hex(c)};`));
    palette.triadic.forEach((c, i) => lines.push(`  --${name}-triadic-${i + 1}: ${hex(c)};`));
    palette.analogous.forEach((c, i) => lines.push(`  --${name}-analogous-${i + 1}: ${hex(c)};`));
    lines.push('}');
    return lines.join('\n');
  },

  toTailwindConfig(palette, name = 'brand') {
    const hex = c => ColorConverter.toHex(c.r, c.g, c.b);
    const entries = [
      `  ${name}: {`,
      ...palette.tints.map((c, i) => `    '${(i + 1) * 100}': '${hex(c)}',`),
      `    '500': '${hex(palette.base)}',`,
      ...palette.shades.map((c, i) => `    '${600 + i * 100}': '${hex(c)}',`),
      '  }'
    ];
    return `// tailwind.config.js → theme.extend.colors\n{\n${entries.join('\n')}\n}`;
  }
};

// ═══════════════════════════════════════════════════
// EXPORT MANAGER
// ═══════════════════════════════════════════════════
const ExportManager = {
  blocks(r, g, b) {
    const hex    = ColorConverter.toHex(r, g, b);
    const rgb    = ColorConverter.toRgb(r, g, b);
    const hsl    = ColorConverter.toHsl(r, g, b);
    const oklch  = ColorConverter.toOklch(r, g, b);

    return [
      {
        title: 'CSS Variable',
        content: `--color-primary: ${hex};\n--color-primary-rgb: ${r}, ${g}, ${b};\n--color-primary-hsl: ${hsl};`
      },
      {
        title: 'OKLCH (CSS Color Level 4)',
        content: `color: ${oklch};\n/* Background use */\nbackground-color: ${oklch};`
      },
      {
        title: 'Tailwind',
        content: `// tailwind.config.js\nprimary: {\n  DEFAULT: '${hex}',\n}`
      },
      {
        title: 'All Formats',
        content: `${hex}\n${rgb}\n${hsl}\n${oklch}`
      }
    ];
  },

  allText(r, g, b) {
    const hex   = ColorConverter.toHex(r, g, b);
    const rgb   = ColorConverter.toRgb(r, g, b);
    const norm  = ColorConverter.toRgbNorm(r, g, b);
    const hsl   = ColorConverter.toHsl(r, g, b);
    const oklch = ColorConverter.toOklch(r, g, b);
    return `/* ColorPick Pro — Exported Color */
/* ${hex} */

:root {
  --color-primary: ${hex};
  --color-primary-rgb: ${r}, ${g}, ${b};
  --color-primary-normalized: ${norm};
  --color-primary-hsl: ${hsl};
  --color-primary-oklch: ${oklch};
}

.element {
  color: ${hex};
  color: ${rgb};
  color: ${hsl};
  color: ${oklch};
}`;
  }
};

// ═══════════════════════════════════════════════════
// APP STATE + DOM REFS
// ═══════════════════════════════════════════════════
let currentColor = { r: 139, g: 92, b: 246 };
let colorHistory = [];
let themePalette = null;
let isDarkMode   = true;

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════
// THEME (LIGHT / DARK)
// ═══════════════════════════════════════════════════
function applyTheme(dark) {
  isDarkMode = dark;
  document.documentElement.classList.toggle('light', !dark);
}

function toggleTheme() {
  applyTheme(!isDarkMode);
  chrome.storage.local.set({ uiTheme: isDarkMode ? 'dark' : 'light' });
}

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Load persisted data
  const data = await chrome.storage.local.get(['pendingColor', 'colorHistory', 'uiTheme']);

  // Apply saved theme (default: dark)
  applyTheme(data.uiTheme !== 'light');

  if (data.pendingColor) {
    currentColor = data.pendingColor;
    // Clear badge and pending after reading
    chrome.storage.local.remove('pendingColor');
    chrome.action.setBadgeText({ text: '' }).catch(() => {});
  }

  colorHistory = data.colorHistory || [];

  // Initial renders
  updateColorDisplay(currentColor);
  renderHistory();
  initWcag();
  initTheme();
  renderExport();

  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Theme toggle
  $('btnThemeToggle').addEventListener('click', toggleTheme);

  // Pick button
  $('btnPick').addEventListener('click', startPicking);

  // Copy buttons (format rows)
  document.querySelectorAll('.btn-copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = $(btn.dataset.copy);
      if (el) copyText(el.textContent.trim(), btn);
    });
  });

  // History clear
  $('btnClearHistory').addEventListener('click', clearHistory);

  // WCAG controls
  $('fgColor').addEventListener('input', e => syncColorField('fg', e.target.value));
  $('bgColor').addEventListener('input', e => syncColorField('bg', e.target.value));
  $('fgHex').addEventListener('input',  e => syncHexField('fg', e.target.value));
  $('bgHex').addEventListener('input',  e => syncHexField('bg', e.target.value));
  $('btnSwapColors').addEventListener('click', swapContrastColors);

  // Theme generator
  $('themeBase').addEventListener('input',    e => syncThemeField('base', e.target.value));
  $('themeBaseHex').addEventListener('input', e => syncThemeHexField(e.target.value));
  $('btnGenTheme').addEventListener('click',  generateTheme);
  $('btnCopyTheme').addEventListener('click', copyThemeCss);
  $('btnCopyTailwind').addEventListener('click', copyThemeTailwind);

  // Export
  $('btnCopyAllExport').addEventListener('click', copyAllExport);
  $('btnDownloadCss').addEventListener('click', downloadCss);

  // Listen for new picks while popup is open
  chrome.storage.onChanged.addListener(onStorageChange);
});

// ═══════════════════════════════════════════════════
// COLOR DISPLAY
// ═══════════════════════════════════════════════════
function updateColorDisplay({ r, g, b }) {
  const hex    = ColorConverter.toHex(r, g, b);
  const rgb    = ColorConverter.toRgb(r, g, b);
  const norm   = ColorConverter.toRgbNorm(r, g, b);
  const hsl    = ColorConverter.toHsl(r, g, b);
  const oklch  = ColorConverter.toOklch(r, g, b);

  $('colorSwatch').style.background = hex;
  $('hexLarge').textContent  = hex.toUpperCase();
  $('rgbSmall').textContent  = rgb;
  $('valHex').textContent    = hex.toUpperCase();
  $('valRgb').textContent    = rgb;
  $('valNorm').textContent   = norm;
  $('valHsl').textContent    = hsl;
  $('valOklch').textContent  = oklch;

  // Auto-fill WCAG foreground
  $('fgColor').value = hex;
  $('fgHex').value   = hex;
  updateContrast();

  // Auto-fill theme base
  $('themeBase').value    = hex;
  $('themeBaseHex').value = hex;

  renderExport();
}

// ═══════════════════════════════════════════════════
// PICK COLOR
// ═══════════════════════════════════════════════════
async function startPicking() {
  const btn = $('btnPick');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Starting…`;

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id) {
      showToast('No active tab found', 'error');
      return;
    }
    if (/^(chrome|about|chrome-extension|edge|brave):/.test(tab.url || '')) {
      showToast('Cannot pick colors from browser pages', 'error');
      return;
    }

    // Wait for background to confirm it successfully injected + started the overlay
    const response = await chrome.runtime.sendMessage({
      action: 'startPick', tabId: tab.id, windowId: tab.windowId
    });

    if (response?.success) {
      window.close(); // only close after overlay is confirmed active
    } else {
      showToast('Could not start picker: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (e) {
    // sendMessage throws if background SW is waking up — retry once
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id) {
        const resp = await chrome.runtime.sendMessage({
          action: 'startPick', tabId: tab.id, windowId: tab.windowId
        });
        if (resp?.success) { window.close(); return; }
      }
    } catch (_) {}
    showToast('Error: ' + e.message, 'error');
  } finally {
    // Restore button if we're still open (error path)
    if (document.body) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
}

// ═══════════════════════════════════════════════════
// COLOR HISTORY
// ═══════════════════════════════════════════════════
function renderHistory() {
  const grid = $('historyPalette');
  grid.innerHTML = '';

  if (!colorHistory.length) {
    grid.innerHTML = '<div class="history-empty">No colors picked yet</div>';
    return;
  }

  colorHistory.forEach(({ r, g, b }) => {
    const hex = ColorConverter.toHex(r, g, b);
    const swatch = document.createElement('div');
    swatch.className = 'history-swatch';
    swatch.style.background = hex;
    swatch.title = hex.toUpperCase();
    swatch.addEventListener('click', () => {
      currentColor = { r, g, b };
      updateColorDisplay(currentColor);
      switchTab('picker');
      showToast('Loaded ' + hex.toUpperCase(), 'success');
    });
    grid.appendChild(swatch);
  });
}

async function clearHistory() {
  colorHistory = [];
  await chrome.storage.local.remove('colorHistory');
  renderHistory();
  showToast('History cleared');
}

// ═══════════════════════════════════════════════════
// WCAG CONTRAST
// ═══════════════════════════════════════════════════
function initWcag() {
  const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
  $('fgColor').value = hex;
  $('fgHex').value   = hex;
  updateContrast();
}

function syncColorField(which, hex) {
  $(`${which}Hex`).value = hex;
  updateContrast();
}

function syncHexField(which, rawVal) {
  const clean = rawVal.startsWith('#') ? rawVal : '#' + rawVal;
  const rgb = ColorConverter.hexToRgb(clean);
  if (rgb) {
    $(`${which}Color`).value = clean;
    updateContrast();
  }
}

function swapContrastColors() {
  const fgHex = $('fgHex').value;
  const bgHex = $('bgHex').value;
  $('fgHex').value   = bgHex;
  $('fgColor').value = bgHex;
  $('bgHex').value   = fgHex;
  $('bgColor').value = fgHex;
  updateContrast();
}

function updateContrast() {
  const fgRgb = ColorConverter.hexToRgb($('fgColor').value);
  const bgRgb = ColorConverter.hexToRgb($('bgColor').value);
  if (!fgRgb || !bgRgb) return;

  const ratio = WCAGChecker.ratio(fgRgb, bgRgb);
  const ev    = WCAGChecker.evaluate(ratio);

  $('contrastRatio').textContent = ratio.toFixed(2) + ':1';

  // Preview
  const preview = $('contrastPreview');
  preview.style.background  = $('bgColor').value;
  $('previewText').style.color = $('fgColor').value;

  // Badges
  setBadge('badgeAA',    ev.aa,    'AA');
  setBadge('badgeAAA',   ev.aaa,   'AAA');
  setBadge('badgeAALg',  ev.aaLg,  'AA Lg');
  setBadge('badgeAAALg', ev.aaaLg, 'AAA Lg');
}

function setBadge(id, pass, label) {
  const el = $(id);
  el.textContent = label;
  el.classList.toggle('pass', pass);
}

// ═══════════════════════════════════════════════════
// THEME GENERATOR
// ═══════════════════════════════════════════════════
function initTheme() {
  const hex = ColorConverter.toHex(currentColor.r, currentColor.g, currentColor.b);
  $('themeBase').value    = hex;
  $('themeBaseHex').value = hex;
  generateTheme();
}

function syncThemeField(_, hex) {
  $('themeBaseHex').value = hex;
  generateTheme();
}

function syncThemeHexField(rawVal) {
  const clean = rawVal.startsWith('#') ? rawVal : '#' + rawVal;
  const rgb = ColorConverter.hexToRgb(clean);
  if (rgb) {
    $('themeBase').value = clean;
    generateTheme();
  }
}

function generateTheme() {
  const rgb = ColorConverter.hexToRgb($('themeBase').value);
  if (!rgb) return;

  themePalette = ThemeGenerator.generate(rgb.r, rgb.g, rgb.b);
  renderThemePalette(themePalette);
  $('themeActions').style.display = 'flex';
}

function renderThemePalette(palette) {
  const container = $('themePalette');
  container.innerHTML = '';

  const rows = [
    { label: 'Tints',            colors: palette.tints },
    { label: 'Base',             colors: [palette.base] },
    { label: 'Shades',           colors: palette.shades },
    { label: 'Complementary',    colors: palette.complementary },
    { label: 'Triadic',          colors: palette.triadic },
    { label: 'Analogous',        colors: palette.analogous },
    { label: 'Split Comp.',      colors: palette.splitComp }
  ];

  rows.forEach(({ label, colors }) => {
    const row = document.createElement('div');
    row.className = 'palette-row';

    const lbl = document.createElement('div');
    lbl.className = 'palette-row-label';
    lbl.textContent = label;

    const swatches = document.createElement('div');
    swatches.className = 'palette-swatches';

    colors.forEach(c => {
      const hex = ColorConverter.toHex(c.r, c.g, c.b);
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.background = hex;
      sw.title = hex.toUpperCase();
      sw.addEventListener('click', () => {
        currentColor = c;
        updateColorDisplay(c);
        switchTab('picker');
        showToast('Loaded ' + hex.toUpperCase(), 'success');
      });
      swatches.appendChild(sw);
    });

    row.appendChild(lbl);
    row.appendChild(swatches);
    container.appendChild(row);
  });
}

function copyThemeCss() {
  if (!themePalette) return;
  const text = ThemeGenerator.toCssVars(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('CSS variables copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function copyThemeTailwind() {
  if (!themePalette) return;
  const text = ThemeGenerator.toTailwindConfig(themePalette);
  navigator.clipboard.writeText(text)
    .then(() => showToast('Tailwind config copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

// ═══════════════════════════════════════════════════
// EXPORT PANEL
// ═══════════════════════════════════════════════════
function renderExport() {
  const { r, g, b } = currentColor;
  const blocks = ExportManager.blocks(r, g, b);
  const container = $('exportBlocks');
  container.innerHTML = '';

  blocks.forEach(({ title, content }) => {
    const block = document.createElement('div');
    block.className = 'export-block';

    const header = document.createElement('div');
    header.className = 'export-block-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'export-block-title';
    titleEl.textContent = title;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(content)
        .then(() => { copyBtn.classList.add('copied'); setTimeout(() => copyBtn.classList.remove('copied'), 1500); showToast('Copied!', 'success'); })
        .catch(() => showToast('Copy failed', 'error'));
    });

    const body = document.createElement('div');
    body.className = 'export-block-body';
    body.textContent = content;

    header.appendChild(titleEl);
    header.appendChild(copyBtn);
    block.appendChild(header);
    block.appendChild(body);
    container.appendChild(block);
  });
}

function copyAllExport() {
  const { r, g, b } = currentColor;
  navigator.clipboard.writeText(ExportManager.allText(r, g, b))
    .then(() => showToast('All formats copied!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
}

function downloadCss() {
  const { r, g, b } = currentColor;
  const text = ExportManager.allText(r, g, b);
  const hex  = ColorConverter.toHex(r, g, b).slice(1);
  const blob = new Blob([text], { type: 'text/css' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `color-${hex}.css`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloading…', 'success');
}

// ═══════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
}

// ═══════════════════════════════════════════════════
// CLIPBOARD COPY
// ═══════════════════════════════════════════════════
function copyText(text, btn) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1500); }
      showToast('Copied!', 'success');
    })
    .catch(() => showToast('Copy failed', 'error'));
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
let toastTimer;
function showToast(msg, type = '') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ═══════════════════════════════════════════════════
// STORAGE CHANGE LISTENER (live update if popup stays open)
// ═══════════════════════════════════════════════════
function onStorageChange(changes) {
  if (changes.pendingColor?.newValue) {
    currentColor = changes.pendingColor.newValue;
    chrome.storage.local.remove('pendingColor');
    chrome.action.setBadgeText({ text: '' }).catch(() => {});
    updateColorDisplay(currentColor);
    showToast('Color picked!', 'success');
  }
  if (changes.colorHistory?.newValue) {
    colorHistory = changes.colorHistory.newValue;
    renderHistory();
  }
}
