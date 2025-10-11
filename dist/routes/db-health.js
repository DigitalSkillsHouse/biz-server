"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("../lib/mongodb");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const admin = mongodb_1.client.db().admin();
        const ping = await admin.ping();
        res.status(200).json({
            ok: true,
            ping,
            serverInfo: await admin.serverStatus().catch(() => undefined),
        });
    }
    catch (err) {
        res.status(500).json({
            ok: false,
            error: err?.message || String(err),
        });
    }
});
exports.default = router;
