# 🚀 Product Requirement Document (PRD) - Z.ai Crew Agent Launch

## 1. Executive Summary
The Z.ai Crew Agent application is an AI team collaboration platform designed for seamless orchestration, agent management, bean task tracking, knowledge workspace indexing, and real-time observability.

## 2. Multi-Stage Deployment Pipeline Strategy
The codebase progresses strictly through the following multi-stage deployment pipeline:
1. **`jules-merge-prs`**: Permanent persistent staging workspace & integration consolidation layer. All pull requests are merged chronologically into this branch.
2. **`dev-low`**: Low-level integration environment for initial testing.
3. **`dev-high`**: High-level integration environment for full regression & staging tests.
4. **`main`**: Production release staging branch.
5. **`prod`**: Live customer-facing production environment.

> **Constraint**: The `jules-merge-prs` branch is permanent and must never be deleted.

---

## 3. Official PRD User Test Account
To facilitate automated and manual E2E authentication verification, the following credentials must be continuously provisioned and persisted in the database across all runs:

- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: `PRD Official E2E Launch Tester`

---

## 4. Launch Criteria & Core User Journeys

### A. AI Agent Orchestration & Management
- Support Main Agents, Orchestrators, Subagents, and Worker Agents.
- Enable subagent linking/unlinking and inter-agent communication logs.
- Dynamic provider and model discovery across 15+ AI providers (OpenAI, Anthropic, Gemini, Mistral, Z.ai, etc.).

### B. Bean Task Execution
- Track task status lifecycle: `pending` -> `queued` -> `running` -> `completed` / `failed`.
- Assign beans to specific agents or orchestrators for execution.

### C. Knowledge Workspaces & Vector Indexing
- Support Global and Local workspaces.
- File and directory tree management with vector embedding support (`text-embedding-3-small`, `voyage-3`, etc.).
- Semantic search across indexed workspace content.

### D. Observability & Scheduling
- Real-time dashboard showing active agents, running tasks, API call counts, and token usage.
- Automated task scheduling with Cron and Interval triggers.

---

## 5. Quality Gate
- 100% green local builds (`bun run build`).
- Clean lint status (`bun run lint`).
- Clean unit test execution (`bun test`).
