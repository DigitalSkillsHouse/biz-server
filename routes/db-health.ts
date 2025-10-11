import express from 'express';
import { client } from '../lib/mongodb';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const admin = client.db().admin();
    const ping = await admin.ping();

    res.status(200).json({
      ok: true,
      ping,
      serverInfo: await admin.serverStatus().catch(() => undefined),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || String(err),
    });
  }
});

export default router;