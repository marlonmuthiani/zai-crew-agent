# /api/keys - API Key Status

## Overview

`src/app/api/keys/route.ts` checks the availability of API keys for various AI providers without exposing the actual keys to the client.

## Purpose

- Verify API keys are configured
- Show key status in UI (connected/not connected)
- Enable/disable provider selection based on key availability
- Maintain security by never exposing keys

## Endpoint

```
GET /api/keys
```

## Response

```typescript
{
  keyStatus: {
    openai: true,      // Key is configured
    anthropic: true,
    google: false,     // Key not configured
    deepseek: true,
    // ... all providers
  }
}
```

## Implementation

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables for each provider
  const keyStatus = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY,
    // ... check all providers
  };
  
  return NextResponse.json({ keyStatus });
}
```

---

## Security Considerations

1. **Never Expose Keys**: Only return boolean status, never actual keys
2. **Environment Variables**: Keys should be in `.env.local` or server environment
3. **No Client Access**: This route ensures client never sees keys

---

## Environment Variables

Required environment variables:

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
# ... more providers
```

---

## Usage in Client

```typescript
// In page.tsx
const fetchApiKeyStatus = async () => {
  const response = await fetch('/api/keys');
  const data = await response.json();
  
  // Update store with status
  Object.entries(data.keyStatus).forEach(([provider, hasKey]) => {
    setApiKeyStatus(provider, hasKey as boolean);
  });
};

// Called on mount
useEffect(() => {
  fetchApiKeyStatus();
}, []);
```

---

## UI Indicators

Providers show status badges:

```typescript
function ProviderSelect() {
  const apiKeyStatus = useAppStore(state => state.apiKeyStatus);
  
  return (
    <Select>
      {providers.map(p => (
        <SelectItem key={p.id} value={p.id}>
          {p.icon} {p.name}
          {apiKeyStatus[p.id] ? (
            <Badge className="bg-green-500">Connected</Badge>
          ) : (
            <Badge className="bg-red-500">No Key</Badge>
          )}
        </SelectItem>
      ))}
    </Select>
  );
}
```

---

## Relationships

```
/api/keys
├── Reads environment variables
│   └── Process.env.*_API_KEY
│
├── Called by page.tsx
│   └── On mount
│
└── Updates store.ts
    └── apiKeyStatus state
```
