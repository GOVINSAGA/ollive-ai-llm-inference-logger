const db = require('../db');
const eventBus = require('../sdk/event-bus');

/**
 * Ingestion Service — listens to inference events and persists logs to PostgreSQL.
 * Uses batch buffering for efficiency and circuit breaker for resilience.
 */

class IngestionService {
  constructor() {
    this.buffer = [];
    this.flushIntervalMs = 2000;
    this.maxBufferSize = 50;
    this.isProcessing = false;
    this.failureCount = 0;
    this.circuitOpen = false;
    this.circuitResetMs = 30000;

    this._bindEvents();
    this._startFlushTimer();
  }

  _bindEvents() {
    eventBus.on('inference.complete', (data) => this._enqueue(data));
    eventBus.on('inference.error', (data) => this._enqueue(data));
  }

  _enqueue(logData) {
    if (this.circuitOpen) {
      console.warn('[Ingestion] Circuit breaker OPEN — dropping log');
      return;
    }

    const record = {
      conversation_id: logData.conversationId || null,
      message_id: logData.messageId || null,
      model: logData.model,
      provider: logData.provider,
      latency_ms: logData.latencyMs || null,
      prompt_tokens: logData.promptTokens || null,
      completion_tokens: logData.completionTokens || null,
      total_tokens: logData.totalTokens || null,
      time_to_first_token_ms: logData.timeToFirstTokenMs || null,
      status: logData.status,
      error_message: logData.errorMessage || null,
      request_timestamp: logData.requestTimestamp,
      response_timestamp: logData.responseTimestamp || null,
      input_preview: logData.inputPreview || null,
      output_preview: logData.outputPreview || null,
      raw_metadata: logData.rawMetadata ? JSON.stringify(logData.rawMetadata) : null,
    };

    this.buffer.push(record);

    if (this.buffer.length >= this.maxBufferSize) {
      this._flush();
    }
  }

  _startFlushTimer() {
    this.timer = setInterval(() => this._flush(), this.flushIntervalMs);
  }

  async _flush() {
    if (this.isProcessing || this.buffer.length === 0) return;

    this.isProcessing = true;
    const batch = this.buffer.splice(0, this.maxBufferSize);

    try {
      await db('inference_logs').insert(batch);
      this.failureCount = 0;
      console.log(`[Ingestion] Flushed ${batch.length} logs to DB`);
    } catch (err) {
      console.error('[Ingestion] Failed to flush logs:', err.message);
      this.failureCount++;

      // Circuit breaker: open after 3 consecutive failures
      if (this.failureCount >= 3) {
        this.circuitOpen = true;
        console.error('[Ingestion] Circuit breaker OPENED — pausing ingestion');
        setTimeout(() => {
          this.circuitOpen = false;
          this.failureCount = 0;
          console.log('[Ingestion] Circuit breaker CLOSED — resuming ingestion');
        }, this.circuitResetMs);
      } else {
        // Put failed batch back
        this.buffer.unshift(...batch);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Force flush remaining buffer (for graceful shutdown).
   */
  async shutdown() {
    clearInterval(this.timer);
    await this._flush();
  }
}

// Singleton
const ingestionService = new IngestionService();

module.exports = ingestionService;
