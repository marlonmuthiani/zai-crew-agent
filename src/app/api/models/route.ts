import { NextRequest, NextResponse } from 'next/server';
import { AI_PROVIDERS } from '@/lib/ai-providers';

// Cache for discovered models (in production, use Redis or similar)
const modelCache: Record<string, { models: string[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API key storage (server-side only)
declare global {
  var apiKeysStore: Record<string, string>;
}

if (!global.apiKeysStore) {
  global.apiKeysStore = {};
}

// ============================================
// MODEL DISCOVERY FUNCTIONS
// ============================================

async function discoverOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data
      .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1'))
      .map((m: any) => m.id)
      .sort();
  } catch {
    return AI_PROVIDERS.openai.models;
  }
}

async function discoverAnthropicModels(apiKey: string): Promise<string[]> {
  // Anthropic doesn't have a models endpoint, return known models
  return AI_PROVIDERS.anthropic.models;
}

async function discoverGoogleModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    if (!response.ok) return AI_PROVIDERS.google.models;
    const data = await response.json();
    return data.models
      ?.filter((m: any) => m.name.includes('gemini'))
      .map((m: any) => m.name.replace('models/', ''))
      .sort() || AI_PROVIDERS.google.models;
  } catch {
    return AI_PROVIDERS.google.models;
  }
}

async function discoverMistralModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.mistral.models;
    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || AI_PROVIDERS.mistral.models;
  } catch {
    return AI_PROVIDERS.mistral.models;
  }
}

async function discoverGroqModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.groq.models;
    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || AI_PROVIDERS.groq.models;
  } catch {
    return AI_PROVIDERS.groq.models;
  }
}

async function discoverDeepSeekModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.deepseek.models;
    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || AI_PROVIDERS.deepseek.models;
  } catch {
    return AI_PROVIDERS.deepseek.models;
  }
}

async function discoverOpenRouterModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.openrouter.models;
    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || AI_PROVIDERS.openrouter.models;
  } catch {
    return AI_PROVIDERS.openrouter.models;
  }
}

async function discoverTogetherModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.together.xyz/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.together.models;
    const data = await response.json();
    return data.data?.map((m: any) => m.id).sort() || AI_PROVIDERS.together.models;
  } catch {
    return AI_PROVIDERS.together.models;
  }
}

async function discoverOllamaModels(endpoint: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    const response = await fetch(`${endpoint}/api/tags`);
    if (!response.ok) return AI_PROVIDERS.ollama.models;
    const data = await response.json();
    return data.models?.map((m: any) => m.name).sort() || AI_PROVIDERS.ollama.models;
  } catch {
    return AI_PROVIDERS.ollama.models;
  }
}

async function discoverCohereModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.cohere.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) return AI_PROVIDERS.cohere.models;
    const data = await response.json();
    return data.models?.map((m: any) => m.name).sort() || AI_PROVIDERS.cohere.models;
  } catch {
    return AI_PROVIDERS.cohere.models;
  }
}

async function discoverZaiModels(apiKey: string): Promise<string[]> {
  // Z.ai uses GLM models, return known models
  return AI_PROVIDERS.zai.models;
}

// Provider discovery mapping
const discoveryFunctions: Record<string, (apiKey: string, endpoint?: string) => Promise<string[]>> = {
  openai: discoverOpenAIModels,
  anthropic: discoverAnthropicModels,
  google: discoverGoogleModels,
  mistral: discoverMistralModels,
  groq: discoverGroqModels,
  deepseek: discoverDeepSeekModels,
  openrouter: discoverOpenRouterModels,
  together: discoverTogetherModels,
  ollama: discoverOllamaModels,
  cohere: discoverCohereModels,
  zai: discoverZaiModels,
};

// ============================================
// API ENDPOINTS
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('provider');
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!providerId) {
    // Return all providers with their static models
    const allProviders = Object.entries(AI_PROVIDERS).map(([id, provider]) => ({
      id,
      name: provider.name,
      icon: provider.icon,
      category: provider.category,
      models: provider.models,
      defaultModel: provider.defaultModel,
      supportsVision: provider.supportsVision,
      supportsAudio: provider.supportsAudio,
      local: provider.local,
    }));
    
    return NextResponse.json({ providers: allProviders });
  }

  const provider = AI_PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  // Check cache first
  const cached = modelCache[providerId];
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      provider: providerId,
      name: provider.name,
      models: cached.models,
      defaultModel: provider.defaultModel,
      cached: true,
    });
  }

  // For local providers, return static models immediately
  if (provider.local) {
    return NextResponse.json({
      provider: providerId,
      name: provider.name,
      models: provider.models,
      defaultModel: provider.defaultModel,
      local: true,
    });
  }

  // Try to discover models if API key exists
  const apiKey = global.apiKeysStore[providerId];
  const discoveryFn = discoveryFunctions[providerId];

  if (apiKey && discoveryFn) {
    try {
      const models = await discoveryFn(apiKey, providerId === 'ollama' ? 'http://localhost:11434' : undefined);
      
      // Cache the results
      modelCache[providerId] = { models, timestamp: Date.now() };
      
      return NextResponse.json({
        provider: providerId,
        name: provider.name,
        models: models.length > 0 ? models : provider.models,
        defaultModel: models.includes(provider.defaultModel) ? provider.defaultModel : (models[0] || provider.defaultModel),
        discovered: true,
      });
    } catch (error) {
      console.error(`Model discovery failed for ${providerId}:`, error);
    }
  }

  // Return static models as fallback
  return NextResponse.json({
    provider: providerId,
    name: provider.name,
    models: provider.models,
    defaultModel: provider.defaultModel,
    discovered: false,
    hasApiKey: !!apiKey,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { provider, apiKey, endpoint } = body;

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 });
  }

  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  // Store API key for discovery
  if (apiKey) {
    global.apiKeysStore[provider] = apiKey;
  }

  // Try to discover models
  const discoveryFn = discoveryFunctions[provider];
  const key = apiKey || global.apiKeysStore[provider];

  if (key && discoveryFn) {
    try {
      const models = await discoveryFn(key, endpoint);
      
      // Cache the results
      modelCache[provider] = { models, timestamp: Date.now() };
      
      return NextResponse.json({
        success: true,
        provider,
        models,
        defaultModel: models.includes(providerConfig.defaultModel) ? providerConfig.defaultModel : (models[0] || providerConfig.defaultModel),
        discovered: true,
      });
    } catch (error) {
      console.error(`Model discovery failed for ${provider}:`, error);
    }
  }

  // Return static models
  return NextResponse.json({
    success: true,
    provider,
    models: providerConfig.models,
    defaultModel: providerConfig.defaultModel,
    discovered: false,
  });
}
