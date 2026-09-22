# 🚀 Launch Product Requirement Document (PRD)

## Overview & Launch Objectives
This document establishes the official product requirements, architecture baseline, deployment pipeline specs, and launch criteria for the application.

## 🎯 Launch Deployment Pipeline
The application utilizes a multi-stage environment promotion pipeline:
`jules-merge-prs` (Persistent Staging Workspace) ➔ `dev-low` ➔ `dev-high` ➔ `main` ➔ `prod`

- **Workspace Baseline**: `jules-merge-prs` is the permanent consolidation branch for open pull requests and continuous improvements.

## 🔐 Official PRD User Test Account
For authenticated E2E verification across all environments, the primary seed test user account is provisioned as follows:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Primary Test User
- **Persistence Constraint**: Account MUST remain active and seeded in database across test cycles.

## ⚙️ Core Technical Specifications
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 & shadcn/ui
- **ORM**: Prisma ORM with SQLite (`DATABASE_URL="file:./dev.db"`)
- **Runtime & Package Manager**: Bun

## 🚦 Zero-Tolerance Quality Gate Criteria
1. **Linting**: Clean ESLint check (`bun run lint`).
2. **Build**: Successful static & standalone generation (`bun run build`).
3. **Tests**: 100% passing test suite (`bun test`).
4. **Database Integrity**: Prisma schema pushed and seed test account active.
