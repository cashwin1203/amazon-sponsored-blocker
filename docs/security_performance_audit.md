# Security, Performance & Compliance Audit Report
## Amazon Sponsored Product Blocker Extension

---

## 1. Safety & Security Factors

### 1.1 Remote Resource Loading (Content Security Policy)
- **The Issue:** In `popup.css`, we import the Google Font via `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`.
- **Safety Risk:** Under Chrome's strict Manifest V3 Content Security Policy (CSP), extensions are **prohibited** from loading remote scripts, styles, or fonts. Loading external files can result in Chrome Web Store rejection or browser blockages.
- **The Solution:** Download the font files (`.woff2`) locally and bundle them within the extension directory, or use safe system fonts:
  ```css
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  ```

### 1.2 Orphaned Content Scripts (Extension Reload Crash)
- **The Issue:** When you update or reload the extension in `chrome://extensions/`, all existing Amazon tabs will still have the old content script running. However, their connection to the background worker is destroyed (orphaned).
- **Pain Point:** When these orphaned scripts attempt to trigger `chrome.runtime.sendMessage`, they will throw a silent but persistent console error: `Error: Extension context invalidated`.
- **The Solution:** Wrap communication scripts inside a verification loop. If the connection fails with context invalidation, disconnect the observer to prevent memory leak loops:
  ```javascript
  try {
    chrome.runtime.sendMessage(message);
  } catch (e) {
    if (e.message.includes("context invalidated")) {
      observer.disconnect(); // Stop observer on orphaned page
    }
  }
  ```

---

## 2. Performance & Memory Leaks

### 2.1 MutationObserver Scope Overhead
- **The Issue:** In `content.js`, we observe the entire body node recursively:
  ```javascript
  observer.observe(document.body, { childList: true, subtree: true });
  ```
- **Performance Leak:** Amazon search result pages dynamically adjust layout elements, hover menus, image lazy-loading, and auto-scrolling. Observing the *entire* DOM subtree causes the scanner to run hundreds of times per page load, leading to high CPU usage on slow machines.
- **The Solution:** Throttle the scanner using a debounce timer, or restrict the observer to watch only the search results area once loaded:
  ```javascript
  const searchSlot = document.querySelector('div.s-main-slot') || document.body;
  observer.observe(searchSlot, { childList: true, subtree: true });
  ```

### 2.2 Memory Leaking in Tab Tracking
- **The Issue:** Service worker state is ephemeral. In `background.js`, we clean up tab session data on `chrome.tabs.onRemoved`.
- **Safety Factor:** If a tab is redirected away from Amazon to another website (e.g., Google or YouTube), the session counts for that tab ID still linger in `chrome.storage.session` indefinitely because the tab was not closed (`onRemoved` did not fire).
- **The Solution:** Clear the tab count whenever the tab navigates to a non-Amazon domain:
  ```javascript
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && !changeInfo.url.includes('amazon.')) {
      removeSessionCountFromStorage(tabId);
    }
  });
  ```

---

## 3. Policy & Privacy Compliance

### 3.1 Strict Host Permissions
- **The Issue:** In `manifest.json`, we listed 20+ national Amazon domains (`.com`, `.co.uk`, etc.).
- **Chrome Web Store Audit:** Google reviewers look closely at broad host permissions. If you request access to 20 domains, you must justify it.
- **Alternative:** You can use `activeTab` permission combined with user click consent, but since this extension requires automatic background blocking, listing domains is necessary.
- **Recommendation:** Keep the list limited only to the regions you actually plan to target, or verify that the manifest matches local deployment needs.

---

## 4. Layout & User Experience Pain Points

### 4.1 Cumulative Layout Shift (CLS)
- **The Issue:** When elements are hidden *after* the browser finishes rendering the organic search results, the page layout changes shape, causing text and images to shift suddenly.
- **Pain Point:** This causes a jarring visual experience for the user.
- **Mitigation:** The CSS `:has()` stylesheet we added solves this natively because it hides elements *before* paint. Ensure JavaScript calculations are strictly background updates (updating stats).

### 4.2 False Positives (Organic Hiding)
- **The Issue:** If an organic product title contains the substring "sponsored" in its name (e.g., a book titled "The Sponsored Athlete"), our text check could accidentally match and hide it:
  ```javascript
  const matchesText = SPONSORED_TEXTS.some(term => text.includes(term));
  ```
- **Pain Point:** Hiding organic search results is a major user experience failure.
- **Mitigation:** Make the selector check more restrictive. Scan for text matches only within elements that are designated tag banners or buttons (e.g., elements containing `sponsored` or `label` in their class list), rather than full product card inner text.
