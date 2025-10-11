"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../lib/models");
// Helper to derive a slug from a display name when DB slug is missing
const toSlug = (s = "") => s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
// Fallback subcategories by category slug (used when DB has none)
const DEFAULT_SUBCATEGORIES = {
    "beauty-salon": [
        { name: "Hair Care", slug: "hair-care" },
        { name: "Makeup", slug: "makeup" },
        { name: "Skin Care", slug: "skin-care" },
        { name: "Nail Salon", slug: "nail-salon" },
        { name: "Spa", slug: "spa" },
    ],
    "automotive": [
        { name: "Car Repair", slug: "car-repair" },
        { name: "Car Wash", slug: "car-wash" },
        { name: "Tyres & Wheels", slug: "tyres-wheels" },
        { name: "Car Accessories", slug: "car-accessories" },
        { name: "Showroom", slug: "showroom" },
    ],
    "restaurants": [
        { name: "Fast Food", slug: "fast-food" },
        { name: "BBQ", slug: "bbq" },
        { name: "Pakistani", slug: "pakistani" },
        { name: "Chinese", slug: "chinese" },
        { name: "Cafe", slug: "cafe" },
    ],
    "healthcare": [
        { name: "Clinic", slug: "clinic" },
        { name: "Hospital", slug: "hospital" },
        { name: "Pharmacy", slug: "pharmacy" },
        { name: "Dentist", slug: "dentist" },
        { name: "Laboratory", slug: "laboratory" },
    ],
    "education": [
        { name: "School", slug: "school" },
        { name: "College", slug: "college" },
        { name: "University", slug: "university" },
        { name: "Coaching", slug: "coaching" },
        { name: "Training Center", slug: "training-center" },
    ],
    "shopping": [
        { name: "Clothing", slug: "clothing" },
        { name: "Electronics", slug: "electronics" },
        { name: "Groceries", slug: "groceries" },
        { name: "Footwear", slug: "footwear" },
        { name: "Jewelry", slug: "jewelry" },
    ],
};
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const q = req.query.q?.trim() || "";
        const slug = req.query.slug?.trim() || "";
        const limit = parseInt(req.query.limit || "10");
        const safeLimit = Math.min(Math.max(limit, 1), 200);
        const noCache = req.query.nocache === "1";
        const models = await (0, models_1.getModels)();
        // If a specific category is requested by slug, return it (with subcategories if present or defaulted)
        if (slug) {
            const category = await models.categories.findOne({ slug, isActive: { $ne: false } }, { projection: { _id: 0, name: 1, slug: 1, count: 1, imageUrl: 1, icon: 1, subcategories: 1 } });
            if (!category) {
                return res.status(404).json({ ok: false, error: "Category not found" });
            }
            // Ensure slug exists
            if (!category.slug && category.name) {
                category.slug = toSlug(category.name);
            }
            if (!Array.isArray(category.subcategories) || category.subcategories.length === 0) {
                category.subcategories = DEFAULT_SUBCATEGORIES[category.slug] || [];
            }
            res.json({ ok: true, category });
            if (noCache) {
                res.set('Cache-Control', 'no-store, must-revalidate');
            }
            else {
                res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
            }
            return;
        }
        // Otherwise, return a list of categories (optionally filtered by q)
        const filter = { isActive: { $ne: false } };
        if (q) {
            const regex = new RegExp(q, "i");
            filter.$or = [{ name: regex }, { slug: regex }];
        }
        const categories = await models.categories
            .find(filter, { projection: { _id: 0, name: 1, slug: 1, count: 1, imageUrl: 1, icon: 1, subcategories: 1 } })
            .sort({ count: -1, name: 1 })
            .limit(safeLimit)
            .toArray();
        // Apply default subcategories if missing
        const enriched = categories.map((c) => {
            // Ensure slug exists for each category
            if (!c.slug && c.name)
                c.slug = toSlug(c.name);
            if (!Array.isArray(c.subcategories) || c.subcategories.length === 0) {
                c.subcategories = DEFAULT_SUBCATEGORIES[c.slug] || [];
            }
            return c;
        });
        res.json({ ok: true, categories: enriched });
        if (noCache) {
            res.set('Cache-Control', 'no-store, must-revalidate');
        }
        else {
            res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        }
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ ok: false, error: "Failed to fetch businesses" });
    }
});
exports.default = router;
