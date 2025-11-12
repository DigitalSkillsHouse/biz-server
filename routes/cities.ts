import express from 'express';

const router = express.Router();

// Static cities data organized by province
const citiesByProvince: Record<string, Array<{ id: string; name: string }>> = {
  "Punjab": [
    { id: "lahore", name: "Lahore" },
    { id: "faisalabad", name: "Faisalabad" },
    { id: "rawalpindi", name: "Rawalpindi" },
    { id: "multan", name: "Multan" },
    { id: "gujranwala", name: "Gujranwala" },
    { id: "sialkot", name: "Sialkot" },
    { id: "sargodha", name: "Sargodha" },
    { id: "bahawalpur", name: "Bahawalpur" },
    { id: "jhang", name: "Jhang" },
    { id: "sheikhupura", name: "Sheikhupura" },
    { id: "gujrat", name: "Gujrat" },
    { id: "kasur", name: "Kasur" },
    { id: "okara", name: "Okara" },
    { id: "sahiwal", name: "Sahiwal" },
    { id: "wazirabad", name: "Wazirabad" }
  ],
  "Sindh": [
    { id: "karachi", name: "Karachi" },
    { id: "hyderabad", name: "Hyderabad" },
    { id: "sukkur", name: "Sukkur" },
    { id: "larkana", name: "Larkana" },
    { id: "nawabshah", name: "Nawabshah" },
    { id: "mirpurkhas", name: "Mirpurkhas" },
    { id: "jacobabad", name: "Jacobabad" },
    { id: "shikarpur", name: "Shikarpur" },
    { id: "khairpur", name: "Khairpur" },
    { id: "dadu", name: "Dadu" }
  ],
  "KPK": [
    { id: "peshawar", name: "Peshawar" },
    { id: "mardan", name: "Mardan" },
    { id: "mingora", name: "Mingora" },
    { id: "kohat", name: "Kohat" },
    { id: "dera-ismail-khan", name: "Dera Ismail Khan" },
    { id: "bannu", name: "Bannu" },
    { id: "swabi", name: "Swabi" },
    { id: "charsadda", name: "Charsadda" },
    { id: "nowshera", name: "Nowshera" },
    { id: "abbottabad", name: "Abbottabad" }
  ],
  "Balochistan": [
    { id: "quetta", name: "Quetta" },
    { id: "turbat", name: "Turbat" },
    { id: "gwadar", name: "Gwadar" },
    { id: "khuzdar", name: "Khuzdar" },
    { id: "chaman", name: "Chaman" },
    { id: "hub", name: "Hub" },
    { id: "sibi", name: "Sibi" },
    { id: "zhob", name: "Zhob" },
    { id: "loralai", name: "Loralai" }
  ],
  "GB": [
    { id: "gilgit", name: "Gilgit" },
    { id: "skardu", name: "Skardu" },
    { id: "hunza", name: "Hunza" },
    { id: "ghanche", name: "Ghanche" },
    { id: "nagar", name: "Nagar" },
    { id: "astore", name: "Astore" },
    { id: "diamer", name: "Diamer" }
  ],
  "ICT": [
    { id: "islamabad", name: "Islamabad" }
  ],
  "AJK": [
    { id: "muzaffarabad", name: "Muzaffarabad" },
    { id: "mirpur", name: "Mirpur" },
    { id: "kotli", name: "Kotli" },
    { id: "rawalakot", name: "Rawalakot" },
    { id: "bhimber", name: "Bhimber" },
    { id: "bagh", name: "Bagh" },
    { id: "palandri", name: "Palandri" }
  ]
};

// Get all cities as a flat array
const getAllCities = () => {
  const allCities: Array<{ id: string; name: string }> = [];
  Object.values(citiesByProvince).forEach(cities => {
    allCities.push(...cities);
  });
  return allCities;
};

router.get('/', async (req, res) => {
  const base = process.env.LEOPARDS_API_BASE_URL;
  const apiKey = process.env.LEOPARDS_API_KEY;
  const apiPassword = process.env.LEOPARDS_API_PASSWORD;

  // Get provinceId from query params
  const provinceId = req.query.provinceId as string;

  // If provinceId is provided, return cities for that province
  if (provinceId) {
    const cities = citiesByProvince[provinceId] || [];
    res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.json({ ok: true, cities });
  }

  // If env vars are missing, return all cities as fallback
  if (!base || !apiKey || !apiPassword) {
    const fallback = getAllCities();
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
    let data: any;
    try { data = JSON.parse(text); } catch { data = {}; }

    if (!response.ok) {
      // Fallback to static data on API error
      const fallback = getAllCities();
      res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.json({ ok: true, cities: fallback });
    }

    if (String(data?.status) !== "1" || !Array.isArray(data?.city_list)) {
      // Fallback to static data on invalid response
      const fallback = getAllCities();
      res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.json({ ok: true, cities: fallback });
    }

    // Normalize city_list to { id, name }
    let cities = data.city_list.map((c: any) => ({
      id: c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? String(c?.name ?? c?.CityName ?? ""),
      name: c?.name ?? c?.CityName ?? c?.city_name ?? String(c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? ""),
    }));

    res.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.json({ ok: true, cities });
  } catch (err: any) {
    console.error('Cities API error:', err);
    // Fallback to static data on error
    const fallback = getAllCities();
    res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.json({ ok: true, cities: fallback });
  }
});

export default router;