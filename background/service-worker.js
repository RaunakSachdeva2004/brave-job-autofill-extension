/**
 * background/service-worker.js
 * Manifest V3 Service Worker for SmartApply.
 * Initializes default sample profiles on first install and handles cross-view actions
 * (like opening the options/dashboard tab from content scripts).
 */
importScripts("../utils/sample-profile.js", "../utils/storage.js");

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await self.SmartApplyStorage.getState();
    console.log("[SmartApply] Initialized local profile storage on install.");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  if (message.action === "OPEN_OPTIONS_PAGE") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === "GET_ACTIVE_PROFILE") {
    self.SmartApplyStorage.getActiveProfile().then((profile) => {
      sendResponse({ ok: true, profile });
    });
    return true; // keep channel open for async response
  }

  return false;
});
