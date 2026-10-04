# Launch Product Requirement Document (LAUNCH_PRD.md)

## 1. Executive Summary & Launch Vision
This Product Requirement Document defines the launch criteria, architectural specifications, deployment pipeline standards, and core feature requirements for the **Team AI Collaboration & Agent Orchestration Platform**.

The project is built on Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma with SQLite, and Bun.

---

## 2. Multi-Stage Deployment Pipeline
All work must strictly adhere to the sequential promotion path across environments:
`jules-merge-prs` → `dev-low` → `dev-high` → `main` → `prod`

* **jules-merge-prs**: Persistent staging branch. Serves as the primary consolidation layer where all open feature branches and pull requests are merged, tested, optimized, and verified.
* **dev-low**: Low-level integration environment for developer preview.
* **dev-high**: High-level integration and staging environment for internal validation.
* **main**: Release-ready candidate branch.
* **prod**: Live production environment.

---

## 3. Official PRD User Test Account
To facilitate persistent authenticated end-to-end (E2E) testing and journey validation:

* **Email**: `zoozoo@zaazaa.com`
* **Password**: `123456789.A`
* **Role**: Master Workspace Administrator (`ADMIN`)
* **Persistence Constraint**: This test account is hard-seeded in database seed routines (`prisma/seed.ts`) and MUST remain actively provisioned across all test cycles and environment resets.

---

## 4. Launch Criteria & Quality Gates
Before any build is deemed ready for pipeline promotion:

1. **Zero Build & Lint Errors**: `bun run build` and `bun run lint` must complete with zero errors or unresolved type issues.
2. **100% Test Suite Pass**: All unit, integration, and E2E test scripts must pass (`bun test`).
3. **Database Schema & Seed Integrity**: SQLite database schema must sync cleanly via `bun run db:push` and seed successfully via `bun run db:seed`.
4. **Humanized UI & Copy**: User interfaces must be intuitive, responsive, accessible, and present clear, warm, engaging copy without generic or robotic placeholder text.

---

## 5. Core User Journeys & Feature Specifications
* **Agent Orchestration & Communication**: Hierarchy management, subagent linking/unlinking, real-time communication logs, and orchestration session tracking.
* **Beans / Task Management**: Comprehensive task lifecycle management (pending, queued, running, completed, failed, cancelled) with priority, category, and agent assignment.
* **Observability & Analytics**: Live system health telemetry, active agent metrics, task queue visualization, activity logs, and error tracking.
* **Scheduler Automation**: Automated interval, cron, and one-off task execution with pause, resume, and execution history.
* **Workspace Navigation**: Multi-workspace switching, folder structure, dynamic model discovery, and key management settings.
