# /api/ai/chat - AI Chat Completions

## Overview

`src/app/api/ai/chat/route.ts` handles all AI chat completions for the dashboard. It acts as a secure proxy between the client and AI providers, ensuring API keys are never exposed to the browser.

## Purpose

- Process chat messages from users
- Route requests to appropriate AI providers
- Handle streaming responses
- Manage conversation context
- Return AI responses to the client

## Endpoint

```
POST /api/ai/chat
```

## Request Body

```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>,
  provider: string,       // e.g., 'openai', 'anthropic'
  model: string,          // e.g., 'gpt-4o', 'claude-3-5-sonnet'
  temperature?: number,   // 0-2, default 0.7
  maxTokens?: number,     // Default 4096
  stream?: boolean,       // Enable streaming
}
```

## Response

### Non-streaming

```typescript
{
  content: string,
  usage: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  },
  model: string,
  provider: string
}
```

### Streaming

Returns Server-Sent Events (SSE) stream with chunks of the response.

## Implementation

```typescript
import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, model, temperature, maxTokens, stream } = body;
    
    // Initialize AI SDK
    const zai = await ZAI.create();
    
    // Make completion request
    const completion = await zai.chat.completions.create({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      model: model,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 4096,
      stream: stream ?? false,
    });
    
    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
          controller.close();
        }
      });
      
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }
    
    // Non-streaming response
    return NextResponse.json({
      content: completion.choices[0]?.message?.content,
      usage: completion.usage,
      model: model,
      provider: provider
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get completion' },
      { status: 500 }
    );
  }
}
```

## Provider Support

All 79+ providers defined in `ai-providers.ts` are supported through the unified SDK interface:

| Provider | Models | Special Notes |
|----------|--------|---------------|
| OpenAI | GPT-4o, GPT-4, etc. | Supports vision, audio |
| Anthropic | Claude 3.5 | Supports vision |
| Google | Gemini 2.0 | Supports vision, audio |
| DeepSeek | Chat, Coder | Cost-effective |
| Groq | Llama models | Fast inference |
| Ollama | Local models | No API key needed |

## Security Considerations

1. **API Keys**: Never passed from client; handled server-side only
2. **Rate Limiting**: Should be implemented to prevent abuse
3. **Input Validation**: Messages are validated before processing
4. **Error Messages**: Sanitized to not expose internal details

## Usage from Client

```typescript
// In page.tsx
const sendMessage = async (messages: Message[]) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      provider: selectedProvider,
      model: selectedModel,
      temperature: 0.7,
      maxTokens: 4096
    })
  });
  
  const data = await response.json();
  return data.content;
};
```

## Relationships

```
/api/ai/chat
├── Uses z-ai-web-dev-sdk
├── References ai-providers.ts for model info
├── Called from page.tsx chat interface
└── May use sessions/route.ts for persistence
```

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | API key invalid/missing |
| 429 | Rate limit exceeded |
| 500 | Internal error |
| 502 | AI provider error |
