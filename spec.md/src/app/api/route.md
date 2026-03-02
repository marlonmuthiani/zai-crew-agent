# API Routes - Overview

## Directory Structure

The `src/app/api/` directory contains all backend API routes following Next.js App Router conventions. Each folder represents an endpoint that can handle HTTP requests.

```
src/app/api/
├── route.ts              # Main API endpoint
├── keys/route.ts         # API key status check
├── models/route.ts       # Model discovery
├── sessions/route.ts     # Session persistence
├── embeddings/route.ts   # Vector embeddings
├── export/route.ts       # Data export
├── speech/route.ts       # Speech-to-text
├── capabilities/route.ts # Capability queries
│
├── ai/
│   └── chat/route.ts     # AI chat completions
│
├── files/
│   └── import/route.ts   # File import handling
│
├── plugins/
│   ├── route.ts          # Plugin CRUD
│   └── execute/route.ts  # Plugin execution
│
├── workspaces/
│   ├── route.ts          # Workspace CRUD
│   ├── folders/route.ts  # Folder management
│   ├── index/route.ts    # Vector indexing
│   └── graph/route.ts    # Knowledge graph
│
├── teams/route.ts        # Team management
├── scheduler/route.ts    # Task scheduling
├── observability/route.ts # Monitoring metrics
├── orchestrator/route.ts # Agent orchestration
├── orchestration/route.ts # Orchestration sessions
└── skills/route.ts       # Skills management
```

---

## Common Patterns

### Route Handler Structure

All routes follow Next.js App Router conventions:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET requests
  return NextResponse.json({ data: 'response' });
}

export async function POST(request: NextRequest) {
  // Handle POST requests
  const body = await request.json();
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  // Handle PUT requests
}

export async function DELETE(request: NextRequest) {
  // Handle DELETE requests
}
```

---

### Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    // Processing logic
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Authentication Check

```typescript
export async function GET(request: NextRequest) {
  // Check for session or API key
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Proceed with authenticated request
}
```

---

## Request/Response Patterns

### Standard Response Format

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}

// Error response
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Pagination

```typescript
// GET /api/beans?page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  // Implement pagination logic
}
```

---

## AI Integration

### Using z-ai-web-dev-sdk

```typescript
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  const zai = await ZAI.create();
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ],
    // Provider/model selection happens here
  });
  
  return NextResponse.json({
    content: completion.choices[0]?.message?.content
  });
}
```

---

## Database Access

### Using Prisma

```typescript
import { prisma } from '@/lib/db';

export async function GET() {
  const agents = await prisma.agent.findMany();
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const agent = await prisma.agent.create({
    data: body
  });
  return NextResponse.json({ agent });
}
```

---

## Rate Limiting

Routes that call external APIs should implement rate limiting:

```typescript
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string, limit: number = 60): boolean {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(t => t > windowStart);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

---

## Route Documentation Files

Each route has its own documentation file in this folder:

| File | Route | Purpose |
|------|-------|---------|
| `keys.md` | `/api/keys` | API key status verification |
| `models.md` | `/api/models` | Discover available models |
| `sessions.md` | `/api/sessions` | Session persistence |
| `ai/chat.md` | `/api/ai/chat` | AI chat completions |
| `speech.md` | `/api/speech` | Speech-to-text conversion |
| `teams.md` | `/api/teams` | Team management |
| `scheduler.md` | `/api/scheduler` | Scheduled tasks |
| `observability.md` | `/api/observability` | System metrics |
| `plugins/route.md` | `/api/plugins` | Plugin management |
| `plugins/execute.md` | `/api/plugins/execute` | Plugin execution |
| `skills.md` | `/api/skills` | Skills management |
| `capabilities.md` | `/api/capabilities` | Capability queries |
| `orchestrator.md` | `/api/orchestrator` | Agent orchestration |
| `orchestration.md` | `/api/orchestration` | Orchestration sessions |
| `workspaces/route.md` | `/api/workspaces` | Workspace CRUD |
| `workspaces/folders.md` | `/api/workspaces/folders` | Folder management |
| `workspaces/index.md` | `/api/workspaces/index` | Vector indexing |
| `workspaces/graph.md` | `/api/workspaces/graph` | Knowledge graph |
| `files/import.md` | `/api/files/import` | File import |
| `embeddings.md` | `/api/embeddings` | Embedding generation |
| `export.md` | `/api/export` | Data export |
