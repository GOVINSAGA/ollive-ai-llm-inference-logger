import React from 'react';

/**
 * About — Architecture overview page explaining what the project does and how it works.
 */
export default function About() {
  return (
    <div className="main-content">
      <div className="about-page">
        {/* Hero */}
        <div className="about-hero">
          <div className="about-hero-icon">✦</div>
          <h1>LLM Inference Logger</h1>
          <p className="about-subtitle">
            A production-grade inference logging &amp; ingestion system for LLM applications
          </p>
          <div className="about-badges">
            <span className="about-badge nvidia">NVIDIA Llama 3.2</span>
            <span className="about-badge pg">PostgreSQL 16</span>
            <span className="about-badge react">React 19</span>
            <span className="about-badge node">Node.js + Express</span>
            <span className="about-badge docker">Docker Compose</span>
          </div>
        </div>

        {/* What it does */}
        <section className="about-section">
          <h2 className="about-section-title">
            <span className="section-icon">🎯</span> What This Project Does
          </h2>
          <div className="about-cards-grid">
            <div className="about-card">
              <div className="about-card-icon">💬</div>
              <h3>1. Chatbot Application</h3>
              <p>
                A multi-turn conversational AI chatbot powered by <strong>NVIDIA's Llama 3.2 (11B Vision Instruct)</strong> model.
                Supports streaming responses via Server-Sent Events (SSE), maintains a 20-message context window,
                and auto-generates conversation titles.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">📦</div>
              <h3>2. Lightweight SDK Wrapper</h3>
              <p>
                A transparent wrapper around LLM API calls that <strong>automatically captures inference metadata</strong> — 
                model, provider, latency, token usage, time-to-first-token, timestamps, request status, and I/O previews.
                Zero config needed; just use the SDK instead of raw API calls.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🔄</div>
              <h3>3. Ingestion Pipeline</h3>
              <p>
                An <strong>event-driven, async ingestion service</strong> that receives logs from the SDK via EventEmitter,
                validates payloads, applies PII redaction, and batch-inserts into PostgreSQL.
                Includes a circuit breaker for resilience.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🗄️</div>
              <h3>4. Database Storage</h3>
              <p>
                PostgreSQL with <strong>3 normalized tables</strong> — conversations, messages, and inference_logs.
                Uses UUIDs, TIMESTAMPTZ, JSONB for extensibility, and optimized indexes for dashboard queries.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="about-section">
          <h2 className="about-section-title">
            <span className="section-icon">⚙️</span> How It Works
          </h2>
          <div className="architecture-flow">
            <div className="flow-step">
              <div className="flow-number">1</div>
              <div className="flow-content">
                <h4>User Sends Message</h4>
                <p>Frontend sends message via <code>POST /api/conversations/:id/messages</code>. Backend saves to <code>messages</code> table and builds context from last 20 messages.</p>
              </div>
            </div>
            <div className="flow-connector">↓</div>
            <div className="flow-step">
              <div className="flow-number">2</div>
              <div className="flow-content">
                <h4>SDK Wrapper Calls NVIDIA API</h4>
                <p>The LLM Client wraps the API call, recording <code>request_timestamp</code> and starting latency measurement. Streams tokens via SSE back to the client in real-time.</p>
              </div>
            </div>
            <div className="flow-connector">↓</div>
            <div className="flow-step">
              <div className="flow-number">3</div>
              <div className="flow-content">
                <h4>Metadata Captured Automatically</h4>
                <p>On first token: <code>time_to_first_token_ms</code>. On completion: <code>latency_ms</code>, <code>prompt_tokens</code>, <code>completion_tokens</code>, <code>total_tokens</code>, <code>status</code>. PII is redacted from previews.</p>
              </div>
            </div>
            <div className="flow-connector">↓</div>
            <div className="flow-step">
              <div className="flow-number">4</div>
              <div className="flow-content">
                <h4>Event Emitted (Non-Blocking)</h4>
                <p>The SDK emits <code>inference.complete</code> or <code>inference.error</code> via the EventBus. This is <strong>fully async</strong> — logging never slows down the chat response.</p>
              </div>
            </div>
            <div className="flow-connector">↓</div>
            <div className="flow-step">
              <div className="flow-number">5</div>
              <div className="flow-content">
                <h4>Ingestion Service Buffers & Writes</h4>
                <p>Logs are buffered (max 50 items or 2-second flush interval) and batch-inserted into the <code>inference_logs</code> table. A circuit breaker protects against DB failures.</p>
              </div>
            </div>
            <div className="flow-connector">↓</div>
            <div className="flow-step">
              <div className="flow-number">6</div>
              <div className="flow-content">
                <h4>Dashboard Queries in Real-Time</h4>
                <p>The dashboard polls <code>GET /api/logs/stats</code> every 5 seconds, computing avg/P95 latency, error rate, throughput, TTFT, token usage, and status distribution from PostgreSQL.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="about-section">
          <h2 className="about-section-title">
            <span className="section-icon">🛠️</span> Tech Stack
          </h2>
          <div className="tech-stack-grid">
            <div className="tech-item">
              <div className="tech-label">Frontend</div>
              <div className="tech-value">React 19 + Vite 6</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">Styling</div>
              <div className="tech-value">Vanilla CSS (Dark Theme)</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">Backend</div>
              <div className="tech-value">Node.js + Express</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">Database</div>
              <div className="tech-value">PostgreSQL 16</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">ORM</div>
              <div className="tech-value">Knex.js (Query Builder)</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">LLM Provider</div>
              <div className="tech-value">NVIDIA API (Llama 3.2 11B)</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">Streaming</div>
              <div className="tech-value">Server-Sent Events (SSE)</div>
            </div>
            <div className="tech-item">
              <div className="tech-label">Deployment</div>
              <div className="tech-value">Docker Compose</div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="about-section">
          <h2 className="about-section-title">
            <span className="section-icon">✨</span> Key Features
          </h2>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <div>
                <strong>Streaming Responses</strong>
                <p>Real-time token-by-token streaming from NVIDIA API → Backend SSE → Frontend render</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Analytics Dashboard</strong>
                <p>Latency (avg + P95), throughput, error rate, TTFT, token usage, status distribution</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <div>
                <strong>PII Redaction</strong>
                <p>Automatic regex-based scrubbing of emails, phones, SSNs, credit cards, IPs before storage</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <strong>Event-Driven Architecture</strong>
                <p>Logging decoupled from inference via EventEmitter — zero impact on chat latency</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔌</span>
              <div>
                <strong>Circuit Breaker</strong>
                <p>Auto-opens after 3 DB failures, prevents cascade failures, self-heals after 30s</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏸️</span>
              <div>
                <strong>Conversation Control</strong>
                <p>Create, cancel, resume, delete conversations. AbortController stops in-flight LLM calls</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🧩</span>
              <div>
                <strong>Multi-Provider SDK</strong>
                <p>Abstracted provider configs — swap NVIDIA for OpenAI, Anthropic, etc. with one line</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🐳</span>
              <div>
                <strong>One-Command Setup</strong>
                <p>docker compose up --build starts PostgreSQL, backend, and frontend automatically</p>
              </div>
            </div>
          </div>
        </section>

        {/* Schema */}
        <section className="about-section">
          <h2 className="about-section-title">
            <span className="section-icon">🗃️</span> Database Schema
          </h2>
          <div className="schema-tables">
            <div className="schema-table">
              <h4>conversations</h4>
              <div className="schema-fields">
                <span className="schema-field pk">id <small>UUID PK</small></span>
                <span className="schema-field">title <small>VARCHAR</small></span>
                <span className="schema-field">status <small>ENUM</small></span>
                <span className="schema-field">created_at <small>TIMESTAMPTZ</small></span>
                <span className="schema-field">updated_at <small>TIMESTAMPTZ</small></span>
              </div>
            </div>
            <div className="schema-arrow">→</div>
            <div className="schema-table">
              <h4>messages</h4>
              <div className="schema-fields">
                <span className="schema-field pk">id <small>UUID PK</small></span>
                <span className="schema-field fk">conversation_id <small>FK</small></span>
                <span className="schema-field">role <small>ENUM</small></span>
                <span className="schema-field">content <small>TEXT</small></span>
                <span className="schema-field">created_at <small>TIMESTAMPTZ</small></span>
              </div>
            </div>
            <div className="schema-arrow">→</div>
            <div className="schema-table">
              <h4>inference_logs</h4>
              <div className="schema-fields">
                <span className="schema-field pk">id <small>UUID PK</small></span>
                <span className="schema-field fk">conversation_id <small>FK</small></span>
                <span className="schema-field fk">message_id <small>FK</small></span>
                <span className="schema-field">model, provider</span>
                <span className="schema-field">latency_ms, tokens</span>
                <span className="schema-field">status, error_message</span>
                <span className="schema-field">input/output_preview</span>
                <span className="schema-field">raw_metadata <small>JSONB</small></span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="about-footer">
          <p>Built for the Ollive.ai assessment • <code>docker compose up --build</code> to run</p>
        </div>
      </div>
    </div>
  );
}
