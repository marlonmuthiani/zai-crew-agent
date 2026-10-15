# Product Requirement Document (PRD) - Launch Criteria

## 1. Overview & Launch Vision
This document defines the launch requirements, core user journeys, technical specifications, and quality gates for the production release of the application.

## 2. Environment Pipeline Progression
The application follows a strict sequential multi-stage promotion pipeline:
1. `jules-merge-prs` (Persistent Staging Workspace)
2. `dev-low` (Internal Low-Tier Staging)
3. `dev-high` (High-Tier Staging & Pre-Release)
4. `main` (Production Candidate)
5. `prod` (Live Production Release)

## 3. Official PRD User Test Account
To support authenticated automated E2E testing, staging verification, and user flow validation, the following test account is persistently provisioned:
- **Email**: `zoozoo@zaazaa.com`
- **Password**: `123456789.A`
- **Role**: Standard User / Launch Tester
- **Persistence Mandate**: Must remain active and preserved across all database migrations and test setup cycles.

## 4. Core User Journeys & Feature Specifications
1. **Authentication & Session Management**
   - User login and sign-up flows via NextAuth.js.
   - Persistent session state across authenticated routes.
2. **Dashboard & Main Application Interface**
   - Responsive design supporting mobile, tablet, and desktop viewports.
   - Fast initial page load with Next.js App Router and optimized assets.
3. **Interactive Features**
   - Drag-and-drop toolkit integration with `@dnd-kit`.
   - Data display and table manipulation with `@tanstack/react-table`.
   - Interactive data visualizations with `Recharts`.
4. **User Experience & Copy Quality**
   - Clear, warm, engaging, humanized UI copy across all pages, forms, and alerts.
   - Accessible UI components compliant with WCAG guidelines using `shadcn/ui` / Radix UI primitives.

## 5. Launch Quality Gates
- **Zero Build Errors**: Project builds successfully (`bun run build`).
- **Zero Lint Errors**: Static analysis passes (`bun run lint`).
- **Database Consistency**: Prisma schema synced (`bun run db:push`).
- **Authenticated Journey Verification**: E2E verification using official launch test account (`zoozoo@zaazaa.com`).
