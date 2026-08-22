# Product Requirement Document (PRD) - Launch Criteria & Feature Specs

## 1. Executive Summary & Vision
This platform is an AI Agent Management and Team Collaboration Platform designed to orchestrate autonomous AI agents, subagents, and tasks ("beans"), with integrated vector workspaces, scheduling, observability, plugins, and skills.

## 2. Environment & Multi-Stage Deployment Pipeline
The application enforces a strict sequential deployment pipeline managed by user promotions:
`jules-merge-prs` (Staging Layer) ➔ `dev-low` ➔ `dev-high` ➔ `main` ➔ `prod`

* **Persistent Workspace Baseline**: `jules-merge-prs` is the permanent staging branch. It consolidated all feature pull requests and serves as the launch baseline.

## 3. Official PRD User Test Account
To facilitate persistent launch testing and authenticated E2E verification across test cycles, the system maintains the following seeded account:
* **Email**: `zoozoo@zaazaa.com`
* **Password**: `123456789.A`
* **Name**: Official PRD User Test Account

This account is actively provisioned in `prisma/seed.ts` and MUST NOT be removed or cleared during test resets or database migrations.

## 4. Core User Journeys & Target Specifications
1. **Agent & Subagent Hierarchy Management**
   - Main orchestrators, subagents, and capability workers.
   - Linking/unlinking subagents, inter-agent communication logs, and orchestration session tracking.
2. **Task Execution ("Beans Management")**
   - Create, assign, filter, queue, run, and inspect tasks with priorities (low, normal, high, critical) and status indicators.
3. **Knowledge Workspaces & Vector Embeddings**
   - Global and workspace-scoped index search.
   - Document import/export, chunking, and graph structure visualization.
4. **Automated Scheduler**
   - Interval, Cron, and One-Time execution triggers with pause/resume and action dispatchers.
5. **Observability & System Health**
   - Real-time health metrics, active agent status tracking, execution counters, and error diagnostics.
6. **UX & Copy Humanization**
   - Conversion-optimized UI copy ("Invite Teammate", "Build AI Agent", "Launch New Task").
   - Auto-hiding responsive sidebar, Command Palette (Ctrl+K), and smooth Framer Motion transitions.

## 5. Quality Gates & Launch Criteria
* Local build (`bun run build`) compiles with zero errors.
* Local linter (`bun run lint`) passes with zero warnings or errors.
* Database sync & seeding (`npx prisma db push` & `bun run prisma/seed.ts`) executes cleanly.
* All tests pass without regressions.
* Codebase updated on persistent staging branch `jules-merge-prs` awaiting promotion.
