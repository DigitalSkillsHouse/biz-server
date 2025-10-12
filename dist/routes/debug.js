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
        const models = await (0, models_1.getModels)();
        // Test database collections
        const categoryCount = await models.categories.countDocuments();
        const cityCount = await models.cities.countDocuments();
        const businessCount = await models.businesses.countDocuments();
        // Get sample data
        const sampleCategories = await models.categories.find({}).limit(3).toArray();
        const sampleCities = await models.cities.find({}).limit(3).toArray();
        const sampleBusinesses = await models.businesses.find({}).limit(3).toArray();
        res.json({
            ok: true,
            counts: {
                categories: categoryCount,
                cities: cityCount,
                businesses: businessCount
            },
            samples: {
                categories: sampleCategories,
                cities: sampleCities,
                businesses: sampleBusinesses
            }
        });
    }
    catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            ok: false,
            error: error?.message || 'Debug failed',
            stack: error?.stack
        });
    }
});
exports.default = router;
