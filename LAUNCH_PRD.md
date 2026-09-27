# Product Requirement Document (PRD) - Launch Criteria & Specifications

## 1. Executive Summary & Launch Goals
This document specifies the core release criteria, system architecture, feature sets, and quality gates required for production launch. The application is built on Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and Bun.

## 2. Environment & Multi-Stage Deployment Pipeline
The deployment pipeline follows a strict sequential progression:
`jules-merge-prs` (Persistent Staging Branch) → `dev-low` → `dev-high` → `main` → `prod`

- **jules-merge-prs**: Acts as the permanent workspace and staging layer. All open PRs are merged, verified, and stabilized here. This branch must never be deleted.
- Manual user approval promotes staging builds from `jules-merge-prs` through `dev-low`, `dev-high`, `main`, to `prod`.

## 3. Official PRD User Test Account
To facilitate authenticated end-to-end (E2E) testing and manual QA verification across environments, the persistent test credentials below are provisioned and persisted in the database:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: `PRD Test Account / System Admin`

*Note: This account must remain actively seeded and provisioned across all test cycles and database resets.*

## 4. Core Architecture & Features
1. **AI Agent Management & Multi-Agent Orchestration**:
   - Main agents, Orchestrators, Subagents, and Workers.
   - Dynamic Model Discovery supporting top AI providers (OpenAI, Anthropic, Google AI, Voyage AI, Cohere, Mistral, Z.ai, etc.).
   - Inter-agent communication logs and session tracking.

2. **Bean Task Management**:
   - Priority-based task queues (`low`, `normal`, `high`, `critical`).
   - Task lifecycle (`pending`, `queued`, `running`, `completed`, `failed`).
   - Agent assignment and execution tracking.

3. **Workspace & Vector Store Indexing**:
   - Workspace file trees and indexing management (Global / Local visibility).
   - Knowledge graph generation and semantic vector search integration.

4. **Plugins & Skills System**:
   - Extensible plugin system with event, schedule, and manual triggers.
   - Deterministic and agent-driven skill execution.

5. **Observability & Scheduling**:
   - Real-time agent status, error tracking, and execution metrics.
   - Automated cron, interval, and one-time task scheduler.

## 5. Quality & Launch Gate Criteria
- **Build Status**: Zero compilation or TypeScript errors during `bun run build`.
- **Test Suite**: 100% pass rate on unit, integration, and E2E tests (`bun test`).
- **Database Health**: Prisma database synced and seeded (`bun run db:push`, `bun run db:seed`).
- **Copy & UI/UX**: Warm, clear, humanized UI copy across all landing pages, empty states, and dialogs.
