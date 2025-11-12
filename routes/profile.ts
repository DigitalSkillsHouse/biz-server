import express from 'express';
import { getProfileDb } from '../lib/mongodb-profile';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (!process.env.MONGODB_PROFILE_URI) {
      return res.status(503).json({ ok: false, error: "Profiles DB not configured" });
    }

    const username = (req.query.username as string || "").trim();
    if (!username) {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    const db = await getProfileDb();

    // Try common collections and field names
    const candidates: Array<{ coll: string; filter: any; project?: any }> = [
      { coll: "profiles", filter: { username: new RegExp(`^${username}$`, "i") } },
      { coll: "users", filter: { username: new RegExp(`^${username}$`, "i") } },
      { coll: "users", filter: { handle: new RegExp(`^${username}$`, "i") } },
      { coll: "profiles", filter: { handle: new RegExp(`^${username}$`, "i") } },
    ];

    let doc: any = null;
    for (const q of candidates) {
      try {
        const found = await db.collection(q.coll).findOne(q.filter);
        if (found) { doc = found; break; }
      } catch {}
    }

    if (!doc) {
      return res.status(404).json({ ok: false, error: "Profile not found" });
    }

    // Normalize common fields
    const name = doc.name || doc.fullName || doc.displayName || doc.title || "";
    const title = doc.title || doc.headline || doc.role || "";
    const avatarUrl = doc.avatarUrl || doc.photoUrl || doc.imageUrl || doc.picture || "";

    res.json({ ok: true, profile: { username, name, title, avatarUrl } });
  } catch (e: any) {
    console.error("/api/profile error", e?.message || e);
    res.status(500).json({ ok: false, error: "Failed to fetch profile" });
  }
});

export default router;