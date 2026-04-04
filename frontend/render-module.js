export function create(deps) {
  const {
    refs,
    admin,
    getLocaleText,
    getCurrentLocale,
    clampPercentage,
    escapeHTML,
    buildPhoneHref,
    formatPhoneDisplay,
    initReveal,
    localizeRenderedContent,
    refreshATSAnalysisPreview,
    ensureGithubSkeleton,
  } = deps;

  function createSocialLink(label, url) {
      const anchor = document.createElement('a');
      anchor.className = 'social-link';
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer noopener';
      anchor.textContent = label;
      return anchor;
    }

  function updateProjectsVisibility(hasProjects) {
      if (refs.projectsSection) {
        refs.projectsSection.hidden = !hasProjects;
      }

      refs.projectAnchors.forEach((anchor) => {
        anchor.hidden = !hasProjects;
        anchor.setAttribute('aria-hidden', String(!hasProjects));
        anchor.tabIndex = hasProjects ? 0 : -1;
      });
    }

  function render(content) {
      const localeText = getLocaleText();
      refs.heroBadge.textContent = content.badge;
      refs.heroName.textContent = content.name;
      refs.heroRole.textContent = content.role;
      refs.heroSummary.textContent = content.summary;
      refs.aboutText.textContent = content.about;
      refs.contactMessage.textContent = content.contactMessage;
      refs.contactEmail.textContent = content.email;
      refs.contactEmail.href = `mailto:${content.email}`;
      refs.footerName.textContent = content.name;
      refs.year.textContent = String(new Date().getFullYear());
      document.title = localeText.title.replace('{name}', content.name);
      if (refs.metaDescription) {
        refs.metaDescription.setAttribute('content', localeText.description);
      }

      const socialItems = [
        { label: 'LinkedIn', url: content.social.linkedin },
        { label: 'GitHub', url: content.social.github },
        { label: 'Portfolio', url: content.social.portfolio },
        { label: 'X', url: content.social.twitter },
      ].filter((item) => item.url && item.url.trim().length > 0);

      refs.socialLinks.innerHTML = '';
      refs.footerSocialLinks.innerHTML = '';
      socialItems.forEach((item) => {
        refs.socialLinks.appendChild(createSocialLink(item.label, item.url));
        refs.footerSocialLinks.appendChild(createSocialLink(item.label, item.url));
      });

      refs.factsList.innerHTML = '';
      const personalFacts = [
        { label: localeText.facts.location, value: content.location, href: '' },
        { label: localeText.facts.email, value: content.email, href: `mailto:${content.email}` },
        { label: localeText.facts.phone, value: formatPhoneDisplay(content.phone), href: buildPhoneHref(content.phone) },
        { label: localeText.facts.languages, value: content.languages, href: '' },
      ];

      personalFacts.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'fact-item';

        const term = document.createElement('dt');
        term.className = 'fact-label';
        term.textContent = item.label;

        const description = document.createElement('dd');
        description.className = 'fact-value';

        if (item.href) {
          const link = document.createElement('a');
          link.className = 'fact-link';
          link.href = item.href;
          link.textContent = item.value;
          if (item.href.startsWith('http')) {
            link.target = '_blank';
            link.rel = 'noreferrer noopener';
          }
          description.appendChild(link);
        } else {
          description.textContent = item.value;
        }

        row.appendChild(term);
        row.appendChild(description);
        refs.factsList.appendChild(row);
      });

      refs.experienceList.innerHTML = '';
      content.experience.forEach((item) => {
        const article = document.createElement('article');
        article.className = 'card reveal';
        article.innerHTML = `
          <p class="meta">${escapeHTML(item.period)}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <p class="body-text">${escapeHTML(item.description)}</p>
        `;
        refs.experienceList.appendChild(article);
      });

      refs.certificationsList.innerHTML = '';
      if (!content.certifications.length) {
        const emptyCard = document.createElement('article');
        emptyCard.className = 'card certification-card reveal';
        emptyCard.innerHTML = `
          <h3>${escapeHTML(localeText.empty.certificationsTitle)}</h3>
          <p class="body-text certification-issuer">${escapeHTML(localeText.empty.certificationsBody)}</p>
        `;
        refs.certificationsList.appendChild(emptyCard);
      }

      content.certifications.forEach((item) => {
        const percentage = clampPercentage(item.percentage ?? 100);
        const isComplete = percentage >= 100;
        const certificationText = getLocaleText();
        const article = document.createElement('article');
        article.className = 'card certification-card reveal';
        article.innerHTML = `
          <div class="certification-head">
            <div>
              <div class="certification-year">${escapeHTML(item.year)}</div>
              <h3>${escapeHTML(item.name)}</h3>
            </div>
            <span class="certification-percent">${percentage}%</span>
          </div>
          <div class="certification-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}" aria-label="${escapeHTML(item.name)} ${percentage}%">
            <span class="certification-fill ${isComplete ? 'is-complete' : ''}" style="width: ${percentage}%"></span>
          </div>
          <div class="certification-foot">
            <span class="certification-status ${isComplete ? 'is-complete' : 'is-progress'}">${escapeHTML(isComplete ? certificationText.certifications.complete : certificationText.certifications.inProgress)}</span>
            <span class="certification-progress-label">${escapeHTML(certificationText.certifications.progress)}</span>
          </div>
          <p class="body-text certification-issuer">${escapeHTML(item.issuer)}</p>
        `;
        refs.certificationsList.appendChild(article);
      });

      refs.projectList.innerHTML = '';
      content.projects.forEach((item) => {
        const article = document.createElement('article');
        article.className = 'card reveal';
        article.innerHTML = `
          <h3>${escapeHTML(item.title)}</h3>
          <p class="body-text">${escapeHTML(item.description)}</p>
          <p class="stack">${escapeHTML(item.stack)}</p>
        `;
        refs.projectList.appendChild(article);
      });
      updateProjectsVisibility(content.projects.length > 0);

      ensureGithubSkeleton();

      refs.skillsList.innerHTML = '';
      content.skills.forEach((skill) => {
        const span = document.createElement('span');
        span.className = 'skill-item';
        span.textContent = skill;
        refs.skillsList.appendChild(span);
      });

      initReveal();
      refreshATSAnalysisPreview();
      void localizeRenderedContent(content);
    }

  function populateForm(content) {
      admin.form.elements.name.value = content.name;
      admin.form.elements.role.value = content.role;
      admin.form.elements.badge.value = content.badge;
      admin.form.elements.summary.value = content.summary;
      admin.form.elements.about.value = content.about;
      admin.form.elements.location.value = content.location;
      admin.form.elements.email.value = content.email;
      admin.form.elements.phone.value = content.phone;
      admin.form.elements.languages.value = content.languages;
      admin.form.elements.linkedin.value = content.social.linkedin;
      admin.form.elements.github.value = content.social.github;
      admin.form.elements.portfolio.value = content.social.portfolio;
      admin.form.elements.twitter.value = content.social.twitter;
      admin.form.elements.contactMessage.value = content.contactMessage;
      admin.form.elements.skills.value = content.skills.join(', ');
      admin.form.elements.certifications.value = content.certifications
        .map((item) => `${item.name} | ${item.issuer} | ${item.year} | ${item.percentage ?? 100}`)
        .join('\n');
      admin.form.elements.experience.value = content.experience
        .map((item) => `${item.period} | ${item.title} | ${item.description}`)
        .join('\n');
      admin.form.elements.projects.value = content.projects
        .map((item) => `${item.title} | ${item.description} | ${item.stack}`)
        .join('\n');
    }

  return {
    render,
    populateForm,
    updateProjectsVisibility,
    createSocialLink,
    getCurrentLocale,
  };
}
