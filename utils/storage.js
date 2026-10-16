/**
 * utils/storage.js
 * Local-only storage manager wrapping chrome.storage.local with automatic fallback
 * to localStorage for standalone testing in browser tabs.
 */
(function(global) {
  const STORAGE_KEY = "smartapply_state_v1";

  function isExtensionContextValid() {
    try {
      return typeof chrome !== "undefined" && Boolean(chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function hasChromeStorage() {
    try {
      return isExtensionContextValid() && Boolean(chrome.storage && chrome.storage.local);
    } catch (e) {
      return false;
    }
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

  function readLocalStorageState() {
    try {
      if (typeof localStorage === "undefined") return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles) {
          if (!parsed.settings) {
            parsed.settings = { showFloatingButton: true, highlightFilledFields: true, minConfidenceThreshold: 0.72 };
          } else if (parsed.settings.showFloatingButton === undefined) {
            parsed.settings.showFloatingButton = true;
          }
          return parsed;
        }
      }
    } catch (e) {
      // Ignore storage error
    }
    return null;
  }

  function writeLocalStorageState(newState) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
    } catch (e) {
      // Ignore storage error
    }
  }

  const SmartApplyStorage = {
    isExtensionValid: isExtensionContextValid,

    async getState() {
      if (hasChromeStorage()) {
        try {
          return await new Promise((resolve) => {
            try {
              chrome.storage.local.get([STORAGE_KEY], (res) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  const fallback = readLocalStorageState() || createInitialState();
                  return resolve(fallback);
                }
                if (res && res[STORAGE_KEY] && res[STORAGE_KEY].profiles) {
                  const state = res[STORAGE_KEY];
                  if (!state.settings) {
                    state.settings = { showFloatingButton: true, highlightFilledFields: true, minConfidenceThreshold: 0.72 };
                  } else if (state.settings.showFloatingButton === undefined) {
                    state.settings.showFloatingButton = true;
                  }
                  resolve(state);
                } else {
                  const initial = createInitialState();
                  try {
                    chrome.storage.local.set({ [STORAGE_KEY]: initial }, () => resolve(initial));
                  } catch (e) {
                    resolve(initial);
                  }
                }
              });
            } catch (syncErr) {
              const fallback = readLocalStorageState() || createInitialState();
              resolve(fallback);
            }
          });
        } catch (e) {
          const fallback = readLocalStorageState() || createInitialState();
          return fallback;
        }
      }

      const localState = readLocalStorageState();
      if (localState) return localState;

      const initial = createInitialState();
      await this.setState(initial);
      return initial;
    },

    async setState(newState) {
      if (hasChromeStorage()) {
        try {
          return await new Promise((resolve) => {
            try {
              chrome.storage.local.set({ [STORAGE_KEY]: newState }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  writeLocalStorageState(newState);
                }
                resolve(newState);
              });
            } catch (err) {
              writeLocalStorageState(newState);
              resolve(newState);
            }
          });
        } catch (err) {
          writeLocalStorageState(newState);
          return newState;
        }
      }
      writeLocalStorageState(newState);
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
