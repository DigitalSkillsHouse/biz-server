"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courier_1 = require("../lib/courier"); // Adjust path based on where you place courier.ts
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    const base = process.env.COURIER_API_BASE_URL;
    const cityId = req.query.cityId; // Express uses req.query for query params
    if (!cityId) {
        return res.status(400).json({ error: 'cityId is required' });
    }
    if (!base) {
        return res.status(500).json({ error: 'Missing COURIER_API_BASE_URL' });
    }
    try {
        const response = await (0, courier_1.courierGet)(`/areas?cityId=${encodeURIComponent(cityId)}`);
        const text = await response.text();
        if (!response.ok) {
            console.error('/api/areas upstream error', response.status, text);
            let body;
            try {
                body = JSON.parse(text);
            }
            catch {
                body = { raw: text };
            }
            return res.status(response.status).json({ error: body?.error || 'Failed to fetch areas', details: body });
        }
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            data = [];
        }
        const raw = Array.isArray(data)
            ? data
            : data?.data || data?.items || data?.areas || data?.results || [];
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list.map((it) => ({
            id: it?.id ?? it?._id ?? it?.value ?? it?.code ?? String(it?.name ?? ''),
            name: it?.name ?? it?.label ?? it?.title ?? String(it?.id ?? it?._id ?? it?.value ?? it?.code ?? ''),
        }));
        return res.json(normalized);
    }
    catch (err) {
        console.error('/api/areas error', err);
        return res.status(500).json({ error: 'Failed to fetch areas' });
    }
});
exports.default = router;
