import express from 'express';
import { getAllBusinessSlugs } from '../lib/mongodb'; // Assuming moved to backend/lib/mongodb.ts or similar

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const slugs = await getAllBusinessSlugs();
    const baseUrl = process.env.NODE_ENV === 'production' ? "https://bizbranches.pk" : "http://localhost:3000";
    
    console.log('Sitemap: Found', slugs.length, 'business slugs');

    // Static pages
    const staticPages = [
      { url: "", priority: "1.0", changefreq: "daily" },
      { url: "/search", priority: "0.9", changefreq: "daily" },
      { url: "/add", priority: "0.8", changefreq: "weekly" },
      { url: "/about", priority: "0.6", changefreq: "monthly" },
      { url: "/contact", priority: "0.6", changefreq: "monthly" },
      { url: "/privacy", priority: "0.5", changefreq: "yearly" },
      { url: "/pending", priority: "0.4", changefreq: "weekly" },
    ];

    const staticUrls = staticPages
      .map(
        (page) => `
      <url>
        <loc>${baseUrl}${page.url}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
      </url>`
      )
      .join("");

    const businessUrls = slugs
      .map(
        (slug) => `
      <url>
        <loc>${baseUrl}/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>`
      )
      .join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${businessUrls}
<!-- Found ${slugs.length} businesses -->
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

export default router;