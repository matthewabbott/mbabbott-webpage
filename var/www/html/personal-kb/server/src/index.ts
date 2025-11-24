// server/src/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
console.log('Current working directory:', process.cwd());
console.log('Loading .env from:', path.resolve(process.cwd(), '.env'));
//const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });
const result = dotenv.config();
if (result.error) {
    console.error('Error loading .env file:', result.error);
}
console.log('Environment variables after dotenv:', {
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_USER: process.env.GITHUB_USER
});

// Rest of your imports
import express from 'express';
import cors from 'cors';
import { GitHubCache } from './githubCache';
import cron from 'node-cron';

const app = express();
const port = process.env.PORT || 3001;
const cache = new GitHubCache();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.get('/api/repos', async (req, res) => {
  try {
    const repos = await cache.getRepos();
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/repos/:name/languages', async (req, res) => {
  try {
    const languages = await cache.getLanguages(req.params.name);
    res.json(languages);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      res.status(404).json({ error: 'Languages not found' });
    } else {
      console.error('Error fetching languages:', error);
      res.status(500).json({ error: 'Failed to fetch languages' });
    }
  }
});

app.get('/api/repos/:name/readme', async (req, res) => {
  try {
    const readme = await cache.getReadme(req.params.name);
    res.type('text').send(readme);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      res.status(404).json({ error: 'README not found' });
    } else {
      console.error('Error fetching README:', error);
      res.status(500).json({ error: 'Failed to fetch README' });
    }
  }
});

app.get('/api/metadata', async (req, res) => {
  try {
    const metadata = await cache.getMetadata();
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Schedule cache updates
cron.schedule('0 * * * *', async () => {
  try {
    await cache.updateCache();
  } catch (error) {
    console.error('Scheduled cache update failed:', error);
  }
});

// Initial cache update on startup
cache.updateCache().catch(console.error);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});