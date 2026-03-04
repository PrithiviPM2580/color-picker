// background.js — Service Worker for ColorPick Pro (Manifest V3)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startPick') {
    handleStartPick(message, sendResponse);
    return true; // keep channel open for async
  }
  if (message.action === 'colorPicked') {
    handleColorPicked(message);
  }
  if (message.action === 'pickCancelled') {
    chrome.action.setBadgeText({ text: '' });
  }
});

// Ping the content script; if it doesn't respond, inject it programmatically
async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch {
    // Content script not present — inject it now
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    // Give the script a moment to register its message listener
    await new Promise(r => setTimeout(r, 80));
  }
}

async function handleStartPick({ tabId, windowId }, sendResponse) {
  try {
    // 1. Ensure content script is alive (inject if missing)
    await ensureContentScript(tabId);

    // 2. Capture the visible tab screenshot
    const dataUrl = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(windowId, { format: 'png', quality: 100 }, url => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(url);
      });
    });

    // 3. Send screenshot to content script to show the overlay
    await chrome.tabs.sendMessage(tabId, { action: 'showPicker', dataUrl });
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleColorPicked({ r, g, b }) {
  const data = await chrome.storage.local.get(['colorHistory']);
  const history = data.colorHistory || [];

  const newColor = { r, g, b, timestamp: Date.now() };
  const newHistory = [
    newColor,
    ...history.filter(c => !(c.r === r && c.g === g && c.b === b))
  ].slice(0, 10);

  await chrome.storage.local.set({ pendingColor: { r, g, b }, colorHistory: newHistory });

  // Show picked color on badge
  const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  chrome.action.setBadgeText({ text: '●' });
  chrome.action.setBadgeBackgroundColor({ color: hex });

  // Try to reopen popup (Chrome 99+)
  try {
    await chrome.action.openPopup();
  } catch (_) {
    // User will click icon to see result
  }
}
