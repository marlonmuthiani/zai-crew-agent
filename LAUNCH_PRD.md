# 🚀 Launch Product Requirement Document (LAUNCH_PRD.md)

## 📌 Executive Summary
This document serves as the live Product Requirement Document (PRD) for the **Team AI Collaboration & Agent Orchestration Dashboard**. It defines the core specifications, launch readiness criteria, multi-stage deployment pipeline, and official PRD user test account credentials for production deployment.

---

## 🎯 Multi-Stage Deployment Pipeline
All work must strictly adhere to the sequential promotion path across environments:
`jules-merge-prs` → `dev-low` → `dev-high` → `main` → `prod`

1. **`jules-merge-prs`**: Persistent staging branch and primary consolidation layer where pull requests and optimizations are merged, tested, and verified.
2. **`dev-low`**: Low-level integration testing environment.
3. **`dev-high`**: High-level integration and user acceptance staging.
4. **`main`**: Release candidate branch.
5. **`prod`**: Live production environment.

---

## 🔑 Official PRD User Test Account
To facilitate persistent authenticated end-to-end (E2E) testing and journey validation:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Master Workspace Administrator (`ADMIN`)
- **Persistence Constraint**: This account is hard-seeded in database seed routines (`prisma/seed.ts`) and MUST remain actively provisioned across all test cycles and environment resets.

---

## 🎯 Launch Goals & Acceptance Criteria
1. **Agent Orchestration & Communication**: Hierarchy management, subagent linking/unlinking, real-time communication logs, and orchestration session tracking.
2. **Beans / Task Management**: Comprehensive task lifecycle management (pending, queued, running, completed, failed, cancelled) with priority, category, and agent assignment.
3. **Observability & Analytics**: Live system health telemetry, active agent metrics, task queue visualization, activity logs, and error tracking.
4. **Scheduler Automation**: Automated interval, cron, and one-off task execution with pause, resume, and execution history.
5. **Humanized Copy & UI Polish**: Professional, intuitive, and welcoming user-facing text and responsive design across all screen breakpoints.
6. **Zero-Tolerance Quality Gate**: 100% build pass rate, clean linting output, and verified database persistence.

---

## 📊 Core User Journeys
1. **Workspace Navigation & Auto-Hiding Sidebar**: Seamless navigation across Chat, Team, Agents, Beans, Workspaces, Observability, and Scheduler tabs.
2. **Agent Assignment & Bean Lifecycle**: Creating tasks (Beans), assigning them to agents, and tracking execution through the task pipeline.
3. **Automated Workflow Scheduling**: Creating automated interval/cron schedules for agents and inspecting recent execution logs.
4. **System Telemetry & Health Monitoring**: Monitoring active agents, token consumption, API calls, and recent error alerts.
