"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../lib/models");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const category = req.query.category?.trim();
        const city = req.query.city?.trim();
        const excludeSlug = req.query.excludeSlug?.trim();
        if (!category || !city) {
            return res.status(400).json({ ok: false, error: "category and city are required" });
        }
        const models = await (0, models_1.getModels)();
        const filter = {
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
        const serialized = businesses.map((b) => ({
            ...b,
            id: b._id.toString(),
            _id: undefined,
        }));
        res.json({ ok: true, businesses: serialized });
        res.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    }
    catch (err) {
        console.error("Error fetching related businesses:", err);
        res.status(500).json({ ok: false, error: "Failed to fetch related businesses" });
    }
});
exports.default = router;
