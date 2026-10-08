# 🚀 Launch Product Requirement Document (PRD)

## 📌 Executive Summary
**Project Name**: Z.ai Crew Agent (Team AI Hub)
**Status**: Staging & Pre-Launch Consolidation
**Workspace Staging Branch**: `jules-merge-prs`
**Deployment Pipeline**: `jules-merge-prs` → `dev-low` → `dev-high` → `main` → `prod`

Z.ai Crew Agent (Team AI Hub) is an enterprise-grade AI collaboration and agent orchestration platform. It enables teams to create, manage, and coordinate multi-agent AI workflows, perform RAG-augmented vector search across local and global workspaces, automate routine operations via scheduled jobs, and monitor system health with real-time observability.

---

## 🔑 Official PRD User Test Account
The persistent launch testing account provisioned across all test cycles and database seed environments:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Primary Admin / Launch Verifier
- **Persistence Constraint**: This account remains actively provisioned and seeded across all local, staging, and preview database migrations.

---

## 🎯 Core Launch Capabilities & User Journeys

### 1. 🤖 AI Agent Management & Hierarchical Orchestration
- **Agent Profiles**: Create agents with custom system prompts, provider selection (OpenAI, Voyage, Cohere, Jina, Google, Mistral, Z.ai, Ollama, etc.), model selection, temperature, and token thresholds.
- **Hierarchy & Linking**: Main agents and orchestrators can link and trigger specialized subagents and workers for subtask delegation.
- **Inter-Agent Communication Log**: Real-time message log tracking request/response/broadcast exchanges between agents.

### 2. 🗄️ Workspaces & RAG Context Store
- **Hybrid Index Types**: Support for `local` (private) and `global` (team-shared) workspaces.
- **Embedding Providers**: Configurable embeddings via OpenAI, Voyage AI, Cohere, Jina AI, Google AI, Mistral, and Z.ai.
- **Knowledge Graph & RAG**: Import local files and folder structures to generate vector embeddings and visual document relationship graphs.
- **Session Indexing**: Automatically index chat conversations for semantic search and retrieval.

### 3. ⏱️ Automated Scheduler
- **Job Types**: Support for `interval`, `cron` expressions, and one-time execution triggers.
- **Automated Actions**: Automated execution of beans (tasks), plugins, report generation, data sync, and maintenance cleanup.
- **Execution History**: Full tracking of past executions, next run schedules, and pause/resume controls.

### 4. 👁️ Real-time Observability Dashboard
- **System Health Monitoring**: Live tracking of system health status (`healthy`, `degraded`, `critical`).
- **Metric Analytics**: Real-time counters for active agents, running tasks, daily API calls, token consumption, and error logs.
- **Live Activity Feed**: Event stream recording agent activities, task start/completion events, and errors.

### 5. 🔌 Plugin & Skill Marketplace / Extensibility
- **Plugins**: Execute custom JavaScript/TypeScript plugin logic triggered manually, on schedule, or via system events.
- **Skills**: Modular capabilities for agents (analysis, coding, research, data transformation) with support for deterministic caching and usage analytics.
- **Governance**: Streamlined approval workflow for agent skill creation requests.

---

## 🛡️ Launch Readiness Criteria & Quality Gates
1. **Zero Build & Lint Failures**: Clean Next.js build compilation and 0 ESLint warnings/errors.
2. **100% Test Pass Rate**: Full green execution of automated unit, integration, and E2E launch tests.
3. **Database Seeding Verification**: `bun run db:seed` executes idempotently and ensures `zoozoo@zaazaa.com` is active in the database.
4. **Copy & UX Polish**: Warm, helpful, conversion-optimized UI text without robotic placeholder copy.
5. **Persistent Pipeline Workspace**: All feature branches consolidated on `jules-merge-prs` without deleting the staging layer.
