export function create(deps) {
  const {
    refs,
    escapeHTML,
    getCurrentLocale,
    getLocaleText,
    getContent,
    getTranslatedContent,
    translateContentForLocale,
    promptText,
    alertText,
  } = deps;

  function generateStyledCVHTML(content, labels = {}) {
    const defaultLabels = {
      aboutTitle: 'Sobre mí',
      experienceTitle: 'Experiencia',
      certificationsTitle: 'Certificaciones',
      projectsTitle: 'Proyectos',
      skillsTitle: 'Habilidades',
      contactTitle: 'Contacto',
      location: 'Ubicación',
      email: 'Email',
      phone: 'Teléfono',
      languages: 'Idiomas',
      stackLabel: 'Stack',
    };
    const finalLabels = { ...defaultLabels, ...labels };
    const certificationsHTML = content.certifications
      .map((cert) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(cert.name)}</strong><span>${escapeHTML(cert.issuer)} · ${escapeHTML(cert.year)}</span></article>`)
      .join('');
    const experienceHTML = content.experience
      .map((exp) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(exp.title)}</strong><span>${escapeHTML(exp.period)}</span><p>${escapeHTML(exp.description)}</p></article>`)
      .join('');
    const projectsHTML = content.projects
      .map((proj) => `<article class="pdf-item avoid-break"><strong>${escapeHTML(proj.title)}</strong><span>${finalLabels.stackLabel}: ${escapeHTML(proj.stack)}</span><p>${escapeHTML(proj.description)}</p></article>`)
      .join('');
    const projectsSectionHTML = projectsHTML
      ? `<section class="section avoid-break"><h2>${finalLabels.projectsTitle}</h2><div class="pdf-list">${projectsHTML}</div></section>`
      : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#243042;background:#fff;font-size:10.5px;line-height:1.28;padding:12mm 10mm 10mm}.page{max-width:100%;margin:0 auto}.header{display:grid;grid-template-columns:1.4fr 1fr;gap:8px 16px;align-items:start;padding-bottom:8px;border-bottom:1px solid #d5deea;margin-bottom:10px;page-break-inside:avoid}h1{font-size:20px;line-height:1.05;margin:0 0 4px;font-family:Arial,sans-serif}.role{font-size:11px;font-weight:700;color:#1067d8;margin:0 0 6px}.badge{display:inline-block;background:#e8f0fe;color:#1067d8;border-radius:999px;padding:3px 8px;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px}.summary{margin:0;color:#516178;max-width:62ch}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px;font-size:9.5px;color:#516178}.contact-chip{display:flex;gap:4px;min-width:0}.contact-chip strong{color:#243042;white-space:nowrap}.main-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:8px 14px;align-items:start}.section{background:#fff;border:1px solid #dfe7f1;border-radius:10px;padding:8px 9px;margin:0 0 8px;page-break-inside:avoid}.section h2{font-size:11px;line-height:1.1;margin:0 0 6px;padding:0 0 5px;border-bottom:1px solid #dfe7f1;text-transform:uppercase;letter-spacing:.04em;color:#1067d8;page-break-after:avoid}.section p{margin:0}.section .muted{color:#516178}.stack-inline{color:#516178;font-size:9.5px}.skill-list{display:flex;flex-wrap:wrap;gap:4px}.skill-pill{border:1px solid #dfe7f1;border-radius:999px;padding:3px 7px;font-size:9px;line-height:1.1;background:#f8fbff;color:#243042}.pdf-list{display:grid;gap:6px}.pdf-item{display:grid;gap:1px;padding-bottom:6px;border-bottom:1px dashed #e2e8f2}.pdf-item:last-child{padding-bottom:0;border-bottom:0}.pdf-item strong{font-size:10px;color:#243042}.pdf-item span,.pdf-item p{font-size:9.3px;color:#516178}.pdf-item p{line-height:1.22}.avoid-break{break-inside:avoid;page-break-inside:avoid}.compact-contact p{margin:0}.compact-links a{color:#1067d8;text-decoration:none}@media print{body{padding:7mm 7mm 6mm}.section,.header,.avoid-break{break-inside:avoid;page-break-inside:avoid}.page{page-break-after:avoid}}</style></head><body><div class="page"><div class="header avoid-break"><div><div class="badge">${escapeHTML(content.badge)}</div><h1>${escapeHTML(content.name)}</h1><p class="role">${escapeHTML(content.role)}</p><p class="summary">${escapeHTML(content.summary)}</p></div><div class="compact-contact contact-grid"><div class="contact-chip"><strong>${finalLabels.location}:</strong><span>${escapeHTML(content.location)}</span></div><div class="contact-chip"><strong>${finalLabels.email}:</strong><span><a href="mailto:${escapeHTML(content.email)}">${escapeHTML(content.email)}</a></span></div><div class="contact-chip"><strong>${finalLabels.phone}:</strong><span>${escapeHTML(content.phone)}</span></div><div class="contact-chip"><strong>${finalLabels.languages}:</strong><span>${escapeHTML(content.languages)}</span></div></div></div><div class="main-grid"><div><section class="section avoid-break"><h2>${finalLabels.aboutTitle}</h2><p>${escapeHTML(content.about)}</p></section><section class="section avoid-break"><h2>${finalLabels.skillsTitle}</h2><div class="skill-list">${content.skills.map((skill) => `<span class="skill-pill">${escapeHTML(skill)}</span>`).join('')}</div></section><section class="section avoid-break"><h2>${finalLabels.contactTitle}</h2><p>${escapeHTML(content.contactMessage)}</p><p class="compact-links">${content.social.linkedin ? `<a href="${escapeHTML(content.social.linkedin)}" target="_blank" rel="noreferrer noopener">LinkedIn</a> · ` : ''}${content.social.github ? `<a href="${escapeHTML(content.social.github)}" target="_blank" rel="noreferrer noopener">GitHub</a> · ` : ''}${content.social.portfolio ? `<a href="${escapeHTML(content.social.portfolio)}" target="_blank" rel="noreferrer noopener">Portfolio</a>` : ''}</p></section></div><div><section class="section avoid-break"><h2>${finalLabels.experienceTitle}</h2><div class="pdf-list">${experienceHTML}</div></section><section class="section avoid-break"><h2>${finalLabels.certificationsTitle}</h2><div class="pdf-list">${certificationsHTML}</div></section>${projectsSectionHTML}</div></div></div></body></html>`;
  }

  function generateATSCVHTML(content, labels = {}) {
    const defaultLabels = {
      contactInfo: 'CONTACT INFORMATION',
      location: 'Location',
      email: 'Email',
      phone: 'Phone',
      languages: 'Languages',
      summary: 'SUMMARY',
      about: 'ABOUT',
      experience: 'EXPERIENCE',
      certifications: 'CERTIFICATIONS',
      projects: 'PROJECTS',
      skills: 'SKILLS',
      contactMessage: 'CONTACT MESSAGE',
      socialProfiles: 'SOCIAL PROFILES',
      stackLabel: 'Stack',
    };
    const finalLabels = { ...defaultLabels, ...labels };
    const skills = content.skills.join(', ');
    const certifications = content.certifications.map((cert) => `${cert.name} - ${cert.issuer} (${cert.year})`).join('\n');
    const experience = content.experience.map((exp) => `${exp.title} (${exp.period})\n${exp.description}`).join('\n\n');
    const projects = content.projects.map((proj) => `${proj.title}\n${proj.description}\n${finalLabels.stackLabel}: ${proj.stack}`).join('\n\n');
    const projectsSectionHTML = projects
      ? `<section><h2>${finalLabels.projects}</h2><div class="block">${projects}</div></section>`
      : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - CV ATS</title><style>html,body{margin:0;padding:0}body{font-family:'Courier New',monospace;white-space:pre-wrap;word-wrap:break-word;font-size:9.5px;line-height:1.22;color:#111;padding:8mm 9mm}h1,h2,p{margin:0}h1{font-size:16px;line-height:1.05;margin-bottom:2px}h2{font-size:10px;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.04em}section{page-break-inside:avoid;margin-bottom:4px}.block{page-break-inside:avoid}.spacer{height:4px}.label{font-weight:700}</style></head><body><h1>${escapeHTML(content.name)}</h1><div class="block">${escapeHTML(content.role)} | ${escapeHTML(content.badge)}</div><div class="spacer"></div><section><h2>${finalLabels.contactInfo}</h2><div class="block"><span class="label">${finalLabels.location}:</span> ${escapeHTML(content.location)} | <span class="label">${finalLabels.email}:</span> ${escapeHTML(content.email)} | <span class="label">${finalLabels.phone}:</span> ${escapeHTML(content.phone)} | <span class="label">${finalLabels.languages}:</span> ${escapeHTML(content.languages)}</div></section><section><h2>${finalLabels.summary}</h2><div class="block">${escapeHTML(content.summary)}</div></section><section><h2>${finalLabels.about}</h2><div class="block">${escapeHTML(content.about)}</div></section><section><h2>${finalLabels.experience}</h2><div class="block">${experience}</div></section><section><h2>${finalLabels.certifications}</h2><div class="block">${certifications}</div></section>${projectsSectionHTML}<section><h2>${finalLabels.skills}</h2><div class="block">${skills}</div></section><section><h2>${finalLabels.contactMessage}</h2><div class="block">${escapeHTML(content.contactMessage)}</div></section><section><h2>${finalLabels.socialProfiles}</h2><div class="block">LinkedIn: ${content.social.linkedin || 'N/A'} | GitHub: ${content.social.github || 'N/A'} | Portfolio: ${content.social.portfolio || 'N/A'}</div></section></body></html>`;
  }

  function generateCoverLetterHTML(content, labels = {}, draft = {}) {
    const defaultLabels = {
      sender: 'Sender',
      recipient: 'Recipient',
      date: 'Date',
      subject: 'Subject',
      salutation: 'Dear Hiring Committee,',
      closing: 'Sincerely,',
      company: 'Company',
      role: 'Role',
    };
    const finalLabels = { ...defaultLabels, ...labels };
    const paragraphs = Array.isArray(draft.paragraphs) ? draft.paragraphs : [];
    const recipientLines = [
      `${finalLabels.recipient}: ${draft.recipient || finalLabels.recipient}`,
      `${finalLabels.company}: ${draft.company || finalLabels.company}`,
      `${finalLabels.role}: ${draft.role || finalLabels.role}`,
    ];

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${escapeHTML(content.name)} - Cover Letter</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,sans-serif;color:#223042;background:#fff;font-size:11px;line-height:1.52;padding:18mm 18mm 16mm}.page{max-width:100%}.header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid #d6deea;padding-bottom:12px;margin-bottom:14px}.sender{max-width:54%}.sender h1{margin:0 0 4px;font-size:18px;line-height:1.08}.sender p,.meta p,.block p{margin:0}.sender .role{color:#1067d8;font-weight:700;margin-bottom:4px}.meta{max-width:42%;text-align:right;color:#516178}.meta strong{color:#223042}.recipient{margin:0 0 12px;color:#223042}.recipient p{margin:0 0 2px}.subject{margin:0 0 12px;font-weight:700}.letter{margin:0}.letter p{margin:0 0 12px;text-align:justify}.signature{margin-top:18px}.signature .closing{margin-bottom:14px}.contact-line{margin-top:14px;padding-top:10px;border-top:1px solid #d6deea;color:#516178;font-size:10px}.muted{color:#516178}.avoid-break{break-inside:avoid;page-break-inside:avoid}</style></head><body><div class="page"><div class="header avoid-break"><div class="sender"><h1>${escapeHTML(content.name)}</h1><p class="role">${escapeHTML(content.role)}</p><p>${escapeHTML(content.location)}</p><p>${escapeHTML(content.email)}</p><p>${escapeHTML(content.phone)}</p></div><div class="meta"><p><strong>${escapeHTML(finalLabels.date)}:</strong> ${escapeHTML(draft.date || '')}</p></div></div><div class="recipient avoid-break">${recipientLines.map((line) => `<p>${escapeHTML(line)}</p>`).join('')}</div><div class="subject avoid-break"><p>${escapeHTML(finalLabels.subject)}: ${escapeHTML(draft.subject || '')}</p></div><div class="letter"><p>${escapeHTML(draft.salutation || finalLabels.salutation)}</p>${paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join('')}<div class="signature avoid-break"><p class="closing">${escapeHTML(draft.closing || finalLabels.closing)}</p><p><strong>${escapeHTML(content.name)}</strong></p></div></div><div class="contact-line avoid-break"><span>${escapeHTML(content.email)}</span> | <span>${escapeHTML(content.phone)}</span> | <span>${escapeHTML(content.location)}</span></div></div></body></html>`;
  }

  function downloadHtmlAsPdf(html, options) {
    const element = document.createElement('div');
    element.innerHTML = html;
    refs.pdfContainer.appendChild(element);

    return globalThis.html2pdf().set(options).from(element).save().finally(() => {
      refs.pdfContainer.removeChild(element);
    });
  }

  async function getLocalizedContentForDownload() {
    if (getCurrentLocale() === 'en') {
      const translated = getTranslatedContent();
      if (translated && translated !== getContent()) {
        return translated;
      }

      return translateContentForLocale(getContent(), 'en');
    }

    return getContent();
  }

  async function downloadATSPDF(content, labels) {
    const localeSuffix = getCurrentLocale() === 'en' ? 'EN' : 'ES';
    const safeName = content.name.replace(/\s+/g, '_');
    const filename = `${safeName}_CV_ATS_${localeSuffix}.pdf`;
    const html = generateATSCVHTML(content, labels);

    return downloadHtmlAsPdf(html, {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.25, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: 'avoid', avoid: ['p'] },
    });
  }

  async function downloadCVPDF(format) {
    const content = await getLocalizedContentForDownload();
    const localeText = getLocaleText();
    const pdfLabels = getCurrentLocale() === 'es'
      ? {
          aboutTitle: 'Sobre mí',
          experienceTitle: 'Experiencia',
          certificationsTitle: 'Certificaciones',
          projectsTitle: 'Proyectos',
          skillsTitle: 'Habilidades',
          contactTitle: 'Contacto',
          location: 'Ubicación',
          email: 'Email',
          phone: 'Teléfono',
          languages: 'Idiomas',
          stackLabel: 'Stack',
          contactInfo: 'CONTACT INFORMATION',
          summary: 'SUMMARY',
          about: 'ABOUT',
          experience: 'EXPERIENCE',
          certifications: 'CERTIFICATIONS',
          projects: 'PROJECTS',
          skills: 'SKILLS',
          contactMessage: 'CONTACT MESSAGE',
          socialProfiles: 'SOCIAL PROFILES',
        }
      : {
          aboutTitle: 'About me',
          experienceTitle: 'Experience',
          certificationsTitle: 'Certifications',
          projectsTitle: 'Projects',
          skillsTitle: 'Skills',
          contactTitle: 'Contact',
          location: 'Location',
          email: 'Email',
          phone: 'Phone',
          languages: 'Languages',
          stackLabel: 'Stack',
          contactInfo: 'CONTACT INFORMATION',
          summary: 'SUMMARY',
          about: 'ABOUT',
          experience: 'EXPERIENCE',
          certifications: 'CERTIFICATIONS',
          projects: 'PROJECTS',
          skills: 'SKILLS',
          contactMessage: 'CONTACT MESSAGE',
          socialProfiles: 'SOCIAL PROFILES',
        };

    pdfLabels.atsScore = localeText.admin.atsScore;
    pdfLabels.atsLevel = localeText.admin.atsLevel;
    pdfLabels.atsMatched = localeText.admin.atsMatched;
    pdfLabels.atsMissing = localeText.admin.atsMissing;
    pdfLabels.atsSuggestions = localeText.admin.atsSuggestions;

    if (format === 'ats') {
      return downloadATSPDF(content, pdfLabels);
    }

    const html = generateStyledCVHTML(content, pdfLabels);
    const localeSuffix = getCurrentLocale() === 'en' ? 'EN' : 'ES';
    const filename = `${content.name.replace(/\s+/g, '_')}_CV_${localeSuffix}.pdf`;

    return downloadHtmlAsPdf(html, {
      margin: [6, 6, 6, 6],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.6, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break', '.section'] },
    });
  }

  async function downloadCoverLetterPDF() {
    const locale = getCurrentLocale();
    const localeText = getLocaleText();
    const content = await getLocalizedContentForDownload();
    const company = String(promptText(locale === 'en' ? 'Company or organization name' : 'Nombre de la empresa u organizacion', '') || '').trim();
    const role = String(promptText(locale === 'en' ? 'Role you are applying for' : 'Puesto al que aplicas', content.role) || '').trim();
    const recipient = String(promptText(locale === 'en' ? 'Recipient or hiring committee' : 'Destinatario o comite de seleccion', locale === 'en' ? 'Hiring Committee' : 'Comite de seleccion') || '').trim();

    const draft = {
      company: company || (locale === 'en' ? 'Company' : 'Empresa'),
      role: role || content.role,
      recipient: recipient || (locale === 'en' ? 'Hiring Committee' : 'Comite de seleccion'),
      date: new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      subject: `${locale === 'en' ? 'Cover letter' : 'Carta de presentacion'} - ${company || (locale === 'en' ? 'Company' : 'Empresa')}`,
      salutation: locale === 'en' ? 'Dear Hiring Committee,' : 'Estimado comite de seleccion:',
      closing: locale === 'en' ? 'Sincerely,' : 'Atentamente,',
      paragraphs: buildCoverLetterParagraphs(content, locale, { company, role }),
      recipient: recipient || (locale === 'en' ? 'Hiring Committee' : 'Comite de seleccion'),
    };

    const labels = {
      sender: locale === 'en' ? 'Sender' : 'Remitente',
      recipient: locale === 'en' ? 'Recipient' : 'Destinatario',
      date: locale === 'en' ? 'Date' : 'Fecha',
      subject: locale === 'en' ? 'Subject' : 'Asunto',
      salutation: draft.salutation,
      closing: draft.closing,
      company: locale === 'en' ? 'Company' : 'Empresa',
      role: locale === 'en' ? 'Role' : 'Puesto',
    };

    const html = generateCoverLetterHTML(content, labels, draft);
    const filename = `${content.name.replace(/\s+/g, '_')}_Cover_Letter_${locale === 'en' ? 'EN' : 'ES'}.pdf`;

    try {
      return await downloadHtmlAsPdf(html, {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break', '.letter p'] },
      });
    } catch (error) {
      console.error('Error downloading cover letter PDF:', error);
      alertText(locale === 'en' ? 'Could not download the cover letter. Please try again.' : 'No se pudo descargar la cover letter. Intenta nuevamente.');
      return null;
    }
  }

  function buildCoverLetterParagraphs(content, locale, draft) {
    const skillsList = content.skills.slice(0, 4).join(', ');
    const experienceTitles = content.experience.slice(0, 2).map((item) => item.title).filter(Boolean);

    if (locale === 'en') {
      return [
        `I am writing to express my interest in the ${draft.role} role at ${draft.company}. My background in frontend development, UX-focused delivery, and collaborative product work has taught me how to connect technical execution with business priorities.`,
        `Across my recent experience, I have worked on accessible interfaces, reusable components, and iterative improvements that make products clearer, faster, and easier to maintain. That kind of work has been especially valuable in roles such as ${experienceTitles.join(' and ') || 'the positions I have held'}, where practical problem solving and attention to detail mattered every day.`,
        `I would bring strengths in ${skillsList || 'frontend technologies and modern web delivery'} along with a habit of learning quickly, communicating clearly, and keeping both quality and momentum in view. I am confident I can contribute meaningfully to your team while continuing to grow in the role.`,
        `Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience aligns with your needs and am happy to provide any additional information you may need.`,
      ];
    }

    return [
      `Me dirijo a usted para expresar mi interes en el puesto de ${draft.role} en ${draft.company}. Mi experiencia en desarrollo frontend, entrega orientada a UX y trabajo colaborativo con producto me enseño a conectar la ejecucion tecnica con las prioridades del negocio.`,
      `En mi experiencia reciente trabaje en interfaces accesibles, componentes reutilizables y mejoras iterativas que hacen que los productos sean mas claros, rapidos y faciles de mantener. Ese enfoque fue especialmente util en roles como ${experienceTitles.join(' y ') || 'los puestos que desempené'}, donde la resolucion practica y la atencion al detalle marcaron la diferencia.`,
      `Aportaria fortalezas en ${skillsList || 'tecnologias frontend y entrega web moderna'} junto con una forma de trabajo basada en aprender rapido, comunicar con claridad y sostener calidad sin perder ritmo. Estoy convencido de que puedo contribuir de manera significativa a su equipo mientras sigo creciendo en el puesto.`,
      `Gracias por su tiempo y consideracion. Quedo a disposicion para ampliar cualquier aspecto de mi perfil y conversar sobre como mi experiencia puede ajustarse a sus necesidades.`,
    ];
  }

  function bind() {
    if (refs.downloadCVNormalBtn) {
      refs.downloadCVNormalBtn.addEventListener('click', () => {
        void downloadCVPDF('normal');
      });
    }

    if (refs.downloadCVATSBtn) {
      refs.downloadCVATSBtn.addEventListener('click', () => {
        void downloadCVPDF('ats');
      });
    }

    if (refs.downloadCoverLetterBtn) {
      refs.downloadCoverLetterBtn.addEventListener('click', () => {
        void downloadCoverLetterPDF();
      });
    }
  }

  return {
    bind,
    downloadCVPDF,
    downloadCoverLetterPDF,
  };
}