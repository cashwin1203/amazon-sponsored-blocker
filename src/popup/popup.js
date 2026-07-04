document.addEventListener('DOMContentLoaded', async () => {
  const powerToggle = document.getElementById('power-toggle');
  const statusText = document.getElementById('status-text');
  const statusIndicator = document.querySelector('.status-indicator');
  const sessionCountEl = document.getElementById('session-count');
  const totalCountEl = document.getElementById('total-count');
  const resetStatsBtn = document.getElementById('reset-stats');

  // Helper to update UI state
  function updateUIState(enabled) {
    if (enabled) {
      statusIndicator.classList.remove('disabled');
      statusText.textContent = 'Shield Active';
      powerToggle.checked = true;
    } else {
      statusIndicator.classList.add('disabled');
      statusText.textContent = 'Shield Paused';
      powerToggle.checked = false;
    }
  }

  // Standalone async function for message communications with structured try/catch
  async function sendTabMessage(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.warn('[Popup] Extension background channel dropped:', err.message);
            resolve({ success: false, error: err.message });
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (err) {
        console.error('[Popup] Critical error sending message:', err);
        resolve({ success: false, error: err.message });
      }
    });
  }

  // Get active tab info
  let tabId = null;
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = activeTab ? activeTab.id : null;
  } catch (err) {
    console.error('[Popup] Failed to query tabs:', err);
  }

  // Retrieve storage state
  chrome.storage.local.get({ enabled: true, totalBlockedCount: 0 }, (data) => {
    updateUIState(data.enabled);
    totalCountEl.textContent = data.totalBlockedCount;
  });

  // Query background for session count
  if (tabId) {
    const response = await sendTabMessage({ action: 'getSessionCount', tabId: tabId });
    if (response && typeof response.sessionCount === 'number') {
      sessionCountEl.textContent = response.sessionCount;
    }
  }

  // Handle Toggle Switch
  powerToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ enabled: isEnabled }, async () => {
      updateUIState(isEnabled);
      await sendTabMessage({ action: 'toggleState', enabled: isEnabled });
    });
  });

  // Handle Reset Stats
  resetStatsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.storage.local.set({ totalBlockedCount: 0 }, async () => {
      totalCountEl.textContent = '0';
      sessionCountEl.textContent = '0';
      if (tabId) {
        await sendTabMessage({ action: 'resetSessionCount', tabId: tabId });
      }
    });
  });
});
