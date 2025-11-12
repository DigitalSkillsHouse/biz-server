import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  // Prevent multiple responses
  if (res.headersSent) return;
  
  // Static provinces for Pakistan to avoid external dependency and CORS
  const provinces = [
    { id: "Punjab", name: "Punjab" },
    { id: "Sindh", name: "Sindh" },
    { id: "KPK", name: "Khyber Pakhtunkhwa" },
    { id: "Balochistan", name: "Balochistan" },
    { id: "ICT", name: "Islamabad Capital Territory" },
    { id: "GB", name: "Gilgit Baltistan" },
    { id: "AJK", name: "Azad Jammu & Kashmir" },
  ];
  
  try {
    // cache for 1 day, allow week-long stale-while-revalidate
    res.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.json(provinces);
  } catch (error) {
    console.error('Error in provinces route:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;