import { invokeGeminiTask } from './gemini-client.js';

export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getScoreLevel(score) {
  if (score >= 75) {
    return 'high';
  }

  if (score >= 45) {
    return 'medium';
  }

  return 'low';
}

export async function buildAnalysis(jobDescription, content, locale, uiText) {
  const result = await invokeGeminiTask('ats_analysis', {
    locale,
    jobDescription,
    content,
  });

  const matched = Array.isArray(result?.matched)
    ? result.matched.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const missing = Array.isArray(result?.missing)
    ? result.missing.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const suggestions = Array.isArray(result?.suggestions)
    ? result.suggestions.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const totalFromApi = Number.isFinite(result?.total) ? Math.max(0, Math.trunc(result.total)) : null;
  const total = totalFromApi !== null ? totalFromApi : matched.length + missing.length;
  const apiScore = Number.isFinite(result?.score) ? Math.trunc(result.score) : 0;
  const score = Math.min(100, Math.max(0, apiScore));
  const level = getScoreLevel(score);
  const localeText = (uiText && uiText[locale]) || (uiText && uiText.es) || { admin: {} };
  const levelLabel = level === 'high'
    ? localeText.admin.atsLevelHigh
    : level === 'medium'
      ? localeText.admin.atsLevelMedium
      : localeText.admin.atsLevelLow;

  return {
    total,
    score,
    matched,
    missing,
    level,
    levelLabel,
    suggestions,
  };
}
