import { NextRequest, NextResponse } from 'next/server';
import { folders, embeddings, workspaces } from '../route';

// GET - Get indexing status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const workspace = workspaces.get(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Get embedding stats
  const workspaceFolders = Array.from(folders.values())
    .filter(f => f.workspaceId === workspaceId);

  const embeddingStats = {
    total: workspaceFolders.length,
    embedded: workspaceFolders.filter(f => !!f.embedding).length,
    pending: workspaceFolders.filter(f => !f.embedding && f.type === 'file').length,
  };

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      embeddingProvider: workspace.embeddingProvider,
      embeddingModel: workspace.embeddingModel,
    },
    stats: embeddingStats,
  });
}

// POST - Index workspace content (generate embeddings)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { workspaceId, forceReindex } = data;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get all files in workspace
    const workspaceFolders = Array.from(folders.values())
      .filter(f => f.workspaceId === workspaceId && f.type === 'file');

    // Filter to files that need embedding
    const toIndex = forceReindex 
      ? workspaceFolders 
      : workspaceFolders.filter(f => !f.embedding);

    if (toIndex.length === 0) {
      return NextResponse.json({ 
        message: 'No files to index',
        indexed: 0,
      });
    }

    // Generate embeddings for each file
    const results = [];
    for (const folder of toIndex) {
      if (!folder.content) continue;

      try {
        // Call embedding API
        const embResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: workspace.embeddingProvider,
            model: workspace.embeddingModel,
            text: folder.content,
          }),
        });

        if (embResponse.ok) {
          const embData = await embResponse.json();
          
          if (embData.embeddings && embData.embeddings[0]) {
            // Store embedding
            folder.embedding = embData.embeddings[0];
            folder.embeddingModel = workspace.embeddingModel;
            folders.set(folder.id, folder);

            // Store in embeddings map
            embeddings.set(folder.id, {
              id: `emb_${folder.id}`,
              itemId: folder.id,
              embedding: embData.embeddings[0],
              model: workspace.embeddingModel,
              provider: workspace.embeddingProvider,
            });

            results.push({
              id: folder.id,
              name: folder.name,
              success: true,
              dimensions: embData.dimensions,
            });
          }
        } else {
          results.push({
            id: folder.id,
            name: folder.name,
            success: false,
            error: 'Failed to generate embedding',
          });
        }
      } catch (error) {
        results.push({
          id: folder.id,
          name: folder.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update workspace stats
    workspace.stats.totalEmbeddings = Array.from(folders.values())
      .filter(f => f.workspaceId === workspaceId && !!f.embedding).length;
    workspace.stats.lastIndexed = Date.now();
    workspaces.set(workspaceId, workspace);

    return NextResponse.json({
      indexed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Error indexing workspace:', error);
    return NextResponse.json({ error: 'Failed to index workspace' }, { status: 500 });
  }
}

// POST with search action - Semantic search in workspace
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { workspaceId, query, limit } = data;

    if (!workspaceId || !query) {
      return NextResponse.json({ error: 'workspaceId and query are required' }, { status: 400 });
    }

    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Generate embedding for query
    const embResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: workspace.embeddingProvider,
        model: workspace.embeddingModel,
        text: query,
      }),
    });

    if (!embResponse.ok) {
      return NextResponse.json({ error: 'Failed to generate query embedding' }, { status: 500 });
    }

    const embData = await embResponse.json();
    const queryEmbedding = embData.embeddings[0];

    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Failed to generate query embedding' }, { status: 500 });
    }

    // Calculate cosine similarity with all embeddings
    const results: Array<{ folder: any; similarity: number }> = [];
    
    for (const folder of folders.values()) {
      if (folder.workspaceId !== workspaceId || !folder.embedding) continue;

      const similarity = cosineSimilarity(queryEmbedding, folder.embedding);
      
      if (similarity >= workspace.settings.similarityThreshold) {
        results.push({
          folder: {
            id: folder.id,
            name: folder.name,
            path: folder.path,
            type: folder.type,
          },
          similarity,
        });
      }
    }

    // Sort by similarity and limit
    results.sort((a, b) => b.similarity - a.similarity);
    const limitedResults = results.slice(0, limit || 10);

    return NextResponse.json({
      query,
      results: limitedResults,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching workspace:', error);
    return NextResponse.json({ error: 'Failed to search workspace' }, { status: 500 });
  }
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
