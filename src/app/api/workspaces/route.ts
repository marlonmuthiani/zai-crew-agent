import { NextRequest, NextResponse } from 'next/server';

// Workspace API - uses in-memory storage for development
// In production, use SurrealDB for persistence

interface WorkspaceFolder {
  id: string;
  workspaceId: string;
  parentId?: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  content?: string;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: number;
  updatedAt: number;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  teamId?: string; // Associated team
  indexType: 'global' | 'local'; // Global = shared across team, Local = private to creator
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  settings: {
    autoIndex: boolean;
    indexDepth: number;
    similarityThreshold: number;
    indexSessions: boolean; // Whether to index team chat sessions
    indexFiles: boolean; // Whether to index imported files
  };
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalEmbeddings: number;
    totalSessions: number;
    lastIndexed?: number;
  };
  access: {
    ownerId: string;
    sharedWith: string[];
    isPublic: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: 'contains' | 'references' | 'similar' | 'depends_on';
  weight: number;
  createdAt: number;
}

// In-memory storage (use SurrealDB in production)
const workspaces = new Map<string, Workspace>();
const folders = new Map<string, WorkspaceFolder>();
const edges = new Map<string, GraphEdge>();
const embeddings = new Map<string, { id: string; itemId: string; embedding: number[]; model: string; provider: string }>();

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// GET - List all workspaces
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');
  const indexType = searchParams.get('indexType');

  let workspaceList = Array.from(workspaces.values());

  // Filter by team
  if (teamId) {
    workspaceList = workspaceList.filter(w => w.teamId === teamId);
  }

  // Filter by user access
  if (userId) {
    workspaceList = workspaceList.filter(w => 
      w.access.ownerId === userId || 
      w.access.sharedWith.includes(userId) ||
      w.access.isPublic ||
      (w.indexType === 'global' && w.teamId) // Global workspaces accessible to team members
    );
  }

  // Filter by index type
  if (indexType) {
    workspaceList = workspaceList.filter(w => w.indexType === indexType);
  }

  return NextResponse.json({ workspaces: workspaceList });
}

// POST - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      name, 
      description, 
      teamId,
      indexType,
      embeddingProvider, 
      embeddingModel, 
      embeddingDimensions, 
      settings,
      ownerId,
      isPublic,
    } = data;

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const id = `workspace_${generateId()}`;
    const workspace: Workspace = {
      id,
      name,
      description,
      teamId,
      indexType: indexType || 'local',
      embeddingProvider: embeddingProvider || 'openai',
      embeddingModel: embeddingModel || 'text-embedding-3-small',
      embeddingDimensions: embeddingDimensions || 1536,
      settings: {
        autoIndex: settings?.autoIndex ?? true,
        indexDepth: settings?.indexDepth ?? 3,
        similarityThreshold: settings?.similarityThreshold ?? 0.75,
        indexSessions: settings?.indexSessions ?? true,
        indexFiles: settings?.indexFiles ?? true,
      },
      stats: {
        totalFiles: 0,
        totalFolders: 0,
        totalEmbeddings: 0,
        totalSessions: 0,
      },
      access: {
        ownerId: ownerId || 'default_user',
        sharedWith: [],
        isPublic: isPublic ?? false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    workspaces.set(id, workspace);

    // Create root folder
    const rootFolder: WorkspaceFolder = {
      id: `folder_${generateId()}`,
      workspaceId: id,
      name: 'root',
      path: '/',
      type: 'folder',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    folders.set(rootFolder.id, rootFolder);

    return NextResponse.json({ workspace, success: true });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}

// PUT - Update workspace
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, action, userId, ...updates } = data;

    if (!id || !workspaces.has(id)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const workspace = workspaces.get(id)!;

    if (action === 'share') {
      // Share workspace with user
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for share action' }, { status: 400 });
      }
      
      if (!workspace.access.sharedWith.includes(userId)) {
        workspace.access.sharedWith.push(userId);
      }
      
      workspace.updatedAt = Date.now();
      workspaces.set(id, workspace);
      
      return NextResponse.json({ workspace, success: true });
    }

    if (action === 'unshare') {
      // Remove user access
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for unshare action' }, { status: 400 });
      }
      
      workspace.access.sharedWith = workspace.access.sharedWith.filter(u => u !== userId);
      workspace.updatedAt = Date.now();
      workspaces.set(id, workspace);
      
      return NextResponse.json({ workspace, success: true });
    }

    // Default update
    const updated = {
      ...workspace,
      ...updates,
      updatedAt: Date.now(),
    };
    workspaces.set(id, updated);

    return NextResponse.json({ workspace: updated, success: true });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE - Delete workspace
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !workspaces.has(id)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Delete all folders and embeddings
    for (const [folderId, folder] of folders.entries()) {
      if (folder.workspaceId === id) {
        folders.delete(folderId);
        embeddings.delete(folderId);
      }
    }

    // Delete all edges
    for (const [edgeId, edge] of edges.entries()) {
      if (folders.has(edge.sourceId) || folders.has(edge.targetId)) {
        edges.delete(edgeId);
      }
    }

    workspaces.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}

// Export storage for use in other routes
export { workspaces, folders, edges, embeddings };
