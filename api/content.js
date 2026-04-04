const { defaultContent, normalizeContent } = require('../content-model');
const { getMongoCollection } = require('./lib/mongo');
const { extractBearerToken, fetchAuth0User, authorizeUser } = require('./lib/auth');
const { readJsonBody } = require('./lib/http');

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

