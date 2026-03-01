import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for API keys (in production, use encrypted database)
// Keys are NEVER returned to the client - only existence status
const apiKeys = new Map<string, string>();

// GET - Check if API keys exist for providers (returns boolean status only)
export async function GET() {
  const keyStatus: Record<string, boolean> = {};
  
  // Check environment variables first
  const providers = [
    'openai', 'anthropic', 'google', 'mistral', 'cohere', 'groq', 'xai',
    'perplexity', 'deepseek', 'together', 'fireworks', 'huggingface',
    'hyperbolic', 'novita', 'deepinfra', 'openrouter', 'moonshot',
    'zhipu', 'qwen', 'siliconflow', 'nvidia', 'cerebras', 'sambanova',
    'zai', 'opencode', 'minimax', 'baichuan', 'replicate', 'fal',
    'runpod', 'lambda', 'azure', 'aws', 'vertex', 'cloudflare',
    'databricks', 'nvidia', 'stability', 'elevenlabs', 'voyage', 'jina',
    'anyscale', 'sambanova', 'cerebras', 'openrouter'
  ];
  
  for (const provider of providers) {
    const envKey = process.env[`${provider.toUpperCase().replace(/-/g, '_')}_API_KEY`];
    const storedKey = apiKeys.get(provider);
    keyStatus[provider] = !!(envKey || storedKey);
  }
  
  return NextResponse.json({ keyStatus });
}

// POST - Store API key securely (key is never returned)
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }
    
    // Store the key (in production, encrypt and store in secure database)
    apiKeys.set(provider, apiKey);
    
    // Only return success status, never the key
    return NextResponse.json({ 
      success: true,
      provider,
      hasKey: true 
    });
    
  } catch (error) {
    console.error('Error storing API key:', error);
    return NextResponse.json(
      { error: 'Failed to store API key' },
      { status: 500 }
    );
  }
}

// DELETE - Remove API key
export async function DELETE(request: NextRequest) {
  try {
    const { provider } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }
    
    apiKeys.delete(provider);
    
    return NextResponse.json({ 
      success: true,
      provider,
      hasKey: false 
    });
    
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// Export for use in chat route
export { apiKeys };
