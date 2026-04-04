function extractBearerToken(headerValue) {
  const match = String(headerValue).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function fetchAuth0User(token) {
  const domain = String(process.env.AUTH0_DOMAIN || '').trim();
  if (!domain) {
    const error = new Error('Auth0 domain is not configured');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`https://${domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = new Error('Invalid Auth0 session');
    error.statusCode = 401;
    throw error;
  }

  return response.json();
}

function parseList(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedSub(normalizedSub, allowedSubs) {
  if (!normalizedSub) {
    return false;
  }

  const parts = normalizedSub.split('|').filter(Boolean);
  const onlyId = parts.length > 0 ? parts[parts.length - 1] : '';
  const providerAndId = parts.length >= 2 ? `${parts[parts.length - 2]}|${parts[parts.length - 1]}` : '';
  const subCandidates = new Set([normalizedSub, onlyId, providerAndId].filter(Boolean));

  return allowedSubs.some((allowed) => {
    const item = String(allowed || '').trim().toLowerCase();
    if (!item) {
      return false;
    }

    return subCandidates.has(item) || normalizedSub.endsWith(`|${item}`);
  });
}

function authorizeUser(user) {
  const allowedEmails = parseList(process.env.AUTH0_ADMIN_EMAILS || '');
  const allowedSubs = parseList(process.env.AUTH0_ADMIN_SUBS || '');

  if (!allowedEmails.length && !allowedSubs.length) {
    const error = new Error('Admin allowlist is not configured');
    error.statusCode = 500;
    throw error;
  }

  const email = String(user?.email || '').toLowerCase();
  const sub = String(user?.sub || '').trim();
  const normalizedSub = sub.toLowerCase();

  const emailAllowed = allowedEmails.length > 0 && allowedEmails.includes(email);
  const subAllowed = allowedSubs.length > 0 && isAllowedSub(normalizedSub, allowedSubs);

  if (!emailAllowed && !subAllowed) {
    const error = new Error(`User is not allowed to edit content (sub: ${sub || 'n/a'})`);
    error.statusCode = 403;
    throw error;
  }
}

module.exports = {
  extractBearerToken,
  fetchAuth0User,
  authorizeUser,
};
