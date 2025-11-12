"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    const base = process.env.LEOPARDS_API_BASE_URL;
    const apiKey = process.env.LEOPARDS_API_KEY;
    const apiPassword = process.env.LEOPARDS_API_PASSWORD;
    // Optional param for future filtering
    const provinceId = req.query.provinceId;
    // If env vars are missing, return a safe fallback
    if (!base || !apiKey || !apiPassword) {
        const fallback = [
            { id: "lahore", name: "Lahore" },
            { id: "karachi", name: "Karachi" },
            { id: "islamabad", name: "Islamabad" },
            { id: "rawalpindi", name: "Rawalpindi" },
            { id: "faisalabad", name: "Faisalabad" },
            { id: "multan", name: "Multan" },
            { id: "peshawar", name: "Peshawar" },
            { id: "quetta", name: "Quetta" },
            { id: "gujranwala", name: "Gujranwala" },
            { id: "sialkot", name: "Sialkot" },
        ];
        res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.json({ ok: true, cities: fallback });
    }
    try {
        const response = await fetch(`${base}/getAllCities/format/json/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: apiKey, api_password: apiPassword }),
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            data = {};
        }
        if (!response.ok) {
            return res.json({ ok: false, error: data?.error || `Upstream error ${response.status}`, details: data, upstreamRaw: text });
        }
        if (String(data?.status) !== "1" || !Array.isArray(data?.city_list)) {
            return res.json({ ok: false, error: "Invalid response", details: data, upstreamRaw: text });
        }
        // Normalize city_list to { id, name }
        let cities = data.city_list.map((c) => ({
            id: c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? String(c?.name ?? c?.CityName ?? ""),
            name: c?.name ?? c?.CityName ?? c?.city_name ?? String(c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? ""),
        }));
        // Optionally filter by provinceId if needed
        if (provinceId) {
            // No upstream filter available in this endpoint; keep all for now
        }
        res.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        res.json({ ok: true, cities });
    }
    catch (err) {
        console.error('Cities API error:', err);
        // Fallback on error
        const fallback = [
            { id: "lahore", name: "Lahore" },
            { id: "karachi", name: "Karachi" },
            { id: "islamabad", name: "Islamabad" },
            { id: "rawalpindi", name: "Rawalpindi" },
            { id: "faisalabad", name: "Faisalabad" },
            { id: "multan", name: "Multan" },
        ];
        res.json({ ok: true, cities: fallback });
    }
});
exports.default = router;
