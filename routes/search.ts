import express from 'express';
import { getModels } from '../lib/models';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.json({
        ok: true,
        businesses: [],
        categories: [],
      });
    }

    const models = await getModels();
    const regex = new RegExp(query, 'i'); // Case-insensitive regex

    // Fetch businesses and categories in parallel
    const [businesses, categories] = await Promise.all([
      models.businesses
        .find(
          {
            $or: [
              { name: { $regex: regex } },
              { description: { $regex: regex } },
            ],
            status: 'approved', // Only search approved businesses
          },
          { projection: { name: 1, city: 1, category: 1, logoUrl: 1, slug: 1 } } // Include slug for linking
        )
        .limit(5) // Limit business results
        .maxTimeMS(300)
        .toArray(),

      models.categories.find(
        { name: { $regex: regex } },
        { projection: { name: 1, slug: 1 } } // Project only needed fields
      )
      .limit(3) // Limit category results
      .toArray(),
    ]);

    // Add id field for each business
    const businessesWithId = businesses.map((business: any) => ({
      ...business,
      id: business._id.toString(),
    }));

    res.json({
      ok: true,
      businesses: businessesWithId,
      categories,
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json(
      { ok: false, error: 'Failed to fetch search suggestions' }
    );
  }
});

export default router;