"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModels = exports.DatabaseModels = void 0;
const mongodb_1 = require("./mongodb");
// Database Models Class
class DatabaseModels {
    constructor(db) {
        this.db = db;
    }
    // Business Collection
    get businesses() {
        return this.db.collection("businesses");
    }
    // Categories Collection
    get categories() {
        return this.db.collection("categories");
    }
    // Cities Collection
    get cities() {
        return this.db.collection("cities");
    }
    // Reviews Collection
    get reviews() {
        return this.db.collection("reviews");
    }
    // Create indexes for better performance
    async createIndexes() {
        try {
            // Business indexes
            await this.businesses.createIndex({ category: 1, city: 1 });
            await this.businesses.createIndex({ status: 1 });
            await this.businesses.createIndex({ featured: 1, featuredAt: -1 });
            await this.businesses.createIndex({ createdAt: -1 });
            await this.businesses.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true } } });
            await this.businesses.createIndex({ name: "text", description: "text" });
            // Category indexes
            await this.categories.createIndex({ slug: 1 }, { unique: true });
            await this.categories.createIndex({ isActive: 1 });
            // City indexes
            await this.cities.createIndex({ slug: 1 }, { unique: true });
            await this.cities.createIndex({ isActive: 1 });
            // Review indexes
            await this.reviews.createIndex({ businessId: 1, createdAt: -1 });
            await this.reviews.createIndex({ businessId: 1, rating: -1 });
            console.log("Database indexes created successfully");
        }
        catch (error) {
            console.error("Error creating indexes:", error);
        }
    }
    // Initialize default data
    async initializeDefaultData() {
        try {
            // Check if categories exist
            const categoryCount = await this.categories.countDocuments();
            if (categoryCount === 0) {
                const defaultCategories = [
                    {
                        name: "Restaurants",
                        slug: "restaurants",
                        icon: "🍽️",
                        description: "Dining and food services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Healthcare",
                        slug: "healthcare",
                        icon: "🏥",
                        description: "Medical and health services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Education",
                        slug: "education",
                        icon: "🏫",
                        description: "Educational institutions and services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Automotive",
                        slug: "automotive",
                        icon: "🚗",
                        description: "Automotive repair and services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Beauty & Salon",
                        slug: "beauty-salon",
                        icon: "✂️",
                        description: "Beauty and salon services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Shopping",
                        slug: "shopping",
                        icon: "🛍️",
                        description: "Retail and shopping centers",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                ];
                await this.categories.insertMany(defaultCategories);
                console.log("Default categories inserted");
            }
            // Check if cities exist
            const cityCount = await this.cities.countDocuments();
            if (cityCount === 0) {
                const defaultCities = [
                    {
                        name: "Karachi",
                        slug: "karachi",
                        province: "Sindh",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        name: "Lahore",
                        slug: "lahore",
                        province: "Punjab",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        name: "Islamabad",
                        slug: "islamabad",
                        province: "Federal Capital",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        name: "Rawalpindi",
                        slug: "rawalpindi",
                        province: "Punjab",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        name: "Faisalabad",
                        slug: "faisalabad",
                        province: "Punjab",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        name: "Multan",
                        slug: "multan",
                        province: "Punjab",
                        country: "Pakistan",
                        isActive: true,
                        createdAt: new Date(),
                    },
                ];
                await this.cities.insertMany(defaultCities);
                console.log("Default cities inserted");
            }
        }
        catch (error) {
            console.error("Error initializing default data:", error);
        }
    }
}
exports.DatabaseModels = DatabaseModels;
// Helper function to get models instance
const getModels = async () => {
    const db = await (0, mongodb_1.getDb)();
    const models = new DatabaseModels(db);
    // Lazily ensure indexes are created once per runtime
    try {
        if (!getModels._indexesCreated) {
            await models.createIndexes();
            getModels._indexesCreated = true;
        }
    }
    catch (e) {
        console.warn("Index creation skipped/failed:", e?.message || e);
    }
    return models;
};
exports.getModels = getModels;
