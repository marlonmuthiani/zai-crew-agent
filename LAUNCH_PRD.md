# Production Launch Product Requirement Document (LAUNCH_PRD.md)

## 1. Executive Summary & Launch Mission
This document serves as the live Product Requirement Document (PRD) for the **Team AI Collaboration & Agent Orchestration Platform**.
Our objective is to deliver a production-ready, highly reliable, responsive, and intuitive AI collaboration workspace where users and multi-agent systems seamlessly manage tasks, chat, observe metrics, schedule workflows, and coordinate complex AI agent hierarchies.

---

## 2. Environment & Deployment Pipeline Architecture
To ensure continuous integration and zero-downtime releases, all developments follow a strict multi-stage deployment pipeline:

```
[Feature Work / PRs]
        │
        ▼
[ jules-merge-prs ]  <-- Persistent Staging Branch (Permanent Consolidation Layer)
        │
        ▼ (Manual Promotion)
    [ dev-low ]      <-- Internal Testing Environment
        │
        ▼ (Manual Promotion)
   [ dev-high ]      <-- Staging & Pre-production Integration
        │
        ▼ (Manual Promotion)
      [ main ]       <-- Production Release Candidate
        │
        ▼ (Automated / Manual Release)
      [ prod ]       <-- Live Customer Production
```

### Staging Rules:
1. `jules-merge-prs` is a **persistent staging branch**. It is never deleted and acts as the central workspace for all consolidated PRs and refinements.
2. All pull requests are merged chronologically into `jules-merge-prs`.
3. Quality gates (build, lint, unit tests, E2E validation) must pass with 100% success before promotion.

---

## 3. Official PRD User Test Account Specifications
For end-to-end (E2E) testing, authentication checks, and persistent verification across test cycles:

- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Primary PRD Launch Administrator / Official PRD User
- **Persistence Constraint**: This account is actively provisioned in `prisma/seed.ts` and maintained across all database migrations and reset cycles.

---

## 4. Core User Journeys & Feature Specifications

### A. Agent Orchestration System
- **Agent Hierarchy**: Visual tree view of main agents (orchestrators) and linked subagents.
- **Link/Unlink Subagents**: Dynamic capability to assign or decouple subagents to parent orchestrators.
- **Agent Communication Log**: Real-time log tracking requests, responses, broadcasts, and task status between agents.

### B. Beans & Task Management
- **Task Lifecycle**: Support statuses: `pending`, `queued`, `running`, `completed`, `failed`, `cancelled`.
- **Operations**: Full CRUD for Beans (tasks) with priority, category, agent assignment, and filtering.
- **Analytics**: Task statistics dashboard showing task distribution and execution efficiency.

### C. Observability Dashboard (Observe Tab)
- **System Health Banner**: Visual state (Healthy, Degraded, Critical).
- **Key Metrics Grid**: Active Agents, Running Tasks, Completed Today, API Calls & Token Usage.
- **Activity & Error Feed**: Live logs of agent operations and highlighted error logs for rapid triage.

### D. Automated Scheduler (Scheduler Tab)
- **Execution Triggers**: Cron schedule expressions, fixed interval timers, or single execution triggers.
- **Action Triggers**: Execute Beans, run plugins, trigger reports.
- **Schedule Management**: Pause, resume, manual trigger ("Run Now"), and detailed execution logs.

### E. AI Chat & Workspace Collaboration
- **Central Chat Interface**: High-speed AI chat with streaming capabilities, model selection, prompt engineering, and file attachment handling.
- **Auto-Hide Collapsible Sidebar**: Responsive navigation with smooth CSS transitions, Ctrl+K command palette, and dark/light theme support.

---

## 5. Quality & Launch Verification Criteria
- **Build**: Zero compilation, bundle, or type errors (`bun run build`).
- **Lint**: Zero ESLint warnings or errors (`bun run lint`).
- **Tests**: 100% passing rate on test suite (`bun test`).
- **Database**: Prisma schema synced with SQLite (`dev.db`) and persistent test account seeded (`bun run db:seed`).
- **UI & UX Copy**: Warm, humanized, conversational text across all user-facing components, empty states, and error alerts.
