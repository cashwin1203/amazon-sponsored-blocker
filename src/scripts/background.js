// Background Service Worker for Amazon Sponsored Blocker
// Standalone helper functions to manage session values in Chrome Storage
async function getSessionCountFromStorage(tabId) {
  if (!tabId) return 0;
  const key = `session_${tabId}`;
  try {
    const storageArea = chrome.storage.session || chrome.storage.local;
    const result = await storageArea.get(key);
    return result[key] || 0;
  } catch (error) {
    console.error('[Background] Error reading session storage:', error);
    return 0;
  }
}

async function setSessionCountInStorage(tabId, count) {
  if (!tabId) return;
  const key = `session_${tabId}`;
  try {
    const storageArea = chrome.storage.session || chrome.storage.local;
    await storageArea.set({ [key]: count });
  } catch (error) {
    console.error('[Background] Error writing session storage:', error);
  }
}

async function removeSessionCountFromStorage(tabId) {
  if (!tabId) return;
  const key = `session_${tabId}`;
  try {
    const storageArea = chrome.storage.session || chrome.storage.local;
    await storageArea.remove(key);
  } catch (error) {
    console.error('[Background] Error removing session storage:', error);
  }
}

// Standalone Async Request-Response Handlers
async function handleIncrementBlocked(tabId, countToAdd, sendResponse) {
  try {
    const currentSessionCount = await getSessionCountFromStorage(tabId);
    const newSessionCount = currentSessionCount + countToAdd;
    await setSessionCountInStorage(tabId, newSessionCount);

    // Update action badge safely
    try {
      await chrome.action.setBadgeText({ text: newSessionCount.toString(), tabId: tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#06b6d4', tabId: tabId });
    } catch (badgeError) {
      // Tab might have closed already, ignore
    }

    // Update total blocked count in local storage
    const localData = await chrome.storage.local.get({ totalBlockedCount: 0 });
    const newTotal = localData.totalBlockedCount + countToAdd;
    await chrome.storage.local.set({ totalBlockedCount: newTotal });

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error in incrementBlocked handler:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSessionCount(tabId, sendResponse) {
  try {
    const count = await getSessionCountFromStorage(tabId);
    sendResponse({ sessionCount: count });
  } catch (error) {
    console.error('[Background] Error in getSessionCount handler:', error);
    sendResponse({ sessionCount: 0, error: error.message });
  }
}

async function handleResetSessionCount(tabId, sendResponse) {
  try {
    await removeSessionCountFromStorage(tabId);
    try {
      await chrome.action.setBadgeText({ text: '', tabId: tabId });
    } catch (badgeError) {
      // Ignore
    }
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error in resetSessionCount handler:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleToggleState(enabled, sendResponse) {
  try {
    // Notify all tabs of status change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && tab.url.includes('amazon.')) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'stateChanged', enabled: enabled });
        } catch (msgError) {
          // Ignore tabs where content scripts aren't loaded yet
        }
      }
    }

    // Update badges
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        if (!enabled) {
          await chrome.action.setBadgeText({ text: 'OFF', tabId: tab.id });
          await chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: tab.id });
        } else {
          const count = await getSessionCountFromStorage(tab.id);
          await chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '', tabId: tab.id });
          await chrome.action.setBadgeBackgroundColor({ color: '#06b6d4', tabId: tab.id });
        }
      } catch (badgeError) {
        // Ignore
      }
    }
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error in toggleState handler:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Root Message Listener (Strict: synchronous entry, returns true for async operation handlers)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab && sender.tab.id ? sender.tab.id : message.tabId;

  if (message.action === 'incrementBlocked') {
    handleIncrementBlocked(tabId, message.count || 1, sendResponse);
    return true; // Keep channel open for async handler response
  }

  if (message.action === 'getSessionCount') {
    handleGetSessionCount(tabId, sendResponse);
    return true; // Keep channel open
  }

  if (message.action === 'resetSessionCount') {
    handleResetSessionCount(tabId, sendResponse);
    return true; // Keep channel open
  }

  if (message.action === 'toggleState') {
    handleToggleState(message.enabled, sendResponse);
    return true; // Keep channel open
  }
});

// Clean up session storage when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  removeSessionCountFromStorage(tabId).catch(() => {});
});

// Clean up session storage when tab navigates to a non-Amazon website
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && !changeInfo.url.includes('amazon.')) {
    removeSessionCountFromStorage(tabId).catch(() => {});
    try {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    } catch (e) {
      // Ignore
    }
  }
});
