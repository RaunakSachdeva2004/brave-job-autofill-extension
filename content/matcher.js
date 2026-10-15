/**
 * content/matcher.js
 * Smart Form-Field Detection & Heuristic Matching Engine.
 * Inspects labels, placeholders, name/id attributes, ARIA attributes, nearby section headings,
 * and input types. Calculates a confidence score and identifies uncertain/ambiguous fields
 * for Smart Suggestions while strictly excluding passwords, payments, and sensitive auth inputs.
 */
(function(global) {
  const BLOCKED_KEYWORDS = [
    "password", "passcode", "passwd", "pin", "cvv", "cvc", "creditcard", "cardnumber",
    "routingnumber", "bankaccount", "ssn", "socialsecurity", "aadhaar", "pan_number",
    "otp", "verification_code", "captcha", "secret", "token"
  ];

  // Canonical field definitions with aliases, input type hints, and profile value getters
  const FIELD_RULES = [
    {
      key: "personal.fullName",
      label: "Full Name",
      category: "Personal",
      exactAliases: ["full name", "fullname", "applicant name", "candidate name", "your name", "legal name", "name"],
      partialAliases: ["full_name", "applicant_name", "candidate_name", "user_name"],
      negativeAliases: ["first", "last", "middle", "college", "university", "company", "project", "reference", "emergency", "father", "mother"],
      getValue: (p) => p.personal?.fullName
    },
    {
      key: "personal.firstName",
      label: "First Name",
      category: "Personal",
      exactAliases: ["first name", "firstname", "given name", "fname", "forename"],
      partialAliases: ["first_name", "given_name", "fname"],
      negativeAliases: [],
      getValue: (p) => p.personal?.firstName || (p.personal?.fullName ? p.personal.fullName.trim().split(/\s+/)[0] : "")
    },
    {
      key: "personal.lastName",
      label: "Last Name",
      category: "Personal",
      exactAliases: ["last name", "lastname", "surname", "family name", "lname"],
      partialAliases: ["last_name", "family_name", "lname", "surname"],
      negativeAliases: [],
      getValue: (p) => p.personal?.lastName || (p.personal?.fullName ? p.personal.fullName.trim().split(/\s+/).slice(1).join(" ") : "")
    },
    {
      key: "personal.email",
      label: "Email Address",
      category: "Personal",
      typeHint: "email",
      exactAliases: ["email", "email address", "e-mail", "e-mail address", "applicant email", "work email", "personal email"],
      partialAliases: ["email", "e_mail", "mail_id"],
      negativeAliases: ["confirm", "verify", "manager", "referrer"],
      getValue: (p) => p.personal?.email
    },
    {
      key: "personal.phone",
      label: "Phone Number",
      category: "Personal",
      typeHint: "tel",
      exactAliases: ["phone", "phone number", "mobile", "mobile number", "contact number", "telephone", "cell phone", "whatsapp number"],
      partialAliases: ["phone", "mobile", "tel", "contact_no", "cell"],
      negativeAliases: ["emergency", "alternate"],
      getValue: (p) => p.personal?.phone
    },
    {
      key: "personal.currentLocation",
      label: "Current Location / Address",
      category: "Personal",
      exactAliases: ["current location", "location", "address", "current city", "city, state", "residential address", "where are you based"],
      partialAliases: ["current_location", "user_location", "address_line", "homelocation"],
      negativeAliases: ["preferred", "desired", "relocate", "email", "url", "website"],
      getValue: (p) => p.personal?.currentLocation
    },
    {
      key: "personal.city",
      label: "City",
      category: "Personal",
      exactAliases: ["city", "town", "current city"],
      partialAliases: ["address_city", "user_city"],
      negativeAliases: ["university", "preferred"],
      getValue: (p) => p.personal?.city || (p.personal?.currentLocation ? p.personal.currentLocation.split(",")[0].trim() : "")
    },
    {
      key: "personal.dateOfBirth",
      label: "Date of Birth",
      category: "Personal",
      typeHint: "date",
      exactAliases: ["date of birth", "dob", "birth date", "birthdate", "birthday"],
      partialAliases: ["date_of_birth", "birth_date", "dob"],
      negativeAliases: ["graduation", "start", "end"],
      getValue: (p) => p.personal?.dateOfBirth
    },
    {
      key: "education.collegeName",
      label: "College / University Name",
      category: "Education",
      exactAliases: ["college", "college name", "university", "university name", "institution", "institution name", "school", "school / university", "alma mater"],
      partialAliases: ["college", "university", "institution", "institute_name", "school_name"],
      negativeAliases: ["10th", "12th", "high school", "secondary"],
      getValue: (p) => p.education?.collegeName
    },
    {
      key: "education.degree",
      label: "Degree / Qualification",
      category: "Education",
      exactAliases: ["degree", "highest degree", "qualification", "highest qualification", "education level", "degree type", "course"],
      partialAliases: ["degree", "qualification", "education_level", "course_name"],
      negativeAliases: [],
      getValue: (p) => p.education?.degree
    },
    {
      key: "education.branch",
      label: "Branch / Specialization",
      category: "Education",
      exactAliases: ["branch", "specialization", "major", "field of study", "discipline", "department", "stream"],
      partialAliases: ["branch", "specialization", "major", "field_of_study", "discipline", "stream"],
      negativeAliases: ["git", "bank"],
      getValue: (p) => p.education?.branch
    },
    {
      key: "education.cgpa",
      label: "Current GPA / CGPA",
      category: "Education",
      exactAliases: ["cgpa", "gpa", "current cgpa", "current gpa", "cumulative gpa", "ug cgpa", "college cgpa", "marks / cgpa"],
      partialAliases: ["cgpa", "gpa", "ug_score", "college_score"],
      negativeAliases: ["10th", "12th", "ssc", "hsc"],
      getValue: (p) => p.education?.cgpa
    },
    {
      key: "education.tenthScore",
      label: "10th Percentage / CGPA",
      category: "Education",
      exactAliases: ["10th percentage", "10th cgpa", "10th score", "10th marks", "ssc percentage", "matriculation percentage", "class 10 percentage", "10th %"],
      partialAliases: ["10th", "tenth", "ssc_score", "class_10", "matric"],
      negativeAliases: [],
      getValue: (p) => p.education?.tenthScore
    },
    {
      key: "education.twelfthScore",
      label: "12th Percentage / CGPA",
      category: "Education",
      exactAliases: ["12th percentage", "12th cgpa", "12th score", "12th marks", "hsc percentage", "intermediate percentage", "class 12 percentage", "12th %", "diploma percentage"],
      partialAliases: ["12th", "twelfth", "hsc_score", "class_12", "inter_score"],
      negativeAliases: [],
      getValue: (p) => p.education?.twelfthScore
    },
    {
      key: "education.graduationYear",
      label: "Graduation Year",
      category: "Education",
      exactAliases: ["graduation year", "year of graduation", "passing year", "year of passing", "batch", "expected graduation", "completion year"],
      partialAliases: ["grad_year", "graduation_year", "passing_year", "passout_year", "batch_year"],
      negativeAliases: ["10th", "12th"],
      getValue: (p) => p.education?.graduationYear
    },
    {
      key: "education.backlogs",
      label: "Active Backlogs / Arrears",
      category: "Education",
      exactAliases: ["backlogs", "active backlogs", "current backlogs", "number of backlogs", "arrears", "standing arrears"],
      partialAliases: ["backlog", "arrears", "active_backlog"],
      negativeAliases: [],
      getValue: (p) => p.education?.backlogs
    },
    {
      key: "professional.currentCompany",
      label: "Current / Last Company",
      category: "Professional",
      exactAliases: ["current company", "company name", "employer", "current employer", "organization", "most recent company"],
      partialAliases: ["current_company", "employer_name", "company_name", "org_name"],
      negativeAliases: ["linkedin", "github"],
      getValue: (p) => p.professional?.currentCompany
    },
    {
      key: "professional.currentTitle",
      label: "Current Job Title",
      category: "Professional",
      exactAliases: ["current title", "job title", "current designation", "designation", "current role"],
      partialAliases: ["current_title", "job_title", "designation"],
      negativeAliases: ["preferred", "desired", "applying for"],
      getValue: (p) => p.professional?.currentTitle
    },
    {
      key: "professional.totalExperienceYears",
      label: "Total Experience (Years)",
      category: "Professional",
      exactAliases: ["total experience", "years of experience", "work experience (years)", "experience in years", "relevant experience"],
      partialAliases: ["total_exp", "years_of_experience", "exp_years", "yoe"],
      negativeAliases: ["describe", "summary", "details"],
      getValue: (p) => p.professional?.totalExperienceYears
    },
    {
      key: "professional.technicalSkills",
      label: "Technical Skills",
      category: "Professional",
      exactAliases: ["technical skills", "skills", "key skills", "core competencies", "technologies", "programming languages", "tech stack"],
      partialAliases: ["tech_skills", "skill_set", "skills", "technologies"],
      negativeAliases: [],
      getValue: (p) => p.professional?.technicalSkills
    },
    {
      key: "professional.certifications",
      label: "Certifications",
      category: "Professional",
      exactAliases: ["certifications", "certificates", "licenses and certifications", "professional certifications", "courses and certifications"],
      partialAliases: ["certification", "certificates", "licenses"],
      negativeAliases: [],
      getValue: (p) => p.professional?.certifications
    },
    {
      key: "professional.workExperienceSummary",
      label: "Work Experience Summary",
      category: "Professional",
      exactAliases: ["work experience", "experience summary", "professional experience", "internship experience", "describe your work experience", "employment history"],
      partialAliases: ["work_experience", "experience_summary", "employment_history", "internship_details"],
      negativeAliases: ["years"],
      getValue: (p) => p.professional?.workExperienceSummary
    },
    {
      key: "professional.projectsSummary",
      label: "Projects Summary",
      category: "Professional",
      exactAliases: ["projects", "key projects", "academic projects", "personal projects", "project experience", "notable projects"],
      partialAliases: ["projects_summary", "project_details", "academic_projects"],
      negativeAliases: [],
      getValue: (p) => p.professional?.projectsSummary
    },
    {
      key: "socials.linkedin",
      label: "LinkedIn Profile URL",
      category: "Social & Coding",
      typeHint: "url",
      exactAliases: ["linkedin", "linkedin url", "linkedin profile", "linkedin link", "linkedin profile url"],
      partialAliases: ["linkedin", "linked_in"],
      negativeAliases: [],
      getValue: (p) => p.socials?.linkedin
    },
    {
      key: "socials.github",
      label: "GitHub Profile URL",
      category: "Social & Coding",
      typeHint: "url",
      exactAliases: ["github", "github url", "github profile", "github link", "github username", "git profile"],
      partialAliases: ["github", "git_hub"],
      negativeAliases: [],
      getValue: (p) => p.socials?.github
    },
    {
      key: "socials.leetcode",
      label: "LeetCode / Coding Profile URL",
      category: "Social & Coding",
      typeHint: "url",
      exactAliases: ["leetcode", "leetcode url", "leetcode profile", "coding profile", "codeforces", "hackerrank"],
      partialAliases: ["leetcode", "coding_profile", "hackerrank", "codechef"],
      negativeAliases: [],
      getValue: (p) => p.socials?.leetcode
    },
    {
      key: "socials.portfolio",
      label: "Portfolio / Personal Website",
      category: "Social & Coding",
      typeHint: "url",
      exactAliases: ["portfolio", "portfolio url", "portfolio website", "personal website", "website", "blog / portfolio"],
      partialAliases: ["portfolio", "personal_website", "website_url", "personal_site"],
      negativeAliases: ["linkedin", "github", "leetcode", "company"],
      getValue: (p) => p.socials?.portfolio
    },
    {
      key: "socials.otherLink",
      label: "Other Profile Link (Kaggle / HuggingFace / etc.)",
      category: "Social & Coding",
      typeHint: "url",
      exactAliases: ["other link", "additional link", "kaggle", "huggingface", "dribbble", "behance", "scholar"],
      partialAliases: ["other_link", "kaggle", "huggingface", "additional_url"],
      negativeAliases: [],
      getValue: (p) => p.socials?.otherLink
    },
    {
      key: "preferences.preferredRole",
      label: "Preferred Role / Position",
      category: "Job Preferences",
      exactAliases: ["preferred role", "desired role", "role applying for", "position applied for", "desired job title", "target role"],
      partialAliases: ["preferred_role", "desired_role", "position_applied", "role_interested"],
      negativeAliases: [],
      getValue: (p) => p.preferences?.preferredRole
    },
    {
      key: "preferences.preferredLocation",
      label: "Preferred Work Location",
      category: "Job Preferences",
      exactAliases: ["preferred location", "desired location", "location preference", "work location preference", "preferred city"],
      partialAliases: ["preferred_location", "desired_location", "loc_preference"],
      negativeAliases: [],
      getValue: (p) => p.preferences?.preferredLocation
    },
    {
      key: "preferences.employmentType",
      label: "Employment Type",
      category: "Job Preferences",
      exactAliases: ["employment type", "job type", "work type", "position type", "full-time / internship"],
      partialAliases: ["employment_type", "job_type", "work_type"],
      negativeAliases: [],
      getValue: (p) => p.preferences?.employmentType
    },
    {
      key: "preferences.noticePeriod",
      label: "Notice Period / Availability",
      category: "Job Preferences",
      exactAliases: ["notice period", "availability", "when can you start", "joining time", "earliest start date", "days to join"],
      partialAliases: ["notice_period", "joining_time", "can_start"],
      negativeAliases: [],
      getValue: (p) => p.preferences?.noticePeriod
    },
    {
      key: "preferences.expectedCtc",
      label: "Expected CTC / Salary",
      category: "Job Preferences",
      exactAliases: ["expected ctc", "expected salary", "desired salary", "desired compensation", "salary expectation"],
      partialAliases: ["expected_ctc", "expected_salary", "desired_compensation"],
      negativeAliases: [],
      getValue: (p) => p.preferences?.expectedCtc
    }
  ];

  // Ambiguous field patterns that trigger Smart Suggestions instead of blind auto-fill
  const AMBIGUOUS_PATTERNS = [
    {
      pattern: /(academic score|overall score|grade|marks obtained|percentage|academic performance)/i,
      reason: "Ambiguous academic metric — choose which saved score applies:",
      candidateKeys: ["education.cgpa", "education.twelfthScore", "education.tenthScore"]
    },
    {
      pattern: /(profile link|social link|online profile|web profile|url)/i,
      reason: "Generic URL field — choose which profile link to insert:",
      candidateKeys: ["socials.linkedin", "socials.github", "socials.portfolio", "socials.leetcode"]
    },
    {
      pattern: /(tell us about yourself|summary|bio|additional information|anything else)/i,
      reason: "Open-ended summary field — pick a saved summary or custom answer:",
      candidateKeys: ["professional.workExperienceSummary", "professional.projectsSummary", "custom:cf_why_hire"]
    }
  ];

  function normalizeText(str) {
    return (str || "")
      .toLowerCase()
      .replace(/[* requiredd:?()\[\]]/gi, " ")
      .replace(/[_\-./]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractElementSignals(el) {
    const id = el.getAttribute("id") || "";
    const name = el.getAttribute("name") || "";
    const placeholder = el.getAttribute("placeholder") || "";
    const ariaLabel = el.getAttribute("aria-label") || "";
    const autocomplete = el.getAttribute("autocomplete") || "";
    const dataTestId = el.getAttribute("data-testid") || el.getAttribute("data-qa") || "";

    let labelText = "";
    // 1. Explicit <label for="id">
    if (id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) labelText = lbl.innerText || lbl.textContent || "";
      } catch (e) {}
    }
    // 2. Wrapping <label>
    if (!labelText) {
      const parentLabel = el.closest("label");
      if (parentLabel) {
        const clone = parentLabel.cloneNode(true);
        clone.querySelectorAll("input, select, textarea").forEach((n) => n.remove());
        labelText = clone.innerText || clone.textContent || "";
      }
    }
    // 3. aria-labelledby
    if (!labelText && el.getAttribute("aria-labelledby")) {
      const ids = el.getAttribute("aria-labelledby").split(/\s+/);
      labelText = ids.map((i) => document.getElementById(i)?.textContent || "").join(" ");
    }
    // 4. Nearby container text (previous sibling label or parent form-group)
    let nearbyText = "";
    const prev = el.previousElementSibling;
    if (prev && ["LABEL", "SPAN", "DIV", "P", "STRONG"].includes(prev.tagName)) {
      nearbyText = prev.textContent || "";
    } else if (el.parentElement) {
      const group = el.closest(".form-group, .field, .input-group, [class*='field'], [class*='Input'], li, tr, div");
      if (group) {
        const lbl = group.querySelector("label, .label, [class*='label'], legend, h4, h5");
        if (lbl) nearbyText = lbl.textContent || "";
      }
    }

    // 5. Nearest section heading
    let sectionHeading = "";
    const section = el.closest("fieldset, section, .section, [class*='section']");
    if (section) {
      const h = section.querySelector("legend, h1, h2, h3, h4");
      if (h) sectionHeading = h.textContent || "";
    }

    const primaryDisplayLabel = (labelText || ariaLabel || nearbyText || placeholder || name || id || "Unnamed Field")
      .replace(/\s+/g, " ")
      .replace(/\*+$/, "")
      .trim()
      .slice(0, 80);

    return {
      id,
      name,
      placeholder,
      ariaLabel,
      autocomplete,
      dataTestId,
      labelText,
      nearbyText,
      sectionHeading,
      primaryDisplayLabel,
      combinedNormalized: normalizeText([labelText, ariaLabel, nearbyText, placeholder, name, id, dataTestId, autocomplete].join(" "))
    };
  }

  function isBlockedInput(el, signals) {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    if (["password", "hidden", "submit", "reset", "button", "image"].includes(type)) {
      return true;
    }
    const raw = (signals.combinedNormalized + " " + (el.id || "") + " " + (el.name || "")).toLowerCase();
    return BLOCKED_KEYWORDS.some((kw) => raw.includes(kw));
  }

  function getAllProfileOptions(profile) {
    const list = FIELD_RULES.map((r) => ({
      key: r.key,
      label: r.label,
      category: r.category,
      value: r.getValue(profile) || ""
    }));
    if (profile && Array.isArray(profile.customFields)) {
      for (const cf of profile.customFields) {
        list.push({
          key: `custom:${cf.id}`,
          label: `Custom: ${cf.label}`,
          category: "Custom Q&A",
          value: cf.value || ""
        });
      }
    }
    return list;
  }

  function getValueByKey(profile, key) {
    if (!profile || !key) return "";
    if (key.startsWith("custom:")) {
      const cfId = key.replace("custom:", "");
      const found = (profile.customFields || []).find((c) => c.id === cfId);
      return found ? found.value || "" : "";
    }
    const rule = FIELD_RULES.find((r) => r.key === key);
    if (rule) return rule.getValue(profile) || "";
    return "";
  }

  function matchInput(el, profile) {
    const signals = extractElementSignals(el);
    const type = (el.getAttribute("type") || el.tagName.toLowerCase()).toLowerCase();

    if (isBlockedInput(el, signals)) {
      return { status: "blocked", signals };
    }

    // Special handling for Resume File Upload (<input type="file">)
    if (type === "file") {
      const isResumeField = /(resume|cv|curriculum|upload|attachment)/i.test(signals.combinedNormalized) || true;
      if (isResumeField) {
        return {
          status: "file_resume",
          key: "professional.resumeFileName",
          fieldLabel: "Resume / CV File",
          confidence: 0.95,
          value: profile?.professional?.resumeFileName || "",
          hasResumeData: Boolean(profile?.professional?.resumeBase64),
          signals
        };
      }
    }

    const primaryNorm = normalizeText(signals.labelText || signals.ariaLabel || signals.nearbyText || signals.placeholder);
    const attrNorm = normalizeText([signals.name, signals.id, signals.dataTestId, signals.autocomplete].join(" "));
    const fullNorm = signals.combinedNormalized;

    // 1. Check Custom Q&A Fields first for long-form questions
    if (profile && Array.isArray(profile.customFields)) {
      for (const cf of profile.customFields) {
        const cfTargets = [cf.label, ...(cf.aliases || [])].map(normalizeText).filter(Boolean);
        for (const t of cfTargets) {
          if (t && (primaryNorm.includes(t) || fullNorm.includes(t))) {
            const val = (cf.value || "").trim();
            return {
              status: val ? "matched" : "missing_profile_value",
              key: `custom:${cf.id}`,
              fieldLabel: cf.label,
              category: "Custom Q&A",
              confidence: 0.92,
              value: val,
              suggestions: [],
              signals
            };
          }
        }
      }
    }

    // 2. Score standard rules
    let bestRule = null;
    let bestScore = 0;
    const candidateRules = [];

    for (const rule of FIELD_RULES) {
      // Check negative aliases
      if (rule.negativeAliases && rule.negativeAliases.some((neg) => primaryNorm.includes(neg))) {
        continue;
      }

      let score = 0;

      // Exact primary label match
      for (const ex of rule.exactAliases) {
        const normEx = normalizeText(ex);
        if (primaryNorm === normEx) {
          score = Math.max(score, 0.98);
        } else if (primaryNorm.includes(normEx) && normEx.length >= 4) {
          score = Math.max(score, 0.88);
        } else if (attrNorm === normEx || attrNorm.includes(normEx)) {
          score = Math.max(score, 0.84);
        }
      }

      // Partial alias match
      if (score < 0.84) {
        for (const pa of rule.partialAliases) {
          const normPa = normalizeText(pa);
          if (fullNorm.includes(normPa)) {
            score = Math.max(score, 0.76);
          }
        }
      }

      // Input type boost
      if (score > 0 && rule.typeHint && type === rule.typeHint) {
        score = Math.min(0.99, score + 0.08);
      } else if (score === 0 && rule.typeHint && type === rule.typeHint) {
        // E.g. <input type="email"> with generic label
        if (type === "email" && rule.key === "personal.email") score = 0.85;
        if (type === "tel" && rule.key === "personal.phone") score = 0.85;
      }

      if (score > 0) {
        candidateRules.push({ rule, score });
        if (score > bestScore) {
          bestScore = score;
          bestRule = rule;
        }
      }
    }

    // 3. Check if field matches an ambiguous pattern (e.g. "Academic Score")
    for (const amb of AMBIGUOUS_PATTERNS) {
      if (amb.pattern.test(primaryNorm) && bestScore < 0.92) {
        const suggestions = amb.candidateKeys.map((k) => {
          const r = FIELD_RULES.find((item) => item.key === k);
          return {
            key: k,
            label: r ? r.label : k,
            value: getValueByKey(profile, k)
          };
        });
        return {
          status: "suggestion",
          key: suggestions[0]?.key || "",
          fieldLabel: signals.primaryDisplayLabel,
          category: "Smart Suggestion",
          confidence: 0.62,
          reason: amb.reason,
          value: "",
          suggestions,
          signals
        };
      }
    }

    if (bestRule && bestScore >= 0.72) {
      const val = String(bestRule.getValue(profile) ?? "").trim();
      return {
        status: val !== "" ? "matched" : "missing_profile_value",
        key: bestRule.key,
        fieldLabel: bestRule.label,
        category: bestRule.category,
        confidence: Number(bestScore.toFixed(2)),
        value: val,
        suggestions: candidateRules
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((c) => ({
            key: c.rule.key,
            label: c.rule.label,
            value: String(c.rule.getValue(profile) ?? "").trim()
          })),
        signals
      };
    }

    // Uncertain / Low-confidence match -> offer Smart Suggestions
    return {
      status: "unmatched",
      key: "",
      fieldLabel: signals.primaryDisplayLabel,
      category: "Unmatched",
      confidence: bestScore,
      value: "",
      suggestions: [
        { key: "personal.fullName", label: "Full Name", value: getValueByKey(profile, "personal.fullName") },
        { key: "education.cgpa", label: "Current CGPA", value: getValueByKey(profile, "education.cgpa") },
        { key: "professional.technicalSkills", label: "Technical Skills", value: getValueByKey(profile, "professional.technicalSkills") }
      ],
      signals
    };
  }

  function scanPageFields(profile, rootNode = document) {
    const rawElements = Array.from(
      rootNode.querySelectorAll("input, textarea, select")
    ).filter((el) => {
      // Skip elements inside our own SmartApply widget
      if (el.closest("#smartapply-root-host") || el.closest("[data-smartapply-ignore='true']")) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return true;
    });

    const results = [];
    rawElements.forEach((el, index) => {
      const match = matchInput(el, profile);
      if (match.status === "blocked") return;
      results.push({
        index,
        element: el,
        ...match
      });
    });
    return results;
  }

  global.SmartApplyMatcher = {
    FIELD_RULES,
    scanPageFields,
    matchInput,
    getAllProfileOptions,
    getValueByKey
  };
})(typeof window !== "undefined" ? window : self);
