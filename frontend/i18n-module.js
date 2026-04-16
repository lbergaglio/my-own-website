export function create(deps) {
  const {
    refs,
    uiText,
    localeKey,
    translationCacheKey,
    supportedLocales,
    readLocaleValue,
    refreshATSAnalysisPreview,
    setTranslatedContent,
  } = deps;

  let currentLocale = getInitialLocale();
  let translationRunId = 0;

  function getLocaleText(locale = currentLocale) {
    return uiText[locale] || uiText.es;
  }

  function getInitialLocale() {
    const savedLocale = String(localStorage.getItem(localeKey) || '').trim().toLowerCase();
    if (supportedLocales.includes(savedLocale)) {
      return savedLocale;
    }

    const browserLocale = String(navigator.language || navigator.languages?.[0] || 'es').toLowerCase();
    return browserLocale.startsWith('en') ? 'en' : 'es';
  }

  function setCurrentLocale(locale) {
    if (supportedLocales.includes(locale)) {
      currentLocale = locale;
    }

    return currentLocale;
  }

  function syncLocaleSwitcher(locale) {
    refs.localeButtons.forEach((button) => {
      const isActive = button.dataset.locale === locale;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function applyStaticLocale(locale, content) {
    const localeText = getLocaleText(locale);
    refs.html.setAttribute('lang', locale);
    syncLocaleSwitcher(locale);

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const value = readLocaleValue(localeText, key);

      if (value !== undefined && typeof value === 'string') {
        element.textContent = value;
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      const value = readLocaleValue(localeText, key);

      if (value !== undefined && typeof value === 'string') {
        element.setAttribute('placeholder', value);
      }
    });

    if (refs.metaDescription) {
      refs.metaDescription.setAttribute('content', localeText.description);
    }

    document.title = localeText.title.replace('{name}', content?.name || '');
    localStorage.setItem(localeKey, locale);
    refreshATSAnalysisPreview();
  }

  async function localizeRenderedContent(content, locale = currentLocale) {
    if (locale === 'es') {
      setTranslatedContent(content);
      return content;
    }

    const runId = ++translationRunId;

    try {
      const translated = await translateContentForLocale(content, locale);
      if (runId !== translationRunId) {
        return content;
      }

      setTranslatedContent(translated);
      refs.heroBadge.textContent = translated.badge;
      refs.heroRole.textContent = translated.role;
      refs.heroSummary.textContent = translated.summary;
      refs.aboutText.textContent = translated.about;
      refs.contactMessage.textContent = translated.contactMessage;

      const experienceCards = refs.experienceList.querySelectorAll('article');
      translated.experience.forEach((item, index) => {
        const card = experienceCards[index];
        if (!card) return;
        const meta = card.querySelector('.meta');
        const title = card.querySelector('h3');
        const body = card.querySelector('.body-text');
        if (meta) meta.textContent = item.period;
        if (title) title.textContent = item.title;
        if (body) body.textContent = item.description;
      });

      const certificationCards = refs.certificationsList.querySelectorAll('article');
      translated.certifications.forEach((item, index) => {
        const card = certificationCards[index];
        if (!card) return;
        const year = card.querySelector('.certification-year');
        const title = card.querySelector('h3');
        const body = card.querySelector('.certification-issuer');
        if (year) year.textContent = item.year;
        if (title) title.textContent = item.name;
        if (body) body.textContent = item.issuer;
      });

      const projectCards = refs.projectList.querySelectorAll('article');
      translated.projects.forEach((item, index) => {
        const card = projectCards[index];
        if (!card) return;
        const title = card.querySelector('h3');
        const body = card.querySelector('.body-text');
        const stack = card.querySelector('.stack');
        if (title) title.textContent = item.title;
        if (body) body.textContent = item.description;
        if (stack) stack.textContent = item.stack;
      });

      const skillItems = refs.skillsList.querySelectorAll('.skill-item');
      translated.skills.forEach((skill, index) => {
        const item = skillItems[index];
        if (item) item.textContent = skill;
      });

      return translated;
    } catch (error) {
      return content;
    }
  }

  async function translateContentForLocale(content, locale) {
    if (locale === 'es') {
      return content;
    }

    const translated = structuredClone(content);
    translated.badge = await translateText(content.badge, locale);
    translated.role = await translateText(content.role, locale);
    translated.summary = await translateText(content.summary, locale);
    translated.about = await translateText(content.about, locale);
    translated.contactMessage = await translateText(content.contactMessage, locale);

    translated.experience = await Promise.all(
      content.experience.map(async (item) => ({
        period: await translateText(item.period, locale),
        title: await translateText(item.title, locale),
        description: await translateText(item.description, locale),
      }))
    );

    translated.certifications = await Promise.all(
      content.certifications.map(async (item) => ({
        name: await translateText(item.name, locale),
        issuer: await translateText(item.issuer, locale),
        year: item.year,
        percentage: item.percentage,
      }))
    );

    translated.projects = await Promise.all(
      content.projects.map(async (item) => ({
        title: await translateText(item.title, locale),
        description: await translateText(item.description, locale),
        stack: await translateText(item.stack, locale),
      }))
    );

    translated.skills = await Promise.all(
      content.skills.map((skill) => translateText(skill, locale))
    );

    return translated;
  }

  async function translateText(text, locale) {
    const sourceText = String(text || '').trim();
    if (!sourceText || locale === 'es') {
      return sourceText;
    }

    const cacheKey = `${locale}::${sourceText}`;
    const cached = readTranslationCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${encodeURIComponent(locale)}&dt=t&q=${encodeURIComponent(sourceText)}`
      );

      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const data = await response.json();
      const translated = Array.isArray(data)
        ? data[0].map((segment) => segment[0]).join('')
        : sourceText;

      writeTranslationCache(cacheKey, translated);
      return translated;
    } catch (error) {
      return sourceText;
    }
  }

  function readTranslationCache(key) {
    try {
      const raw = localStorage.getItem(translationCacheKey);
      if (!raw) {
        return '';
      }

      const parsed = JSON.parse(raw);
      return parsed && typeof parsed[key] === 'string' ? parsed[key] : '';
    } catch (error) {
      return '';
    }
  }

  function writeTranslationCache(key, value) {
    try {
      const raw = localStorage.getItem(translationCacheKey);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[key] = value;
      localStorage.setItem(translationCacheKey, JSON.stringify(parsed));
    } catch (error) {
      return;
    }
  }

  return {
    getCurrentLocale: () => currentLocale,
    setCurrentLocale,
    getLocaleText,
    getInitialLocale,
    applyStaticLocale,
    localizeRenderedContent,
    translateContentForLocale,
    translateText,
    syncLocaleSwitcher,
  };
}