// Configuration
const SPONSORED_TEXTS = [
  'sponsored',
  'gesponsert',
  'sponsorisé',
  'patrocinado',
  'sponsorizzato',
  'スポンサー',
  'gesponsord',
  'sponsrad',
  'sponsorowane',
  '广告',
  '廣告',
  '스폰서'
];

let blockerEnabled = true;
let observer = null;
let scanTimeout = null;

// Inject Stylesheet safely into Head (dynamic creation for document_idle execution)
const style = document.createElement('style');
style.textContent = `
  body.noads-active .noads-blocked-element,
  body.noads-active div.s-result-item:has(.puis-sponsored-label-text),
  body.noads-active div.s-result-item:has(.s-widget-sponsored-label-text),
  body.noads-active div.s-result-item:has(a[aria-label*="Sponsored"]),
  body.noads-active div.s-result-item:has(a[aria-label*="sponsored"]),
  body.noads-active div.s-result-item:has([class*="sponsored-label"]),
  body.noads-active div.s-result-item:has([class*="sponsored-info"]),
  body.noads-active div.s-result-item:has(a[href*="/gp/sponsored-products/"]),
  body.noads-active div.s-result-item:has(a[href*="slredirect"]),
  body.noads-active .s-carousel-card-container:has(.puis-sponsored-label-text),
  body.noads-active .s-carousel-card-container:has(.s-widget-sponsored-label-text),
  body.noads-active .s-carousel-card-container:has(a[aria-label*="Sponsored"]),
  body.noads-active .s-carousel-card-container:has(a[href*="slredirect"]),
  body.noads-active .s-widget-container:has(.puis-sponsored-label-text),
  body.noads-active .s-widget-container:has(.s-widget-sponsored-label-text),
  body.noads-active .s-widget-container:has(a[aria-label*="Sponsored"]),
  body.noads-active .s-widget-container:has(a[href*="slredirect"]),
  body.noads-active .shopping-ad-card,
  body.noads-active .sparkle-container,
  body.noads-active [class*="AdHolder"],
  body.noads-active div[data-component-type="sp-sponsored-result"],
  body.noads-active div[id*="desktop-hqp-no-padding"],
  body.noads-active div[class*="desktop-ad-"],
  body.noads-active div[id*="sponsored-products-"],
  body.noads-active div[class*="creative-card"] {
    display: none !important;
  }
`;
document.head.appendChild(style);

// Safe messaging wrapper with try/catch handling for disconnects & context invalidation
async function sendBackgroundMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          if (error.message.includes("Extension context invalidated")) {
            cleanupOrphanedScript();
          }
          resolve({ success: false, error: error.message });
        } else {
          resolve(response || { success: true });
        }
      });
    } catch (err) {
      if (err.message.includes("Extension context invalidated")) {
        cleanupOrphanedScript();
      }
      resolve({ success: false, error: err.message });
    }
  });
}

// Shuts down observer if extension is updated/reloaded to prevent memory leaks in orphan state
function cleanupOrphanedScript() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  console.log('[Blocker] Orphaned content script disconnected.');
}

// Find the outer structural card/element containing the ad
function findAdContainer(element) {
  // 1. Grid/list standard card wrapper search
  let container = element.closest('.s-result-item, [data-component-type="sp-sponsored-result"], .adHolder');
  if (container) return container;

  // 2. Carousel item/widget search
  container = element.closest('.s-carousel-card-container, .shopping-ad-card, [class*="AdHolder"], .sparkle-container');
  if (container) return container;

  // 3. Main header banners / video slots
  container = element.closest('[id*="desktop-hqp-no-padding"], [id*="sponsored-products-"], [class*="desktop-ad-"]');
  if (container) return container;

  // 4. Dom climbing fallback (up to 5 levels)
  let current = element;
  for (let i = 0; i < 5; i++) {
    if (!current || current === document.body) break;
    if (current.tagName === 'DIV' && (current.classList.contains('s-card-container') || current.getAttribute('data-asin'))) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

// Mark element as hidden and report to background storage
async function markAsBlocked(element) {
  if (!element || element.classList.contains('noads-blocked-element')) return;

  element.classList.add('noads-blocked-element');
  
  // Asynchronous update to background state worker
  await sendBackgroundMessage({ action: 'incrementBlocked', count: 1 });
}

// Scrape and match sponsored tags
function scanForAds() {
  if (!blockerEnabled) return;

  // 1. Structural CSS matches (Fast scan)
  const targets = document.querySelectorAll(
    'div.s-result-item:not(.noads-blocked-element), ' +
    '.s-carousel-card-container:not(.noads-blocked-element), ' +
    '.s-widget-container:not(.noads-blocked-element), ' +
    '.shopping-ad-card:not(.noads-blocked-element), ' +
    '.sparkle-container:not(.noads-blocked-element), ' +
    '[class*="AdHolder"]:not(.noads-blocked-element), ' +
    'div[data-component-type="sp-sponsored-result"]:not(.noads-blocked-element), ' +
    'div[id*="desktop-hqp-no-padding"]:not(.noads-blocked-element), ' +
    'div[class*="desktop-ad-"]:not(.noads-blocked-element), ' +
    'div[id*="sponsored-products-"]:not(.noads-blocked-element), ' +
    'div[class*="creative-card"]:not(.noads-blocked-element)'
  );

  targets.forEach(container => {
    const hasSponsoredTag = container.querySelector(
      '.puis-sponsored-label-text, ' +
      '.s-widget-sponsored-label-text, ' +
      'a[aria-label*="Sponsored"], ' +
      'a[aria-label*="sponsored"], ' +
      '[class*="sponsored-label"], ' +
      '[class*="sponsored-info"], ' +
      'a[href*="/gp/sponsored-products/"], ' +
      'a[href*="slredirect"]'
    );

    const isDirectAd = container.matches(
      '.shopping-ad-card, ' +
      '.sparkle-container, ' +
      '[class*="AdHolder"], ' +
      'div[data-component-type="sp-sponsored-result"], ' +
      'div[id*="desktop-hqp-no-padding"], ' +
      'div[class*="desktop-ad-"], ' +
      'div[id*="sponsored-products-"], ' +
      'div[class*="creative-card"]'
    );

    if (hasSponsoredTag || isDirectAd) {
      markAsBlocked(container);
    }
  });

  // 2. Multi-language and text matching scans (limited to labels to prevent false-positives on products)
  const potentialLabels = document.querySelectorAll(
    'span[class*="sponsored"]:not([data-noads-scanned]), ' +
    'a[class*="sponsored"]:not([data-noads-scanned]), ' +
    'span[class*="label"]:not([data-noads-scanned]), ' +
    'a[class*="label"]:not([data-noads-scanned]), ' +
    'span._ZGFyZ_ad-feedback-text-desktop_q3xp_:not([data-noads-scanned])'
  );
  
  potentialLabels.forEach(el => {
    el.setAttribute('data-noads-scanned', 'true');
    const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
    if (text) {
      const matchesText = SPONSORED_TEXTS.some(term => text.includes(term));
      if (matchesText && el.textContent.length < 25) {
        const container = findAdContainer(el);
        if (container) {
          markAsBlocked(container);
        }
      }
    }
  });
}

// Debounced wrapper to prevent performance bottlenecks on heavy DOM mutation pages
function debouncedScan() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanForAds, 60);
}

// Initialize content script
function init() {
  // Query blocker state
  chrome.storage.local.get({ enabled: true }, (data) => {
    blockerEnabled = data.enabled;
    if (blockerEnabled) {
      document.body.classList.add('noads-active');
      scanForAds();
    } else {
      document.body.classList.remove('noads-active');
    }
  });

  // Observe page updates using a throttled scanner
  observer = new MutationObserver(() => {
    if (blockerEnabled) {
      debouncedScan();
    }
  });

  // Restrict observer to the main search slots area if loaded, otherwise fallback to document.body
  const searchContainer = document.querySelector('div.s-main-slot') || document.querySelector('#search') || document.body;
  observer.observe(searchContainer, {
    childList: true,
    subtree: true
  });

  // Listen for toggles from extension popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'stateChanged') {
      blockerEnabled = message.enabled;
      if (blockerEnabled) {
        document.body.classList.add('noads-active');
        scanForAds();
      } else {
        document.body.classList.remove('noads-active');
      }
    }
  });
}

// Execute safely when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
