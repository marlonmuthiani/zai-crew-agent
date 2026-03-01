import { NextRequest, NextResponse } from 'next/server';

// Embedding generation endpoint - uses providers from the provider list
// API keys are handled server-side only

interface EmbeddingRequest {
  provider: string;
  model: string;
  text: string | string[];
}

// API key storage (shared with chat route)
const apiKeys = new Map<string, string>();

function getApiKey(provider: string): string | null {
  const envKey = process.env[`${provider.toUpperCase().replace(/-/g, '_')}_API_KEY`];
  if (envKey) return envKey;
  return apiKeys.get(provider) || null;
}

// Provider-specific embedding endpoints and formats
const EMBEDDING_CONFIGS: Record<string, {
  endpoint: string;
  authType: 'bearer' | 'x-api-key' | 'query';
  formatRequest: (model: string, text: string | string[]) => Record<string, unknown>;
  parseResponse: (data: any) => number[][];
}> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: text,
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  voyage: {
    endpoint: 'https://api.voyageai.com/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  cohere: {
    endpoint: 'https://api.cohere.ai/v1/embed',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      texts: Array.isArray(text) ? text : [text],
      input_type: 'search_document',
    }),
    parseResponse: (data) => data.embeddings || [],
  },
  
  jina: {
    endpoint: 'https://api.jina.ai/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  google: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent',
    authType: 'query',
    formatRequest: (model, text) => ({
      model: `models/${model}`,
      content: {
        parts: Array.isArray(text) 
          ? text.map(t => ({ text: t }))
          : [{ text }],
      },
    }),
    parseResponse: (data) => {
      if (data.embedding) return [data.embedding.values];
      return data.embeddings?.map((e: any) => e.values) || [];
    },
  },
  
  mistral: {
    endpoint: 'https://api.mistral.ai/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  huggingface: {
    endpoint: 'https://api-inference.huggingface.co/pipeline/feature-extraction/{model}',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      inputs: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => Array.isArray(data[0]) ? data : [data],
  },
  
  nvidia: {
    endpoint: 'https://integrate.api.nvidia.com/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
      input_type: 'query',
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  zhipu: {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  zai: {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model: model || 'embedding-2',
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  siliconflow: {
    endpoint: 'https://api.siliconflow.cn/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
      encoding_format: 'float',
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
  
  together: {
    endpoint: 'https://api.together.xyz/v1/embeddings',
    authType: 'bearer',
    formatRequest: (model, text) => ({
      model,
      input: Array.isArray(text) ? text : [text],
    }),
    parseResponse: (data) => data.data?.map((d: any) => d.embedding) || [],
  },
};

// Default embedding dimensions per provider/model
const EMBEDDING_DIMENSIONS: Record<string, Record<string, number>> = {
  openai: {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536,
  },
  voyage: {
    'voyage-3': 1024,
    'voyage-3-lite': 512,
    'voyage-2': 1024,
    'voyage-large-2-instruct': 1536,
  },
  cohere: {
    'embed-english-v3.0': 1024,
    'embed-multilingual-v3.0': 1024,
    'embed-english-light-v3.0': 384,
  },
  jina: {
    'jina-embeddings-v3': 1024,
    'jina-embeddings-v2-base-en': 768,
  },
  google: {
    'text-embedding-004': 768,
    'text-embedding-preview-0409': 768,
  },
  mistral: {
    'mistral-embed': 1024,
  },
  zai: {
    'embedding-2': 1024,
    'embedding-3': 1536,
  },
};

export async function POST(request: NextRequest) {
  try {
    const data: EmbeddingRequest = await request.json();
    const { provider, model, text } = data;

    if (!provider || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, text' },
        { status: 400 }
      );
    }

    const config = EMBEDDING_CONFIGS[provider];
    if (!config) {
      return NextResponse.json(
        { error: `Embedding not supported for provider: ${provider}` },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${provider}` },
        { status: 401 }
      );
    }

    // Build endpoint URL
    let endpoint = config.endpoint;
    if (endpoint.includes('{model}')) {
      endpoint = endpoint.replace('{model}', model);
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.authType === 'bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (config.authType === 'x-api-key') {
      headers['x-api-key'] = apiKey;
    } else if (config.authType === 'query') {
      const sep = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${sep}key=${apiKey}`;
    }

    // Make request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(config.formatRequest(model, text)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const embeddings = config.parseResponse(responseData);
    
    // Get dimensions
    const dimensions = EMBEDDING_DIMENSIONS[provider]?.[model] || embeddings[0]?.length || 1536;

    return NextResponse.json({
      embeddings,
      dimensions,
      model,
      provider,
      count: embeddings.length,
    });

  } catch (error) {
    console.error('Embedding API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - return supported embedding providers and models
export async function GET() {
  const providers = Object.entries(EMBEDDING_CONFIGS).map(([id, config]) => ({
    id,
    models: Object.keys(EMBEDDING_DIMENSIONS[id] || {}),
    defaultModel: Object.keys(EMBEDDING_DIMENSIONS[id] || {})[0] || 'default',
    dimensions: EMBEDDING_DIMENSIONS[id] || {},
  }));

  return NextResponse.json({ providers });
}
