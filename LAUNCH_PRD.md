# 🚀 Product Requirement Document (PRD) - Launch Criteria & Roadmap

## 1. Overview & Launch Vision
The Team AI Collaboration & Agent Orchestration Hub is an enterprise-grade platform designed to streamline multi-agent communication, task execution (Beans), automated scheduling, and system observability.

## 2. Official PRD User Test Account
For automated and manual E2E/authenticated verification, the following dedicated launch test account is permanently provisioned and seeded:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: `Administrator / Launch Validator`

## 3. Deployment Pipeline & Environments
- **Persistent Staging Baseline**: `jules-merge-prs`
- **Pipeline Order**: `jules-merge-prs` → `dev-low` → `dev-high` → `main` → `prod`
- **Rule**: Staging workspace `jules-merge-prs` is permanent and must never be deleted.

## 4. Core Features & Specifications

### A. Agent Orchestration System
- **Main Agents & Subagents**: Supports hierarchy creation, linking, and unlinking.
- **Inter-Agent Communication**: Log and stream request/response/broadcast messages between orchestrators and worker agents.
- **Visual Switcher**: Toggle between List View and Hierarchy View.

### B. Task Management (Beans System)
- **Bean Lifecycle**: Status tracking across `pending`, `queued`, `running`, `completed`, `failed`, `cancelled`.
- **Assignment & Priority**: Dynamically assign tasks to agents with priority levels (`low`, `normal`, `high`, `critical`).

### C. System Observability & Health Dashboard
- **Health Metrics**: Real-time status banners (healthy/degraded/critical), active/busy/idle agent counts, total API calls, token usage.
- **Activity Stream & Errors**: Live feed of agent activities and detailed error logging.

### D. Automated Scheduler System
- **Triggers**: Support for cron expressions, fixed interval minutes, and one-off executions.
- **Actions**: Trigger Beans, execute plugins, check agent capabilities, and generate metrics reports.

### E. Humanized Experience & Copy Polish
- All user-facing interfaces feature clear, warm, engaging copy, eliminating clinical jargon for an intuitive user experience.

## 5. Launch Quality Gates
- **Build**: `bun run build` must succeed without errors.
- **Lint**: `bun run lint` must pass with zero ESLint warnings or errors.
- **Tests**: `bun test` must pass with 100% success rate across test suites.
- **Database**: SQLite database synced via `bun run db:push` and seeded via `bun run db:seed`.
