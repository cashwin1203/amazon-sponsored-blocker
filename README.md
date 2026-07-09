# 🚫 Amazon Sponsored Blocker

> A Chrome extension that removes sponsored product listings from Amazon search results — because you searched for *genuine recommendations*, not ads.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-yellow?logo=googlechrome)](https://github.com/cashwin1203/amazon-sponsored-blocker)
[![JavaScript](https://img.shields.io/badge/Built%20with-JavaScript-f1e05a?logo=javascript)](https://github.com/cashwin1203/amazon-sponsored-blocker)

---

## 🧩 Problem Statement

Amazon's search results increasingly surface **sponsored products** at the top and interspersed throughout organic listings. For a user searching for a specific product, this means:

- Extra scrolling to find genuine, relevancy-ranked results
- Decision fatigue from evaluating paid placements vs organic ones
- Loss of trust in search result quality over time

**This is a UX degradation problem masquerading as a business model.**

---

## 💡 Solution

A lightweight Chrome extension that:
1. Detects sponsored product cards in Amazon search results via DOM selectors
2. Removes them from the page in real time, before the user sees them
3. Runs passively — no UI, no setup, no ongoing interaction needed

---

## 📐 Design Decisions

| Decision | Trade-off |
|---|---|
| DOM removal vs CSS hiding | Chose DOM removal for cleaner layout reflow |
| No popup UI | Reduces friction — extension just works on install |
| Selector-based detection | Fast & lightweight; brittle if Amazon changes HTML |

---

## 🗺️ What I'd Build Next (PM Roadmap)

- [ ] **Analytics panel**: Ads blocked per session, estimated time saved
- [ ] **Toggle control**: Allow users to temporarily show sponsored content
- [ ] **Crowdsourced selectors**: Community-maintained list for resilience against Amazon HTML changes
- [ ] **Feedback signal**: "Was this a genuine product or an ad?" — improve detection accuracy

---

## 🛠️ Tech

- JavaScript (Manifest V3)
- Chrome Extension APIs
- DOM Manipulation

---

## 📦 Install

Clone the repo, go to `chrome://extensions`, enable Developer Mode, and load unpacked.

---

*Built by [Ashwin C](https://github.com/cashwin1203) — SWE at JPMorgan Chase, aspiring PM.*
