const { EventEmitter } = require('events');

/**
 * Central event bus for decoupling inference logging from the inference path.
 * Events:
 *   - inference.start    { conversationId, messageId, model, provider, requestTimestamp }
 *   - inference.firstToken { conversationId, messageId, timeToFirstTokenMs }
 *   - inference.complete  { conversationId, messageId, model, provider, latencyMs, promptTokens, completionTokens, totalTokens, timeToFirstTokenMs, status, inputPreview, outputPreview, requestTimestamp, responseTimestamp, rawMetadata }
 *   - inference.error     { conversationId, messageId, model, provider, latencyMs, status, errorMessage, requestTimestamp, responseTimestamp, rawMetadata }
 */
class InferenceEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitStart(data) {
    this.emit('inference.start', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitFirstToken(data) {
    this.emit('inference.firstToken', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitComplete(data) {
    this.emit('inference.complete', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitError(data) {
    this.emit('inference.error', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton
const eventBus = new InferenceEventBus();

module.exports = eventBus;
