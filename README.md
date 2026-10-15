# SmartApply — Smart Job Application Autofill Extension for Brave Browser (Manifest V3)

SmartApply is a privacy-first, local-only Manifest V3 browser extension designed for **Brave Browser** (and all Chromium-based browsers) and structured for easy customization in **Antigravity IDE**.

---

## 1. Architecture & Folder Structure

```text
brave-job-autofill-extension/
├── manifest.json                  # Manifest V3 configuration (minimal permissions: storage, activeTab, scripting)
├── README.md                      # Documentation, Brave installation, testing & alias guide
├── icons/                         # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── utils/
│   ├── sample-profile.js          # Schema + 3 preloaded sample profiles (General SDE, AI/ML, Data Analyst)
│   └── storage.js                 # Local storage wrapper (chrome.storage.local + completion calculator)
├── background/
│   └── service-worker.js          # MV3 background service worker for install initialization & tab routing
├── content/
│   ├── matcher.js                 # Multi-signal heuristic & alias field detection + Smart Suggestion engine
│   ├── autofill.js                # React/Vue/Angular-compatible value setter + DataTransfer resume helper
│   ├── content.js                 # Floating autofill button, review drawer, and MutationObserver for SPAs
│   └── widget.css                 # Scoped styles for the floating widget and status highlights
├── popup/
│   ├── popup.html                 # Brave toolbar popup UI
│   ├── popup.css                  # Toolbar popup styles
│   └── popup.js                   # Toolbar popup logic (profile switcher, completion bar, scan & autofill)
├── options/
│   ├── options.html               # Full Profile Setup & Management Dashboard
│   ├── options.css                # Responsive dashboard stylesheet
│   └── options.js                 # Profile CRUD, local PDF resume encoding, custom Q&A, JSON export/import
└── test/
    └── sample-job-application.html # Built-in test career portal with standard, ambiguous, and password fields
```

---

## 2. Step-by-Step Instructions to Load into Brave Browser

1. **Extract the Extension Folder**:
   Unzip `brave-job-autofill-extension.zip` on your computer and open the `brave-job-autofill-extension` folder in **Antigravity IDE**.
2. **Open Brave Extensions Page**:
   Open Brave Browser and navigate to:
   ```text
   brave://extensions
   ```
3. **Enable Developer Mode**:
   Toggle **Developer mode** ON in the top-right corner of the `brave://extensions` page.
4. **Load Unpacked**:
   Click **Load unpacked** in the top-left toolbar and select the `brave-job-autofill-extension` directory (the folder containing `manifest.json`).
5. **Pin the Extension**:
   Click the puzzle-piece Extensions icon in the Brave toolbar and pin **SmartApply** for one-click access.

---

## 3. Testing & Debugging Guide

1. **Test on the Built-in Career Portal Form**:
   - Click the SmartApply icon in the Brave toolbar and click **Open Test Job Form ↗** at the bottom, or open `test/sample-job-application.html` directly.
   - Click the floating **⚡ Autofill Job Form** button at the bottom-right of the page.
   - Click **⚡ Autofill Form (One Click)** to watch all matched personal, academic, coding profile, custom Q&A, and resume upload fields populate with green highlights.
   - Notice that the **Create Portal Password** field is intentionally ignored (`blocked` status) and the **Academic Score** field triggers a **Smart Suggestion** (`CGPA` vs `12th %` vs `10th %`) instead of guessing blindly.
2. **Switch Role Profiles**:
   - Switch between **General Software Engineer**, **AI / ML Engineer Profile**, and **Data Analyst Profile** from either the floating widget or toolbar popup and click Autofill again to see role-specific skills, projects, and resumes populate immediately.
3. **Debugging in Antigravity IDE & Brave DevTools**:
   - **Content Scripts (`matcher.js`, `autofill.js`, `content.js`)**: Right-click any job application webpage → **Inspect** → Console tab. After editing a file in Antigravity IDE, click the **Reload (↻)** button on `brave://extensions` and refresh the job portal tab.
   - **Popup (`popup.js`)**: Right-click the SmartApply toolbar icon → **Inspect popup**.
   - **Service Worker (`service-worker.js`)**: On `brave://extensions`, click the **service worker** link on the SmartApply card.

---

## 4. How to Add New Field Aliases in Antigravity IDE

Open `content/matcher.js` in Antigravity IDE and locate the `FIELD_RULES` array. Each field rule follows a declarative format:

```javascript
{
  key: "education.collegeName",
  label: "College / University Name",
  category: "Education",
  exactAliases: ["college", "college name", "university", "university name", "institution", "alma mater"],
  partialAliases: ["college", "university", "institution", "institute_name"],
  negativeAliases: ["10th", "12th", "high school"],
  getValue: (p) => p.education?.collegeName
}
```
- You can also add custom questions and comma-separated aliases directly in the UI without touching code via **Edit Profile → 💬 Reusable Application Answers & Custom Fields**.

---

## 5. Privacy, Security & Browser Limitations

- **100% Local Storage**: All profile fields, custom Q&A answers, and base64-encoded resume files are stored exclusively in `chrome.storage.local` inside your Brave browser profile. Zero external network requests, analytics, or third-party servers are used.
- **Sensitive Input Protection**: Inputs matching `type="password"`, credit cards (`cvv`, `cardnumber`), bank details, OTPs, or government IDs (`ssn`, `aadhaar`, `pan_number`) are hard-blocked in `matcher.js`.
- **Never Auto-Submits**: `autofill.js` dispatches `input`, `change`, and `blur` events so React/Angular/Vue state updates cleanly, but never invokes `form.submit()` or clicks submit buttons.
- **Known Browser Limitations**:
  - **Cross-Origin Sandboxed Iframes**: Some ATS embeds (e.g., certain third-party iframe widgets with restrictive CSP/sandbox attributes) may require clicking inside the frame or opening the frame URL directly.
  - **Custom File Dropzones**: Standard `<input type="file">` fields accept programmatic `DataTransfer` assignment in Chromium/Brave. However, custom JS dropzones that do not bind to an underlying `<input type="file">` require manually selecting your local file.
  - **Brave Shields**: Brave Shields does not block extension content scripts or `chrome.storage.local`, so SmartApply works seamlessly with Shields Up.
