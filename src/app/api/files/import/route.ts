import { NextRequest, NextResponse } from 'next/server';
import { workspaces, folders, embeddings } from '../../workspaces/route';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// File type handlers
const FILE_HANDLERS: Record<string, { 
  extract: (buffer: Buffer, filename: string) => Promise<string>;
  mimeType: string;
}> = {
  // Text files
  '.txt': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.md': {
    mimeType: 'text/markdown',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.json': {
    mimeType: 'application/json',
    extract: async (buffer) => {
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        return JSON.stringify(json, null, 2);
      } catch {
        return buffer.toString('utf-8');
      }
    },
  },
  '.csv': {
    mimeType: 'text/csv',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.xml': {
    mimeType: 'application/xml',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.yaml': {
    mimeType: 'application/x-yaml',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.yml': {
    mimeType: 'application/x-yaml',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.html': {
    mimeType: 'text/html',
    extract: async (buffer) => {
      const html = buffer.toString('utf-8');
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    },
  },
  '.htm': {
    mimeType: 'text/html',
    extract: async (buffer) => {
      const html = buffer.toString('utf-8');
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    },
  },
  '.log': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.sql': {
    mimeType: 'application/sql',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.js': {
    mimeType: 'application/javascript',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.ts': {
    mimeType: 'application/typescript',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.jsx': {
    mimeType: 'application/javascript',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.tsx': {
    mimeType: 'application/typescript',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.py': {
    mimeType: 'text/x-python',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.java': {
    mimeType: 'text/x-java',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.c': {
    mimeType: 'text/x-c',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.cpp': {
    mimeType: 'text/x-c++',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.h': {
    mimeType: 'text/x-c',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.css': {
    mimeType: 'text/css',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.scss': {
    mimeType: 'text/x-scss',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.less': {
    mimeType: 'text/x-less',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.sh': {
    mimeType: 'application/x-sh',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.bash': {
    mimeType: 'application/x-sh',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.ps1': {
    mimeType: 'application/x-powershell',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.bat': {
    mimeType: 'application/x-msdos-program',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.env': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.ini': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.conf': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.config': {
    mimeType: 'text/plain',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.toml': {
    mimeType: 'application/toml',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.go': {
    mimeType: 'text/x-go',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.rs': {
    mimeType: 'text/x-rust',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.rb': {
    mimeType: 'text/x-ruby',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.php': {
    mimeType: 'text/x-php',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.swift': {
    mimeType: 'text/x-swift',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.kt': {
    mimeType: 'text/x-kotlin',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.scala': {
    mimeType: 'text/x-scala',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.r': {
    mimeType: 'text/x-r',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.lua': {
    mimeType: 'text/x-lua',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.pl': {
    mimeType: 'text/x-perl',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.vue': {
    mimeType: 'text/x-vue',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
  '.svelte': {
    mimeType: 'text/x-svelte',
    extract: async (buffer) => buffer.toString('utf-8'),
  },
};

// PDF text extraction (basic)
async function extractPdfText(buffer: Buffer): Promise<string> {
  const content = buffer.toString('latin1');
  const textMatches: string[] = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  
  while ((match = streamRegex.exec(content)) !== null) {
    const stream = match[1];
    const textContent = stream
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (textContent.length > 10) {
      textMatches.push(textContent);
    }
  }
  return textMatches.join('\n\n') || 'PDF content requires pdf-parse library for full extraction.';
}

// RTF text extraction
async function extractRtfText(buffer: Buffer): Promise<string> {
  const rtf = buffer.toString('utf-8');
  return rtf.replace(/\\[a-z]+\d* ?/gi, '').replace(/[{}\\]/g, '').replace(/\s+/g, ' ').trim();
}

// DOCX placeholder (needs mammoth library)
async function extractDocxText(buffer: Buffer): Promise<string> {
  return 'DOCX extraction requires mammoth library. Install: npm install mammoth';
}

// Register binary file handlers
FILE_HANDLERS['.pdf'] = { mimeType: 'application/pdf', extract: extractPdfText };
FILE_HANDLERS['.docx'] = { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extract: extractDocxText };
FILE_HANDLERS['.doc'] = { mimeType: 'application/msword', extract: extractDocxText };
FILE_HANDLERS['.rtf'] = { mimeType: 'application/rtf', extract: extractRtfText };

// POST - Import files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const workspaceId = formData.get('workspaceId') as string;
    const parentId = formData.get('parentId') as string;
    const autoIndex = formData.get('autoIndex') === 'true';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const workspace = workspaces.get(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const results: Array<{
      filename: string;
      success: boolean;
      id?: string;
      content?: string;
      error?: string;
      embedding?: boolean;
    }> = [];

    for (const file of files) {
      try {
        const filename = file.name;
        const ext = '.' + filename.split('.').pop()?.toLowerCase();
        const handler = FILE_HANDLERS[ext] || FILE_HANDLERS[ext.toLowerCase()];
        
        if (!handler) {
          results.push({ filename, success: false, error: `Unsupported file type: ${ext}` });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const content = await handler.extract(buffer, filename);

        let path = '/' + filename;
        if (parentId) {
          const parent = folders.get(parentId);
          if (parent) path = parent.path + '/' + filename;
        }

        const id = `file_${generateId()}`;
        const folderRecord: any = {
          id,
          workspaceId,
          parentId: parentId || undefined,
          name: filename,
          path,
          type: 'file',
          content,
          metadata: { originalName: filename, mimeType: handler.mimeType, size: file.size, importedAt: Date.now() },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        folders.set(id, folderRecord);

        let hasEmbedding = false;
        if (autoIndex && content && content.length > 0) {
          try {
            const embResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/embeddings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: workspace.embeddingProvider,
                model: workspace.embeddingModel,
                text: content.substring(0, 8000), // Limit content size for embedding
              }),
            });

            if (embResponse.ok) {
              const embData = await embResponse.json();
              if (embData.embeddings && embData.embeddings[0]) {
                folderRecord.embedding = embData.embeddings[0];
                folderRecord.embeddingModel = workspace.embeddingModel;
                folders.set(id, folderRecord);

                embeddings.set(id, {
                  id: `emb_${id}`,
                  itemId: id,
                  embedding: embData.embeddings[0],
                  model: workspace.embeddingModel,
                  provider: workspace.embeddingProvider,
                });
                hasEmbedding = true;
              }
            }
          } catch (embError) {
            console.error('Embedding error:', embError);
          }
        }

        results.push({
          filename,
          success: true,
          id,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          embedding: hasEmbedding,
        });

      } catch (error) {
        results.push({ filename: file.name, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    workspace.stats.totalFiles += results.filter(r => r.success).length;
    workspace.stats.totalEmbeddings += results.filter(r => r.success && r.embedding).length;
    workspace.updatedAt = Date.now();
    workspaces.set(workspaceId, workspace);

    return NextResponse.json({
      success: true,
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed' }, { status: 500 });
  }
}

// GET - List supported file types
export async function GET() {
  const supportedTypes = Object.keys(FILE_HANDLERS).map(ext => ({
    extension: ext,
    mimeType: FILE_HANDLERS[ext].mimeType,
  }));

  return NextResponse.json({
    supportedTypes,
    count: supportedTypes.length,
    categories: {
      text: ['.txt', '.md', '.log', '.env', '.ini', '.conf', '.config'],
      code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.css', '.scss', '.less', '.sh', '.bash', '.ps1', '.bat', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r', '.lua', '.pl', '.vue', '.svelte'],
      data: ['.json', '.csv', '.xml', '.yaml', '.yml', '.toml', '.sql'],
      documents: ['.pdf', '.docx', '.doc', '.rtf', '.html', '.htm'],
    },
  });
}
