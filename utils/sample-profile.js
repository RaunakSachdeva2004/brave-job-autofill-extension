/**
 * utils/sample-profile.js
 * Provides default schema, empty profile template, and sample dummy profiles for testing.
 */
(function(global) {
  const EMPTY_PROFILE = {
    id: "general",
    profileName: "General Job Application",
    updatedAt: new Date().toISOString(),
    personal: {
      fullName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      currentLocation: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      dateOfBirth: ""
    },
    education: {
      tenthScore: "",
      twelfthScore: "",
      collegeName: "",
      degree: "",
      branch: "",
      cgpa: "",
      graduationYear: "",
      backlogs: "0"
    },
    professional: {
      currentCompany: "",
      currentTitle: "",
      totalExperienceYears: "",
      technicalSkills: "",
      certifications: "",
      workExperienceSummary: "",
      projectsSummary: "",
      resumeFileName: "",
      resumeMimeType: "application/pdf",
      resumeBase64: ""
    },
    socials: {
      linkedin: "",
      github: "",
      leetcode: "",
      portfolio: "",
      otherLink: ""
    },
    preferences: {
      preferredRole: "",
      preferredLocation: "",
      employmentType: "Full-time",
      noticePeriod: "",
      expectedCtc: "",
      workAuthorization: "Authorized to work"
    },
    customFields: [
      {
        id: "cf_why_hire",
        label: "Why should we hire you?",
        aliases: ["why hire you", "why are you a good fit", "pitch yourself", "why join us"],
        value: ""
      },
      {
        id: "cf_best_project",
        label: "Describe your best project",
        aliases: ["best project", "challenging project", "most proud project", "key project"],
        value: ""
      }
    ]
  };

  const SAMPLE_PROFILES = {
    "general": {
      id: "general",
      profileName: "General Software Engineer",
      updatedAt: "2026-10-15T10:00:00.000Z",
      personal: {
        fullName: "Aarav Sharma",
        firstName: "Aarav",
        lastName: "Sharma",
        email: "aarav.sharma.dev@example.com",
        phone: "+91 9876543210",
        currentLocation: "Bengaluru, Karnataka, India",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        postalCode: "560001",
        dateOfBirth: "2003-05-14"
      },
      education: {
        tenthScore: "94.6%",
        twelfthScore: "92.8%",
        collegeName: "Vellore Institute of Technology",
        degree: "Bachelor of Technology (B.Tech)",
        branch: "Computer Science and Engineering",
        cgpa: "9.12",
        graduationYear: "2025",
        backlogs: "0"
      },
      professional: {
        currentCompany: "NovaStack Labs",
        currentTitle: "Software Engineer Intern",
        totalExperienceYears: "1",
        technicalSkills: "JavaScript, TypeScript, Python, React, Node.js, PostgreSQL, Docker, AWS, Git",
        certifications: "AWS Certified Cloud Practitioner, Meta Front-End Developer Certificate",
        workExperienceSummary: "Software Engineer Intern at NovaStack Labs (Jan 2025 - Present): Built REST & GraphQL microservices in Node.js and TypeScript, reducing p95 API latency by 38% and automating CI/CD pipelines.",
        projectsSummary: "1. SmartApply Browser Extension: Built a privacy-first Manifest V3 autofill engine using heuristic DOM analysis.\n2. CloudPulse Telemetry: Distributed log aggregation dashboard in React, Go, and ClickHouse handling 50k events/sec.",
        resumeFileName: "Aarav_Sharma_Resume_2026.pdf",
        resumeMimeType: "application/pdf",
        resumeBase64: "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiA+PgplbmRvYmoKJSVFT0YK"
      },
      socials: {
        linkedin: "https://www.linkedin.com/in/aarav-sharma-dev",
        github: "https://github.com/aarav-sharma-dev",
        leetcode: "https://leetcode.com/u/aarav_sharma",
        portfolio: "https://aaravsharma.dev",
        otherLink: "https://kaggle.com/aaravsharma"
      },
      preferences: {
        preferredRole: "Software Development Engineer (SDE-1 / Full Stack)",
        preferredLocation: "Bengaluru, Hyderabad, Pune, or Remote",
        employmentType: "Full-time",
        noticePeriod: "Immediate / 15 Days",
        expectedCtc: "14 LPA",
        workAuthorization: "Authorized to work in India without sponsorship"
      },
      customFields: [
        {
          id: "cf_why_hire",
          label: "Why should we hire you?",
          aliases: ["why hire you", "why are you a good fit", "pitch yourself", "why join us", "cover letter"],
          value: "I combine strong Computer Science fundamentals (9.12 CGPA, 500+ algorithmic problems solved) with hands-on production experience shipping full-stack TypeScript/Python systems. I love taking ownership of end-to-end features and writing clean, maintainable code."
        },
        {
          id: "cf_best_project",
          label: "Describe your best project",
          aliases: ["best project", "challenging project", "most proud project", "key project", "project details"],
          value: "My flagship project is CloudPulse Telemetry, an open-source real-time observability platform built with React, Node.js, and ClickHouse. It ingests 50,000+ log events per second with sub-200ms query latency and features automated anomaly alerting."
        }
      ]
    },
    "aiml": {
      id: "aiml",
      profileName: "AI / ML Engineer Profile",
      updatedAt: "2026-10-15T10:00:00.000Z",
      personal: {
        fullName: "Aarav Sharma",
        firstName: "Aarav",
        lastName: "Sharma",
        email: "aarav.sharma.dev@example.com",
        phone: "+91 9876543210",
        currentLocation: "Bengaluru, Karnataka, India",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        postalCode: "560001",
        dateOfBirth: "2003-05-14"
      },
      education: {
        tenthScore: "94.6%",
        twelfthScore: "92.8%",
        collegeName: "Vellore Institute of Technology",
        degree: "Bachelor of Technology (B.Tech)",
        branch: "Computer Science (AI & Machine Learning)",
        cgpa: "9.12",
        graduationYear: "2025",
        backlogs: "0"
      },
      professional: {
        currentCompany: "NovaStack Labs",
        currentTitle: "Machine Learning Intern",
        totalExperienceYears: "1",
        technicalSkills: "Python, PyTorch, TensorFlow, Scikit-Learn, LangChain, RAG, HuggingFace, FastAPI, Docker, SQL",
        certifications: "DeepLearning.AI Machine Learning Specialization, AWS Cloud Practitioner",
        workExperienceSummary: "ML Intern at NovaStack Labs: Fine-tuned domain-specific embedding models and built hybrid BM25 + dense vector retrieval pipelines, improving retrieval recall@10 by 24%.",
        projectsSummary: "1. MedRAG Assistant: Clinical literature retrieval-augmented generation pipeline using PyTorch & Qdrant.\n2. VisionDefect: Automated PCB defect segmentation using YOLOv8 with 96.4% mAP.",
        resumeFileName: "Aarav_Sharma_AIML_Resume.pdf",
        resumeMimeType: "application/pdf",
        resumeBase64: "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiA+PgplbmRvYmoKJSVFT0YK"
      },
      socials: {
        linkedin: "https://www.linkedin.com/in/aarav-sharma-dev",
        github: "https://github.com/aarav-sharma-dev",
        leetcode: "https://leetcode.com/u/aarav_sharma",
        portfolio: "https://aaravsharma.dev/ai",
        otherLink: "https://huggingface.co/aaravsharma"
      },
      preferences: {
        preferredRole: "AI / Machine Learning Engineer",
        preferredLocation: "Bengaluru, Hyderabad, or Remote",
        employmentType: "Full-time",
        noticePeriod: "Immediate",
        expectedCtc: "16 LPA",
        workAuthorization: "Authorized to work in India"
      },
      customFields: [
        {
          id: "cf_why_hire",
          label: "Why should we hire you?",
          aliases: ["why hire you", "why are you a good fit", "pitch yourself", "why join us"],
          value: "I bridge model experimentation and production ML engineering—from training and evaluating PyTorch/Transformer models to serving low-latency inference APIs with FastAPI and Docker."
        },
        {
          id: "cf_best_project",
          label: "Describe your best project",
          aliases: ["best project", "challenging project", "most proud project", "key project"],
          value: "MedRAG Assistant: Built a hybrid retrieval and citation-verifying RAG pipeline over 120k biomedical abstracts, reducing hallucinated citations by 62%."
        }
      ]
    },
    "data_analyst": {
      id: "data_analyst",
      profileName: "Data Analyst Profile",
      updatedAt: "2026-10-15T10:00:00.000Z",
      personal: {
        fullName: "Aarav Sharma",
        firstName: "Aarav",
        lastName: "Sharma",
        email: "aarav.sharma.dev@example.com",
        phone: "+91 9876543210",
        currentLocation: "Bengaluru, Karnataka, India",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        postalCode: "560001",
        dateOfBirth: "2003-05-14"
      },
      education: {
        tenthScore: "94.6%",
        twelfthScore: "92.8%",
        collegeName: "Vellore Institute of Technology",
        degree: "Bachelor of Technology (B.Tech)",
        branch: "Computer Science and Engineering",
        cgpa: "9.12",
        graduationYear: "2025",
        backlogs: "0"
      },
      professional: {
        currentCompany: "NovaStack Labs",
        currentTitle: "Product Analytics Intern",
        totalExperienceYears: "1",
        technicalSkills: "SQL, Python, Pandas, Tableau, Power BI, Looker, A/B Testing, Statistical Modeling, Excel",
        certifications: "Google Data Analytics Professional Certificate",
        workExperienceSummary: "Product Analytics Intern at NovaStack Labs: Designed cohort retention dashboards in SQL/Tableau and analyzed funnel conversion experiments across 200k+ monthly active users.",
        projectsSummary: "1. E-Commerce Churn Predictor & Executive Dashboard (SQL, Python, Power BI).\n2. Supply Chain Bottleneck Analyzer using statistical process control.",
        resumeFileName: "Aarav_Sharma_Data_Analyst_Resume.pdf",
        resumeMimeType: "application/pdf",
        resumeBase64: ""
      },
      socials: {
        linkedin: "https://www.linkedin.com/in/aarav-sharma-dev",
        github: "https://github.com/aarav-sharma-dev",
        leetcode: "https://leetcode.com/u/aarav_sharma",
        portfolio: "https://aaravsharma.dev/analytics",
        otherLink: "https://public.tableau.com/app/profile/aaravsharma"
      },
      preferences: {
        preferredRole: "Data Analyst / Business Intelligence Analyst",
        preferredLocation: "Bengaluru, Mumbai, Gurugram, or Remote",
        employmentType: "Full-time",
        noticePeriod: "Immediate",
        expectedCtc: "12 LPA",
        workAuthorization: "Authorized to work in India"
      },
      customFields: [
        {
          id: "cf_why_hire",
          label: "Why should we hire you?",
          aliases: ["why hire you", "why are you a good fit"],
          value: "I turn messy product and transactional datasets into clear, statistically sound business decisions using advanced SQL, Python, and interactive BI dashboards."
        }
      ]
    }
  };

  global.SmartApplyDefaults = {
    EMPTY_PROFILE,
    SAMPLE_PROFILES,
    clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };
})(typeof window !== "undefined" ? window : self);
