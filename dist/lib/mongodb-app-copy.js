"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBusinessSlugs = getAllBusinessSlugs;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
const client = new mongodb_1.MongoClient(uri);
async function getAllBusinessSlugs() {
    await client.connect();
    const db = client.db("bizbranches"); // apna DB name likho
    const businesses = await db
        .collection("businesses")
        .find({}, { projection: { slug: 1 } })
        .toArray();
    return businesses.map((b) => b.slug);
}
