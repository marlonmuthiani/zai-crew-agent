# Product Requirement Document (PRD) - Launch Criteria & Feature Specs

## 1. Executive Summary & Vision
This application is an AI Agent Management and Team Collaboration Platform designed to orchestrate autonomous AI agents, subagents, and tasks ("beans"), with integrated vector workspaces, scheduling, observability, plugins, and skills.

## 2. Environment & Multi-Stage Deployment Pipeline
The application enforces a sequential deployment pipeline managed by user promotions:
`jules-merge-prs` (Staging Layer) ➔ `dev-low` ➔ `dev-high` ➔ `main` ➔ `prod`

* Note: `jules-merge-prs` is the persistent workspace branch.

## 3. Official PRD User Test Account
To facilitate persistent launch testing and authenticated E2E verification across test cycles, the system maintains the following seeded account:
* **Email**: `zoozoo@zaazaa.com`
* **Password**: `123456789.A`

This account is actively provisioned in the database migration setup and MUST NOT be removed or cleared during test resets.

## 4. Core User Journeys & Target Specifications
1. **Agent & Subagent Hierarchy Management**
   - Main agents, orchestrators, subagents, and workers.
   - Linking/unlinking subagents and managing inter-agent communications.
2. **Task Execution ("Beans")**
   - Create, assign, queue, run, and inspect tasks with priorities (low, normal, high, critical).
3. **Knowledge Workspaces & Vector Embeddings**
   - Global and local indexed workspaces.
   - Document upload/importing, chunking, and semantic search integration.
4. **Automated Scheduler**
   - Interval, Cron, and One-Time scheduled actions.
5. **Observability & System Monitoring**
   - Real-time health metrics, active agent status tracking, and error logs.
6. **Extensibility (Plugins & Skills)**
   - Custom plugin runtime and agent capability skills.

## 5. Definition of Quality Gates
* Local build (`bun run build`) compiles with zero errors.
* Database schema & seed scripts pass (`npx prisma db push` & seed verification).
* Zero lint issues.
