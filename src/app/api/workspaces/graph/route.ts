import { NextRequest, NextResponse } from 'next/server';
import { folders, edges, embeddings, workspaces } from '../route';

// GET - Get workspace graph for visualization
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  // Get all nodes (folders/files) in workspace
  const nodes = Array.from(folders.values())
    .filter(f => f.workspaceId === workspaceId)
    .map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      path: f.path,
      hasEmbedding: !!f.embedding,
      parent: f.parentId,
    }));

  // Get all edges in workspace
  const workspaceEdges = Array.from(edges.values())
    .filter(e => {
      const source = folders.get(e.sourceId);
      const target = folders.get(e.targetId);
      return source?.workspaceId === workspaceId && target?.workspaceId === workspaceId;
    })
    .map(e => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: e.relationType,
      weight: e.weight,
    }));

  // Calculate graph statistics
  const stats = {
    nodes: nodes.length,
    edges: workspaceEdges.length,
    files: nodes.filter(n => n.type === 'file').length,
    folders: nodes.filter(n => n.type === 'folder').length,
    embedded: nodes.filter(n => n.hasEmbedding).length,
    maxDepth: Math.max(...nodes.map(n => n.path.split('/').length - 1), 0),
  };

  return NextResponse.json({
    nodes,
    edges: workspaceEdges,
    stats,
  });
}

// POST - Create edge between nodes (for references, dependencies)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sourceId, targetId, relationType, weight } = data;

    if (!sourceId || !targetId || !relationType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify both nodes exist
    if (!folders.has(sourceId) || !folders.has(targetId)) {
      return NextResponse.json({ error: 'Source or target not found' }, { status: 404 });
    }

    const generateId = () => Math.random().toString(36).substring(2, 15);
    const id = `edge_${generateId()}`;

    const edge = {
      id,
      sourceId,
      targetId,
      relationType,
      weight: weight || 1.0,
      createdAt: Date.now(),
    };

    edges.set(id, edge);

    return NextResponse.json({ edge, success: true });
  } catch (error) {
    console.error('Error creating edge:', error);
    return NextResponse.json({ error: 'Failed to create edge' }, { status: 500 });
  }
}

// DELETE - Delete edge
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !edges.has(id)) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    edges.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting edge:', error);
    return NextResponse.json({ error: 'Failed to delete edge' }, { status: 500 });
  }
}
