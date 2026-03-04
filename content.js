// content.js — Overlay injected into pages for pixel picking
// Guard against being injected more than once
if (window.__colorPickProLoaded) {
  // Already running — just re-register won't hurt, but skip full init
} else {
window.__colorPickProLoaded = true;

(function () {
  'use strict';

  let overlay = null;
  let mainCanvas, ctx, magCanvas, magCtx, screenshotImg;
  const dpr = window.devicePixelRatio || 1;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'ping') {
      sendResponse({ ok: true });
      return true;
    }
    if (message.action === 'showPicker') {
      if (overlay) cleanup();
      startPicker(message.dataUrl);
      sendResponse({ ok: true });
      return true;
    }
    // Feature 5: Page Color Audit
    if (message.action === 'auditColors') {
      sendResponse({ colors: auditPageColors() });
      return true;
    }
    // Feature 10: Get element color from last hovered element
    if (message.action === 'getElementColor') {
      const el = window.__lastHoveredEl || document.body;
      const style = window.getComputedStyle(el);
      const m = (style.color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        chrome.runtime.sendMessage({ action: 'colorPicked', r, g, b });
        const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
        const toast = document.createElement('div');
        Object.assign(toast.style, {
          position:'fixed',bottom:'20px',right:'20px',zIndex:'2147483647',
          background: hex, color:(r*.299+g*.587+b*.114)>128?'#000':'#fff',
          padding:'8px 16px',borderRadius:'8px',font:'700 12px sans-serif',
          boxShadow:'0 4px 12px rgba(0,0,0,0.4)',pointerEvents:'none'
        });
        toast.textContent = hex + ' captured!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
      sendResponse({ ok: true });
      return true;
    }
  });

  // Feature 10: track last hovered element for context menu
  document.addEventListener('mouseover', e => { window.__lastHoveredEl = e.target; }, true);

  // Feature 5: audit all colors on the page
  function auditPageColors() {
    const unique = new Map();
    const props = ['color','backgroundColor','borderColor','outlineColor'];
    for (const el of document.querySelectorAll('*')) {
      if (unique.size >= 50) break;
      const style = window.getComputedStyle(el);
      for (const prop of props) {
        const val = style[prop];
        if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') continue;
        const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
          const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
          if (!unique.has(hex)) { unique.set(hex,{r,g,b}); if (unique.size>=50) break; }
        }
      }
    }
    return [...unique.values()];
  }

  function startPicker(dataUrl) {
    screenshotImg = new Image();
    screenshotImg.onload = () => {
      buildOverlay();
      ctx.drawImage(screenshotImg, 0, 0);
    };
    screenshotImg.src = dataUrl;
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      zIndex: '2147483647', cursor: 'none',
      overflow: 'hidden', userSelect: 'none'
    });

    // Main canvas — fills viewport, holds screenshot
    mainCanvas = document.createElement('canvas');
    mainCanvas.width = screenshotImg.width;
    mainCanvas.height = screenshotImg.height;
    Object.assign(mainCanvas.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%'
    });
    ctx = mainCanvas.getContext('2d', { willReadFrequently: true });

    // Magnifier canvas
    magCanvas = document.createElement('canvas');
    magCanvas.width = 156;
    magCanvas.height = 156;
    Object.assign(magCanvas.style, {
      position: 'absolute', display: 'none', pointerEvents: 'none',
      width: '156px', height: '156px',
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.9)',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.6)',
      overflow: 'hidden'
    });
    magCtx = magCanvas.getContext('2d');

    // Hint bar
    const hint = document.createElement('div');
    Object.assign(hint.style, {
      position: 'absolute', top: '14px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,10,20,0.88)',
      color: '#e4e4f0',
      padding: '8px 18px', borderRadius: '24px',
      font: '600 13px/1.5 system-ui,sans-serif',
      pointerEvents: 'none', whiteSpace: 'nowrap',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)'
    });
    hint.textContent = '🎨  Click to pick a color  ·  ESC to cancel';

    // Floating color label
    const colorLabel = document.createElement('div');
    colorLabel.id = '__cp_label';
    Object.assign(colorLabel.style, {
      position: 'absolute', display: 'none', pointerEvents: 'none',
      background: 'rgba(10,10,20,0.92)',
      color: '#e4e4f0',
      padding: '5px 11px 5px 8px', borderRadius: '8px',
      font: '700 12px/1.5 "SF Mono","Fira Code",monospace',
      letterSpacing: '0.5px', whiteSpace: 'nowrap',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)'
    });

    overlay.appendChild(mainCanvas);
    overlay.appendChild(magCanvas);
    overlay.appendChild(hint);
    overlay.appendChild(colorLabel);
    document.documentElement.appendChild(overlay);

    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('click', onPick);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function onMouseMove(e) {
    const cx = e.clientX, cy = e.clientY;
    const px = Math.floor(cx * dpr);
    const py = Math.floor(cy * dpr);

    // Read pixel from canvas
    const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Draw magnifier
    const magSize = 156;
    const zoom = 9;
    const srcW = magSize / zoom; // ~17.3 screenshot px shown
    const sx = px - srcW / 2;
    const sy = py - srcW / 2;

    magCtx.imageSmoothingEnabled = false;
    magCtx.clearRect(0, 0, magSize, magSize);
    magCtx.fillStyle = '#0d0d12';
    magCtx.fillRect(0, 0, magSize, magSize);
    magCtx.drawImage(screenshotImg, sx, sy, srcW, srcW, 0, 0, magSize, magSize);

    // Crosshair lines
    const half = magSize / 2;
    magCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    magCtx.lineWidth = 1;
    magCtx.beginPath();
    magCtx.moveTo(half, 0); magCtx.lineTo(half, magSize);
    magCtx.moveTo(0, half); magCtx.lineTo(magSize, half);
    magCtx.stroke();

    // Center pixel highlight box
    const pixelBox = zoom;
    magCtx.strokeStyle = '#fff';
    magCtx.lineWidth = 1.5;
    magCtx.strokeRect(half - pixelBox / 2, half - pixelBox / 2, pixelBox, pixelBox);

    // Color band at bottom of magnifier
    magCtx.fillStyle = `rgb(${r},${g},${b})`;
    magCtx.fillRect(0, magSize - 28, magSize, 28);
    magCtx.fillStyle = (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? '#000' : '#fff';
    magCtx.font = '700 10px "SF Mono","Fira Code",monospace';
    magCtx.textAlign = 'center';
    magCtx.fillText(hex, half, magSize - 6);

    // Feature 13: Draw 5 nearby sample color dots in the band
    const sampleOffsets = [[0,0],[0,-20*dpr],[20*dpr,0],[0,20*dpr],[-20*dpr,0]];
    sampleOffsets.forEach(([ox, oy], i) => {
      const spx = Math.max(0, Math.min(screenshotImg.width-1, Math.round(px+ox)));
      const spy = Math.max(0, Math.min(screenshotImg.height-1, Math.round(py+oy)));
      const [sr, sg, sb] = ctx.getImageData(spx, spy, 1, 1).data;
      const dx = 20 + i * 14, dy = magSize - 20;
      magCtx.beginPath();
      magCtx.arc(dx, dy, 5, 0, Math.PI*2);
      magCtx.fillStyle = `rgb(${sr},${sg},${sb})`;
      magCtx.fill();
      magCtx.strokeStyle = 'rgba(255,255,255,0.75)';
      magCtx.lineWidth = 1;
      magCtx.stroke();
    });

    // Position magnifier near cursor (avoids edges)
    const pad = 18;
    let mx = cx + pad, my = cy - magSize - pad;
    if (mx + magSize > window.innerWidth - 4) mx = cx - magSize - pad;
    if (my < 4) my = cy + pad;
    magCanvas.style.left = mx + 'px';
    magCanvas.style.top = my + 'px';
    magCanvas.style.display = 'block';

    // Update color label
    const label = overlay.querySelector('#__cp_label');
    label.textContent = hex;
    label.style.borderLeft = `5px solid ${hex.toLowerCase()}`;
    label.style.left = (mx) + 'px';
    label.style.top = (my + magSize + 6) + 'px';
    label.style.display = 'block';
  }

  function onPick(e) {
    const px = Math.floor(e.clientX * dpr);
    const py = Math.floor(e.clientY * dpr);
    const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
    chrome.runtime.sendMessage({ action: 'colorPicked', r, g, b });
    cleanup();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      chrome.runtime.sendMessage({ action: 'pickCancelled' });
      cleanup();
    }
  }

  function cleanup() {
    if (!overlay) return;
    overlay.removeEventListener('mousemove', onMouseMove);
    overlay.removeEventListener('click', onPick);
    document.removeEventListener('keydown', onKeyDown, true);
    overlay.remove();
    overlay = null;
  }
})();

} // end __colorPickProLoaded guard
