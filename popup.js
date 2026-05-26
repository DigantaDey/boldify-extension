/**
 * Boldify Reading Assistant — Popup Script
 * Manages popup UI and communicates with the content script.
 *
 * @license MIT
 */

(function () {
  'use strict';

  /* ─── DOM refs ──────────────────────────────────────────────── */

  const popup          = document.getElementById('popup');
  const themeToggle    = document.getElementById('themeToggle');
  const toggleCard     = document.getElementById('toggleCard');
  const enableToggle   = document.getElementById('enableToggle');
  const toggleTitle    = document.getElementById('toggleTitle');
  const currentSiteEl  = document.getElementById('currentSite');
  const intensitySlider = document.getElementById('intensitySlider');
  const intensityValue = document.getElementById('intensityValue');
  const italicToggle   = document.getElementById('italicToggle');
  const presetBtns     = document.querySelectorAll('.preset-btn');
  const wordsTodayEl   = document.getElementById('wordsToday');
  const pagesTotalEl   = document.getElementById('pagesTotal');

  /* ─── state ─────────────────────────────────────────────────── */

  let currentHostname = '';
  let currentTabId    = null;
  let isEnabled       = false;
  let settings        = { intensity: 50, italic: false };

  /* ─── helpers ───────────────────────────────────────────────── */

  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  }

  function updateUI() {
    enableToggle.setAttribute('aria-checked', String(isEnabled));
    toggleCard.classList.toggle('enabled', isEnabled);
    toggleTitle.textContent = isEnabled ? 'Active on this site' : 'Enable on this site';

    intensitySlider.value = settings.intensity;
    intensityValue.textContent = settings.intensity + '%';

    italicToggle.setAttribute('aria-checked', String(settings.italic));

    presetBtns.forEach(b => {
      b.classList.toggle('active',
        Math.abs(parseInt(b.dataset.intensity) - settings.intensity) < 10);
    });
  }

  async function persist() {
    const data = await chrome.storage.local.get(['siteSettings']);
    const ss   = data.siteSettings || {};
    ss[currentHostname] = {
      enabled:   isEnabled,
      intensity: settings.intensity,
      italic:    settings.italic,
    };
    await chrome.storage.local.set({ siteSettings: ss });
  }

  async function send(msg) {
    if (!currentTabId) return;
    try { await chrome.tabs.sendMessage(currentTabId, msg); }
    catch (_) { /* content script not ready */ }
  }

  /* ─── init ──────────────────────────────────────────────────── */

  async function init() {
    // theme
    const td = await chrome.storage.local.get(['theme']);
    if (td.theme === 'dark') popup.setAttribute('data-theme', 'dark');

    // current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        currentHostname = new URL(tab.url).hostname;
        currentTabId    = tab.id;
        currentSiteEl.textContent = currentHostname;
      } catch (_) {
        currentSiteEl.textContent = 'This page';
      }
    }

    // load state
    const data = await chrome.storage.local.get([
      'globalEnabled', 'globalSettings', 'siteSettings',
    ]);
    const site = data.siteSettings?.[currentHostname];
    if (site) {
      isEnabled = site.enabled ?? false;
      settings  = {
        intensity: site.intensity ?? data.globalSettings?.intensity ?? 50,
        italic:    site.italic    ?? data.globalSettings?.italic    ?? false,
      };
    } else {
      isEnabled = false;
      settings  = data.globalSettings || { intensity: 50, italic: false };
    }

    // stats
    const sd    = await chrome.storage.local.get(['stats']);
    const stats = sd.stats || { totalWordsProcessed: 0, totalPagesProcessed: 0 };
    wordsTodayEl.textContent  = fmt(stats.totalWordsProcessed);
    pagesTotalEl.textContent  = fmt(stats.totalPagesProcessed);

    updateUI();
    bind();
  }

  /* ─── event bindings ────────────────────────────────────────── */

  function bind() {
    // Theme
    themeToggle.addEventListener('click', async () => {
      const dark = popup.getAttribute('data-theme') === 'dark';
      popup.setAttribute('data-theme', dark ? 'light' : 'dark');
      await chrome.storage.local.set({ theme: dark ? 'light' : 'dark' });
    });

    // Master toggle
    enableToggle.addEventListener('click', async () => {
      isEnabled = !isEnabled;
      updateUI();
      await persist();
      await send({ type: 'TOGGLE', enabled: isEnabled });
    });

    // Intensity — live preview value only
    intensitySlider.addEventListener('input', (e) => {
      settings.intensity = parseInt(e.target.value);
      intensityValue.textContent = settings.intensity + '%';
      presetBtns.forEach(b => {
        b.classList.toggle('active',
          Math.abs(parseInt(b.dataset.intensity) - settings.intensity) < 10);
      });
    });

    // Intensity — commit on release
    intensitySlider.addEventListener('change', async () => {
      await persist();
      if (isEnabled) {
        await send({ type: 'UPDATE_SETTINGS', settings: { intensity: settings.intensity } });
      }
    });

    // Italic
    italicToggle.addEventListener('click', async () => {
      settings.italic = !settings.italic;
      updateUI();
      await persist();
      if (isEnabled) {
        await send({ type: 'UPDATE_SETTINGS', settings: { italic: settings.italic } });
      }
    });

    // Presets
    presetBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        settings.intensity = parseInt(btn.dataset.intensity);
        intensitySlider.value = settings.intensity;
        updateUI();
        await persist();
        if (isEnabled) {
          await send({ type: 'UPDATE_SETTINGS', settings: { intensity: settings.intensity } });
        }
      });
    });
  }

  /* ─── go ────────────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
