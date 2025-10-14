"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Load environment variables from .env file
dotenv_1.default.config();
const areas_1 = __importDefault(require("./routes/areas"));
const business_1 = __importDefault(require("./routes/business"));
const categories_1 = __importDefault(require("./routes/categories"));
const cities_1 = __importDefault(require("./routes/cities"));
const db_health_1 = __importDefault(require("./routes/db-health"));
const profile_1 = __importDefault(require("./routes/profile"));
const provinces_1 = __importDefault(require("./routes/provinces"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const search_1 = __importDefault(require("./routes/search"));
const sitemap_1 = __importDefault(require("./routes/sitemap"));
const business_related_1 = __importDefault(require("./routes/business-related"));
const debug_1 = __importDefault(require("./routes/debug"));
console.log('MONGODB_URI in index.ts:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//<redacted>@') : 'undefined');
console.log('MONGODB_DB in index.ts:', process.env.MONGODB_DB);
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/areas', areas_1.default);
app.use('/api/business', business_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/cities', cities_1.default);
app.use('/api/db-health', db_health_1.default);
app.use('/api/profile', profile_1.default);
app.use('/api/provinces', provinces_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/search', search_1.default);
app.use('/api/sitemap.xml', sitemap_1.default);
app.use('/api/business/related', business_related_1.default);
app.use('/api/debug', debug_1.default);
// Root route
app.get('/', (req, res) => {
    res.json({ ok: true, message: 'BizBranches API Server', timestamp: new Date().toISOString() });
});
app.listen(PORT, async () => {
    console.log(`Backend running on port ${PORT}`);
    try {
        const { getModels } = await Promise.resolve().then(() => __importStar(require('./lib/models')));
        const models = await getModels();
        await models.initializeDefaultData();
    }
    catch (error) {
        console.error('Failed to initialize default data:', error);
    }
});
