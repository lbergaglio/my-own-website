export function create(deps) {
  const {
    admin,
    storageKey,
    getCurrentLocale,
    getLocaleText,
    getContent,
    buildAnalysis,
    escapeHTML,
    normalizeText,
  } = deps;

  let analysisRunId = 0;

  function getJobDescription() {
    return String(admin.atsJobDescription?.value || localStorage.getItem(storageKey) || '').trim();
  }

  async function refresh() {
    if (!admin.atsAnalysisResult) {
      return;
    }

    const localeText = getLocaleText();
    const jobDescription = getJobDescription();
    if (!jobDescription) {
      admin.atsAnalysisResult.innerHTML = `<p>${escapeHTML(localeText.admin.atsNoData)}</p>`;
      return;
    }

    const runId = ++analysisRunId;
    admin.atsAnalysisResult.innerHTML = `<p>${escapeHTML(localeText.admin.atsLoading || 'Analizando...')}</p>`;

    try {
      const analysis = await buildAnalysis(jobDescription, getContent());
      if (runId !== analysisRunId) {
        return;
      }

      const missingPreview = analysis.missing.slice(0, 18).join(', ') || 'N/A';
      const matchedPreview = analysis.matched.slice(0, 18).join(', ') || 'N/A';

      admin.atsAnalysisResult.innerHTML = `
        <p><strong>${escapeHTML(localeText.admin.atsScore)}:</strong> <span class="ats-score-badge ats-score-${analysis.level}">${analysis.score}%</span> (${analysis.matched.length}/${analysis.total})</p>
        <p><strong>${escapeHTML(localeText.admin.atsLevel)}:</strong> ${escapeHTML(analysis.levelLabel)}</p>
        <p><strong>${escapeHTML(localeText.admin.atsMatched)}:</strong> ${escapeHTML(matchedPreview)}</p>
        <p><strong>${escapeHTML(localeText.admin.atsMissing)}:</strong> ${escapeHTML(missingPreview)}</p>
      `;
    } catch (error) {
      if (runId !== analysisRunId) {
        return;
      }

      admin.atsAnalysisResult.innerHTML = `<p>${escapeHTML(localeText.admin.atsError || 'No se pudo analizar ATS en este momento.')}</p>`;
    }
  }

  async function applySuggestionsToProfile() {
    const localeText = getLocaleText();
    const jobDescription = getJobDescription();
    let analysis;

    try {
      analysis = await buildAnalysis(jobDescription, getContent());
    } catch (error) {
      alert(localeText.admin.atsError || 'No se pudo analizar ATS en este momento.');
      return;
    }

    const suggestedKeywords = (analysis.suggestions || []).slice(0, 8);

    if (!suggestedKeywords.length) {
      alert(localeText.admin.atsNoSuggestions);
      return;
    }

    const skillsField = admin.form?.elements?.skills;
    if (!skillsField) {
      return;
    }

    const currentSkills = String(skillsField.value || '');
    const skillParts = currentSkills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const normalizedSkills = new Set(skillParts.map((item) => normalizeText(item)));
    const keywordsToAdd = suggestedKeywords.filter((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword || normalizedSkills.has(normalizedKeyword)) {
        return false;
      }

      normalizedSkills.add(normalizedKeyword);
      return true;
    });

    if (!keywordsToAdd.length) {
      alert(localeText.admin.atsNoSuggestions);
      return;
    }

    skillsField.value = [...skillParts, ...keywordsToAdd].join(', ');
    skillsField.dispatchEvent(new Event('input', { bubbles: true }));
    skillsField.focus();
    alert(localeText.admin.atsSummaryApplied);
  }

  function applySuggestionsToSummary() {
    void applySuggestionsToProfile();
  }

  function bind() {
    if (admin.atsAnalyzeBtn) {
      admin.atsAnalyzeBtn.addEventListener('click', () => {
        void refresh();
      });
    }

    if (admin.atsApplySummaryBtn) {
      admin.atsApplySummaryBtn.addEventListener('click', () => {
        void applySuggestionsToProfile();
      });
    }

    if (admin.atsJobDescription) {
      admin.atsJobDescription.value = localStorage.getItem(storageKey) || '';
      admin.atsJobDescription.addEventListener('input', () => {
        localStorage.setItem(storageKey, admin.atsJobDescription.value);
        void refresh();
      });
    }

    void refresh();
  }

  return {
    bind,
    refresh,
    getJobDescription,
    applySuggestionsToProfile,
    applySuggestionsToSummary,
    getCurrentLocale,
  };
}
