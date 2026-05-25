const axios = require('axios');
const eventBus = require('./event-bus');
const { safePreview } = require('./pii-redactor');

/**
 * LLM Client SDK — wraps LLM provider API calls with automatic
 * metadata capture, latency measurement, and event-based logging.
 * 
 * Supports:
 *   - Streaming (SSE) and non-streaming modes
 *   - Multi-provider abstraction (currently NVIDIA)
 *   - Automatic token usage tracking
 *   - Time-to-first-token measurement
 *   - Cancellation via AbortController
 */

const PROVIDER_CONFIGS = {
  nvidia: {
    name: 'nvidia',
    url: process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    authHeader: () => `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
};

class LLMClient {
  constructor(provider = 'nvidia') {
    const cfg = PROVIDER_CONFIGS[provider];
    if (!cfg) throw new Error(`Unknown provider: ${provider}`);
    this.provider = cfg;
  }

  /**
   * Send a chat completion request with streaming.
   * Yields tokens as they arrive and emits inference events.
   *
   * @param {Object} params
   * @param {Array} params.messages - Chat messages array
   * @param {string} params.conversationId
   * @param {string} params.messageId - ID of the assistant message being generated
   * @param {AbortController} [params.abortController] - For cancellation
   * @param {function} [params.onToken] - Callback for each token chunk
   * @returns {Promise<{content: string, usage: Object}>}
   */
  async chatStream({ messages, conversationId, messageId, abortController, onToken }) {
    const requestTimestamp = new Date();
    const model = this.provider.model;
    const provider = this.provider.name;
    let firstTokenTime = null;
    let fullContent = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Emit start event
    eventBus.emitStart({ conversationId, messageId, model, provider, requestTimestamp: requestTimestamp.toISOString() });

    const inputPreview = messages.map(m => `[${m.role}]: ${m.content}`).join('\n');

    try {
      const response = await axios.post(
        this.provider.url,
        {
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          stream: true,
        },
        {
          headers: {
            'Authorization': this.provider.authHeader(),
            'Accept': 'text/event-stream',
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          signal: abortController?.signal,
          timeout: 60000,
        }
      );

      return await new Promise((resolve, reject) => {
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                // Track time to first token
                if (!firstTokenTime) {
                  firstTokenTime = new Date();
                  eventBus.emitFirstToken({
                    conversationId,
                    messageId,
                    timeToFirstTokenMs: firstTokenTime - requestTimestamp,
                  });
                }

                fullContent += delta.content;
                if (onToken) onToken(delta.content);
              }

              // Capture usage if present (usually in last chunk)
              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch (e) {
              // Skip malformed JSON chunks
            }
          }
        });

        response.data.on('end', () => {
          const responseTimestamp = new Date();
          const latencyMs = responseTimestamp - requestTimestamp;

          // Emit complete event
          eventBus.emitComplete({
            conversationId,
            messageId,
            model,
            provider,
            latencyMs,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            timeToFirstTokenMs: firstTokenTime ? firstTokenTime - requestTimestamp : null,
            status: 'success',
            inputPreview: safePreview(inputPreview),
            outputPreview: safePreview(fullContent),
            requestTimestamp: requestTimestamp.toISOString(),
            responseTimestamp: responseTimestamp.toISOString(),
            rawMetadata: { stream: true, max_tokens: 1024, temperature: 0.7 },
          });

          resolve({ content: fullContent, usage });
        });

        response.data.on('error', (err) => {
          const responseTimestamp = new Date();
          eventBus.emitError({
            conversationId,
            messageId,
            model,
            provider,
            latencyMs: responseTimestamp - requestTimestamp,
            status: 'error',
            errorMessage: err.message,
            inputPreview: safePreview(inputPreview),
            requestTimestamp: requestTimestamp.toISOString(),
            responseTimestamp: responseTimestamp.toISOString(),
            rawMetadata: { stream: true },
          });
          reject(err);
        });
      });
    } catch (err) {
      const responseTimestamp = new Date();
      const isCancelled = err.code === 'ERR_CANCELED' || err.name === 'AbortError' || abortController?.signal?.aborted;

      eventBus.emitError({
        conversationId,
        messageId,
        model,
        provider,
        latencyMs: responseTimestamp - requestTimestamp,
        status: isCancelled ? 'cancelled' : 'error',
        errorMessage: err.message,
        inputPreview: safePreview(inputPreview),
        outputPreview: safePreview(fullContent),
        requestTimestamp: requestTimestamp.toISOString(),
        responseTimestamp: responseTimestamp.toISOString(),
        rawMetadata: { stream: true },
      });

      if (isCancelled) {
        return { content: fullContent, usage, cancelled: true };
      }
      throw err;
    }
  }
}

module.exports = LLMClient;
