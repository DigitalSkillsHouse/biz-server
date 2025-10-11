import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);

export async function getAllBusinessSlugs() {
  await client.connect();
  const db = client.db("bizbranches"); // apna DB name likho
  const businesses = await db
    .collection("businesses")
    .find({}, { projection: { slug: 1 } })
    .toArray();

  return businesses.map((b) => b.slug);
}
