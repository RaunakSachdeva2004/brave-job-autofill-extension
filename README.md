# SmartApply — Smart Job Application Autofill Extension for Brave Browser (Manifest V3)

SmartApply is a privacy-first, 100% local-storage Manifest V3 browser extension designed for **Brave Browser** (and all Chromium-based browsers) and optimized for rapid development and customization in **Antigravity IDE**.

---

## Table of Contents
1. [Architecture & Folder Structure](#1-architecture--folder-structure)
2. [Step-by-Step Installation in Brave](#2-step-by-step-installation-in-brave)
3. [How to Use SmartApply (Daily Workflow)](#3-how-to-use-smartapply-daily-workflow)
   - [3.1 Setting Up & Editing Profiles](#31-setting-up--editing-profiles)
   - [3.2 Uploading a Resume for Auto-Attachment](#32-uploading-a-resume-for-auto-attachment)
   - [3.3 Autofilling Job Applications on Any Career Portal](#33-autofilling-job-applications-on-any-career-portal)
   - [3.4 Using the Floating Widget & Smart Suggestions](#34-using-the-floating-widget--smart-suggestions)
   - [3.5 Adding Custom Questions & Reusable Answers](#35-adding-custom-questions--reusable-answers)
   - [3.6 Switching Role Profiles & JSON Export / Import](#36-switching-role-profiles--json-export--import)
4. [Testing with the Built-in Career Portal](#4-testing-with-the-built-in-career-portal)
5. [Developer & Debugging Guide](#5-developer--debugging-guide)
6. [How to Add New Field Aliases in Code](#6-how-to-add-new-field-aliases-in-code)
7. [Privacy, Security & Limitations](#7-privacy-security--limitations)

---

## 1. Architecture & Folder Structure

```text
brave-job-autofill-extension/
├── manifest.json                  # Manifest V3 configuration (permissions: storage, activeTab, scripting)
├── README.md                      # Complete user instructions, setup & developer guide
├── LICENSE                        # MIT License
├── .gitignore                     # Git ignore rules for node_modules, logs, OS files, and builds
├── icons/                         # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── utils/
│   ├── sample-profile.js          # Schema + 3 preloaded role profiles (General SDE, AI/ML, Data Analyst)
│   └── storage.js                 # chrome.storage.local wrapper & profile completion calculator
├── background/
│   └── service-worker.js          # MV3 service worker for extension install lifecycle & tab routing
├── content/
│   ├── matcher.js                 # Heuristic label matcher, alias detector, and Smart Suggestion engine
│   ├── autofill.js                # React/Vue/Angular-compatible DOM event dispatcher + DataTransfer resume upload
│   ├── content.js                 # Floating FAB with domain filter, dismiss button, review panel & MutationObserver
│   └── widget.css                 # Scoped stylesheet for floating widget, dismiss button, drawer & highlights
├── popup/
│   ├── popup.html                 # Brave toolbar popup UI with global floating button toggle switch
│   ├── popup.css                  # Toolbar popup styling with switch slider
│   └── popup.js                   # Profile switcher, completion progress bar, scanner, quick-fill & live toggle sync
├── options/
│   ├── options.html               # Full profile management & configuration dashboard
│   ├── options.css                # Responsive dashboard styling
│   └── options.js                 # Multi-profile CRUD, local PDF resume encoder, custom Q&A, JSON export/import
└── test/
    └── sample-job-application.html # Test career portal with standard, ambiguous, and sensitive fields
```

---

## 2. Step-by-Step Installation in Brave

1. **Open the Project**:
   Ensure this project directory (`brave-job-autofill-extension`) is saved on your computer.
2. **Open Brave Extensions Page**:
   In your Brave Browser address bar, navigate to:
   ```text
   brave://extensions
   ```
3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left toolbar.
   - In the file picker, select the `brave-job-autofill-extension` folder (the directory containing `manifest.json`).
5. **Pin SmartApply to the Toolbar**:
   - Click the puzzle-piece Extensions icon in the Brave address bar / toolbar.
   - Click the **Pin** icon next to **SmartApply — Job Application Autofill for Brave** for quick 1-click access.

---

## 3. How to Use SmartApply (Daily Workflow)

### 3.1 Setting Up & Editing Profiles
SmartApply comes preloaded with 3 role profiles (**General Software Engineer**, **AI / ML Engineer Profile**, and **Data Analyst Profile**) that you can customize with your actual details:

1. Click the **SmartApply** icon in your Brave toolbar.
2. Click **Open Profile Settings (⚙)** (or right-click the extension icon and choose **Options**).
3. The **Profile Dashboard** will open in a new tab:
   - **Profile Selector**: Choose which profile you want to edit or click **+ Add New Profile** to create a tailored profile (e.g. *Frontend Developer*, *DevOps Specialist*).
   - **Personal Information**: Enter your Full Name, First Name, Last Name, Email, Phone, Current City, and Date of Birth.
   - **Education**: College/University Name, Degree, Branch, CGPA, 10th & 12th Percentages, Graduation Year, and Backlogs.
   - **Work Experience & Technical Skills**: Current Company, Current Title, Total Experience (in years), comma-separated Technical Skills, Certifications, and Experience Summaries.
   - **Socials & Portfolios**: LinkedIn, GitHub, LeetCode/CodeChef, Portfolio URL, and other personal links.
   - **Job Preferences**: Preferred Role, Preferred Location, Notice Period (days), Expected CTC, and Work Authorization status.
4. Click **Save Profile Details** at the bottom. The completion meter at the top will update to show readiness.

### 3.2 Uploading a Resume for Auto-Attachment
SmartApply can automatically attach your resume PDF when job boards feature a file upload input (`<input type="file">`):

1. On the **Profile Dashboard**, scroll to the **Resume File (Local PDF)** section.
2. Click **Upload PDF Resume** and pick your resume file from your computer.
3. The file is read locally using the browser's `FileReader` API and saved as base64 in your local browser profile (`chrome.storage.local`).
4. **No file ever leaves your computer** or gets uploaded to any remote server.
5. You can attach different tailored resumes to different profiles (e.g. an ML-focused resume for the AI/ML profile, an SDE resume for the General profile).

### 3.3 Autofilling Job Applications on Any Career Portal
SmartApply works on modern ATS platforms (Greenhouse, Lever, Workday, Ashby, Taleo, BambooHR, LinkedIn Easy Apply / External, etc.) as well as company-specific career portals:

1. Open any job application page in Brave.
2. Make sure you have selected your desired active profile (via the toolbar popup or the floating widget).
3. Use either of two convenient ways to fill the form:
   - **Option A — Floating Action Button (Recommended)**: Look for the floating **⚡ Autofill Job Form** button at the bottom-right corner of the page. Click it to open the floating drawer, then click **⚡ Autofill Form (One Click)**.
   - **Option B — Brave Toolbar Popup**: Click the SmartApply extension icon in the Brave toolbar and click **⚡ Autofill Page**.
4. All recognized fields (Name, Email, Phone, College, Degree, Experience, Skills, LinkedIn, GitHub, etc.) will be automatically populated!
5. Inputs flash with a gentle green outline so you can immediately see what has been filled.

### 3.4 Using the Floating Widget & Smart Suggestions
The on-page floating widget (**⚡ Autofill Job Form**) provides real-time detection, instant autofill, and a built-in review drawer:

- **Smart Visibility & Site Filtering**: SmartApply automatically suppresses the floating button on non-job websites (such as YouTube, Google, GitHub, X/Twitter, Reddit, and Netflix). It only appears when:
  - The page contains at least 3 high-confidence matched job profile fields, **OR**
  - The URL or page title contains job-related keywords (`apply`, `careers`, `job`, `application`, `workday`, `greenhouse`, `lever`, `ashby`, `smartrecruiters`).
  - If 0 fields match on any page, the button is immediately hidden.
- **One-Click Tab Dismiss (`×`)**: If you don't need autofill on a specific tab, click the small **`×`** dismiss button right next to the floating pill to hide it for that tab without affecting other tabs.
- **Global Toolbar Toggle Switch**: Open the SmartApply toolbar popup at any time to toggle **"Show floating button on job pages"**. When switched off, the floating button is globally hidden across all tabs in real time.
- **Review Matches**: Shows a list of every detected input on the page and the exact value SmartApply filled in.
- **Missing Details**: Lists any inputs found on the job page where your active profile doesn't have a value set yet, prompting you to fill them in your profile.
- **Smart Suggestions**: Job applications often have ambiguous or multi-purpose inputs (e.g., a field named `"Score / Marks"` could be your CGPA, 12th percentage, or 10th percentage; or `"Profile URL"` could be GitHub or LinkedIn). Instead of guessing blindly, SmartApply detects these and provides 1-click suggestion chips so you can choose the right one.
- **SPA & Dynamic Forms**: When applying on single-page applications (React, Angular, Vue) where questions appear step-by-step or dynamically after selecting dropdowns, SmartApply uses a `MutationObserver` to automatically detect newly inserted inputs. Simply click **Review Matches** or **Autofill Form** on the next step.

### 3.5 Adding Custom Questions & Reusable Answers
Job applications frequently ask custom questions like *"Why do you want to work here?"*, *"Are you legally authorized to work in the country?"*, or *"Describe your greatest technical achievement"*:

1. Go to **Profile Dashboard (Options)**.
2. Scroll to **💬 Reusable Application Answers & Custom Fields**.
3. Click **+ Add Custom Q&A / Field**.
4. Enter:
   - **Question Title / Key**: e.g. `work_authorization_sponsorship`
   - **Your Answer**: e.g. `No, I do not require sponsorship now or in the future.`
   - **Matching Aliases (comma-separated)**: e.g. `sponsorship, visa sponsorship, legal authorization, require visa`
5. Click **Save Profile Details**.
6. When a job portal has an input or textarea matching any of those aliases, SmartApply will automatically fill your saved response.

### 3.6 Switching Role Profiles & JSON Export / Import
- **Instant Role Switching**: Use the profile dropdown in either the toolbar popup or the on-page floating widget to switch between your profiles (e.g., SDE vs AI/ML). When you switch, clicking Autofill immediately uses the newly selected profile.
- **Backup via Export JSON**: In the Profile Dashboard, click **Export JSON** to download a backup file of all your saved profiles, custom questions, and preferences.
- **Restore via Import JSON**: Click **Import JSON** to load your profile configuration onto another computer, browser profile, or after a clean reinstall.

---

## 4. Testing with the Built-in Career Portal

SmartApply includes an offline test career portal covering real-world application form patterns:

1. Click the SmartApply icon in the toolbar and click **Open Test Job Form ↗** at the bottom (or open `test/sample-job-application.html` directly in Brave).
2. Click the floating **⚡ Autofill Job Form** button at the bottom-right.
3. Click **⚡ Autofill Form (One Click)**.
4. Verify the test results:
   - Personal information, Education, Experience, and Social links populate automatically.
   - The PDF resume is attached to the resume file input with a confirmation pill.
   - The **Create Portal Password** input is **safely blocked/ignored** (status: `blocked`).
   - The ambiguous **Academic Score** field triggers a **Smart Suggestion** (`CGPA` vs `12th %` vs `10th %`).
   - Custom questions (e.g. *"Why do you want to join?"*) populate from the custom fields engine.

---

## 5. Developer & Debugging Guide

When customizing SmartApply in **Antigravity IDE**:

1. **Content Scripts (`content/matcher.js`, `content/autofill.js`, `content/content.js`)**:
   - Right-click anywhere on the webpage → **Inspect** → **Console** tab.
   - After editing content scripts in Antigravity IDE, go to `brave://extensions`, click the **Reload (↻)** icon on SmartApply, and refresh the active web page.
2. **Toolbar Popup (`popup/popup.js`, `popup/popup.html`)**:
   - Right-click the SmartApply extension icon in the Brave toolbar → **Inspect popup**.
3. **Background Service Worker (`background/service-worker.js`)**:
   - Navigate to `brave://extensions` and click the **service worker** link inside the SmartApply card to open its dedicated DevTools console.
4. **Options Page (`options/options.js`, `options/options.html`)**:
   - Right-click anywhere in the Options dashboard → **Inspect**.

---

## 6. How to Add New Field Aliases in Code

To add new built-in heuristic rules for recognizing specific job portal inputs, open `content/matcher.js` and locate `FIELD_RULES`. Add or extend rules using this structure:

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

- `exactAliases`: Strings compared against normalized input `name`, `id`, `placeholder`, and `<label>` text.
- `partialAliases`: Substrings searched within labels or attributes.
- `negativeAliases`: Terms that disqualify false matches (e.g., prevent high school fields from matching college).
- `getValue`: Accessor function returning the value from the active profile object.

---

## 7. Privacy, Security & Limitations

- **100% Local Storage**: All profiles, contact details, answers, and encoded resume files are stored strictly within `chrome.storage.local` inside your local browser. No data is ever transmitted to external servers, analytics providers, or cloud APIs.
- **Sensitive Input Protection**: SmartApply explicitly filters and hard-blocks inputs matching passwords (`type="password"`), payment cards (`cvv`, `cardnumber`), banking credentials, OTPs, and national IDs (`ssn`, `aadhaar`, `pan_number`).
- **Never Auto-Submits**: SmartApply dispatches standard `input`, `change`, and `blur` events so frontend frameworks (React, Vue, Angular) register the updated values, but **never clicks the submit button** or calls `form.submit()`. You always retain full control to review the form before submitting.
- **Cross-Origin Sandboxed Iframes**: For job forms rendered inside sandboxed third-party iframes with strict cross-origin policies, click inside the iframe or right-click to open the frame URL in its own tab.
- **Custom File Dropzones**: Standard `<input type="file">` fields accept programmatic file attachment via the HTML5 `DataTransfer` API. Custom drag-and-drop dropzones that do not maintain an underlying `<input type="file">` element will require selecting the file manually.
- **Brave Shields Compatibility**: SmartApply operates completely client-side and does not make external network requests, ensuring full functionality with **Brave Shields** enabled.
