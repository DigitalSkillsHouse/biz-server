"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("../lib/mongodb"); // Assuming moved to backend/lib/mongodb.ts or similar
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    const slugs = await (0, mongodb_1.getAllBusinessSlugs)();
    const baseUrl = process.env.NODE_ENV === 'production' ? "https://bizbranches.pk" : "https://bizbranches-theta.vercel.app";
    console.log('Sitemap: Found', slugs.length, 'business slugs:', slugs);
    // Static pages
    const staticPages = [
        { url: "", priority: "1.0", changefreq: "daily" },
        { url: "/search", priority: "0.9", changefreq: "daily" },
        { url: "/add", priority: "0.8", changefreq: "weekly" },
        { url: "/about", priority: "0.6", changefreq: "monthly" },
        { url: "/contact", priority: "0.6", changefreq: "monthly" },
        { url: "/privacy", priority: "0.5", changefreq: "yearly" },
    ];
    const staticUrls = staticPages
        .map((page) => `
    <url>
      <loc>${baseUrl}${page.url}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`)
        .join("");
    const businessUrls = slugs
        .map((slug) => `
    <url>
      <loc>${baseUrl}/${slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`)
        .join("");
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${businessUrls}
<!-- Found ${slugs.length} businesses -->
</urlset>`;
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "no-cache");
    res.send(sitemap);
});
exports.default = router;
