# 🚀 Product Requirement Document (PRD) - Launch Readiness

## 1. Executive Summary & Launch Vision
The AI Collaboration Dashboard is an enterprise-grade agent orchestration platform designed to streamline multi-agent workflows, task distribution (Beans), real-time agent communication, observable system health, and scheduled job executions.

This document serves as the live Product Requirement Document tracking system criteria, test user baselines, core user journeys, and technical compliance across deployment environments.

---

## 2. Environment Deployment Pipeline Strategy
The application follows a strict multi-stage progressive promotion pipeline:
1. **`jules-merge-prs`**: Persistent staging branch and consolidation baseline. All pull requests and feature integrations are merged here first.
2. **`dev-low`**: Low-tier sandbox environment for early component integration.
3. **`dev-high`**: High-tier development staging environment for integration tests.
4. **`main`**: Production release candidate branch.
5. **`prod`**: Production live user-facing environment.

*Note: The `jules-merge-prs` branch is persistent and must never be deleted.*

---

## 3. Official PRD Test Account Credentials
To facilitate automated E2E testing, authentication flows, and persistent staging verification, the following dedicated test user is provisioned:

- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: `PRD Official Launch Test User / Admin`
- **Status**: Persistent across all database seeding, migrations, and test runs.

---

## 4. Core User Journeys & Target Capabilities

### A. Agent Orchestration System
- Visual hierarchy displaying main agents (orchestrators) and subagents.
- Dynamic linking and unlinking of subagents with dialog confirmations.
- Seamless view toggling between List View and Hierarchy View.

### B. Bean / Task Management Workflow
- Centralized task backlog with status progression (`pending` → `queued` → `running` → `completed` / `failed` / `cancelled`).
- Bean creation with priority weighting, categorizations, and assignability to specific agents.
- Real-time statistics dashboard displaying status counts and execution health.

### C. Agent Communication & Session Observability
- Live communication logs recording messages exchanged between agents (`request`, `response`, `broadcast`, `task`, `status`).
- Orchestration session visualizer monitoring parallel workflow execution.

### D. Observability & System Metrics Dashboard
- Live system health status (`healthy`, `degraded`, `critical`).
- Metric counters tracking active agents, task queues, daily completion rate, and API call volumes.
- Error log stream highlighting recent operational warnings or failures.

### E. Scheduler & Job Automation
- Multi-trigger scheduling engine supporting `interval`, `cron`, and `once` execution modes.
- Action handlers for automatic bean execution, report generation, and plugin runs.
- Execution history tracking with status badges and manual override controls (Pause / Resume / Run Now).

---

## 5. Technology Stack & Technical Guidelines
- **Framework**: Next.js 16 (App Router) with TypeScript 5 & Tailwind CSS 4.
- **Runtime & Package Manager**: Bun.
- **Database & ORM**: SQLite (`DATABASE_URL="file:./dev.db"`) with Prisma ORM.
- **State Management**: Zustand & TanStack Query.
- **UI Components**: shadcn/ui, Radix UI primitives, Lucide React icons, Framer Motion animations.

---

## 6. Definition of Launch Readiness
1. **Zero Failing Tests**: `bun test` passes 100% of test suites.
2. **Clean Linting**: `bun run lint` passes with zero errors or unresolved warnings.
3. **Build Stability**: `bun run build` generates optimized production builds successfully.
4. **Persistent Seeding**: Database seed script populates the `zoozoo@zaazaa.com` launch test user seamlessly on every run.
5. **Humanized UI & Messaging**: User-facing copy, error messages, and empty state prompts are warm, clear, professional, and accessible.
