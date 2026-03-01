import Surreal from 'surrealdb';

// SurrealDB connection singleton
let db: Surreal | null = null;

export interface WorkspaceFolder {
  id: string;
  workspaceId: string;
  parentId?: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  content?: string;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceEmbedding {
  id: string;
  workspaceId: string;
  itemId: string;
  itemType: 'folder' | 'file' | 'workspace';
  embedding: number[];
  model: string;
  provider: string;
  dimensions: number;
  createdAt: Date;
}

export interface WorkspaceGraph {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: 'contains' | 'references' | 'similar' | 'depends_on';
  weight: number;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  settings: {
    autoIndex: boolean;
    indexDepth: number;
    similarityThreshold: number;
  };
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalEmbeddings: number;
    lastIndexed?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Initialize SurrealDB connection
export async function getSurrealDB(): Promise<Surreal> {
  if (db) return db;

  db = new Surreal();
  
  try {
    // Connect to SurrealDB (default local instance)
    await db.connect('http://127.0.0.1:8000/rpc');
    
    // Sign in as root user
    await db.signin({
      username: 'root',
      password: 'root',
    });
    
    // Use namespace and database
    await db.use({ ns: 'team_ai_hub', db: 'workspaces' });
    
    // Initialize schema
    await initializeSchema(db);
    
    console.log('SurrealDB connected successfully');
    return db;
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    // Return a mock db for development without SurrealDB running
    throw error;
  }
}

// Initialize database schema
async function initializeSchema(db: Surreal) {
  // Define tables and schemas
  await db.query(`
    -- Workspace table
    DEFINE TABLE workspace SCHEMAFULL;
    DEFINE FIELD name ON workspace TYPE string;
    DEFINE FIELD description ON workspace TYPE option<string>;
    DEFINE FIELD embedding_provider ON workspace TYPE string DEFAULT 'openai';
    DEFINE FIELD embedding_model ON workspace TYPE string DEFAULT 'text-embedding-3-small';
    DEFINE FIELD embedding_dimensions ON workspace TYPE int DEFAULT 1536;
    DEFINE FIELD settings ON workspace TYPE object DEFAULT {
      autoIndex: true,
      indexDepth: 3,
      similarityThreshold: 0.75
    };
    DEFINE FIELD stats ON workspace TYPE object DEFAULT {
      totalFiles: 0,
      totalFolders: 0,
      totalEmbeddings: 0
    };
    DEFINE FIELD created_at ON workspace TYPE datetime DEFAULT time::now();
    DEFINE FIELD updated_at ON workspace TYPE datetime DEFAULT time::now();
    
    -- Folder/File table
    DEFINE TABLE folder SCHEMAFULL;
    DEFINE FIELD workspace_id ON folder TYPE record<workspace>;
    DEFINE FIELD parent_id ON folder TYPE option<record<folder>>;
    DEFINE FIELD name ON folder TYPE string;
    DEFINE FIELD path ON folder TYPE string;
    DEFINE FIELD type ON folder TYPE string ASSERT $value IN ['folder', 'file'];
    DEFINE FIELD content ON folder TYPE option<string>;
    DEFINE FIELD embedding ON folder TYPE option<array<float>>;
    DEFINE FIELD embedding_model ON folder TYPE option<string>;
    DEFINE FIELD created_at ON folder TYPE datetime DEFAULT time::now();
    DEFINE FIELD updated_at ON folder TYPE datetime DEFAULT time::now();
    
    -- Embedding index table
    DEFINE TABLE embedding SCHEMAFULL;
    DEFINE FIELD workspace_id ON embedding TYPE record<workspace>;
    DEFINE FIELD item_id ON embedding TYPE record;
    DEFINE FIELD item_type ON embedding TYPE string;
    DEFINE FIELD embedding ON embedding TYPE array<float>;
    DEFINE FIELD model ON embedding TYPE string;
    DEFINE FIELD provider ON embedding TYPE string;
    DEFINE FIELD dimensions ON embedding TYPE int;
    DEFINE FIELD created_at ON embedding TYPE datetime DEFAULT time::now();
    
    -- Graph relations table
    DEFINE TABLE graph_edge SCHEMAFULL;
    DEFINE FIELD source_id ON graph_edge TYPE record;
    DEFINE FIELD target_id ON graph_edge TYPE record;
    DEFINE FIELD relation_type ON graph_edge TYPE string ASSERT $value IN ['contains', 'references', 'similar', 'depends_on'];
    DEFINE FIELD weight ON graph_edge TYPE float DEFAULT 1.0;
    DEFINE FIELD created_at ON graph_edge TYPE datetime DEFAULT time::now();
    
    -- Indexes for faster queries
    DEFINE INDEX workspace_name_idx ON workspace COLUMNS name;
    DEFINE INDEX folder_workspace_idx ON folder COLUMNS workspace_id;
    DEFINE INDEX folder_parent_idx ON folder COLUMNS parent_id;
    DEFINE INDEX folder_path_idx ON folder COLUMNS path;
    DEFINE INDEX embedding_workspace_idx ON embedding COLUMNS workspace_id;
    DEFINE INDEX embedding_item_idx ON embedding COLUMNS item_id;
    DEFINE INDEX graph_source_idx ON graph_edge COLUMNS source_id;
    DEFINE INDEX graph_target_idx ON graph_edge COLUMNS target_id;
  `);
}

// Workspace CRUD operations
export const WorkspaceDB = {
  // Create a new workspace
  async create(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Workspace> {
    const db = await getSurrealDB();
    const result = await db.create('workspace', {
      ...data,
      stats: {
        totalFiles: 0,
        totalFolders: 0,
        totalEmbeddings: 0,
      },
      created_at: new Date(),
      updated_at: new Date(),
    });
    return result[0] as unknown as Workspace;
  },

  // Get all workspaces
  async getAll(): Promise<Workspace[]> {
    const db = await getSurrealDB();
    const result = await db.select('workspace');
    return result as unknown as Workspace[];
  },

  // Get workspace by ID
  async getById(id: string): Promise<Workspace | null> {
    const db = await getSurrealDB();
    try {
      const result = await db.select(id);
      return result[0] as unknown as Workspace;
    } catch {
      return null;
    }
  },

  // Update workspace
  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    const db = await getSurrealDB();
    const result = await db.merge(id, {
      ...data,
      updated_at: new Date(),
    });
    return result[0] as unknown as Workspace;
  },

  // Delete workspace and all related data
  async delete(id: string): Promise<boolean> {
    const db = await getSurrealDB();
    try {
      // Delete all folders in workspace
      await db.query(`
        DELETE FROM folder WHERE workspace_id = $workspace_id;
        DELETE FROM embedding WHERE workspace_id = $workspace_id;
        DELETE FROM graph_edge WHERE source_id IN (SELECT id FROM folder WHERE workspace_id = $workspace_id) 
          OR target_id IN (SELECT id FROM folder WHERE workspace_id = $workspace_id);
        DELETE FROM $workspace_id;
      `, { workspace_id: id });
      return true;
    } catch {
      return false;
    }
  },

  // Folder operations
  async createFolder(data: Omit<WorkspaceFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceFolder> {
    const db = await getSurrealDB();
    const result = await db.create('folder', {
      workspace_id: data.workspaceId,
      parent_id: data.parentId,
      name: data.name,
      path: data.path,
      type: data.type,
      content: data.content,
      embedding: data.embedding,
      embedding_model: data.embeddingModel,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    // Update workspace stats
    await this.updateStats(data.workspaceId);
    
    return result[0] as unknown as WorkspaceFolder;
  },

  async getFolders(workspaceId: string, parentId?: string): Promise<WorkspaceFolder[]> {
    const db = await getSurrealDB();
    const query = parentId 
      ? 'SELECT * FROM folder WHERE workspace_id = $workspace_id AND parent_id = $parent_id'
      : 'SELECT * FROM folder WHERE workspace_id = $workspace_id AND parent_id = NONE';
    
    const result = await db.query(query, { 
      workspace_id: workspaceId,
      parent_id: parentId,
    });
    return result[0] as unknown as WorkspaceFolder[];
  },

  async getFolderTree(workspaceId: string): Promise<WorkspaceFolder[]> {
    const db = await getSurrealDB();
    const result = await db.query(
      'SELECT * FROM folder WHERE workspace_id = $workspace_id ORDER BY path',
      { workspace_id: workspaceId }
    );
    return result[0] as unknown as WorkspaceFolder[];
  },

  async updateFolder(id: string, data: Partial<WorkspaceFolder>): Promise<WorkspaceFolder | null> {
    const db = await getSurrealDB();
    const result = await db.merge(id, {
      ...data,
      updated_at: new Date(),
    });
    return result[0] as unknown as WorkspaceFolder;
  },

  async deleteFolder(id: string): Promise<boolean> {
    const db = await getSurrealDB();
    try {
      // Get folder to find workspace_id for stats update
      const folder = await db.select(id);
      const workspaceId = (folder[0] as any)?.workspace_id;
      
      // Recursively delete all children
      await db.query(`
        LET $ids = (SELECT id FROM folder WHERE path STARTS WITH (SELECT path FROM $folder_id).path);
        DELETE FROM folder WHERE id IN $ids.id;
        DELETE FROM embedding WHERE item_id IN $ids.id;
        DELETE FROM graph_edge WHERE source_id IN $ids.id OR target_id IN $ids.id;
        DELETE FROM $folder_id;
      `, { folder_id: id });
      
      if (workspaceId) {
        await this.updateStats(workspaceId);
      }
      return true;
    } catch {
      return false;
    }
  },

  // Embedding operations
  async storeEmbedding(data: Omit<WorkspaceEmbedding, 'id' | 'createdAt'>): Promise<WorkspaceEmbedding> {
    const db = await getSurrealDB();
    const result = await db.create('embedding', {
      workspace_id: data.workspaceId,
      item_id: data.itemId,
      item_type: data.itemType,
      embedding: data.embedding,
      model: data.model,
      provider: data.provider,
      dimensions: data.dimensions,
      created_at: new Date(),
    });
    return result[0] as unknown as WorkspaceEmbedding;
  },

  async searchSimilar(workspaceId: string, queryEmbedding: number[], limit: number = 10): Promise<Array<{ item: WorkspaceFolder; similarity: number }>> {
    const db = await getSurrealDB();
    
    // Get all embeddings in workspace and compute cosine similarity
    const result = await db.query(`
      LET $embeddings = SELECT *, embedding FROM embedding WHERE workspace_id = $workspace_id;
      
      FOR $emb IN $embeddings {
        LET $similarity = vector::similarity::cosine($emb.embedding, $query_embedding);
        RETURN {
          item_id: $emb.item_id,
          similarity: $similarity
        };
      }
    `, { 
      workspace_id: workspaceId,
      query_embedding: queryEmbedding,
    });
    
    // Sort by similarity and get items
    const similarities = (result[0] as any[] || [])
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    const items: Array<{ item: WorkspaceFolder; similarity: number }> = [];
    for (const sim of similarities) {
      const item = await db.select(sim.item_id);
      if (item[0]) {
        items.push({
          item: item[0] as unknown as WorkspaceFolder,
          similarity: sim.similarity,
        });
      }
    }
    
    return items;
  },

  // Graph operations
  async createEdge(data: Omit<WorkspaceGraph, 'id' | 'createdAt'>): Promise<WorkspaceGraph> {
    const db = await getSurrealDB();
    const result = await db.create('graph_edge', {
      source_id: data.sourceId,
      target_id: data.targetId,
      relation_type: data.relationType,
      weight: data.weight,
      created_at: new Date(),
    });
    return result[0] as unknown as WorkspaceGraph;
  },

  async getGraph(workspaceId: string): Promise<{ nodes: any[]; edges: WorkspaceGraph[] }> {
    const db = await getSurrealDB();
    
    const nodes = await db.query(
      'SELECT * FROM folder WHERE workspace_id = $workspace_id',
      { workspace_id: workspaceId }
    );
    
    const edges = await db.query(`
      SELECT * FROM graph_edge 
      WHERE source_id IN (SELECT id FROM folder WHERE workspace_id = $workspace_id)
    `, { workspace_id: workspaceId });
    
    return {
      nodes: nodes[0] as any[],
      edges: edges[0] as unknown as WorkspaceGraph[],
    };
  },

  // Stats
  async updateStats(workspaceId: string): Promise<void> {
    const db = await getSurrealDB();
    await db.query(`
      UPDATE $workspace_id MERGE {
        stats: {
          totalFiles: (SELECT count() FROM folder WHERE workspace_id = $workspace_id AND type = 'file')[0].count,
          totalFolders: (SELECT count() FROM folder WHERE workspace_id = $workspace_id AND type = 'folder')[0].count,
          totalEmbeddings: (SELECT count() FROM embedding WHERE workspace_id = $workspace_id)[0].count
        }
      }
    `, { workspace_id: workspaceId });
  },
};

export default getSurrealDB;
