const { MongoClient } = require('mongodb');
const { defaultContent, normalizeContent } = require('../content-model');

// MongoDB connection singleton for serverless (Vercel recycles between invocations).
let mongoClient = null;

async function getMongoCollection() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    const error = new Error('MongoDB URI is not configured');
    error.statusCode = 500;
    throw error;
  }

  // Reconectar si la topología está cerrada (Vercel serverless issue).
  if (mongoClient && !mongoClient.topology?.isConnected()) {
    mongoClient = null;
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { 
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      // Agregamos opciones SSL para mayor compatibilidad
      ssl: true,
      authSource: 'admin',
    });
    await mongoClient.connect();
  }

  const db = mongoClient.db('cv-portfolio');
  return db.collection('content');
}

// Endpoint serverless para leer/escribir el contenido editable del CV.
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const collection = await getMongoCollection();
      const doc = await collection.findOne({ _id: 'cv-content-v1' });
      const content = doc?.data || defaultContent;
      return res.status(200).json(normalizeContent(content));
    } catch (error) {
      // Fallback seguro para no romper la UI ante errores de infraestructura.
      return res.status(200).json(defaultContent);
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // El PUT requiere un Bearer token valido emitido por Auth0.
    const token = extractBearerToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const user = await fetchAuth0User(token);
    authorizeUser(user);

    const body = await readJsonBody(req);
    const content = normalizeContent(body);

    // Persistimos un documento JSON del CV en MongoDB.
    const collection = await getMongoCollection();
    await collection.updateOne(
      { _id: 'cv-content-v1' },
      { $set: { data: content, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json(content);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Unable to save content' });
  }
};

// Extrae el token de un header Authorization: Bearer <token>.
function extractBearerToken(headerValue) {
  const match = String(headerValue).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

// Valida el token consultando el endpoint /userinfo de Auth0.
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

// Aplica allowlist por email o sub para habilitar edicion administrativa.
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

// Permite comparar sub exacto y variantes comunes (id final o proveedor|id).
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

// Convierte strings CSV (a,b,c) a lista normalizada y sin vacios.
function parseList(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

// Lee body JSON en entornos donde req.body puede no venir parseado.
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