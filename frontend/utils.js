export function readLocaleValue(source, key) {
  if (!source || !key) return undefined;

  const parts = String(key || '').split('.');
  let current = source;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

export function clampPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function formatRelativeDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'sin fecha';
  }

  const now = new Date();
  const diffInDays = Math.max(0, Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) {
    return 'hoy';
  }

  if (diffInDays === 1) {
    return 'hace 1 día';
  }

  if (diffInDays < 30) {
    return `hace ${diffInDays} días`;
  }

  const months = Math.round(diffInDays / 30);
  if (months === 1) {
    return 'hace 1 mes';
  }

  return `hace ${months} meses`;
}

export function parsePipeLines(text, keys) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const result = [];
  for (const line of lines) {
    const parts = line.split('|').map((item) => item.trim());
    if (parts.length !== keys.length || parts.some((value) => !value)) {
      return null;
    }

    const entry = {};
    keys.forEach((entryKey, index) => {
      entry[entryKey] = parts[index];
    });
    result.push(entry);
  }

  return result;
}

export function buildPhoneHref(phone) {
  const sanitized = String(phone || '').replace(/[^\d+]/g, '');
  return sanitized ? `tel:${sanitized}` : '';
}

export function formatPhoneDisplay(phone) {
  return String(phone || '').trim();
}

export function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeAuth0Domain(domain) {
  const clean = String(domain).trim();
  if (!clean) {
    return '';
  }

  if (clean.includes('.')) {
    return clean;
  }

  return `${clean}.auth0.com`;
}
