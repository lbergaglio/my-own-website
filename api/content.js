const { Redis } = require('@upstash/redis');
const { defaultContent, normalizeContent } = require('../content-model');

const STORAGE_KEY = 'cv-content-v1';
const redis = Redis.fromEnv();

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const content = await redis.get(STORAGE_KEY);
      return res.status(200).json(normalizeContent(content || defaultContent));
    } catch (error) {
      return res.status(200).json(defaultContent);
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractBearerToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const user = await fetchAuth0User(token);
    authorizeUser(user);

    const body = await readJsonBody(req);
    const content = normalizeContent(body);

    await redis.set(STORAGE_KEY, content);

    return res.status(200).json(content);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Unable to save content' });
  }
};

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

  const emailAllowed = allowedEmails.length > 0 && allowedEmails.includes(email);
  const subAllowed = allowedSubs.length > 0 && allowedSubs.includes(sub);

  if (!emailAllowed && !subAllowed) {
    const error = new Error('User is not allowed to edit content');
    error.statusCode = 403;
    throw error;
  }
}

function parseList(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const raw = await new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const parseError = new Error('Invalid JSON payload');
    parseError.statusCode = 400;
    throw parseError;
  }
}