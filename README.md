# ColorPick Pro

A powerful Chrome extension for picking pixel-level colors from any webpage, with multi-format output, WCAG contrast checking, theme generation, and export features.

---

## Features

### 🎨 Pixel-Level Color Picker
- Click **"Pick Color from Page"** to activate a fullscreen overlay
- A magnifier (9× zoom) follows your cursor with crosshair precision
- A floating color label shows the hex value in real time
- Click any pixel to capture its color; press **ESC** to cancel

### 🖌️ Color Formats
Displays the picked color in five formats, each with a one-click copy button:
| Format | Example |
|--------|---------|
| HEX | `#8B5CF6` |
| RGB | `rgb(139, 92, 246)` |
| Normalized RGB | `rgb(0.5451, 0.3608, 0.9647)` |
| HSL | `hsl(263, 90%, 66%)` |
| OKLCH | `oklch(60.42% 0.2576 292.15)` |

### 🕓 History
- Stores the last **10 picked colors** in browser local storage
- Click any swatch to reload that color into the picker
- "Clear all" button to wipe the history

### ♿ WCAG Contrast Checker
- Input a foreground and background color
- Live contrast ratio display with pass/fail badges for:
  - **AA** (≥ 4.5:1 normal text)
  - **AAA** (≥ 7:1 normal text)
  - **AA Large** (≥ 3:1 large text)
  - **AAA Large** (≥ 4.5:1 large text)
- Swap button to instantly reverse foreground/background

### 🎨 Theme Generator
- Enter a base hex color and click **Generate**
- Produces a 10-shade palette (50 → 950) using HSL lightness steps
- Copy as **CSS custom properties** or **Tailwind CSS config**

### 📤 Export
- Displays the current color as ready-to-paste snippets for:
  - CSS variable, HEX, RGB, HSL, OKLCH, Tailwind arbitrary value, Swift `UIColor`, Android XML, and Figma token
- **Copy All** — copies every snippet at once
- **Download .css** — saves a `.css` file with all variables

### 🌙 Light / Dark Mode
- Toggle button in the header switches the UI between dark and light themes; preference is persisted in `localStorage`

---

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `color-picker` folder.
5. The **ColorPick Pro** icon will appear in your toolbar.

> **Note:** The extension requires the `activeTab`, `storage`, `scripting`, and `tabs` permissions to capture screenshots and persist history.

---

## Usage

1. Navigate to any webpage.
2. Click the **ColorPick Pro** toolbar icon to open the popup.
3. Press **Pick Color from Page** — the page dims and the magnifier appears.
4. Hover over the pixel you want, then **click** to pick it.
5. The popup reopens automatically showing the color in all formats.
6. Use the **History**, **Theme**, and **Export** tabs for additional tools.

---

## Tech Stack

- **Manifest V3** Chrome Extension API
- Vanilla JavaScript (no external libraries)
- CSS custom properties for theming
- `chrome.tabs.captureVisibleTab` for pixel-accurate screenshot picking
- `chrome.storage.local` for history persistence

---

## Project Structure

```
color-picker/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — screenshot capture & storage
├── content.js          # Injected overlay — magnifier & pixel picking
├── popup.html          # Extension popup UI
├── popup.js            # All popup logic & color math
├── style.css           # Popup styles with dark/light theme support
├── generate-icons.js   # Script to generate icon PNGs
└── icons/              # Extension icons (16, 32, 48, 128 px)
```

---

## License

MIT
