/**
 * popup/popup.js
 * Controller for the Brave toolbar popup.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const profileSelect = document.getElementById("active-profile-select");
  const completionPercent = document.getElementById("completion-percent");
  const completionBar = document.getElementById("completion-bar");
  const completionSubtext = document.getElementById("completion-subtext");
  const openDashboardBtn = document.getElementById("open-dashboard-btn");
  const autofillBtn = document.getElementById("autofill-page-btn");
  const scanBtn = document.getElementById("scan-page-btn");
  const scanList = document.getElementById("scan-list");
  const scanCountPill = document.getElementById("scan-count-pill");
  const alertBox = document.getElementById("popup-alert");
  const toggleFloatingBtn = document.getElementById("toggle-floating-btn");

  function showAlert(msg, isError = false) {
    alertBox.textContent = msg;
    alertBox.style.background = isError ? "#fef2f2" : "#ecfdf5";
    alertBox.style.color = isError ? "#991b1b" : "#065f46";
    alertBox.style.borderColor = isError ? "#fecaca" : "#a7f3d0";
    alertBox.classList.remove("hidden");
  }

  async function renderPopupState() {
    const state = await window.SmartApplyStorage.getState();
    const profile = await window.SmartApplyStorage.getActiveProfile();

    if (toggleFloatingBtn) {
      toggleFloatingBtn.checked = state.settings?.showFloatingButton !== false;
    }

    profileSelect.innerHTML = Object.values(state.profiles)
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === state.activeProfileId ? "selected" : ""}>${p.profileName}</option>`
      )
      .join("");

    const comp = window.SmartApplyStorage.calculateCompletion(profile);
    completionPercent.textContent = `${comp.percent}%`;
    completionBar.style.width = `${comp.percent}%`;
    completionSubtext.textContent =
      comp.missing.length === 0
        ? `All ${comp.total} core profile fields saved!`
        : `${comp.filled}/${comp.total} fields ready • Missing: ${comp.missing.slice(0, 2).join(", ")}${comp.missing.length > 2 ? "..." : ""}`;
  }

  if (toggleFloatingBtn) {
    toggleFloatingBtn.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      const state = await window.SmartApplyStorage.getState();
      if (!state.settings) {
        state.settings = { showFloatingButton: true, highlightFilledFields: true, minConfidenceThreshold: 0.72 };
      }
      state.settings.showFloatingButton = isEnabled;
      await window.SmartApplyStorage.setState(state);
      sendTabMessage({ action: "SETTINGS_UPDATED", settings: state.settings }, () => {});
    });
  }

  profileSelect.addEventListener("change", async (e) => {
    await window.SmartApplyStorage.setActiveProfileId(e.target.value);
    await renderPopupState();
    scanActiveTab();
  });

  openDashboardBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("../options/options.html", "_blank");
    }
  });

  function sendTabMessage(payload, callback) {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.runtime || !chrome.runtime.id) {
      if (payload.action !== "SETTINGS_UPDATED") {
        showAlert("Open this popup from the Brave extension toolbar on an active web page.", true);
      }
      return;
    }
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime && chrome.runtime.lastError) return;
        const tab = tabs && tabs[0];
        if (!tab || !tab.id) {
          if (payload.action !== "SETTINGS_UPDATED") {
            showAlert("No active tab detected.", true);
          }
          return;
        }
        try {
          chrome.tabs.sendMessage(tab.id, payload, (response) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              if (payload.action !== "SETTINGS_UPDATED") {
                showAlert("Please reload the job page once after updating the extension.", true);
              }
              return;
            }
            if (!response) {
              if (payload.action !== "SETTINGS_UPDATED") {
                showAlert("Refresh the job page once after installing/updating the extension, or open the Test Job Form below.", true);
              }
              return;
            }
            if (callback) callback(response);
          });
        } catch (e) {
          if (payload.action !== "SETTINGS_UPDATED") {
            showAlert("Please reload the job page once after updating the extension.", true);
          }
        }
      });
    } catch (e) {}
  }

  function scanActiveTab() {
    sendTabMessage({ action: "SCAN_PAGE" }, (res) => {
      if (!res || !res.fields) return;
      const fields = res.fields;
      const matched = fields.filter((f) => f.status === "matched" || f.status === "file_resume");
      scanCountPill.textContent = `${matched.length} / ${fields.length} matched`;

      if (fields.length === 0) {
        scanList.innerHTML = `<div class="empty-note">No form fields found on this page.</div>`;
        return;
      }

      scanList.innerHTML = fields
        .map(
          (f) => `
          <div class="scan-item">
            <strong>${f.pageLabel}</strong>
            <span class="scan-item-val">${f.value ? f.value : f.status === "missing_profile_value" ? "⚠️ Empty" : "💡 Suggestion"}</span>
          </div>
        `
        )
        .join("");
    });
  }

  scanBtn.addEventListener("click", scanActiveTab);

  autofillBtn.addEventListener("click", () => {
    sendTabMessage({ action: "TRIGGER_AUTOFILL" }, (res) => {
      if (res && res.summary) {
        showAlert(`Autofilled ${res.summary.filledCount} field(s)! Review the form before submitting.`);
        scanActiveTab();
      }
    });
  });

  await renderPopupState();
  scanActiveTab();
});
