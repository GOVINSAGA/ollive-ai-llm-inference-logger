require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');

// Initialize services
const db = require('./db');
const ingestionService = require('./ingestion/ingestion-service'); // starts listening on import

// Import routes
const chatController = require('./chat/chat-controller');
const ingestionController = require('./ingestion/ingestion-controller');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.includes('/health')) {
      console.log(`[${req.method}] ${req.url} — ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ── Routes ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('/api/conversations', chatController);
app.use('/api/ingest', ingestionController);
app.use('/api/logs', ingestionController);

// ── Error handling ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Graceful shutdown ──────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  await ingestionService.shutdown();
  await db.destroy();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Start ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   LLM Inference Logger — Backend                 ║
║   Port: ${PORT}                                      ║
║   Health: http://localhost:${PORT}/api/health         ║
╚══════════════════════════════════════════════════╝
  `);
});
