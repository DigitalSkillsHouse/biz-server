import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();
import areasRouter from './routes/areas';
import businessRouter from './routes/business';
import categoriesRouter from './routes/categories';
import citiesRouter from './routes/cities';
import dbHealthRouter from './routes/db-health';
import profileRouter from './routes/profile';
import provincesRouter from './routes/provinces';
import reviewsRouter from './routes/reviews';
import searchRouter from './routes/search';
import sitemapRouter from './routes/sitemap';
import businessRelatedRouter from './routes/business-related';
import debugRouter from './routes/debug';

console.log('MONGODB_URI in index.ts:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//<redacted>@') : 'undefined');
console.log('MONGODB_DB in index.ts:', process.env.MONGODB_DB);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/areas', areasRouter);
app.use('/api/business', businessRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/db-health', dbHealthRouter);
app.use('/api/profile', profileRouter);
app.use('/api/provinces', provincesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/search', searchRouter);
app.use('/api/sitemap.xml', sitemapRouter);
app.use('/api/business/related', businessRelatedRouter);
app.use('/api/debug', debugRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'BizBranches API Server', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  
  // Initialize default data
  try {
    const { getModels } = await import('./lib/models');
    const models = await getModels();
    await models.initializeDefaultData();
  } catch (error) {
    console.error('Failed to initialize default data:', error);
  }
});