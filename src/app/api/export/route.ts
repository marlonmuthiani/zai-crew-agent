import { NextRequest, NextResponse } from 'next/server';
import { workspaces, folders, edges, embeddings } from '../workspaces/route';

// GET - Export index database
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const format = searchParams.get('format') || 'json';
  const includeEmbeddings = searchParams.get('includeEmbeddings') === 'true';

  try {
    let exportData: any = {};

    if (workspaceId) {
      // Export specific workspace
      const workspace = workspaces.get(workspaceId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      const workspaceFolders = Array.from(folders.values()).filter(f => f.workspaceId === workspaceId);
      const workspaceEdges = Array.from(edges.values()).filter(e => 
        workspaceFolders.some(f => f.id === e.sourceId || f.id === e.targetId)
      );
      const workspaceEmbeddings = includeEmbeddings 
        ? Array.from(embeddings.values()).filter(e => workspaceFolders.some(f => f.id === e.itemId))
        : [];

      exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          embeddingProvider: workspace.embeddingProvider,
          embeddingModel: workspace.embeddingModel,
          settings: workspace.settings,
          stats: workspace.stats,
        },
        folders: workspaceFolders.map(f => ({
          id: f.id,
          parentId: f.parentId,
          name: f.name,
          path: f.path,
          type: f.type,
          content: f.content,
          metadata: (f as any).metadata,
          embedding: includeEmbeddings ? f.embedding : undefined,
          embeddingModel: f.embeddingModel,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
        edges: workspaceEdges,
        embeddings: workspaceEmbeddings,
      };

    } else {
      // Export all workspaces
      exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        workspaces: Array.from(workspaces.values()).map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          embeddingProvider: w.embeddingProvider,
          embeddingModel: w.embeddingModel,
          settings: w.settings,
          stats: w.stats,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
        folders: Array.from(folders.values()).map(f => ({
          id: f.id,
          workspaceId: f.workspaceId,
          parentId: f.parentId,
          name: f.name,
          path: f.path,
          type: f.type,
          content: f.content,
          metadata: (f as any).metadata,
          embedding: includeEmbeddings ? f.embedding : undefined,
          embeddingModel: f.embeddingModel,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
        edges: Array.from(edges.values()),
        embeddings: includeEmbeddings ? Array.from(embeddings.values()) : [],
      };
    }

    if (format === 'json') {
      const jsonStr = JSON.stringify(exportData, null, 2);
      return new NextResponse(jsonStr, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="index-export-${Date.now()}.json"`,
        },
      });
    }

    if (format === 'summary') {
      // Return summary without full data
      const summary = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        stats: {
          workspaces: exportData.workspaces?.length || 1,
          folders: exportData.folders?.length || 0,
          edges: exportData.edges?.length || 0,
          embeddings: exportData.embeddings?.length || 0,
          totalSize: JSON.stringify(exportData).length,
        },
      };
      return NextResponse.json(summary);
    }

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// POST - Import index database
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.version || !data.folders) {
      return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
    }

    let imported = {
      workspaces: 0,
      folders: 0,
      edges: 0,
      embeddings: 0,
    };

    // Import workspaces
    if (data.workspaces) {
      for (const ws of data.workspaces) {
        if (!workspaces.has(ws.id)) {
          workspaces.set(ws.id, ws);
          imported.workspaces++;
        }
      }
    } else if (data.workspace) {
      if (!workspaces.has(data.workspace.id)) {
        workspaces.set(data.workspace.id, data.workspace);
        imported.workspaces++;
      }
    }

    // Import folders
    for (const folder of data.folders) {
      if (!folders.has(folder.id)) {
        folders.set(folder.id, folder);
        imported.folders++;
      }
    }

    // Import edges
    if (data.edges) {
      for (const edge of data.edges) {
        if (!edges.has(edge.id)) {
          edges.set(edge.id, edge);
          imported.edges++;
        }
      }
    }

    // Import embeddings
    if (data.embeddings) {
      for (const emb of data.embeddings) {
        if (!embeddings.has(emb.id)) {
          embeddings.set(emb.id, emb);
          imported.embeddings++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Imported ${imported.workspaces} workspaces, ${imported.folders} folders, ${imported.edges} edges, ${imported.embeddings} embeddings`,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
