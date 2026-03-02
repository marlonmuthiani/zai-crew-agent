# Team AI Collaboration Dashboard - Project Documentation

## What is this folder?

This `spec.md` folder contains **human-readable documentation** for every file in the Team AI Collaboration Dashboard project. It is designed to help developers, stakeholders, and AI assistants understand the project in depth without needing to read raw code.

**This folder is NOT part of the application** - it is a documentation mirror that exists purely for human understanding.

---

## Project Overview

### What is the Team AI Collaboration Dashboard?

The Team AI Collaboration Dashboard is a sophisticated web application that enables teams to work with multiple AI agents simultaneously. It functions as a command center where users can create, configure, and orchestrate AI agents that communicate with each other to accomplish complex tasks.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **79+ AI Providers** | Integrates with OpenAI, Anthropic, Google, DeepSeek, Z.ai, and 70+ other AI providers |
| **Multi-Agent Orchestration** | Create main agents that coordinate subagents for complex workflows |
| **Beans System** | Task management designed specifically for AI agent assignment and execution |
| **Plugin Architecture** | Extend agent capabilities with custom JavaScript/TypeScript plugins |
| **Skills Framework** | Define reusable, multi-step agent capabilities |
| **Observability Dashboard** | Real-time monitoring of agent activities, task progress, and system health |
| **Scheduler** | Cron-like scheduling for automated task execution |
| **Team Management** | ISO 27001-compliant role-based access control (RBAC) |
| **Vector Workspaces** | Embedding-based semantic search over documents and conversations |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    page.tsx (Main UI)                        │ │
│  │  - Sidebar Navigation                                        │ │
│  │  - Tab-based Content Areas                                   │ │
│  │  - Real-time State Management (Zustand)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Backend)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  /api/chat   │  │ /api/agents  │  │ /api/beans   │  ...     │
│  │  AI Chat     │  │ CRUD Ops     │  │ Task Mgmt    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Zustand Store│  │   Prisma     │  │  SurrealDB   │          │
│  │ (Client)     │  │ (SQLite)     │  │ (Optional)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL AI PROVIDERS                        │
│  OpenAI │ Anthropic │ Google │ DeepSeek │ Z.ai │ ... 79+ more   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
spec.md/
├── README.md                    # This file - project overview
├── IMPLEMENTATIONS.md           # Chronological build history
│
├── src/                         # Source code documentation
│   ├── app/
│   │   ├── page.md              # Main dashboard component
│   │   ├── layout.md            # Root layout & providers
│   │   ├── globals.md           # Global CSS styles
│   │   │
│   │   └── api/                 # API Routes documentation
│   │       ├── route.md         # Main API endpoint
│   │       ├── keys.md          # API key management
│   │       ├── sessions.md      # Session persistence
│   │       ├── models.md        # Model discovery
│   │       ├── capabilities.md  # Capability queries
│   │       ├── embeddings.md    # Vector embeddings
│   │       ├── export.md        # Data export
│   │       ├── speech.md        # Speech-to-text
│   │       ├── teams.md         # Team management
│   │       ├── scheduler.md     # Task scheduling
│   │       ├── observability.md # Monitoring
│   │       ├── orchestrator.md  # Agent orchestration
│   │       ├── orchestration.md # Orchestration sessions
│   │       ├── skills.md        # Skills management
│   │       └── plugins/         # Plugin routes
│   │           ├── route.md     # Plugin CRUD
│   │           └── execute.md   # Plugin execution
│   │       ├── ai/
│   │       │   └── chat.md      # AI chat endpoint
│   │       ├── files/
│   │       │   └── import.md    # File import
│   │       └── workspaces/
│   │           ├── route.md     # Workspace CRUD
│   │           ├── folders.md   # Folder management
│   │           ├── index.md     # Vector indexing
│   │           └── graph.md     # Knowledge graph
│   │
│   ├── lib/
│   │   ├── store.md             # Zustand state management
│   │   ├── ai-providers.md      # 79+ AI provider configs
│   │   ├── utils.md             # Utility functions
│   │   ├── db.md                # Database connection
│   │   ├── surrealdb.md         # SurrealDB client
│   │   └── use-model-discovery.md # Model discovery hook
│   │
│   ├── hooks/
│   │   ├── use-mobile.md        # Mobile detection
│   │   └── use-toast.md         # Toast notifications
│   │
│   └── components/
│       └── ui/                  # shadcn/ui components
│           ├── button.md
│           ├── card.md
│           ├── dialog.md
│           └── ... (40+ components)
│
├── prisma/
│   └── schema.md                # Database schema
│
└── examples/
    └── websocket/
        ├── frontend.md          # WebSocket client
        └── server.md            # WebSocket server
```

---

## How to Navigate This Documentation

### For New Developers
1. Start with `IMPLEMENTATIONS.md` to understand the project's evolution
2. Read `src/app/page.md` to understand the main UI
3. Explore `src/lib/store.md` to understand state management
4. Review `src/lib/ai-providers.md` to understand AI integrations

### For AI Assistants
1. Read `IMPLEMENTATIONS.md` to understand what has been built
2. Use the file-specific `.md` files to understand relationships
3. Reference the architecture diagrams when making changes

### For Product Managers
1. Read this `README.md` for feature overview
2. Check `IMPLEMENTATIONS.md` for feature history
3. Review individual feature docs in `src/app/` subfolders

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15+ | React framework with App Router |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with component library |
| **State** | Zustand | Client-side state management |
| **Database** | Prisma + SQLite | ORM and local database |
| **Optional DB** | SurrealDB | Graph/document database |
| **AI SDK** | z-ai-web-dev-sdk | Multi-provider AI integration |
| **Icons** | Lucide React | Icon library |

---

## Quick Reference

### Main Entry Points
- **UI Entry**: `src/app/page.tsx` - The single-page dashboard
- **API Entry**: `src/app/api/` - RESTful API routes
- **State Entry**: `src/lib/store.ts` - Global state management

### Key Concepts
- **Agent**: An AI assistant with a specific role and capabilities
- **Bean**: A task specifically designed for AI agent execution
- **Plugin**: JavaScript/TypeScript code that extends agent capabilities
- **Skill**: A multi-step, reusable capability definition
- **Orchestration**: Coordinating multiple agents to complete a task

### User Flows
1. **Create Team Member** → Assign AI Agent → Start Conversation
2. **Create Agent** → Configure Provider/Model → Link Subagents
3. **Create Bean** → Assign to Agent → Monitor Progress
4. **Create Plugin** → Define Triggers → Execute on Events

---

## Related Files

| Document | Purpose |
|----------|---------|
| `IMPLEMENTATIONS.md` | Chronological history of all changes |
| `src/app/page.md` | Main dashboard component documentation |
| `src/lib/store.md` | State management documentation |
| `src/lib/ai-providers.md` | AI provider configurations |
