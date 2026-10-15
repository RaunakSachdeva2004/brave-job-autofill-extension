/**
 * utils/storage.js
 * Local-only storage manager wrapping chrome.storage.local with automatic fallback
 * to localStorage for standalone testing in browser tabs.
 */
(function(global) {
  const STORAGE_KEY = "smartapply_state_v1";

  function hasChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  }

  function createInitialState() {
    const defaults = global.SmartApplyDefaults;
    return {
      activeProfileId: "general",
      settings: {
        showFloatingButton: true,
        highlightFilledFields: true,
        minConfidenceThreshold: 0.72
      },
      profiles: defaults ? defaults.clone(defaults.SAMPLE_PROFILES) : {}
    };
  }

  const SmartApplyStorage = {
    async getState() {
      if (hasChromeStorage()) {
        return new Promise((resolve) => {
          chrome.storage.local.get([STORAGE_KEY], (res) => {
            if (res && res[STORAGE_KEY] && res[STORAGE_KEY].profiles) {
              resolve(res[STORAGE_KEY]);
            } else {
              const initial = createInitialState();
              chrome.storage.local.set({ [STORAGE_KEY]: initial }, () => resolve(initial));
            }
          });
        });
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.profiles) return parsed;
        }
      } catch (e) {
        // Ignore storage error
      }
      const initial = createInitialState();
      await this.setState(initial);
      return initial;
    },

    async setState(newState) {
      if (hasChromeStorage()) {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [STORAGE_KEY]: newState }, () => resolve(newState));
        });
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        // Ignore storage error
      }
      return newState;
    },

    async getActiveProfile() {
      const state = await this.getState();
      const id = state.activeProfileId || "general";
      return state.profiles[id] || Object.values(state.profiles)[0] || global.SmartApplyDefaults.clone(global.SmartApplyDefaults.EMPTY_PROFILE);
    },

    async setActiveProfileId(profileId) {
      const state = await this.getState();
      if (state.profiles[profileId]) {
        state.activeProfileId = profileId;
        await this.setState(state);
      }
      return state;
    },

    async saveProfile(profile) {
      const state = await this.getState();
      const id = profile.id || state.activeProfileId || "general";
      profile.id = id;
      profile.updatedAt = new Date().toISOString();
      // Auto-derive firstName and lastName if fullName changed and they are empty
      if (profile.personal && profile.personal.fullName) {
        const parts = profile.personal.fullName.trim().split(/\s+/);
        if (!profile.personal.firstName) profile.personal.firstName = parts[0] || "";
        if (!profile.personal.lastName) profile.personal.lastName = parts.slice(1).join(" ") || "";
      }
      state.profiles[id] = profile;
      state.activeProfileId = id;
      await this.setState(state);
      return profile;
    },

    async createProfile(profileId, profileName, baseProfileId) {
      const state = await this.getState();
      const defaults = global.SmartApplyDefaults;
      const template = (baseProfileId && state.profiles[baseProfileId])
        ? defaults.clone(state.profiles[baseProfileId])
        : defaults.clone(defaults.EMPTY_PROFILE);
      template.id = profileId;
      template.profileName = profileName;
      template.updatedAt = new Date().toISOString();
      state.profiles[profileId] = template;
      state.activeProfileId = profileId;
      await this.setState(state);
      return template;
    },

    async resetToSampleData() {
      const initial = createInitialState();
      await this.setState(initial);
      return initial;
    },

    async clearAllData() {
      const defaults = global.SmartApplyDefaults;
      const emptyProfile = defaults.clone(defaults.EMPTY_PROFILE);
      const blankState = {
        activeProfileId: "general",
        settings: {
          showFloatingButton: true,
          highlightFilledFields: true,
          minConfidenceThreshold: 0.72
        },
        profiles: {
          general: emptyProfile
        }
      };
      await this.setState(blankState);
      return blankState;
    },

    calculateCompletion(profile) {
      if (!profile) return { percent: 0, filled: 0, total: 0, missing: [] };
      const checks = [
        { key: "personal.fullName", label: "Full Name", val: profile.personal?.fullName },
        { key: "personal.email", label: "Email Address", val: profile.personal?.email },
        { key: "personal.phone", label: "Phone Number", val: profile.personal?.phone },
        { key: "personal.currentLocation", label: "Current Location", val: profile.personal?.currentLocation },
        { key: "personal.dateOfBirth", label: "Date of Birth", val: profile.personal?.dateOfBirth },
        { key: "education.tenthScore", label: "10th Percentage/CGPA", val: profile.education?.tenthScore },
        { key: "education.twelfthScore", label: "12th Percentage/CGPA", val: profile.education?.twelfthScore },
        { key: "education.collegeName", label: "College / University", val: profile.education?.collegeName },
        { key: "education.degree", label: "Degree", val: profile.education?.degree },
        { key: "education.branch", label: "Branch / Specialization", val: profile.education?.branch },
        { key: "education.cgpa", label: "Current CGPA / GPA", val: profile.education?.cgpa },
        { key: "education.graduationYear", label: "Graduation Year", val: profile.education?.graduationYear },
        { key: "professional.technicalSkills", label: "Technical Skills", val: profile.professional?.technicalSkills },
        { key: "professional.workExperienceSummary", label: "Work Experience", val: profile.professional?.workExperienceSummary },
        { key: "professional.projectsSummary", label: "Projects", val: profile.professional?.projectsSummary },
        { key: "professional.resumeFileName", label: "Resume File", val: profile.professional?.resumeFileName },
        { key: "socials.linkedin", label: "LinkedIn URL", val: profile.socials?.linkedin },
        { key: "socials.github", label: "GitHub URL", val: profile.socials?.github },
        { key: "socials.leetcode", label: "LeetCode URL", val: profile.socials?.leetcode },
        { key: "socials.portfolio", label: "Portfolio Website", val: profile.socials?.portfolio },
        { key: "preferences.preferredRole", label: "Preferred Role", val: profile.preferences?.preferredRole },
        { key: "preferences.preferredLocation", label: "Preferred Location", val: profile.preferences?.preferredLocation },
        { key: "preferences.employmentType", label: "Employment Type", val: profile.preferences?.employmentType },
        { key: "preferences.noticePeriod", label: "Notice Period", val: profile.preferences?.noticePeriod }
      ];
      let filled = 0;
      const missing = [];
      for (const item of checks) {
        if (item.val !== undefined && item.val !== null && String(item.val).trim() !== "") {
          filled++;
        } else {
          missing.push(item.label);
        }
      }
      const percent = Math.round((filled / checks.length) * 100);
      return { percent, filled, total: checks.length, missing };
    }
  };

  global.SmartApplyStorage = SmartApplyStorage;
})(typeof window !== "undefined" ? window : self);
