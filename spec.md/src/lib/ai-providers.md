# ai-providers.ts - AI Provider Configurations

## Overview

`src/lib/ai-providers.ts` is the **AI provider registry** that defines configuration for 79+ AI service providers. This file centralizes all provider metadata, model lists, and capability flags.

## Purpose

This file enables the dashboard to:
- Display available AI providers in dropdowns
- Show provider-specific models
- Indicate capabilities (vision, audio, local)
- Link to provider documentation
- Provide placeholders for API key inputs

## File Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | ~520 |
| Providers Defined | 79+ |
| Categories | 12 |
| Helper Functions | 3 |

## Type Definitions

### AIProvider Interface

```typescript
interface AIProvider {
  id: string;              // Unique identifier (e.g., 'openai', 'anthropic')
  name: string;            // Display name (e.g., 'OpenAI', 'Anthropic')
  icon: string;            // Emoji icon for UI display
  category: string;        // Grouping category
  models: string[];        // Available model identifiers
  defaultModel: string;    // Pre-selected model
  keyPlaceholder: string;  // API key input placeholder
  docs: string;            // Documentation URL
  supportsVision?: boolean; // Can process images
  supportsAudio?: boolean; // Can process/generate audio
  local?: boolean;         // Runs locally (no API key needed)
}
```

---

## Provider Categories

### 1. Featured
Z.ai and OpenCode - highlighted providers

```typescript
'zai': {
  id: 'zai',
  name: 'Z.ai',
  icon: '🤖',
  models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4-air', 'glm-4-long', 'glm-4v-plus', 'glm-4v'],
  defaultModel: 'glm-4-plus',
  supportsVision: true,
}
```

### 2. Major Cloud
OpenAI, Anthropic, Google AI - the biggest providers

```typescript
'openai': {
  models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o1-preview'],
  supportsVision: true,
  supportsAudio: true,
}

'anthropic': {
  models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  supportsVision: true,
}

'google': {
  models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  supportsVision: true,
  supportsAudio: true,
}
```

### 3. Chinese AI
DeepSeek, Moonshot, Zhipu, Qwen, Baichuan, MiniMax, SiliconFlow

```typescript
'deepseek': {
  id: 'deepseek',
  name: 'DeepSeek',
  icon: '🔮',
  models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
}

'qwen': {
  name: 'Alibaba Qwen',
  models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
}
```

### 4. Major Platforms
Mistral, Cohere, Groq, xAI, Perplexity

```typescript
'groq': {
  name: 'Groq',
  icon: '⚡',
  models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
}

'xai': {
  name: 'xAI (Grok)',
  models: ['grok-beta', 'grok-2-1212', 'grok-2-vision-1212'],
  supportsVision: true,
}
```

### 5. Cloud GPU / Inference
Together AI, Fireworks, Replicate, Hugging Face, Hyperbolic, Novita, DeepInfra, Fal, RunPod, Lambda

```typescript
'together': {
  name: 'Together AI',
  models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo'],
}

'replicate': {
  models: ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-405b-instruct'],
}
```

### 6. Cloud Providers
Azure, AWS Bedrock, Vertex AI, Cloudflare, Databricks, NVIDIA

```typescript
'azure': {
  name: 'Azure OpenAI',
  models: ['gpt-4o', 'gpt-4-turbo', 'gpt-35-turbo'],
}

'aws': {
  name: 'AWS Bedrock',
  models: ['anthropic.claude-3-5-sonnet', 'anthropic.claude-3-opus', 'meta.llama3-70b-instruct'],
}
```

### 7. Specialized
Stability AI (images), ElevenLabs (audio), Voyage AI, Jina AI (embeddings)

```typescript
'stability': {
  name: 'Stability AI',
  models: ['stable-diffusion-xl-1024-v1-0', 'stable-image-ultra', 'stable-diffusion-3-large'],
}

'elevenlabs': {
  name: 'ElevenLabs',
  models: ['eleven_multilingual_v2', 'eleven_monolingual_v1', 'eleven_turbo_v2'],
  supportsAudio: true,
}
```

### 8. Local / Open Source
Ollama, vLLM, LocalAI

```typescript
'ollama': {
  name: 'Ollama (Local)',
  icon: '🦙',
  models: ['llama3.3', 'llama3.2', 'mistral', 'qwen2.5', 'deepseek-r1'],
  local: true,  // No API key required
  keyPlaceholder: 'No key required',
}
```

### 9. Enterprise
Anyscale, SambaNova, Cerebras

### 10. Aggregators
OpenRouter - access multiple providers through one API

```typescript
'openrouter': {
  models: [
    'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.3-70b-instruct'
  ],
}
```

### 11. Custom
User-defined endpoints

```typescript
'custom': {
  name: 'Custom Endpoint',
  models: ['custom-model'],
  keyPlaceholder: 'API Key (optional)',
}
```

---

## Helper Functions

### getProvidersByCategory()

```typescript
export function getProvidersByCategory(): Record<string, AIProvider[]> {
  const categories: Record<string, AIProvider[]> = {};
  for (const provider of Object.values(AI_PROVIDERS)) {
    if (!categories[provider.category]) {
      categories[provider.category] = [];
    }
    categories[provider.category].push(provider);
  }
  return categories;
}
```

**Returns:** Object mapping category names to arrays of providers

**Usage:**
```typescript
const byCategory = getProvidersByCategory();
// {
//   'Major Cloud': [OpenAI, Anthropic, Google],
//   'Chinese AI': [DeepSeek, Moonshot, ...],
//   ...
// }
```

---

### getProvider()

```typescript
export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS[id];
}
```

**Returns:** Single provider config by ID, or undefined

---

### PROVIDER_COUNT

```typescript
export const PROVIDER_COUNT = Object.keys(AI_PROVIDERS).length;
```

**Returns:** Total number of providers (79+)

---

## Security Considerations

**IMPORTANT:** API keys are NEVER exposed to the client. The comment at the top of the file states:

```typescript
// API keys are NEVER exposed to client - all requests go through secure API routes
```

The `keyPlaceholder` field only shows what format the key should look like (e.g., `sk-...`), not actual keys.

---

## Usage in Components

### In Dropdown Selection

```typescript
import { AI_PROVIDERS, getProvidersByCategory } from '@/lib/ai-providers';

function ProviderSelect() {
  const byCategory = getProvidersByCategory();
  
  return (
    <Select>
      {Object.entries(byCategory).map(([category, providers]) => (
        <SelectGroup key={category}>
          <SelectLabel>{category}</SelectLabel>
          {providers.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.icon} {p.name}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </Select>
  );
}
```

### Getting Models for Provider

```typescript
function ModelSelect({ providerId }: { providerId: string }) {
  const provider = AI_PROVIDERS[providerId];
  
  if (!provider) return null;
  
  return (
    <Select defaultValue={provider.defaultModel}>
      {provider.models.map(model => (
        <SelectItem key={model} value={model}>
          {model}
        </SelectItem>
      ))}
    </Select>
  );
}
```

### Checking Capabilities

```typescript
function ProviderCard({ providerId }: { providerId: string }) {
  const provider = AI_PROVIDERS[providerId];
  
  return (
    <div>
      <h3>{provider.icon} {provider.name}</h3>
      {provider.supportsVision && <Badge>Vision</Badge>}
      {provider.supportsAudio && <Badge>Audio</Badge>}
      {provider.local && <Badge>Local</Badge>}
    </div>
  );
}
```

---

## Adding a New Provider

To add a new AI provider:

1. **Define the provider object:**

```typescript
'new-provider': {
  id: 'new-provider',
  name: 'New Provider',
  icon: '🆕',
  category: 'Major Cloud',  // Choose appropriate category
  models: ['model-1', 'model-2'],
  defaultModel: 'model-1',
  keyPlaceholder: 'api-key-here',
  docs: 'https://docs.newprovider.com',
  supportsVision: true,    // Optional
  supportsAudio: false,    // Optional
  local: false,            // Optional
},
```

2. **Add to AI_PROVIDERS object**

3. **Test in UI** - Provider should appear in dropdowns

---

## Relationships with Other Files

```
ai-providers.ts
├── Used by store.ts
│   └── Default model selection when creating agents
│
├── Used by page.tsx
│   ├── Provider dropdown population
│   ├── Model dropdown population
│   └── Capability badges display
│
└── Used by API routes
    └── Provider endpoint configuration
```

---

## Model Naming Conventions

Different providers use different naming patterns:

| Provider | Pattern | Example |
|----------|---------|---------|
| OpenAI | gpt-version | `gpt-4o` |
| Anthropic | claude-version-date | `claude-3-5-sonnet-20241022` |
| Google | gemini-version | `gemini-1.5-pro` |
| Open Source | org/model-name | `meta-llama/Llama-3.3-70B-Instruct` |
| Chinese | name-version | `qwen-max` |

---

## Common Issues

### Missing Provider?
- Check if provider ID is correct
- Verify the provider is in AI_PROVIDERS object

### Wrong Models?
- Provider model lists may become outdated
- Check provider's official documentation for current models

### API Key Format?
- Use `keyPlaceholder` to show expected format
- Never store or display actual API keys
