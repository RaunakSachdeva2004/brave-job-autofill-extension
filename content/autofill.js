/**
 * content/autofill.js
 * Executes safe, non-submitting DOM value injection compatible with vanilla HTML forms
 * as well as React, Vue, and Angular controlled inputs via native value setter + synthetic events.
 * Also handles local resume file attachment via DataTransfer where browser security permits.
 */
(function(global) {
  function setNativeValue(el, value) {
    const tag = el.tagName.toLowerCase();
    const proto = tag === "textarea"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function fillSelectElement(selectEl, targetValue) {
    if (!targetValue) return false;
    const normTarget = targetValue.toLowerCase().trim();
    const options = Array.from(selectEl.options);

    // 1. Exact value or text match
    let bestOpt = options.find(
      (o) => o.value.toLowerCase().trim() === normTarget || o.text.toLowerCase().trim() === normTarget
    );
    // 2. Substring match (e.g. "B.Tech" inside "Bachelor of Technology (B.Tech)")
    if (!bestOpt) {
      bestOpt = options.find((o) => {
        const t = o.text.toLowerCase().trim();
        const v = o.value.toLowerCase().trim();
        return (t && (normTarget.includes(t) || t.includes(normTarget))) ||
               (v && (normTarget.includes(v) || v.includes(normTarget)));
      });
    }

    if (bestOpt) {
      selectEl.value = bestOpt.value;
      selectEl.dispatchEvent(new Event("input", { bubbles: true }));
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }

  function attachResumeToFileInput(fileInput, profile) {
    const base64 = profile?.professional?.resumeBase64;
    const fileName = profile?.professional?.resumeFileName || "Resume.pdf";
    const mimeType = profile?.professional?.resumeMimeType || "application/pdf";

    if (!base64) {
      return { ok: false, reason: "No saved resume file found in active profile." };
    }

    try {
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      highlightElement(fileInput, "filled");
      return { ok: true, fileName };
    } catch (err) {
      return {
        ok: false,
        reason: "Browser security prevented automatic file assignment. Use the manual upload picker with your saved resume."
      };
    }
  }

  function highlightElement(el, state) {
    if (!el || !el.style) return;
    el.dataset.smartapplyState = state;
    if (state === "filled") {
      el.style.transition = "box-shadow 0.25s ease, border-color 0.25s ease";
      el.style.borderColor = "#10b981";
      el.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.18)";
    } else if (state === "missing") {
      el.style.transition = "box-shadow 0.25s ease, border-color 0.25s ease";
      el.style.borderColor = "#f59e0b";
      el.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.22)";
    } else if (state === "suggestion") {
      el.style.transition = "box-shadow 0.25s ease, border-color 0.25s ease";
      el.style.borderColor = "#6366f1";
      el.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.22)";
    }
  }

  function fillSingleField(el, value) {
    if (!el || value === undefined || value === null || String(value).trim() === "") return false;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute("type") || "text").toLowerCase();

    if (type === "file") return false;

    if (tag === "select") {
      const ok = fillSelectElement(el, String(value));
      if (ok) highlightElement(el, "filled");
      return ok;
    }

    if (type === "checkbox" || type === "radio") {
      const normVal = String(value).toLowerCase();
      const elVal = (el.value || "").toLowerCase();
      if (elVal === normVal || ["true", "yes", "1"].includes(normVal)) {
        el.checked = true;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        highlightElement(el, "filled");
        return true;
      }
      return false;
    }

    setNativeValue(el, String(value));
    highlightElement(el, "filled");
    return true;
  }

  /**
   * Autofills all high-confidence matched fields on the page.
   * NEVER triggers form.submit() or clicks submit buttons.
   */
  function autofillDetectedFields(scannedFields, profile, customOverrides = {}) {
    let filledCount = 0;
    let resumeAttached = false;
    const missingFields = [];
    const suggestionFields = [];

    for (const item of scannedFields) {
      const overrideVal = customOverrides[item.index];
      if (overrideVal !== undefined && overrideVal !== "") {
        if (fillSingleField(item.element, overrideVal)) {
          filledCount++;
        }
        continue;
      }

      if (item.status === "file_resume") {
        const res = attachResumeToFileInput(item.element, profile);
        if (res.ok) {
          resumeAttached = true;
          filledCount++;
        }
        continue;
      }

      if (item.status === "matched" && item.value) {
        if (fillSingleField(item.element, item.value)) {
          filledCount++;
        }
      } else if (item.status === "missing_profile_value") {
        highlightElement(item.element, "missing");
        missingFields.push(item);
      } else if (item.status === "suggestion") {
        highlightElement(item.element, "suggestion");
        suggestionFields.push(item);
      }
    }

    return {
      filledCount,
      resumeAttached,
      missingCount: missingFields.length,
      suggestionCount: suggestionFields.length
    };
  }

  global.SmartApplyAutofill = {
    fillSingleField,
    attachResumeToFileInput,
    autofillDetectedFields,
    highlightElement
  };
})(typeof window !== "undefined" ? window : self);
