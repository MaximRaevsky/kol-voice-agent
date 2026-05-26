// Load environment variables FIRST using synchronous approach
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths to find .env - __dirname is apps/server/src when running with tsx
const envPaths = [
  resolve(__dirname, '../../../.env'),        // apps/server/src -> project root/.env
  resolve(__dirname, '../../.env'),           // apps/server/src -> apps/server/.env (fallback)
  resolve(process.cwd(), '.env'),             // From CWD
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) break;
  }
}

// Bootstrap the app with dynamic imports so env vars are loaded first
async function bootstrap() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const { apiRouter } = await import('./routes/api.js');
  const { callRouter } = await import('./routes/call.js');
  const speechRouter = (await import('./routes/speech.js')).default;
  const { isAzureTtsEnabled } = await import('./providers/speech/azureTtsProvider.js');

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api', apiRouter);
  app.use('/api/call', callRouter);
  app.use('/api/speech', speechRouter);

  // Feature flags
  const features = {
    azureTtsEnabled: isAzureTtsEnabled(),
    llmEnabled: Boolean(process.env.OPENAI_API_KEY),
  };

  // Health check with feature flags
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      features,
    });
  });

  // Features endpoint
  app.get('/api/features', (_req, res) => {
    res.json(features);
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(() => process.exit(1));
