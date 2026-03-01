import { NextRequest, NextResponse } from 'next/server';

// Secure API endpoint for AI chat - API keys are handled server-side only
// Keys are stored securely and never exposed to the client

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  provider: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  customEndpoint?: string;
}

// API key storage (in production, use secure database/environment variables)
const apiKeys = new Map<string, string>();

// Get API key from environment or secure storage
function getApiKey(provider: string): string | null {
  // First check environment variables
  const envKey = process.env[`${provider.toUpperCase().replace(/-/g, '_')}_API_KEY`];
  if (envKey) return envKey;
  
  // Then check secure storage
  return apiKeys.get(provider) || null;
}

// Store API key securely (called from settings API)
export function setApiKey(provider: string, key: string) {
  apiKeys.set(provider, key);
}

// Provider-specific request formatters
function formatOpenAIRequest(data: ChatRequest): Record<string, unknown> {
  return {
    model: data.model,
    messages: [
      { role: 'system', content: data.systemPrompt },
      ...data.messages,
    ],
    temperature: data.temperature || 0.7,
    max_tokens: data.maxTokens || 4096,
  };
}

function formatAnthropicRequest(data: ChatRequest): Record<string, unknown> {
  return {
    model: data.model,
    system: data.systemPrompt,
    messages: data.messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: data.maxTokens || 4096,
  };
}

function formatGoogleRequest(data: ChatRequest): Record<string, unknown> {
  return {
    contents: data.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: data.temperature || 0.7,
      maxOutputTokens: data.maxTokens || 4096,
    },
    systemInstruction: {
      parts: [{ text: data.systemPrompt }],
    },
  };
}

// Provider endpoints
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  cohere: 'https://api.cohere.ai/v2/chat',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  fireworks: 'https://api.fireworks.ai/inference/v1/chat/completions',
  huggingface: 'https://api-inference.huggingface.co/models',
  hyperbolic: 'https://api.hyperbolic.xyz/v1/chat/completions',
  novita: 'https://api.novita.ai/v3/openai/chat/completions',
  deepinfra: 'https://api.deepinfra.com/v1/openai/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  moonshot: 'https://api.moonshot.cn/v1/chat/completions',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
  nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
  sambanova: 'https://api.sambanova.ai/v1/chat/completions',
  zai: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  opencode: 'https://api.opencode.ai/v1/chat/completions',
  minimax: 'https://api.minimax.chat/v1/chat/completions',
  baichuan: 'https://api.baichuan-ai.com/v1/chat/completions',
};

export async function POST(request: NextRequest) {
  try {
    const data: ChatRequest = await request.json();
    const { provider, model, messages, systemPrompt, temperature, maxTokens, customEndpoint } = data;

    // Validate required fields
    if (!provider || !model || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model, messages' },
        { status: 400 }
      );
    }

    // Check for local providers (no API key needed)
    const localProviders = ['ollama', 'vllm', 'localai'];
    const isLocal = localProviders.includes(provider);

    // Get API key for non-local providers
    let apiKey: string | null = null;
    if (!isLocal) {
      apiKey = getApiKey(provider);
      if (!apiKey) {
        return NextResponse.json(
          { error: `API key not configured for ${provider}. Please add it in Settings.` },
          { status: 401 }
        );
      }
    }

    // Build request based on provider
    let endpoint = customEndpoint || PROVIDER_ENDPOINTS[provider];
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: Record<string, unknown>;

    // Handle different providers
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'xai':
      case 'deepseek':
      case 'together':
      case 'fireworks':
      case 'hyperbolic':
      case 'novita':
      case 'deepinfra':
      case 'openrouter':
      case 'moonshot':
      case 'siliconflow':
      case 'nvidia':
      case 'cerebras':
      case 'sambanova':
      case 'zai':
      case 'zhipu':
      case 'qwen':
      case 'opencode':
      case 'minimax':
      case 'baichuan':
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = formatOpenAIRequest(data);
        break;

      case 'anthropic':
        headers['x-api-key'] = apiKey!;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        body = formatAnthropicRequest(data);
        break;

      case 'google':
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        body = formatGoogleRequest(data);
        break;

      case 'mistral':
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = formatOpenAIRequest(data);
        break;

      case 'cohere':
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model,
          messages: data.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: maxTokens || 4096,
          temperature: temperature || 0.7,
        };
        break;

      case 'perplexity':
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = formatOpenAIRequest(data);
        break;

      case 'ollama':
        endpoint = 'http://localhost:11434/api/chat';
        body = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          stream: false,
        };
        break;

      case 'vllm':
        endpoint = customEndpoint || 'http://localhost:8000/v1/chat/completions';
        body = formatOpenAIRequest(data);
        break;

      case 'localai':
        endpoint = customEndpoint || 'http://localhost:8080/v1/chat/completions';
        body = formatOpenAIRequest(data);
        break;

      case 'huggingface':
        endpoint = `https://api-inference.huggingface.co/models/${model}`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          inputs: messages[messages.length - 1]?.content || '',
          parameters: {
            temperature: temperature || 0.7,
            max_new_tokens: maxTokens || 4096,
          },
        };
        break;

      case 'custom':
        if (!customEndpoint) {
          return NextResponse.json(
            { error: 'Custom endpoint required for custom provider' },
            { status: 400 }
          );
        }
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        body = formatOpenAIRequest(data);
        break;

      default:
        // Default to OpenAI-compatible format
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        body = formatOpenAIRequest(data);
    }

    // Make the API request
    const response = await fetch(endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API Error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || errorData.message || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Parse response based on provider
    let content: string;

    switch (provider) {
      case 'anthropic':
        content = responseData.content?.[0]?.text || 'No response';
        break;

      case 'google':
        content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        break;

      case 'cohere':
        content = responseData.message?.content?.[0]?.text || responseData.text || 'No response';
        break;

      case 'ollama':
        content = responseData.message?.content || 'No response';
        break;

      case 'huggingface':
        content = Array.isArray(responseData) 
          ? responseData[0]?.generated_text || 'No response'
          : responseData.generated_text || 'No response';
        break;

      default:
        // OpenAI-compatible format
        content = responseData.choices?.[0]?.message?.content || 'No response';
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
