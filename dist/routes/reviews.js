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
const models_1 = require("../lib/models");
const schemas_1 = require("../lib/schemas");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const bizParam = (req.query.businessId || req.query.business || "").trim();
        if (!bizParam) {
            return res.status(400).json({ ok: false, error: "businessId is required" });
        }
        const models = await (0, models_1.getModels)();
        // Resolve business by _id or slug
        let business = null;
        try {
            const { ObjectId } = await Promise.resolve().then(() => __importStar(require("mongodb")));
            if (ObjectId.isValid(bizParam)) {
                business = await models.businesses.findOne({ _id: new ObjectId(bizParam) });
            }
        }
        catch { }
        if (!business) {
            business = await models.businesses.findOne({ slug: bizParam });
        }
        if (!business) {
            return res.status(404).json({ ok: false, error: "Business not found" });
        }
        const businessId = String(business._id);
        const reviews = await models.reviews
            .find({ businessId }, { projection: { _id: 0 } })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray();
        // Recalculate aggregates from reviews to reflect any admin edits
        const agg = await models.reviews.aggregate([
            { $match: { businessId } },
            { $group: { _id: "$businessId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]).toArray();
        const calcAvg = Number((agg[0]?.avg ?? 0).toFixed(2));
        const calcCount = Number(agg[0]?.count ?? 0);
        // Best-effort sync back to business document (do not block response)
        models.businesses.updateOne({ _id: business._id }, { $set: { ratingAvg: calcAvg, ratingCount: calcCount, updatedAt: new Date() } }).catch(() => { });
        res.set("Cache-Control", "no-store");
        res.json({
            ok: true,
            reviews,
            ratingAvg: calcAvg,
            ratingCount: calcCount,
        });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Failed to fetch reviews" });
    }
});
router.post('/', async (req, res) => {
    try {
        const models = await (0, models_1.getModels)();
        const json = req.body || {};
        // Accept businessId as DB id or slug; coerce rating to number
        const candidate = {
            businessId: String(json.businessId || json.business || ""),
            name: String(json.name || "").trim(),
            rating: Number(json.rating),
            comment: String(json.comment || "").trim(),
        };
        // Resolve business first
        let business = null;
        try {
            const { ObjectId } = await Promise.resolve().then(() => __importStar(require("mongodb")));
            if (candidate.businessId && ObjectId.isValid(candidate.businessId)) {
                business = await models.businesses.findOne({ _id: new ObjectId(candidate.businessId) });
            }
        }
        catch { }
        if (!business && candidate.businessId) {
            business = await models.businesses.findOne({ slug: candidate.businessId });
        }
        if (!business) {
            return res.status(404).json({ ok: false, error: "Business not found" });
        }
        const parsed = schemas_1.CreateReviewSchema.safeParse({
            businessId: String(business._id),
            name: candidate.name,
            rating: candidate.rating,
            comment: candidate.comment,
        });
        if (!parsed.success) {
            return res.status(400).json({ ok: false, error: "Invalid review", details: parsed.error.flatten() });
        }
        const doc = {
            ...parsed.data,
            createdAt: new Date(),
        };
        await models.reviews.insertOne(doc);
        // Update business ratingAvg and ratingCount atomically (best-effort)
        const current = await models.businesses.findOne({ _id: business._id }, { projection: { ratingAvg: 1, ratingCount: 1 } });
        const prevAvg = Number(current?.ratingAvg || 0);
        const prevCount = Number(current?.ratingCount || 0);
        const newCount = prevCount + 1;
        const newAvg = Number(((prevAvg * prevCount + doc.rating) / newCount).toFixed(2));
        await models.businesses.updateOne({ _id: business._id }, { $set: { ratingAvg: newAvg, ratingCount: newCount, updatedAt: new Date() } });
        res.set("Cache-Control", "no-store");
        res.json({ ok: true, ratingAvg: newAvg, ratingCount: newCount });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Failed to submit review" });
    }
});
exports.default = router;
