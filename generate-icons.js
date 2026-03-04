#!/usr/bin/env node
/**
 * generate-icons.js — Creates PNG icons for ColorPick Pro
 * Zero dependencies — pure Node.js (uses built-in zlib)
 */
'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.alloc(4); len.writeUInt32BE(d.length, 0);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])), 0);
  return Buffer.concat([len, t, d, crcBuf]);
}

// ── HSL → RGB ──────────────────────────────────────
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const h2r = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [
    Math.round(h2r(h / 360 + 1/3) * 255),
    Math.round(h2r(h / 360) * 255),
    Math.round(h2r(h / 360 - 1/3) * 255)
  ];
}

// ── Icon draw function ─────────────────────────────
// Draws a color-wheel ring with a white center dot (eyedropper style)
function drawPixel(x, y, size) {
  const cx = size / 2 - 0.5, cy = size / 2 - 0.5;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

  const outerR = size * 0.46;
  const ringW  = size * 0.18;
  const innerR = outerR - ringW;
  const dotR   = size * 0.13;

  // Anti-aliasing helper
  const aa = (d, r) => Math.max(0, Math.min(1, r - d + 1));

  if (dist <= dotR) {
    // White center dot
    const a = aa(dist, dotR) * 255;
    return [255, 255, 255, Math.round(a)];
  }

  if (dist <= outerR && dist >= innerR) {
    // Color wheel ring — saturation/alpha toward edges
    const [r, g, b] = hslToRgb(angle, 0.9, 0.55);
    let alpha = 255;
    if (dist > outerR - 1.2) alpha = Math.round(aa(dist, outerR) * 255);
    else if (dist < innerR + 1.2) alpha = Math.round(aa(innerR + 1.2 - dist + 1, 1.2) * 255);
    return [r, g, b, Math.max(0, alpha)];
  }

  // Gap between dot and ring — dark fill
  if (dist < innerR) {
    return [15, 15, 22, 255];
  }

  // Outside — transparent
  return [0, 0, 0, 0];
}

// ── PNG builder ────────────────────────────────────
function createPNG(size) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth=8, color type=RGBA

  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter = None
    for (let x = 0; x < size; x++) {
      raw.push(...drawPixel(x, y, size));
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw), { level: 9 });

  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

// ── Run ────────────────────────────────────────────
const iconsDir = path.join(__dirname, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 32, 48, 128].forEach(size => {
  const png  = createPNG(size);
  const file = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`  ✓  icons/icon${size}.png  (${png.length} bytes)`);
});

console.log('\n✅  All icons generated!');
