const DEFAULT_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'you', 'your', 'are', 'our',
  'una', 'unas', 'unos', 'para', 'con', 'por', 'las', 'los', 'del', 'que', 'como',
  'sobre', 'entre', 'desde', 'hasta', 'de', 'la', 'el', 'en', 'to', 'of', 'a', 'an',
]);

export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractKeywords(text) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return [];
  }

  const candidates = normalizedText.match(/[a-z0-9+#.]{2,}/g) || [];
  const unique = new Set();

  candidates.forEach((token) => {
    if (!token || DEFAULT_STOPWORDS.has(token) || token.length < 3) {
      return;
    }

    unique.add(token);
  });

  return Array.from(unique).slice(0, 60);
}

function buildProfileCorpus(content) {
  const allText = [
    content.name,
    content.role,
    content.badge,
    content.summary,
    content.about,
    content.contactMessage,
    content.languages,
    content.skills.join(' '),
    ...content.experience.map((item) => `${item.period} ${item.title} ${item.description}`),
    ...content.certifications.map((item) => `${item.name} ${item.issuer} ${item.year}`),
    ...content.projects.map((item) => `${item.title} ${item.description} ${item.stack}`),
  ].join(' ');

  return normalizeText(allText);
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

export function buildAnalysis(jobDescription, content, locale, uiText) {
  const keywords = extractKeywords(jobDescription);
  const profileText = buildProfileCorpus(content);
  const matched = keywords.filter((keyword) => profileText.includes(keyword));
  const missing = keywords.filter((keyword) => !profileText.includes(keyword));
  const total = keywords.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;
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
    suggestions: [],
  };
}
