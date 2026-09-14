# 🚀 LAUNCH_PRD.md - Product Requirement Document & Launch Specification

## Executive Overview
**Project Name**: Z.ai AI Crew Scaffold & Autonomous Collaboration Platform
**Target Launch Version**: v1.0.0-launch
**Persistent Staging Branch**: `jules-merge-prs`

This document defines the core product specifications, launch requirements, user journeys, architecture, and deployment pipeline for the Z.ai AI Crew Scaffold.

---

## 🔐 Official PRD User Test Account
To facilitate authenticated end-to-end testing and staging verification across test cycles, the following launch account is provisioned and persisted in all environments:

* **Email**: `zoozoo@zaazaa.com`
* **Password**: `123456789.A`
* **Role**: Admin / Lead Operator
* **Persistence Requirement**: This account MUST remain actively seeded and persisted across database migration setups, resets, and deployment cycles.

---

## 🔄 Deployment Pipeline Architecture

Code progressions strictly follow this multi-stage sequential environment progression:
`jules-merge-prs` → `dev-low` → `dev-high` → `main` → `prod`

1. **`jules-merge-prs`**: Persistent staging workspace. Open PRs are integrated chronologically from oldest to newest here.
2. **`dev-low`**: Low-tier integration and initial automated deployment environment.
3. **`dev-high`**: High-tier staging environment with performance and load validation.
4. **`main`**: Production-candidate release candidate branch.
5. **`prod`**: Live customer-facing production release environment.

---

## 🎯 Launch Criteria & Zero-Tolerance Quality Gates

- [x] **100% Build Green**: Next.js 16 standalone build passes with zero compilation or syntax errors.
- [x] **100% Lint Clean**: ESLint checks pass with zero errors.
- [x] **100% Test Green**: Local unit, integration, and E2E test suites pass without regression.
- [x] **Database Persistence**: SQLite database schema synced via Prisma and seeded with Official PRD Test Account (`zoozoo@zaazaa.com`).
- [x] **Humanized UI/UX**: All user-facing text, empty states, and button actions rewritten for clear, warm, engaging copy.

---

## 🧭 Core User Journeys & Feature Specifications

### 1. Team & AI Member Orchestration
- **User Journey**: Operators configure team members, assign personalized AI models (OpenAI, Voyage, Cohere, Jina, etc.), and communicate via live chat or voice input.
- **Key Features**: Model discovery, custom system prompts, temperature controls, and streaming chat responses.

### 2. Multi-Agent Hierarchy & Communication
- **User Journey**: Main agents coordinate subagents, broadcast tasks, log inter-agent messages, and track session status.
- **Key Features**: Visual hierarchy tree, agent linking/unlinking, communication logs.

### 3. Task Management ("Beans")
- **User Journey**: Tasks ("beans") are created, prioritized, assigned to specific agents, executed, and tracked through completion.
- **Key Features**: Status filtering (pending, queued, running, completed, failed), priority indicators, result formatting.

### 4. Workspaces & Knowledge Indexing
- **User Journey**: Team files and directories imported into workspaces, embedded via configurable providers, and queried semantically.
- **Key Features**: Vector indexing, file import, index graph visualization, import/export JSON configurations.

### 5. Observability & System Monitoring
- **User Journey**: Real-time metrics dashboard displaying system health, active agents, running tasks, token usage, and activity logs.
- **Key Features**: Health status indicators, activity feeds, error tracking.

### 6. Automated Scheduler & Extensibility (Plugins & Skills)
- **User Journey**: Automated cron/interval tasks execute workflows; agents utilize extensible skills and plugins.
- **Key Features**: Scheduler triggers, skill creation requests, custom JS plugin execution sandbox.
