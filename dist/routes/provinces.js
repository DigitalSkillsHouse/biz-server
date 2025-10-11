"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    // Static provinces for Pakistan to avoid external dependency and CORS
    const provinces = [
        { id: "Punjab", name: "Punjab" },
        { id: "Sindh", name: "Sindh" },
        { id: "KPK", name: "Khyber Pakhtunkhwa" },
        { id: "Balochistan", name: "Balochistan" },
        { id: "GB", name: "Gilgit Baltistan" },
        { id: "AJK", name: "Azad Jammu & Kashmir" },
    ];
    res.json(provinces);
    // cache for 1 day, allow week-long stale-while-revalidate
    res.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
});
exports.default = router;
