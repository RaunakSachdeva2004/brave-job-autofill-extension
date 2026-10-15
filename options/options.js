/**
 * options/options.js
 * Full Profile Dashboard controller: handles multi-profile switching, editing all fields,
 * local PDF resume encoding, custom Q&A snippets, JSON export/import, and profile deletion.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const FIELD_PATHS = [
    "personal.fullName",
    "personal.firstName",
    "personal.lastName",
    "personal.email",
    "personal.phone",
    "personal.currentLocation",
    "personal.dateOfBirth",
    "education.collegeName",
    "education.degree",
    "education.branch",
    "education.cgpa",
    "education.graduationYear",
    "education.backlogs",
    "education.tenthScore",
    "education.twelfthScore",
    "professional.currentCompany",
    "professional.currentTitle",
    "professional.totalExperienceYears",
    "professional.technicalSkills",
    "professional.certifications",
    "professional.workExperienceSummary",
    "professional.projectsSummary",
    "socials.linkedin",
    "socials.github",
    "socials.leetcode",
    "socials.portfolio",
    "socials.otherLink",
    "preferences.preferredRole",
    "preferences.preferredLocation",
    "preferences.employmentType",
    "preferences.noticePeriod",
    "preferences.expectedCtc",
    "preferences.workAuthorization"
  ];

  let activeProfile = null;

  const variantSelect = document.getElementById("profile-variant-select");
  const headingEl = document.getElementById("current-profile-heading");
  const profileNameInput = document.getElementById("profileName");
  const compPercentEl = document.getElementById("dash-comp-percent");
  const compBarEl = document.getElementById("dash-comp-bar");
  const compMissingEl = document.getElementById("dash-comp-missing");
  const customContainer = document.getElementById("custom-fields-container");
  const resumeInput = document.getElementById("resume-file-input");
  const resumeStatusText = document.getElementById("resume-status-text");
  const toastBanner = document.getElementById("toast-banner");

  function showToast(message, isWarning = false) {
    toastBanner.textContent = message;
    toastBanner.style.background = isWarning ? "#fef3c7" : "#ecfdf5";
    toastBanner.style.color = isWarning ? "#92400e" : "#065f46";
    toastBanner.style.borderColor = isWarning ? "#fde68a" : "#a7f3d0";
    toastBanner.classList.remove("hidden");
    setTimeout(() => {
      toastBanner.classList.add("hidden");
    }, 4500);
  }

  function getNested(obj, path) {
    return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  }

  function setNested(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
      if (!acc[part]) acc[part] = {};
      return acc[part];
    }, obj);
    target[last] = value;
  }

  async function loadDashboard() {
    const state = await window.SmartApplyStorage.getState();
    activeProfile = await window.SmartApplyStorage.getActiveProfile();

    variantSelect.innerHTML = Object.values(state.profiles)
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === state.activeProfileId ? "selected" : ""}>${p.profileName}</option>`
      )
      .join("");

    headingEl.textContent = activeProfile.profileName || "Job Profile";
    profileNameInput.value = activeProfile.profileName || "";

    FIELD_PATHS.forEach((path) => {
      const el = document.getElementById(path);
      if (el) {
        el.value = getNested(activeProfile, path) ?? "";
      }
    });

    if (activeProfile.professional?.resumeFileName) {
      resumeStatusText.textContent = `Saved locally: ${activeProfile.professional.resumeFileName}`;
    } else {
      resumeStatusText.textContent = "No resume file stored in this profile yet.";
    }

    renderCustomFields();
    updateCompletionMeter();
  }

  function updateCompletionMeter() {
    const comp = window.SmartApplyStorage.calculateCompletion(activeProfile);
    compPercentEl.textContent = `${comp.percent}%`;
    compBarEl.style.width = `${comp.percent}%`;
    compMissingEl.textContent =
      comp.missing.length === 0
        ? "100% Complete — Ready for one-click autofill!"
        : `Missing (${comp.missing.length}): ${comp.missing.slice(0, 4).join(", ")}${comp.missing.length > 4 ? "..." : ""}`;
  }

  function renderCustomFields() {
    customContainer.innerHTML = "";
    const list = activeProfile.customFields || [];
    list.forEach((cf, idx) => {
      const row = document.createElement("div");
      row.className = "custom-field-item";
      row.innerHTML = `
        <div class="custom-field-top">
          <div class="form-field">
            <label>Question / Field Label</label>
            <input type="text" class="cf-label" data-idx="${idx}" value="${escapeAttr(cf.label)}" placeholder="e.g., Why should we hire you?" />
          </div>
          <div class="form-field">
            <label>Matching Keywords / Aliases (comma-separated)</label>
            <input type="text" class="cf-aliases" data-idx="${idx}" value="${escapeAttr((cf.aliases || []).join(", "))}" placeholder="why hire you, pitch yourself, cover letter" />
          </div>
          <button type="button" class="btn-danger cf-remove-btn" data-idx="${idx}">Remove</button>
        </div>
        <div class="form-field">
          <label>Reusable Answer</label>
          <textarea class="cf-value" data-idx="${idx}" rows="2" placeholder="Your saved response...">${escapeHtml(cf.value || "")}</textarea>
        </div>
      `;
      customContainer.appendChild(row);
    });

    customContainer.querySelectorAll(".cf-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.currentTarget.getAttribute("data-idx"));
        activeProfile.customFields.splice(i, 1);
        renderCustomFields();
      });
    });
  }

  function collectFormIntoProfile() {
    activeProfile.profileName = profileNameInput.value.trim() || "Job Application Profile";
    FIELD_PATHS.forEach((path) => {
      const el = document.getElementById(path);
      if (el) {
        setNested(activeProfile, path, el.value.trim());
      }
    });

    // Collect custom fields
    const labels = customContainer.querySelectorAll(".cf-label");
    const aliases = customContainer.querySelectorAll(".cf-aliases");
    const values = customContainer.querySelectorAll(".cf-value");
    const updatedCustom = [];
    for (let i = 0; i < labels.length; i++) {
      const lbl = labels[i].value.trim();
      if (!lbl) continue;
      updatedCustom.push({
        id: activeProfile.customFields?.[i]?.id || `cf_${Date.now()}_${i}`,
        label: lbl,
        aliases: aliases[i].value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        value: values[i].value.trim()
      });
    }
    activeProfile.customFields = updatedCustom;
  }

  // Save button
  document.getElementById("save-profile-btn").addEventListener("click", async () => {
    collectFormIntoProfile();
    await window.SmartApplyStorage.saveProfile(activeProfile);
    await loadDashboard();
    showToast(`Saved "${activeProfile.profileName}" locally!`);
  });

  // Switch active profile variant
  variantSelect.addEventListener("change", async (e) => {
    await window.SmartApplyStorage.setActiveProfileId(e.target.value);
    await loadDashboard();
    showToast(`Switched active profile to "${activeProfile.profileName}".`);
  });

  // Resume upload handler (encodes locally to Base64 in chrome.storage.local)
  resumeInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast("Please select a resume file under 4 MB for local extension storage.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      activeProfile.professional = activeProfile.professional || {};
      activeProfile.professional.resumeFileName = file.name;
      activeProfile.professional.resumeMimeType = file.type || "application/pdf";
      activeProfile.professional.resumeBase64 = base64;
      resumeStatusText.textContent = `Saved locally: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      await window.SmartApplyStorage.saveProfile(activeProfile);
      updateCompletionMeter();
      showToast(`Resume "${file.name}" stored locally!`);
    };
    reader.readAsDataURL(file);
  });

  // Add custom Q&A field
  document.getElementById("add-custom-field-btn").addEventListener("click", () => {
    collectFormIntoProfile();
    activeProfile.customFields = activeProfile.customFields || [];
    activeProfile.customFields.push({
      id: `cf_${Date.now()}`,
      label: "New Custom Question",
      aliases: ["custom question"],
      value: ""
    });
    renderCustomFields();
  });

  // Load sample dummy data
  document.getElementById("load-sample-btn").addEventListener("click", async () => {
    await window.SmartApplyStorage.resetToSampleData();
    await loadDashboard();
    showToast("Restored sample profiles (General SDE, AI/ML Engineer, Data Analyst)!");
  });

  // Create new profile modal
  const modal = document.getElementById("new-profile-modal");
  const newNameInput = document.getElementById("new-profile-name-input");
  document.getElementById("new-profile-btn").addEventListener("click", () => {
    newNameInput.value = "";
    modal.classList.remove("hidden");
  });
  document.getElementById("cancel-new-profile-btn").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  document.getElementById("confirm-new-profile-btn").addEventListener("click", async () => {
    const name = newNameInput.value.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString().slice(-3);
    await window.SmartApplyStorage.createProfile(id, name, activeProfile?.id);
    modal.classList.add("hidden");
    await loadDashboard();
    showToast(`Created new profile "${name}"!`);
  });

  // Export JSON
  document.getElementById("export-json-btn").addEventListener("click", async () => {
    const state = await window.SmartApplyStorage.getState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartapply-profiles-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported all profiles to JSON.");
  });

  // Import JSON
  document.getElementById("import-json-input").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed.profiles || typeof parsed.profiles !== "object") {
          showToast("Invalid backup JSON format: missing 'profiles' object.", true);
          return;
        }
        await window.SmartApplyStorage.setState(parsed);
        await loadDashboard();
        showToast("Imported profile backup successfully!");
      } catch (err) {
        showToast("Failed to parse JSON file.", true);
      }
    };
    reader.readAsText(file);
  });

  // Delete All Data
  document.getElementById("delete-all-btn").addEventListener("click", async () => {
    await window.SmartApplyStorage.clearAllData();
    await loadDashboard();
    showToast("All saved profile data has been wiped from local storage.", true);
  });

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  await loadDashboard();
});
