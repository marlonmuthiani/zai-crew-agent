# 🚀 Launch Product Requirement Document (PRD)

## 1. Executive Summary & Launch Criteria
This document serves as the live Product Requirement Document (PRD) for the **Team AI Hub** application platform. It details product specifications, user journeys, deployment pipeline architecture, quality gates, and automated launch criteria required for production launch.

---

## 2. Multi-Stage Deployment Architecture & Pipeline
The project follows a strict multi-stage environment progression to guarantee platform stability:

$$\text{jules-merge-prs} \longrightarrow \text{dev-low} \longrightarrow \text{dev-high} \longrightarrow \text{main} \longrightarrow \text{prod}$$

- **Persistent Staging Branch (`jules-merge-prs`)**: Permanent integration baseline branch. All open pull requests are merged, tested, fixed, and staged here directly. **This branch must never be deleted.**
- **Promotion Integrity**: Environments downstream (`dev-low` -> `dev-high` -> `main` -> `prod`) are managed directly by user promotion commands.

---

## 3. Official Launch Test Account
To support end-to-end automated and manual testing of authenticated routes, the following dedicated user account is permanently provisioned across all database environments:

- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Official PRD Lead Tester / Admin
- **Persistence Mandate**: This account must remain actively provisioned in the SQLite database (`prisma/dev.db`) and seeded across all deployment cycles.

---

## 4. Core User Journeys & Feature Matrix

### A. Team Collaboration & Interactive AI Hub
- Multi-member workspaces with individual AI assistant assignment.
- Model discovery across top AI providers (OpenAI, Voyage AI, Cohere, Jina, Google, Mistral, Z.ai).
- Audio recording and speech-to-text transcriptions.

### B. Agent Hierarchy & Multi-Agent Orchestration
- Main Agents (Orchestrators) and Subagents (Workers).
- Dynamic linking and unlinking of subagent hierarchy.
- Communication logging across agent request/response cycles.

### C. Bean Task Management
- Task lifecycle management (`pending` -> `queued` -> `running` -> `completed` / `failed`).
- Priority levels (`low`, `normal`, `high`, `critical`) and categories.
- Direct assignment of Beans to specialized agents.

### D. Observability & Automated Scheduler
- Real-time system health banner and active agent metrics.
- Agent activity feed and error logs.
- Cron, interval, and one-time automated schedules for recurring tasks.

### E. Extensibility (Plugins & Skills)
- Dynamic creation, execution, and toggling of JavaScript/TypeScript plugins.
- Agent skill creation, complexity levels, deterministic caching, and request approvals.

---

## 5. Quality & Launch Readiness Criteria
1. **Build & Syntax Verification**: `bun run build` completes with 0 compilation errors.
2. **Lint Cleanliness**: `bun run lint` passes without errors.
3. **Database Integrity**: Prisma schema synchronized via `bun run db:push` using `DATABASE_URL="file:./dev.db"`.
4. **Copy & Humanization**: All UI text, button labels, toasts, and dialogs are clear, natural, inviting, and humanized.
