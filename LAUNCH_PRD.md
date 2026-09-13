# 🚀 AI Hub - Launch Product Requirement Document (PRD)

## 1. Executive Summary & Vision
**AI Hub** is an enterprise-ready, multi-agent AI orchestration platform enabling seamless collaboration between human team members and customizable AI agents. Powered by Next.js 16 (App Router), TypeScript, Prisma ORM, and Tailwind CSS, AI Hub unifies model discovery, multi-agent hierarchies, task execution ("beans"), observability monitoring, workflow scheduling, plugin extensions, and vector-backed data workspaces.

---

## 2. Multi-Stage Deployment & Promotion Pipeline
To guarantee release stability and zero-regression deployments, code progresses through a strictly defined multi-stage pipeline:

```
[jules-merge-prs] ──► [dev-low] ──► [dev-high] ──► [main] ──► [prod]
```

1. **`jules-merge-prs` (Persistent Staging Workspace)**: Permanent integration baseline for merging open pull requests, executing automated regression tests, verifying database seeds, and staging release candidates. Never deleted.
2. **`dev-low` (Low-Environment Testing)**: Initial staging for internal integration and non-breaking validation.
3. **`dev-high` (High-Environment Integration)**: Pre-release validation layer for load, security, and multi-tenant testing.
4. **`main` (Production Candidate)**: Verified codebase awaiting final deployment triggers.
5. **`prod` (Live Production Environment)**: End-user live environment.

---

## 3. Official PRD User Test Account Credentials
For authenticated E2E validation, automated regression testing, and platform verification, the following official persistent test user account is provisioned across all environments:

* **Email**: `zoozoo@zaazaa.com`
* **Password**: `123456789.A`
* **Role**: `ADMIN`
* **Status**: Provisioned & Persisted (Must remain active across database sync cycles)

---

## 4. Core Features & Capabilities

### 🤖 Multi-Agent Orchestration & Hierarchy
- **Agent Roles**: Support for Main Agents, Orchestrators, Subagents, and Workers.
- **Hierarchical Linking**: Parent-child linking between orchestrators and worker subagents.
- **Provider Aggregation**: Integrated access across 20+ AI providers (OpenAI, Voyage, Cohere, Anthropic, Google, Z.ai, etc.).
- **Dynamic Model Discovery**: Live capability probing and model listing.

### 🫘 Task & Workflow Engine ("Beans")
- **Task Delegation**: Assign tasks ("beans") to specific agents or orchestrators with priority levels (`low`, `normal`, `high`, `critical`).
- **Execution Tracking**: Status lifecycle monitoring (`pending` → `queued` → `running` → `completed` / `failed`).
- **Result Auditing**: Output capture and structured execution histories.

### 👁️ Observability & Health Dashboard
- **Real-Time Telemetry**: System health indicators (`healthy`, `degraded`, `critical`).
- **Resource Usage**: API request counts, token consumption metrics, active/busy agent statuses, and error tracking feeds.

### ⏰ Automated Scheduler
- **Trigger Modes**: Interval, Cron expressions (e.g. `0 9 * * 1-5`), and one-time execution.
- **Automated Actions**: Bean runs, plugin triggers, report generation, and data synchronization.

### 🔌 Extensibility: Plugins & Skills
- **Custom Plugins**: Extend platform functionality with custom JavaScript/TypeScript plugin scripts.
- **Skill Engine**: Deterministic and generative agent capabilities with usage stats and success rate metrics.

### 📁 Data Workspaces & Embedding Indexing
- **Semantic Workspaces**: Global (shared) and Local (private) vector-backed content indexing.
- **Multi-Format Ingestion**: Document support (.txt, .md, .json, .csv, code files) with configurable embedding models.

---

## 5. Launch Quality Gates & Acceptance Criteria
- [x] **Zero Build Errors**: Clean build using `bun run build`.
- [x] **Zero Lint Warnings**: Passes `bun run lint` (ESLint 9).
- [x] **100% Test Suite Green**: All unit and integration tests pass via `bun test`.
- [x] **Database Seed Integrity**: Persistent test account (`zoozoo@zaazaa.com`) seeded cleanly via Prisma.
- [x] **User Experience & Microcopy**: Clear, warm, humanized copy across all dashboard UI states.
