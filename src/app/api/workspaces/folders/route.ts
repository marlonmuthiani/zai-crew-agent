import { NextRequest, NextResponse } from 'next/server';
import { workspaces, folders, edges, embeddings } from '../route';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// GET - Get folders in workspace
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const parentId = searchParams.get('parentId');
  const getTree = searchParams.get('tree') === 'true';

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  if (getTree) {
    // Return full tree
    const folderList = Array.from(folders.values())
      .filter(f => f.workspaceId === workspaceId)
      .sort((a, b) => a.path.localeCompare(b.path));
    return NextResponse.json({ folders: folderList });
  }

  // Return folders by parent
  const folderList = Array.from(folders.values())
    .filter(f => {
      if (f.workspaceId !== workspaceId) return false;
      if (parentId === 'null' || parentId === null) {
        return !f.parentId;
      }
      return f.parentId === parentId;
    });

  return NextResponse.json({ folders: folderList });
}

// POST - Create folder or file
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { workspaceId, parentId, name, type, content } = data;

    if (!workspaceId || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get workspace
    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Build path
    let path = '/' + name;
    if (parentId) {
      const parent = folders.get(parentId);
      if (parent) {
        path = parent.path + '/' + name;
      }
    }

    const id = `folder_${generateId()}`;
    const folder = {
      id,
      workspaceId,
      parentId: parentId || undefined,
      name,
      path,
      type: type as 'folder' | 'file',
      content: content || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    folders.set(id, folder);

    // Create edge for parent relationship
    if (parentId) {
      const edgeId = `edge_${generateId()}`;
      edges.set(edgeId, {
        id: edgeId,
        sourceId: parentId,
        targetId: id,
        relationType: 'contains',
        weight: 1.0,
        createdAt: Date.now(),
      });
    }

    // Update workspace stats
    if (type === 'folder') {
      workspace.stats.totalFolders++;
    } else {
      workspace.stats.totalFiles++;
    }
    workspace.updatedAt = Date.now();
    workspaces.set(workspaceId, workspace);

    return NextResponse.json({ folder, success: true });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

// PUT - Update folder
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id || !folders.has(id)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folder = folders.get(id)!;
    const updated = {
      ...folder,
      ...updates,
      updatedAt: Date.now(),
    };
    folders.set(id, updated);

    // Update workspace stats
    const workspace = workspaces.get(folder.workspaceId);
    if (workspace) {
      workspace.updatedAt = Date.now();
      workspaces.set(workspace.id, workspace);
    }

    return NextResponse.json({ folder: updated, success: true });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// DELETE - Delete folder
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !folders.has(id)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folder = folders.get(id)!;
    const workspace = workspaces.get(folder.workspaceId);

    // Recursively delete children
    const deleteRecursive = (folderId: string) => {
      const children = Array.from(folders.values()).filter(f => f.parentId === folderId);
      for (const child of children) {
        deleteRecursive(child.id);
      }
      
      // Delete embeddings
      embeddings.delete(folderId);
      
      // Delete edges
      for (const [edgeId, edge] of edges.entries()) {
        if (edge.sourceId === folderId || edge.targetId === folderId) {
          edges.delete(edgeId);
        }
      }
      
      const f = folders.get(folderId);
      folders.delete(folderId);
      
      // Update stats
      if (workspace && f) {
        if (f.type === 'folder') workspace.stats.totalFolders--;
        else workspace.stats.totalFiles--;
      }
    };

    deleteRecursive(id);

    if (workspace) {
      workspace.updatedAt = Date.now();
      workspaces.set(workspace.id, workspace);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
