/**
 * content/content.js
 * Content script injected onto web pages.
 * Detects job application forms, renders the floating SmartApply button & popup panel,
 * supports MutationObserver for dynamically rendered SPA forms (Workday, Greenhouse, Lever, React),
 * and communicates with the toolbar popup.
 */
(function() {
  if (window.__smartApplyContentLoaded) return;
  window.__smartApplyContentLoaded = true;

  let currentState = null;
  let activeProfile = null;
  let scannedFields = [];
  let currentTabFilter = "all"; // "all" | "missing" | "suggestions"
  let isDismissedOnThisTab = false;

  async function refreshState() {
    currentState = await window.SmartApplyStorage.getState();
    activeProfile = await window.SmartApplyStorage.getActiveProfile();
    scannedFields = window.SmartApplyMatcher.scanPageFields(activeProfile);
  }

  const BLOCKED_DOMAINS = [
    "youtube.com",
    "google.com",
    "github.com",
    "x.com",
    "twitter.com",
    "reddit.com",
    "netflix.com"
  ];

  const JOB_KEYWORDS = [
    "apply",
    "careers",
    "career",
    "job",
    "jobs",
    "application",
    "workday",
    "greenhouse",
    "lever",
    "ashby",
    "smartrecruiters"
  ];

  function isBlockedDomain() {
    const host = (window.location.hostname || "").toLowerCase();
    if (!host) return false;
    return BLOCKED_DOMAINS.some((domain) => host === domain || host.endsWith("." + domain));
  }

  function hasJobKeywords() {
    const text = (window.location.href + " " + (document.title || "")).toLowerCase();
    return JOB_KEYWORDS.some((kw) => text.includes(kw));
  }

  function countMatchedFields() {
    return scannedFields.filter((f) => f.status === "matched" || f.status === "file_resume").length;
  }

  function isLikelyFormPage() {
    if (isDismissedOnThisTab) return false;
    if (isBlockedDomain()) return false;

    const inputs = document.querySelectorAll(
      "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"
    );
    if (inputs.length < 2) return false;

    const matchedCount = countMatchedFields();
    if (matchedCount === 0) return false;

    return matchedCount >= 3 || hasJobKeywords();
  }

  function updateWidgetVisibility() {
    const container = document.getElementById("smartapply-floating-container");
    const isEnabled = currentState?.settings?.showFloatingButton !== false;
    const matchedCount = countMatchedFields();

    if (!isEnabled || isDismissedOnThisTab || matchedCount === 0 || !isLikelyFormPage()) {
      if (container) {
        container.style.display = "none";
      }
      return;
    }

    if (!container) {
      createFloatingWidget();
    } else {
      container.style.display = "";
    }
    renderPanelContents();
  }

  function createFloatingWidget() {
    if (document.getElementById("smartapply-floating-container")) return;

    const container = document.createElement("div");
    container.id = "smartapply-floating-container";
    container.setAttribute("data-smartapply-ignore", "true");

    container.innerHTML = `
      <div id="sa-panel" class="sa-panel sa-hidden">
        <div class="sa-panel-header">
          <div class="sa-panel-title">
            <span>⚡ SmartApply Autofill</span>
          </div>
          <button id="sa-close-btn" class="sa-close-btn" title="Close">×</button>
        </div>
        <div class="sa-profile-bar">
          <span>Profile:</span>
          <select id="sa-profile-select" class="sa-profile-select"></select>
        </div>
        <div class="sa-actions-grid">
          <button id="sa-autofill-now-btn" class="sa-btn sa-btn-primary">⚡ Autofill Form (One Click)</button>
          <button id="sa-tab-review" class="sa-btn sa-btn-secondary sa-active">Review Matches</button>
          <button id="sa-tab-missing" class="sa-btn sa-btn-secondary">Missing Details</button>
          <button id="sa-tab-suggestions" class="sa-btn sa-btn-secondary">Smart Suggestions</button>
          <button id="sa-open-profile-btn" class="sa-btn sa-btn-secondary">Edit Profile ↗</button>
        </div>
        <div id="sa-status-banner" class="sa-status-banner"></div>
        <div id="sa-body-list" class="sa-body-list"></div>
        <div class="sa-footer-note">
          🔒 Local-only storage • Never auto-submits forms
        </div>
      </div>
      <div class="sa-fab-wrapper">
        <button id="sa-fab-trigger" class="sa-fab-btn" title="Open SmartApply Job Autofill">
          <span>⚡ Autofill Job Form</span>
          <span id="sa-fab-count" class="sa-fab-badge">0</span>
        </button>
        <button id="sa-fab-dismiss" class="sa-fab-dismiss-btn" title="Hide for this tab" aria-label="Dismiss">×</button>
      </div>
    `;

    document.body.appendChild(container);

    // Event bindings
    const panel = document.getElementById("sa-panel");
    const fabBtn = document.getElementById("sa-fab-trigger");
    const dismissBtn = document.getElementById("sa-fab-dismiss");
    const closeBtn = document.getElementById("sa-close-btn");
    const profileSelect = document.getElementById("sa-profile-select");
    const autofillBtn = document.getElementById("sa-autofill-now-btn");
    const tabReview = document.getElementById("sa-tab-review");
    const tabMissing = document.getElementById("sa-tab-missing");
    const tabSuggestions = document.getElementById("sa-tab-suggestions");
    const openProfileBtn = document.getElementById("sa-open-profile-btn");

    fabBtn.addEventListener("click", async () => {
      await refreshState();
      panel.classList.toggle("sa-hidden");
      renderPanelContents();
    });

    if (dismissBtn) {
      dismissBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isDismissedOnThisTab = true;
        const c = document.getElementById("smartapply-floating-container");
        if (c) c.style.display = "none";
      });
    }

    closeBtn.addEventListener("click", () => {
      panel.classList.add("sa-hidden");
    });

    profileSelect.addEventListener("change", async (e) => {
      await window.SmartApplyStorage.setActiveProfileId(e.target.value);
      await refreshState();
      renderPanelContents();
    });

    autofillBtn.addEventListener("click", async () => {
      await refreshState();
      const summary = window.SmartApplyAutofill.autofillDetectedFields(scannedFields, activeProfile);
      showStatusBanner(
        `Filled ${summary.filledCount} field(s)${summary.resumeAttached ? " + attached resume" : ""}. Review form before submitting.`
      );
      await refreshState();
      renderPanelContents();
    });

    tabReview.addEventListener("click", () => {
      currentTabFilter = "all";
      setActiveTabButton(tabReview);
      renderPanelContents();
    });

    tabMissing.addEventListener("click", () => {
      currentTabFilter = "missing";
      setActiveTabButton(tabMissing);
      renderPanelContents();
    });

    tabSuggestions.addEventListener("click", () => {
      currentTabFilter = "suggestions";
      setActiveTabButton(tabSuggestions);
      renderPanelContents();
    });

    openProfileBtn.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "OPEN_OPTIONS_PAGE" });
      } else {
        window.open("../options/options.html", "_blank");
      }
    });
  }

  function setActiveTabButton(activeBtn) {
    ["sa-tab-review", "sa-tab-missing", "sa-tab-suggestions"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle("sa-active", btn === activeBtn);
    });
  }

  function showStatusBanner(msg) {
    const banner = document.getElementById("sa-status-banner");
    if (!banner) return;
    banner.textContent = msg;
    banner.style.display = "block";
    setTimeout(() => {
      banner.style.display = "none";
    }, 5000);
  }

  function renderPanelContents() {
    const matchedCount = countMatchedFields();
    const container = document.getElementById("smartapply-floating-container");

    if (matchedCount === 0) {
      if (container) {
        container.style.display = "none";
      }
      return;
    }

    const countBadge = document.getElementById("sa-fab-count");
    if (countBadge) countBadge.textContent = String(matchedCount);

    const profileSelect = document.getElementById("sa-profile-select");
    if (profileSelect && currentState && currentState.profiles) {
      profileSelect.innerHTML = Object.values(currentState.profiles)
        .map(
          (p) =>
            `<option value="${p.id}" ${p.id === currentState.activeProfileId ? "selected" : ""}>${p.profileName}</option>`
        )
        .join("");
    }

    const listEl = document.getElementById("sa-body-list");
    if (!listEl) return;

    const allOptions = window.SmartApplyMatcher.getAllProfileOptions(activeProfile);
    let filtered = scannedFields;
    if (currentTabFilter === "missing") {
      filtered = scannedFields.filter((f) => f.status === "missing_profile_value" || f.status === "unmatched");
    } else if (currentTabFilter === "suggestions") {
      filtered = scannedFields.filter((f) => f.status === "suggestion" || f.status === "unmatched");
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="padding:18px;text-align:center;color:#64748b;font-size:12px;">No fields in this view.</div>`;
      return;
    }

    listEl.innerHTML = "";
    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "sa-field-card";

      let pillClass = "sa-pill-matched";
      let pillText = item.status === "file_resume" ? "Resume Upload" : `Matched (${Math.round(item.confidence * 100)}%)`;
      if (item.status === "missing_profile_value") {
        pillClass = "sa-pill-missing";
        pillText = "Empty in Profile";
      } else if (item.status === "suggestion" || item.status === "unmatched") {
        pillClass = "sa-pill-suggestion";
        pillText = item.status === "suggestion" ? "Smart Suggestion" : "Manual Pick";
      }

      const displayVal = item.value
        ? item.value
        : item.status === "missing_profile_value"
        ? "⚠️ Not set in active profile"
        : item.reason || "Select a profile field below to fill manually:";

      card.innerHTML = `
        <div class="sa-field-card-top">
          <span class="sa-field-name">${escapeHtml(item.signals.primaryDisplayLabel)}</span>
          <span class="sa-pill ${pillClass}">${pillText}</span>
        </div>
        <div class="sa-field-val">${escapeHtml(displayVal)}</div>
      `;

      // Smart suggestion quick buttons if available
      if ((item.status === "suggestion" || item.status === "unmatched") && item.suggestions && item.suggestions.length > 0) {
        const sugWrap = document.createElement("div");
        sugWrap.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;";
        item.suggestions.forEach((s) => {
          if (!s.value) return;
          const chip = document.createElement("button");
          chip.type = "button";
          chip.style.cssText = "font-size:11px;padding:3px 7px;border-radius:6px;border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;cursor:pointer;";
          chip.textContent = `Use ${s.label}: ${s.value.slice(0, 24)}`;
          chip.addEventListener("click", () => {
            window.SmartApplyAutofill.fillSingleField(item.element, s.value);
            showStatusBanner(`Filled "${item.signals.primaryDisplayLabel}" with ${s.label}`);
          });
          sugWrap.appendChild(chip);
        });
        card.appendChild(sugWrap);
      }

      // Manual field selector dropdown for any detected input
      if (item.status !== "file_resume") {
        const select = document.createElement("select");
        select.className = "sa-manual-select";
        select.innerHTML = `<option value="">— Manually choose a profile field to fill —</option>` +
          allOptions
            .map(
              (opt) =>
                `<option value="${escapeHtml(opt.key)}" ${opt.key === item.key ? "selected" : ""}>[${escapeHtml(opt.category)}] ${escapeHtml(opt.label)} (${escapeHtml((opt.value || "empty").slice(0, 25))})</option>`
            )
            .join("");
        select.addEventListener("change", (e) => {
          const val = window.SmartApplyMatcher.getValueByKey(activeProfile, e.target.value);
          if (val) {
            window.SmartApplyAutofill.fillSingleField(item.element, val);
            showStatusBanner(`Manually filled "${item.signals.primaryDisplayLabel}"`);
          }
        });
        card.appendChild(select);
      }

      listEl.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Listen for commands from Toolbar Popup
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg || !msg.action) return false;

      if (msg.action === "SCAN_PAGE") {
        refreshState().then(() => {
          const serialized = scannedFields.map((f) => ({
            index: f.index,
            fieldLabel: f.fieldLabel,
            pageLabel: f.signals.primaryDisplayLabel,
            status: f.status,
            confidence: f.confidence,
            value: f.value
          }));
          sendResponse({ ok: true, fields: serialized });
        });
        return true;
      }

      if (msg.action === "TRIGGER_AUTOFILL") {
        refreshState().then(() => {
          const summary = window.SmartApplyAutofill.autofillDetectedFields(scannedFields, activeProfile);
          renderPanelContents();
          sendResponse({ ok: true, summary });
        });
        return true;
      }

      if (msg.action === "SETTINGS_UPDATED") {
        if (currentState && msg.settings) {
          currentState.settings = msg.settings;
        }
        updateWidgetVisibility();
        sendResponse({ ok: true });
        return true;
      }

      return false;
    });
  }

  // Auto-sync setting updates across all open tabs
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes["smartapply_state_v1"]) {
        const newVal = changes["smartapply_state_v1"].newValue;
        if (newVal) {
          currentState = newVal;
          updateWidgetVisibility();
        }
      }
    });
  }

  async function init() {
    await refreshState();
    updateWidgetVisibility();

    // Observe dynamic DOM mutations (SPA portals like Workday, Greenhouse, Ashby)
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (isDismissedOnThisTab) return;
        await refreshState();
        updateWidgetVisibility();
      }, 600);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
