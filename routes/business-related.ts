import express from 'express';
import { getModels } from '../lib/models';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const category = (req.query.category as string)?.trim();
    const city = (req.query.city as string)?.trim();
    const excludeSlug = (req.query.excludeSlug as string)?.trim();

    if (!category || !city) {
      return res.status(400).json({ ok: false, error: "category and city are required" });
    }

    const models = await getModels();
    const filter: any = {
      category,
      city,
      status: "approved",
    };
    if (excludeSlug) {
      filter.slug = { $ne: excludeSlug };
    }

    const businesses = await models.businesses
      .find(filter, {
        projection: { _id: 1, name: 1, slug: 1, category: 1, city: 1, logoUrl: 1, description: 1 },
      })
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();

    const serialized = businesses.map((b: any) => ({
      ...b,
      id: b._id.toString(),
      _id: undefined,
    }));

    res.json({ ok: true, businesses: serialized });
    res.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  } catch (err: any) {
    console.error("Error fetching related businesses:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch related businesses" });
  }
});

export default router;