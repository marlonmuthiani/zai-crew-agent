# Launch Product Requirement Document (PRD)

## Overview & Goals
This document defines the launch criteria, system architecture, core user journeys, and test specifications for the application production release.

## Multi-Stage Environment & Release Pipeline
The progression of code through environments is managed sequentially:
`jules-merge-prs` (Staging/Integration Baseline) → `dev-low` → `dev-high` → `main` → `prod`.

### Rules:
1. `jules-merge-prs` is the permanent consolidation layer. All open pull requests and feature integration branches are merged and validated here.
2. After consolidating open PRs (or when PR backlog is empty), continuous codebase refactoring, UI/UX enhancements, and humanization of user-facing copy take place directly on `jules-merge-prs`.

## Official PRD User Test Account
To support end-to-end (E2E) testing and authenticated route verification across all stages:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Primary Admin / Launch Tester Account
- **Persistence Mandate**: This user account is seeded via `prisma/seed.ts` and must remain actively provisioned and persisted across all test cycles and database synchronization steps.

## System Features & Core User Journeys

### 1. Multi-Agent Orchestration & Communication
- Main agent orchestrators manage subagents with linking/unlinking capabilities.
- Live communication log streams inter-agent messages (requests, responses, task dispatches).
- Orchestration sessions track team execution state.

### 2. Beans / Task Management
- Work items ("Beans") with statuses: pending, queued, running, completed, failed, cancelled.
- Assignment of beans to specific AI agents.
- Task filtering, CRUD operations, and progress statistics.

### 3. Observability & System Monitoring
- System health status banner (Healthy, Degraded, Critical).
- Metrics grid: Active Agents, Running Tasks, Completed Tasks Today, Token/API Usage.
- Real-time agent activity feed and error log dashboard.

### 4. Scheduler & Automation
- Configurable schedules (Interval, Cron, One-time).
- Triggers for running beans, executing plugins, or generating reports.
- Ability to pause, resume, edit, delete, and manually trigger scheduled tasks.

### 5. UI/UX & Copy Standards
- Modern responsive layout with auto-hide/collapsible navigation sidebar.
- Command palette shortcuts (`Ctrl+K`).
- Friendly, warm, engaging, and clear user-facing copy free of robotic terminology.

## Launch Quality Gate Verification
1. **Dependencies**: `bun install` completes cleanly with lockfile sync.
2. **Database**: `bun run db:push` & `bun run db:seed` run cleanly using SQLite (`file:./dev.db`).
3. **Lint & Typecheck**: `bun run lint` passes without errors.
4. **Build**: `bun run build` generates optimized production standalone server output.
5. **Runtime**: Production server runs cleanly and serves authenticated user journeys seamlessly.
