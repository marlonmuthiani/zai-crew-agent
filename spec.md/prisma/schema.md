# Prisma Schema - Database Configuration

## Overview

`prisma/schema.prisma` defines the database schema for persistent storage in the Team AI Dashboard.

## Purpose

- Define database models
- Configure database connection
- Set up relationships between entities
- Enable type-safe database access

## Database Provider

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Note:** SQLite is used for local development. Can be switched to PostgreSQL, MySQL, or other providers for production.

---

## Models

### User

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  teams     Team[]
  agents    Agent[]
  sessions  Session[]
}
```

### Team

```prisma
model Team {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     TeamMember[]
  agents      Agent[]
}
```

### Agent

```prisma
model Agent {
  id            String   @id @default(uuid())
  name          String
  description   String?
  type          String   // 'main', 'subagent', 'orchestrator', 'worker'
  status        String   // 'idle', 'busy', 'error', 'offline'
  
  provider      String
  model         String
  systemPrompt  String
  temperature   Float    @default(0.7)
  maxTokens     Int      @default(4096)
  
  parentAgentId String?
  subagentIds   String?  // JSON array
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  parentAgent   Agent?         @relation("AgentHierarchy", fields: [parentAgentId], references: [id])
  subagents     Agent[]        @relation("AgentHierarchy")
  beans         Bean[]
}
```

### Bean

```prisma
model Bean {
  id              String   @id @default(uuid())
  title           String
  description     String?
  content         String?
  
  status          String   @default("pending")
  priority        String   @default("normal")
  
  assignedAgentId String?
  result          String?
  error           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  agent           Agent?   @relation(fields: [assignedAgentId], references: [id])
}
```

### Session

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  data      String   // JSON stringified state
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Database Commands

### Generate Client

```bash
bun run db:generate
# or
bunx prisma generate
```

### Push Schema Changes

```bash
bun run db:push
# or
bunx prisma db push
```

### Create Migration

```bash
bun run db:migrate
# or
bunx prisma migrate dev --name description
```

### Reset Database

```bash
bun run db:reset
# or
bunx prisma migrate reset
```

---

## Usage in Code

### Import

```typescript
import { prisma } from '@/lib/db';
```

### Query Examples

```typescript
// Create
const agent = await prisma.agent.create({
  data: {
    name: 'Research Agent',
    type: 'worker',
    provider: 'openai',
    model: 'gpt-4o',
    systemPrompt: 'You are a research assistant.',
  }
});

// Read
const agents = await prisma.agent.findMany();

// Update
await prisma.agent.update({
  where: { id: agentId },
  data: { status: 'busy' }
});

// Delete
await prisma.agent.delete({
  where: { id: agentId }
});
```

---

## Relationships

```
schema.prisma
├── Used by lib/db.ts
│   └── Prisma client export
│
├── Used by API routes
│   └── Database operations
│
└── Generates TypeScript types
    └── Type-safe database access
```

---

## Production Considerations

### Switching to PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/teamai"
```

### Connection Pooling

For production, use connection pooling:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```
