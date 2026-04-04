const { MongoClient } = require('mongodb');

let mongoClient = null;

async function getMongoCollection() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    const error = new Error('MongoDB URI is not configured');
    error.statusCode = 500;
    throw error;
  }

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
      ssl: true,
      authSource: 'admin',
    });
    await mongoClient.connect();
  }

  const db = mongoClient.db('cv-portfolio');
  return db.collection('content');
}

module.exports = {
  getMongoCollection,
};
