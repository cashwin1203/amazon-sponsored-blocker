# Walkthrough - Amazon Sponsored Product Blocker Extension (Stable Build)

The extension has been reverted to the stable build structure, which executes at `document_idle` and dynamically injects the stylesheet rules. This avoids loading collisions while maintaining all optimization, security, and storage persistence enhancements.

## Project Structure
`C:\Users\LENOVO\.gemini\antigravity\scratch\amazon-sponsored-blocker`

- **[src/](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/src):** Developmental source folder containing comments and formatting.
  - **[src/manifest.json](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/src/manifest.json):** Configuration containing a strict MV3 Content Security Policy (CSP), minimal permissions, and `document_idle` run instruction.
  - **[src/popup/](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/src/popup):** HTML, CSS, and JS popup dashboard using a promise-wrapped async request-response architecture.
  - **[src/scripts/background.js](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/src/scripts/background.js):** Service worker managing tab session counters in `chrome.storage.session` and totals in `chrome.storage.local`.
  - **[src/scripts/content.js](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/src/scripts/content.js):** Webpage DOM-scanning script. Injects style tag rules on load, runs debounced scans on MutationObserver updates, and safely cleans up if extension updates.
- **[dist/](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/dist):** Production build. All files are minified for optimized deployment.
- **[minify.py](file:///C:/Users/LENOVO/.gemini/antigravity/scratch/amazon-sponsored-blocker/minify.py):** Run-to-build script to compile files from `src/` to `dist/`.

---

## Loading the Stable Extension Build
To load the stable build:
1. Open Google Chrome.
2. Go to **`chrome://extensions/`**.
3. Toggle on **Developer mode** (top right).
4. Click **Reload** (circular arrow) on the **Amazon Sponsored Product Blocker** card to reload files from disk.
5. If loading for the first time, click **Load unpacked** (top left) and select:
   `C:\Users\LENOVO\.gemini\antigravity\scratch\amazon-sponsored-blocker\dist`
