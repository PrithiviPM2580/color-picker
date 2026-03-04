# ColorPick Pro

A professional Chrome extension for picking, analyzing, converting, and exporting colors — with a full suite of design tools built in.

---

## Features

### 🎨 Picker Tab

#### Pixel-Level Color Picker
- Click **"Pick Color from Page"** to activate a fullscreen overlay
- A magnifier (9× zoom) follows your cursor with crosshair precision
- A floating color label shows the hex value in real time
- Click any pixel to capture its color; press **ESC** to cancel
- **Right-click** any element on the page → "Pick Element Color" via context menu
- Click the color swatch to manually choose a color with the native color picker

#### Color Formats
Displays the picked color in all major formats, each with a one-click copy button:
| Format | Example |
|--------|---------|
| HEX | `#8B5CF6` |
| RGB | `rgb(139, 92, 246)` |
| HSL | `hsl(263, 90%, 66%)` |
| RGBA | `rgba(139, 92, 246, 1.00)` |
| OKLCH | `oklch(60.42% 0.2576 292.15)` |
| CMYK | `cmyk(43%, 63%, 0%, 4%)` |
| LAB | `lab(55.32 -14.21 47.83)` |
| LCH | `lch(55.32 49.90 106.6°)` |

- **Paste any color** — type or paste `#hex`, `rgb()`, `hsl()`, or a CSS color name to load it instantly
- **Copy All** — copies every format at once as a formatted block
- **Alpha slider** — adjust opacity; RGBA, HSLA, and HEX8 rows appear automatically
- **Random color** button (🎲) for instant inspiration

#### Color Intelligence
- **Color name** — nearest CSS named color (e.g. "MediumSlateBlue")
- **Tailwind class** — nearest Tailwind CSS color (e.g. `violet-500`)
- **Color temperature** — Warm / Cool / Neutral label
- **Pantone & RAL** — nearest Pantone and RAL reference codes
- **Side-by-side compare** — compare two colors with WCAG contrast ratio

---

### 🕓 History Tab
- **Recent colors** — last 20 colors you interacted with (not just picked), shown as clickable dots
- Stores full color history with **timestamps**
- **Search / filter** history by hex or color name
- **Pin favorites** — star any color to keep it at the top
- **Import palette** — paste a list of hex codes to bulk-import
- **Clear all** button

---

### 🎨 Theme Tab
Generate full design system palettes from a single base color.

#### Palette Modes
| Mode | Description |
|------|-------------|
| **Harmony** | Tints, shades, complementary, triadic, analogous, split-complementary |
| **Mono** | 10-step monochromatic lightness scale |
| **Duotone** | 9-step blend between two base colors |
| **Material** | Material Design 50–900 scale |

#### Palette Adjustments
- **Hue shift** slider (±180°), **Saturation** (±100), **Lightness** (±50) — all live
- **Lock individual swatches** — prevent specific shades from being affected by adjustments

#### UI Preview
- Live **light mode + dark mode** mini UI cards rendered with your palette

#### Export Formats
- CSS Custom Properties, Tailwind config, **SCSS variables**, **JSON Design Tokens**, **Figma Tokens**

#### Presets
- Name and save generated themes; reload or delete them anytime

---

### 🗂️ Palette Tab
- Create and save named **palette collections**
- **Gradient builder** — add color stops, preview the gradient, copy CSS

---

### 📤 Export Tab
- Ready-to-paste snippets: CSS variable, Swift `UIColor`, Android XML, Figma token, iOS/Android formats
- Custom **CSS variable name** prefix
- **Download palette as PNG** — exports your color history as a labeled swatch image

---

### 🔧 Tools Tab

#### Color Mixer
- Pick two colors + a ratio slider → get the blended result live
- Copy result hex or send it directly to the Picker

#### Contrast Checker
- Foreground + background color pickers with live **WCAG AA / AAA** pass/fail badges
- "Use current color" button to pull in the active picker color
- Sample text preview on the chosen background

#### Color Wheel
- Interactive **HSL color wheel** canvas — click to pick hue + saturation
- Lightness slider; "Use Color" sends it to the Picker

#### Gradient Builder
- Linear / Radial / Conic gradient with angle control
- Add/remove/reorder color stops; live preview; copy full CSS

#### Color Blindness Simulator
- Preview how your color looks under Deuteranopia, Protanopia, Tritanopia, and Achromatopsia

#### Image Eyedropper
- Upload any image and pick colors directly from it

#### Page Color Audit
- Scans the active page and returns up to 50 unique colors in use

---

### 🌙 Light / Dark Mode
- Toggle in the header; preference is persisted across sessions

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `P` | Pick color from page |
| `R` | Random color |
| `C` | Copy current HEX |
| `H` | Go to History tab |
| `T` | Go to Theme tab |

---

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `color-picker` folder.
5. The **ColorPick Pro** icon will appear in your toolbar.

> **Permissions used:** `activeTab`, `storage`, `scripting`, `tabs`, `contextMenus`

---

## Usage

1. Navigate to any webpage.
2. Click the **ColorPick Pro** toolbar icon to open the popup.
3. Press **Pick Color from Page** — the page dims and the magnifier appears.
4. Hover over the pixel you want, then **click** to pick it.
5. The popup reopens with the color in all formats across 6 tabs.

---

## Tech Stack

- **Manifest V3** Chrome Extension API
- Vanilla JavaScript (no external libraries)
- CSS custom properties for dark/light theming
- `chrome.tabs.captureVisibleTab` for pixel-accurate screenshot picking
- `chrome.storage.local` for all persistence
- Full color math: sRGB ↔ HSL ↔ OKLCH ↔ XYZ ↔ LAB ↔ LCH ↔ CMYK (all in-browser, no APIs)

---

## Project Structure

```
color-picker/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — screenshot capture, context menu, storage
├── content.js          # Injected overlay — magnifier, pixel picking, page audit
├── popup.html          # Extension popup UI (6 tabs)
├── popup.js            # All popup logic, color math, and feature handlers
├── style.css           # Popup styles with full dark/light theme support
├── generate-icons.js   # Script to generate icon PNGs
└── icons/              # Extension icons (16, 32, 48, 128 px)
```

---

## License

MIT
