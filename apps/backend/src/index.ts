import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { initSocket } from './socket.js';
import apiRoutes from './routes/index.js';
import { rateLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { RadarWorkerService } from './services/radarWorker.service.js';
import { FreshnessService } from './services/freshness.service.js';
import './connectors/index.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// 1. Core Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// 2. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ProspectAI Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes under /api/v1
app.use('/api/v1', apiRoutes);

// 4. Centralized Error Handler
app.use(errorHandler);

// 5. Initialize Socket.IO
initSocket(server);

// 6. Start Background Workers
const workerIntervalMs = process.env.RADAR_WORKER_INTERVAL_MS
  ? parseInt(process.env.RADAR_WORKER_INTERVAL_MS, 10)
  : 60000;
RadarWorkerService.start(workerIntervalMs);
FreshnessService.start(300000); // Sweep every 5 minutes

import { ConfigValidator } from './utils/configValidator.js';

// 7. Start HTTP Server
server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 ProspectAI Backend running at http://${HOST}:${PORT}`);
  console.log(`🔌 Socket.IO live on ws://${HOST}:${PORT}`);
  console.log(`📡 Endpoints available under http://${HOST}:${PORT}/api/v1`);
  console.log(`⚙️ Radar Worker started (interval: ${workerIntervalMs}ms)`);
  console.log(`🧹 Freshness & Expiry Worker active (interval: 300000ms)`);
  ConfigValidator.validateAndReport();
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  RadarWorkerService.stop();
  FreshnessService.stop();
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
