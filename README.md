# Amazon Sponsored Product Blocker

A lightweight, privacy-first Chrome Extension designed to identify and filter out sponsored search results, banner ads, and video promotions from Amazon search pages using Manifest V3 standards.

## Project Structure

The codebase is split into development and production targets:

* **src/**: Contains human-readable, fully documented source code.
  * **src/manifest.json**: Manifest V3 configuration containing strict Content Security Policies and minimal host permissions.
  * **src/popup/**: HTML, CSS, and Javascript popup dashboard.
  * **src/scripts/background.js**: Service Worker managing session counts in temporary session storage and totals in local storage.
  * **src/scripts/content.js**: Injects style rules at idle loading, processes debounced scans on mutations, and handles graceful context invalidation cleanups.
* **dist/**: Production distribution directory containing minified, optimized, and comment-free assets ready for deployment.
* **docs/**: Project specifications, including Product Requirement Documents (PRDs) and a security audit report.
* **icons/**: High-resolution logo assets.

## Key Features

* **Native Styling Blocker**: Dynamically injects styling rules using the CSS :has() selector to hide ads natively inside the browser layout engine, preventing page flicker and layout shifts.
* **Asynchronous Communication**: Employs async-wrapped message passing with structured try-catch blocks to prevent connection drops.
* **Service Worker Resilience**: Stores background states in chrome.storage instead of in-memory variables to preserve statistics when the browser terminates idle worker processes.
* **Local Processing**: Processes all scanning, blocking, and statistics rendering locally. The extension does not perform external network calls or track user telemetry.

## Installation (Developer Mode)

1. Open Google Chrome.
2. Navigate to chrome://extensions/ in the address bar.
3. Enable Developer Mode by toggling the switch in the top-right corner.
4. Click Load Unpacked in the top-left corner.
5. Select the dist/ directory within the repository:
   C:\Users\LENOVO\.gemini\antigravity\scratch\amazon-sponsored-blocker\dist

## Development and Build Guide

### Icon Generation
If you need to regenerate logo files, ensure Pillow (PIL) is installed on your system and run:
```bash
python generate_icons.py
```
This builds custom high-resolution shield logos.

### Code Compilation and Minification
The project relies on a build pipeline to package developmental files from src/ into the production dist/ folder. To compile, clean comments, and minify CSS/JS files, execute:
```bash
python minify.py
```

## License

This project is open-source and licensed under the MIT License.
