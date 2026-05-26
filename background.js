/**
 * Boldify Reading Assistant — Background Service Worker
 * Handles keyboard shortcuts, install defaults, and stats.
 *
 * @license MIT
 */

/* ─── keyboard shortcut ──────────────────────────────────────── */

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-boldify') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  let hostname;
  try { hostname = new URL(tab.url).hostname; } catch (_) { return; }

  const data     = await chrome.storage.local.get(['siteSettings']);
  const ss       = data.siteSettings || {};
  const current  = ss[hostname]?.enabled ?? false;
  const next     = !current;

  ss[hostname] = { ...(ss[hostname] || {}), enabled: next };
  await chrome.storage.local.set({ siteSettings: ss });

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled: next });
  } catch (_) {
    // content script may not be injected on this page
  }
});

/* ─── first install defaults ─────────────────────────────────── */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return;

  chrome.storage.local.set({
    globalEnabled: false,
    globalSettings: { intensity: 50, italic: false },
    siteSettings: {},
    stats: {
      totalWordsProcessed: 0,
      totalPagesProcessed: 0,
      installDate: Date.now(),
    },
  });
});

/* ─── message relay / stats ──────────────────────────────────── */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'UPDATE_STATS') {
    chrome.storage.local.get(['stats'], (data) => {
      const s = data.stats || { totalWordsProcessed: 0, totalPagesProcessed: 0 };
      s.totalWordsProcessed  += msg.wordsProcessed  || 0;
      s.totalPagesProcessed  += msg.pagesProcessed  || 0;
      chrome.storage.local.set({ stats: s });
    });
    // no response needed
    return false;
  }

  if (msg.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0] ? { url: tabs[0].url, tabId: tabs[0].id } : {});
    });
    return true; // async
  }
});
