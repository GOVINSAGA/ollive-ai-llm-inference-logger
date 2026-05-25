# LLM Inference Logger & Ingestion System

A production-grade inference logging and ingestion system for LLM applications. Features a chatbot with streaming responses, a lightweight SDK wrapper for metadata capture, an event-driven ingestion pipeline, and a real-time analytics dashboard.

![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue)
![LLM](https://img.shields.io/badge/LLM-NVIDIA%20Llama%203.2-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ollive-llm-inference-logger.git
cd ollive-llm-inference-logger

# Copy environment file and add your NVIDIA API key
cp .env.example .env
# Edit .env and set NVIDIA_API_KEY

# Start everything
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/api/health |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)              │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │  Chat UI │  │  Conversation │  │ Analytics Dashboard │   │
│  │  (SSE)   │  │   Manager     │  │ (Auto-refresh 5s)  │   │
│  └────┬─────┘  └───────┬───────┘  └────────┬───────────┘   │
└───────┼────────────────┼────────────────────┼───────────────┘
        │ SSE Stream     │ REST              │ REST
┌───────┼────────────────┼────────────────────┼───────────────┐
│       ▼                ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Express.js Backend                      │    │
│  │  ┌───────────────┐  ┌──────────────────────────┐    │    │
│  │  │ Chat Controller│  │  Ingestion Controller    │    │    │
│  │  │ (CRUD + SSE)  │  │  (Query + Stats)         │    │    │
│  │  └───────┬───────┘  └──────────▲───────────────┘    │    │
│  │          │                      │                    │    │
│  │          ▼                      │                    │    │
│  │  ┌───────────────┐              │                    │    │
│  │  │  LLM SDK      │    ┌────────┴───────────┐        │    │
│  │  │  Wrapper       │───▶│  EventBus          │        │    │
│  │  │  • Latency     │    │  (EventEmitter)    │        │    │
│  │  │  • Tokens      │    └────────┬───────────┘        │    │
│  │  │  • TTFT        │             │ async              │    │
│  │  │  • PII Redact  │    ┌────────▼───────────┐        │    │
│  │  └───────┬───────┘    │  Ingestion Service  │        │    │
│  │          │             │  • Batch buffer     │        │    │
│  │          │             │  • Circuit breaker  │        │    │
│  │          ▼             └────────┬───────────┘        │    │
│  │  ┌───────────────┐              │                    │    │
│  │  │ NVIDIA API    │              │                    │    │
│  │  │ (Llama 3.2)   │              │                    │    │
│  │  └───────────────┘              │                    │    │
│  └─────────────────────────────────┼────────────────────┘    │
└────────────────────────────────────┼─────────────────────────┘
                                     │
                            ┌────────▼───────────┐
                            │   PostgreSQL 16     │
                            │  • conversations    │
                            │  • messages         │
                            │  • inference_logs   │
                            └─────────────────────┘
```

### Ingestion Flow

1. **User sends message** → Chat Controller saves user message to DB
2. **LLM SDK Wrapper** calls NVIDIA API with automatic instrumentation:
   - Records `request_timestamp`, measures `latency_ms`, `time_to_first_token_ms`
   - Captures `token_usage` from response
   - Applies **PII redaction** to input/output previews
3. **EventBus** (Node.js EventEmitter) emits `inference.complete` or `inference.error` events — **non-blocking**
4. **Ingestion Service** listens to events, **buffers logs** (max 50 or 2s flush interval)
5. **Batch insert** into PostgreSQL `inference_logs` table
6. **Circuit breaker** opens after 3 consecutive DB failures, auto-resets after 30s

### Logging Strategy

- **Structured events**: All inference metadata captured as typed objects
- **Async pipeline**: Logging never blocks the inference/chat path
- **PII redaction**: Email, phone, SSN, credit card, IP patterns stripped before storage
- **Truncated previews**: Input/output capped at 500 chars for storage efficiency
- **JSONB extensibility**: `raw_metadata` field for arbitrary provider-specific data

---

## 📊 Schema Design

### `conversations`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| title | VARCHAR(255) | Auto-set from first user message |
| status | ENUM | `active` · `cancelled` · `completed` |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last activity time |

### `messages`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| conversation_id | UUID (FK) | References conversations.id |
| role | ENUM | `user` · `assistant` · `system` |
| content | TEXT | Full message content |
| created_at | TIMESTAMPTZ | Message time |

**Index**: `(conversation_id, created_at)` for efficient context loading.

### `inference_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| conversation_id | UUID (FK) | Optional reference |
| message_id | UUID (FK) | Optional reference |
| model | VARCHAR(100) | e.g., `meta/llama-3.2-11b-vision-instruct` |
| provider | VARCHAR(50) | e.g., `nvidia` |
| latency_ms | INTEGER | Total round-trip latency |
| prompt_tokens | INTEGER | Input token count |
| completion_tokens | INTEGER | Output token count |
| total_tokens | INTEGER | Total tokens consumed |
| time_to_first_token_ms | INTEGER | TTFT for streaming |
| status | ENUM | `success` · `error` · `cancelled` |
| error_message | TEXT | Error details if failed |
| request_timestamp | TIMESTAMPTZ | When request was initiated |
| response_timestamp | TIMESTAMPTZ | When response completed |
| input_preview | TEXT | PII-redacted, truncated input |
| output_preview | TEXT | PII-redacted, truncated output |
| raw_metadata | JSONB | Extensible metadata blob |

**Indexes**: `conversation_id`, `request_timestamp`, `status` for dashboard queries.

### Schema Design Decisions
- **UUIDs** over auto-increment: distributed-friendly, no sequence contention
- **TIMESTAMPTZ** over TIMESTAMP: timezone-aware for global deployments
- **JSONB raw_metadata**: extensible without schema migrations for provider-specific data
- **Separate previews**: PII-redacted, truncated copies — never store raw user data
- **ON DELETE CASCADE** for messages: clean up when conversation deleted
- **ON DELETE SET NULL** for logs: preserve inference history even if conversation deleted

---

## ⚙️ Tradeoffs Made

| Decision | Alternative | Why |
|----------|------------|-----|
| EventEmitter (in-process) | Redis/Kafka | Sufficient for single-process; avoids infra complexity |
| Batch buffer (50/2s) | Individual inserts | Reduces DB write pressure by 10-50x |
| Regex PII redaction | ML-based NER | Zero latency overhead; ML would add 50-200ms |
| PostgreSQL for logs | TimescaleDB/ClickHouse | Handles both relational + time-series at this scale |
| SSE (Server-Sent Events) | WebSocket | Simpler for unidirectional streaming; native HTTP |
| Knex query builder | Prisma/TypeORM | Lightweight, no code generation, transparent SQL |
| Circuit breaker | Retry queue | Prevents cascade failures; simpler than dead letter queue |

---

## 🔮 What I'd Improve With More Time

1. **Redis/Kafka event bus** — Horizontal scaling, message durability, replay
2. **Prometheus + Grafana** — Infrastructure-level metrics and alerting
3. **ML-based PII detection** — spaCy NER for better accuracy
4. **Rate limiting** — Per-user/per-API-key request throttling
5. **Kubernetes deployment** — Helm charts, HPA, pod disruption budgets
6. **Request replay** — Replay failed requests for debugging
7. **Multi-tenant support** — Org/user isolation for SaaS deployment
8. **WebSocket fallback** — Bidirectional real-time for collaborative features
9. **Log retention policies** — Auto-archive/delete old logs
10. **Cost tracking** — Per-model token pricing calculations

---

## 📁 Project Structure

```
ollive.ai-llm/
├── docker-compose.yml          # One-command setup
├── .env.example                # Environment template
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── knexfile.js             # DB connection config
│   ├── migrations/
│   │   ├── 001_create_conversations.js
│   │   ├── 002_create_messages.js
│   │   └── 003_create_inference_logs.js
│   └── src/
│       ├── server.js           # Express app entry
│       ├── db.js               # Knex connection singleton
│       ├── sdk/
│       │   ├── llm-client.js   # LLM SDK wrapper
│       │   ├── event-bus.js    # Event-driven architecture
│       │   └── pii-redactor.js # PII redaction
│       ├── ingestion/
│       │   ├── ingestion-service.js    # Async log processor
│       │   └── ingestion-controller.js # REST API for logs
│       └── chat/
│           ├── chat-service.js     # Business logic
│           └── chat-controller.js  # REST + SSE endpoints
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css           # Monochrome High-Contrast theme
        ├── api/
        │   └── client.js       # API + SSE client
        └── components/
            ├── ChatView.jsx    # Chat with streaming
            ├── Sidebar.jsx     # Conversation management
            ├── Dashboard.jsx   # Analytics dashboard
            └── MessageBubble.jsx
```

---

## 🧩 Bonus Features

| Feature | Status | Details |
|---------|--------|---------|
| Multi-provider support | ✅ | SDK abstraction with provider configs |
| Streaming responses | ✅ | SSE from NVIDIA → SSE to frontend |
| Latency dashboard | ✅ | Avg, P95, TTFT metrics |
| Throughput dashboard | ✅ | RPM chart with SVG visualization |
| Error dashboard | ✅ | Error rate, status distribution |
| Docker Compose | ✅ | One-command `docker compose up --build` |
| Event-based architecture | ✅ | EventEmitter for async logging |
| PII redaction | ✅ | Regex patterns for email, phone, SSN, CC, IP |
| Cancel conversation | ✅ | AbortController + status update |
| List conversations | ✅ | Sidebar with status, time, actions |
| Resume conversation | ✅ | Status toggle + context restoration |

---

## 🛡️ Failure Handling

- **LLM API timeout**: 60s timeout, error logged with partial response
- **Stream interruption**: Partial content saved, error event emitted
- **DB write failure**: Circuit breaker opens after 3 failures, auto-resets in 30s
- **Client disconnect**: AbortController cancels upstream LLM request
- **Graceful shutdown**: Flushes remaining log buffer before exit

---

## 📜 License

MIT
