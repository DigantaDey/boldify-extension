/**
 * Boldify Reading Assistant — Content Script
 * ═══════════════════════════════════════════
 *
 * Uses the science-based boldify-engine for word analysis.
 * See boldify-engine.js for the full research citations.
 *
 * Safety: MutationObserver is disconnected during all DOM writes.
 *
 * @license MIT
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     INLINE ENGINE  (self-contained — no ES module import needed)
     ═══════════════════════════════════════════════════════════════ */

  // ═══════════════════════════════════════════════════════
  //  EMPIRICAL PVL TABLE  (Rayner 1979, McConkie et al. 1988)
  //  Index = word length.  Value = PVL char position (0-indexed).
  //  PVL = "halfway between word beginning and word center"
  // ═══════════════════════════════════════════════════════
  const PVL = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
     0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7,
  ];
  function getPVL(len) {
    return len <= 20 ? PVL[len] : Math.floor(len * 0.33);
  }

  // bold = PVL + 1 + foveal buffer (length-aware + intensity-scaled)
  function baseBoldCount(len, intensity) {
    if (len <= 1) return 1;
    const pvl = getPVL(len);
    const maxBuf = len <= 5 ? 1 : len <= 9 ? 2 : 3;
    const buffer = Math.min(maxBuf, Math.floor((intensity / 100) * (maxBuf + 1)));
    const bc = pvl + 1 + buffer;
    const cap = len <= 3 ? Math.max(1, len - 1) : Math.max(2, Math.ceil(len * 0.75));
    return Math.max(1, Math.min(cap, bc));
  }

  // ── frequency tiers ───────────────────────────────────────
  const FREQ_T0 = new Set([
    'a','i','the','be','to','of','and','in','that','have',
    'it','for','not','on','with','he','as','you','do','at',
    'this','but','his','by','from','is','or','an','if','so',
  ]);
  const FREQ_T1 = new Set([
    'we','say','she','will','my','one','all','would','there','their',
    'what','up','out','about','who','get','which','go','me','when',
    'make','can','like','time','no','just','him','know','take',
    'into','year','your','good','some','could','them','see','other',
    'than','then','now','look','only','come','its','over','think',
    'also','back','after','use','two','how','our','work','first',
    'well','way','even','new','want','because','any','these','give',
    'day','most','us','been','has','had','are','was','were','am','her',
  ]);

  // ── morphology tables (longest first) ─────────────────────
  const PREFIXES = [
    'counter','trans','under','super','inter','multi','micro','macro',
    'extra','over','anti','auto','fore','semi','post','self',
    'meta','para','ultra','mono','poly',
    'dis','mis','pre','non','sub','out','mid',
    'un','re','in','im','ir','il','en','em','de','co',
  ];
  const SUFFIXES = [
    'fulness','isation','ization','lessly','ousness',
    'ation','ition','ement','iness','ously','ively','ingly',
    'able','ible','ment','ness','less','tion','sion','ious',
    'eous','ical','ally','ling','ence','ance','ship',
    'ward','wise','like','full',
    'ing','ful','ous','ive','ity','ism','ist','ant','ent',
    'ary','ery','ory','ure','age','dom','ize','ise','ify',
    'ate','ual','ial','tic','ble','est','ess',
    'ly','ed','er','al','en',
  ];

  function findMorphBoundary(word, target) {
    const len = word.length;
    let best = null, bestD = Infinity;
    for (const p of PREFIXES) {
      if (word.startsWith(p) && p.length < len - 1) {
        const d = Math.abs(p.length - target);
        if (d < bestD) { bestD = d; best = p.length; }
        break;
      }
    }
    for (const s of SUFFIXES) {
      if (word.endsWith(s) && s.length < len - 1) {
        const b = len - s.length;
        const d = Math.abs(b - target);
        if (d < bestD) { bestD = d; best = b; }
        break;
      }
    }
    return best;
  }

  // ── pre-compute lookup table ──────────────────────────────
  function buildTable(intensity, max) {
    max = max || 30;
    const t = new Uint8Array(max + 1);
    for (let l = 1; l <= max; l++) t[l] = baseBoldCount(l, intensity);
    return t;
  }

  function getBoldCount(word, table, freqAware, morphAware) {
    const len = word.length;
    if (len <= 1) return 1;
    const lw = word.toLowerCase();

    // Layer 1: frequency — function words get minimal bolding
    if (freqAware) {
      if (FREQ_T0.has(lw)) return 1;
      if (FREQ_T1.has(lw) && len <= 5) return 1;
    }

    // Layer 2: empirical PVL-based lookup
    let bc = len <= 30 ? table[len] : baseBoldCount(len, settings.intensity);

    // Layer 3: morphology snap (within ±1 char only)
    if (morphAware && len >= 5) {
      const mb = findMorphBoundary(lw, bc);
      if (mb !== null && Math.abs(mb - bc) <= 1) bc = mb;
    }

    return Math.max(1, Math.min(len, bc));
  }

  /* ═══════════════════════════════════════════════════════════════
     CONTENT SCRIPT PROPER
     ═══════════════════════════════════════════════════════════════ */

  const ATTR     = 'data-boldify';
  const STYLE_ID = 'boldify-injected-styles';

  const SKIP_TAGS = new Set([
    'SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION',
    'CODE','PRE','KBD','SAMP','VAR',
    'NOSCRIPT','IFRAME','OBJECT','EMBED','SVG','MATH','CANVAS',
    'VIDEO','AUDIO','IMG','BR','HR',
  ]);

  let isEnabled    = false;
  let isProcessing = false;
  let observer     = null;

  // settings (defaults)
  let settings = {
    intensity:  50,
    italic:     false,
    freqAware:  true,   // reduce bolding on function words
    morphAware: true,   // align to morpheme boundaries
    saccade:    true,   // use OVP model (vs flat ratio)
  };

  // lookup table — rebuilt when intensity changes
  let boldTable = buildTable(settings.intensity);

  /* ── DOM helpers ────────────────────────────────────────── */

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return false;
    return SKIP_TAGS.has(el.tagName)
        || el.isContentEditable
        || el.hasAttribute(ATTR);
  }

  function isInsideSkipped(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== document.body) {
      if (shouldSkip(el)) return true;
      el = el.parentElement;
    }
    return false;
  }

  /* ── process one text node ─────────────────────────────── */

  function processTextNode(tn) {
    const text = tn.nodeValue;
    if (!text || !text.trim()) return;
    const parent = tn.parentNode;
    if (!parent) return;
    if (parent.hasAttribute && parent.hasAttribute(ATTR)) return;

    const frag  = document.createDocumentFragment();
    const parts = text.split(/(\s+)/);

    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      if (!seg || /^\s+$/.test(seg)) {
        frag.appendChild(document.createTextNode(seg));
        continue;
      }

      // Separate leading/trailing punctuation from the "word"
      const lm = seg.match(/^[^\p{L}\p{N}]+/u);
      const tm = seg.match(/[^\p{L}\p{N}]+$/u);
      const leading  = lm ? lm[0] : '';
      const trailing = tm ? tm[0] : '';
      const word = seg.slice(
        leading.length,
        seg.length - (trailing.length || 0) || undefined
      );

      if (!word) {
        frag.appendChild(document.createTextNode(seg));
        continue;
      }

      if (leading) frag.appendChild(document.createTextNode(leading));

      const bc = getBoldCount(word, boldTable, settings.freqAware, settings.morphAware);

      const wrapper = document.createElement('span');
      wrapper.setAttribute(ATTR, '1');

      const b = document.createElement('b');
      b.textContent = word.slice(0, bc);
      if (settings.italic) b.style.fontStyle = 'italic';
      wrapper.appendChild(b);

      const rest = word.slice(bc);
      if (rest) wrapper.appendChild(document.createTextNode(rest));

      frag.appendChild(wrapper);

      if (trailing) frag.appendChild(document.createTextNode(trailing));
    }

    parent.replaceChild(frag, tn);
  }

  /* ── tree walk ─────────────────────────────────────────── */

  function collectText(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.parentElement?.hasAttribute(ATTR)) return NodeFilter.FILTER_REJECT;
        if (isInsideSkipped(n)) return NodeFilter.FILTER_REJECT;
        return (n.nodeValue && n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }

  function processSubtree(root) {
    const nodes = collectText(root);
    if (!nodes.length) return;
    const BATCH = 250;
    let i = 0;
    (function run() {
      pauseObs();
      isProcessing = true;
      const end = Math.min(i + BATCH, nodes.length);
      for (; i < end; i++) {
        if (nodes[i].parentNode) processTextNode(nodes[i]);
      }
      isProcessing = false;
      if (i < nodes.length) {
        requestAnimationFrame(run);
      } else {
        resumeObs();
        reportStats(nodes.length);
      }
    })();
  }

  /* ── MutationObserver (safe) ───────────────────────────── */

  function makeObs() {
    return new MutationObserver((muts) => {
      if (isProcessing || !isEnabled) return;
      const roots = new Set();
      for (const m of muts)
        for (const n of m.addedNodes)
          if (n.nodeType === 1 && !(n.hasAttribute && n.hasAttribute(ATTR)))
            roots.add(n);
      if (!roots.size) return;
      pauseObs(); isProcessing = true;
      for (const r of roots)
        if (r.isConnected)
          for (const tn of collectText(r))
            if (tn.parentNode) processTextNode(tn);
      isProcessing = false; resumeObs();
    });
  }

  function pauseObs()  { observer?.disconnect(); }
  function resumeObs() {
    if (observer && isEnabled)
      observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ── enable / disable ──────────────────────────────────── */

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `[${ATTR}] b { font-weight: 700; }`;
    document.head.appendChild(s);
  }

  function enable() {
    if (isEnabled) return;
    isEnabled = true;
    injectStyles();
    if (!observer) observer = makeObs();
    processSubtree(document.body);
  }

  function disable() {
    if (!isEnabled) return;
    isEnabled = false;
    pauseObs(); isProcessing = true;
    for (const w of document.querySelectorAll(`[${ATTR}]`)) {
      const p = w.parentNode;
      if (p) p.replaceChild(document.createTextNode(w.textContent), w);
    }
    document.body.normalize();
    document.getElementById(STYLE_ID)?.remove();
    isProcessing = false;
  }

  /* ── stats ─────────────────────────────────────────────── */

  function reportStats(count) {
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_STATS',
        wordsProcessed: count,
        pagesProcessed: 1,
      });
    } catch (_) { /* context invalidated */ }
  }

  /* ── init ──────────────────────────────────────────────── */

  async function init() {
    const hostname = location.hostname;
    let data;
    try {
      data = await chrome.storage.local.get([
        'globalEnabled', 'globalSettings', 'siteSettings',
      ]);
    } catch (_) { return; }

    const site = data.siteSettings?.[hostname];
    const gs   = data.globalSettings || {};

    if (site) {
      settings.intensity  = site.intensity  ?? gs.intensity  ?? 50;
      settings.italic     = site.italic     ?? gs.italic     ?? false;
      settings.freqAware  = site.freqAware  ?? gs.freqAware  ?? true;
      settings.morphAware = site.morphAware ?? gs.morphAware ?? true;
      boldTable = buildTable(settings.intensity);
      if (site.enabled) enable();
    } else if (data.globalEnabled) {
      Object.assign(settings, gs);
      boldTable = buildTable(settings.intensity);
      enable();
    }
  }

  /* ── messages ──────────────────────────────────────────── */

  chrome.runtime.onMessage.addListener((msg, _, resp) => {
    switch (msg.type) {
      case 'TOGGLE':
        msg.enabled ? enable() : disable();
        resp({ ok: true });
        break;

      case 'UPDATE_SETTINGS':
        const prev = settings.intensity;
        Object.assign(settings, msg.settings);
        // Rebuild lookup table if intensity changed
        if (settings.intensity !== prev) {
          boldTable = buildTable(settings.intensity);
        }
        if (isEnabled) {
          disable();
          setTimeout(enable, 0);
        }
        resp({ ok: true });
        break;

      case 'GET_STATUS':
        resp({ enabled: isEnabled, settings });
        break;

      default:
        resp({ error: 'unknown' });
    }
    return true;
  });

  /* ── go ────────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
