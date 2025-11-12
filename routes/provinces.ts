import express from 'express';

const router = express.Router();

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
  // cache for 1 day, allow week-long stale-while-revalidate
  res.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  res.json(provinces);
});

export default router;