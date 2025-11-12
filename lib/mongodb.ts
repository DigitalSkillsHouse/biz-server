import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'BizBranches'; // Match .env case

if (!uri) {
  console.error('MONGODB_URI is undefined. Ensure .env file exists and contains MONGODB_URI.');
  throw new Error('MONGODB_URI environment variable is not defined in .env file');
}

console.log('MONGODB_URI:', uri.replace(/\/\/.*@/, '//<redacted>@')); // Log redacted URI for debugging
console.log('MONGODB_DB:', MONGODB_DB);

export const client = new MongoClient(uri);
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    try {
      // Test connection
      await cachedDb.admin().ping();
      return cachedDb;
    } catch (error) {
      console.log('Cached connection failed, reconnecting...');
      cachedDb = null;
    }
  }

  try {
    await client.connect();
    cachedDb = client.db(MONGODB_DB);
    console.log('Connected to MongoDB database:', MONGODB_DB);
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', (error as Error).message);
    throw new Error(`Failed to connect to MongoDB: ${(error as Error).message}`);
  }
}

export async function getAllBusinessSlugs() {
  const db = await getDb();
  const businesses = await db
    .collection('businesses')
    .find({}, { projection: { slug: 1 } })
    .toArray();

  return businesses.map((b) => b.slug);
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}