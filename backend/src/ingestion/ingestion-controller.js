const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * POST /api/ingest — Manual log ingestion endpoint.
 * Validates and stores inference logs sent directly (not via EventBus).
 */
router.post('/', async (req, res) => {
  try {
    const {
      conversation_id, message_id, model, provider,
      latency_ms, prompt_tokens, completion_tokens, total_tokens,
      time_to_first_token_ms, status, error_message,
      request_timestamp, response_timestamp,
      input_preview, output_preview, raw_metadata,
    } = req.body;

    // Validate required fields
    if (!model || !provider || !status || !request_timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: model, provider, status, request_timestamp',
      });
    }

    if (!['success', 'error', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: success, error, cancelled' });
    }

    const [log] = await db('inference_logs').insert({
      conversation_id, message_id, model, provider,
      latency_ms, prompt_tokens, completion_tokens, total_tokens,
      time_to_first_token_ms, status, error_message,
      request_timestamp, response_timestamp,
      input_preview, output_preview,
      raw_metadata: raw_metadata ? JSON.stringify(raw_metadata) : null,
    }).returning('*');

    res.status(201).json(log);
  } catch (err) {
    console.error('[Ingest] Error:', err.message);
    res.status(500).json({ error: 'Failed to ingest log' });
  }
});

/**
 * GET /api/logs — Query inference logs with filtering.
 * Query params: status, model, from, to, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { status, model, from, to, limit = 50, offset = 0 } = req.query;

    let query = db('inference_logs')
      .orderBy('request_timestamp', 'desc')
      .limit(Math.min(parseInt(limit), 200))
      .offset(parseInt(offset));

    if (status) query = query.where('status', status);
    if (model) query = query.where('model', model);
    if (from) query = query.where('request_timestamp', '>=', from);
    if (to) query = query.where('request_timestamp', '<=', to);

    const logs = await query;
    const [{ count }] = await db('inference_logs').count('id as count');

    res.json({ logs, total: parseInt(count), limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('[Logs] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/logs/stats — Aggregated metrics for the dashboard.
 */
router.get('/stats', async (req, res) => {
  try {
    const { from, to } = req.query;

    let baseQuery = db('inference_logs');
    if (from) baseQuery = baseQuery.where('request_timestamp', '>=', from);
    if (to) baseQuery = baseQuery.where('request_timestamp', '<=', to);

    // Total requests
    const [{ count: totalRequests }] = await baseQuery.clone().count('id as count');

    // Average latency
    const [{ avg: avgLatency }] = await baseQuery.clone()
      .where('status', 'success')
      .avg('latency_ms as avg');

    // P95 latency — use percentile_cont
    const p95Result = await db.raw(`
      SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95
      FROM inference_logs
      WHERE status = 'success' AND latency_ms IS NOT NULL
      ${from ? `AND request_timestamp >= '${from}'` : ''}
      ${to ? `AND request_timestamp <= '${to}'` : ''}
    `);
    const p95Latency = p95Result.rows[0]?.p95 || 0;

    // Error rate
    const [{ count: errorCount }] = await baseQuery.clone()
      .where('status', 'error')
      .count('id as count');

    const errorRate = totalRequests > 0 ? (errorCount / totalRequests * 100) : 0;

    // Token usage totals
    const [tokenUsage] = await baseQuery.clone()
      .sum('prompt_tokens as totalPromptTokens')
      .sum('completion_tokens as totalCompletionTokens')
      .sum('total_tokens as totalTokens');

    // Throughput (requests per minute for last 60 minutes)
    const throughputData = await db.raw(`
      SELECT
        date_trunc('minute', request_timestamp) as minute,
        COUNT(*) as count
      FROM inference_logs
      WHERE request_timestamp >= NOW() - INTERVAL '60 minutes'
      GROUP BY minute
      ORDER BY minute
    `);

    // Status distribution
    const statusDist = await baseQuery.clone()
      .select('status')
      .count('id as count')
      .groupBy('status');

    // Average time to first token
    const [{ avg: avgTTFT }] = await baseQuery.clone()
      .where('status', 'success')
      .whereNotNull('time_to_first_token_ms')
      .avg('time_to_first_token_ms as avg');

    res.json({
      totalRequests: parseInt(totalRequests),
      avgLatency: Math.round(parseFloat(avgLatency) || 0),
      p95Latency: Math.round(parseFloat(p95Latency) || 0),
      errorRate: parseFloat(errorRate.toFixed(2)),
      avgTimeToFirstToken: Math.round(parseFloat(avgTTFT) || 0),
      tokenUsage: {
        prompt: parseInt(tokenUsage?.totalPromptTokens) || 0,
        completion: parseInt(tokenUsage?.totalCompletionTokens) || 0,
        total: parseInt(tokenUsage?.totalTokens) || 0,
      },
      throughput: throughputData.rows,
      statusDistribution: statusDist.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error('[Stats] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/logs/:id — Single log detail.
 */
router.get('/:id', async (req, res) => {
  try {
    const log = await db('inference_logs').where('id', req.params.id).first();
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

module.exports = router;
