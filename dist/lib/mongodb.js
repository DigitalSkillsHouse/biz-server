"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
exports.getDb = getDb;
exports.getAllBusinessSlugs = getAllBusinessSlugs;
exports.closeDb = closeDb;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'BizBranches'; // Match .env case
if (!uri) {
    console.error('MONGODB_URI is undefined. Ensure .env file exists and contains MONGODB_URI.');
    throw new Error('MONGODB_URI environment variable is not defined in .env file');
}
console.log('MONGODB_URI:', uri.replace(/\/\/.*@/, '//<redacted>@')); // Log redacted URI for debugging
console.log('MONGODB_DB:', MONGODB_DB);
exports.client = new mongodb_1.MongoClient(uri);
let cachedDb = null;
async function getDb() {
    if (cachedDb) {
        try {
            // Test connection
            await cachedDb.admin().ping();
            return cachedDb;
        }
        catch (error) {
            console.log('Cached connection failed, reconnecting...');
            cachedDb = null;
        }
    }
    try {
        await exports.client.connect();
        cachedDb = exports.client.db(MONGODB_DB);
        console.log('Connected to MongoDB database:', MONGODB_DB);
        return cachedDb;
    }
    catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
}
async function getAllBusinessSlugs() {
    const db = await getDb();
    const businesses = await db
        .collection('businesses')
        .find({}, { projection: { slug: 1 } })
        .toArray();
    return businesses.map((b) => b.slug);
}
async function closeDb() {
    if (exports.client) {
        await exports.client.close();
        cachedDb = null;
        console.log('MongoDB connection closed');
    }
}
