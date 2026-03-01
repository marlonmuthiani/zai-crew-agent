import { NextRequest, NextResponse } from 'next/server';
import { workspaces, embeddings } from '../workspaces/route';

// Session storage for team conversations
// Sessions can be indexed for search within workspaces

interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  memberId?: string;
  memberName?: string;
  agentProvider?: string;
  agentModel?: string;
  embedding?: number[];
  createdAt: number;
}

interface Session {
  id: string;
  workspaceId?: string; // Optional - for workspace-linked sessions
  teamId?: string;
  title: string;
  participants: string[];
  settings: {
    autoIndex: boolean;
    embeddingProvider?: string;
    embeddingModel?: string;
  };
  stats: {
    messageCount: number;
    totalTokens?: number;
  };
  createdAt: number;
  updatedAt: number;
}

// In-memory storage
const sessions = new Map<string, Session>();
const sessionMessages = new Map<string, SessionMessage[]>();

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// GET - Get sessions or session details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const workspaceId = searchParams.get('workspaceId');
  const teamId = searchParams.get('teamId');

  if (sessionId) {
    // Get specific session with messages
    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = sessionMessages.get(sessionId) || [];
    return NextResponse.json({ session, messages });
  }

  // List sessions
  let sessionList = Array.from(sessions.values());

  if (workspaceId) {
    sessionList = sessionList.filter(s => s.workspaceId === workspaceId);
  }

  if (teamId) {
    sessionList = sessionList.filter(s => s.teamId === teamId);
  }

  return NextResponse.json({ sessions: sessionList });
}

// POST - Create session or add message
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, sessionId, workspaceId, teamId, title, autoIndex, message, embeddingProvider, embeddingModel } = data;

    if (action === 'create' || !action) {
      // Create new session
      const id = `session_${generateId()}`;
      const session: Session = {
        id,
        workspaceId,
        teamId,
        title: title || `Session ${new Date().toLocaleDateString()}`,
        participants: [],
        settings: {
          autoIndex: autoIndex ?? true,
          embeddingProvider,
          embeddingModel,
        },
        stats: {
          messageCount: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      sessions.set(id, session);
      sessionMessages.set(id, []);

      return NextResponse.json({ success: true, session });

    } else if (action === 'message') {
      // Add message to session
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const { role, content, memberId, memberName, agentProvider, agentModel } = message;

      if (!role || !content) {
        return NextResponse.json({ error: 'role and content are required' }, { status: 400 });
      }

      const id = `msg_${generateId()}`;
      const msg: SessionMessage = {
        id,
        sessionId,
        role,
        content,
        memberId,
        memberName,
        agentProvider,
        agentModel,
        createdAt: Date.now(),
      };

      // Auto-index if enabled and session has embedding config
      if (session.settings.autoIndex && session.settings.embeddingProvider && workspaceId) {
        try {
          const embResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: session.settings.embeddingProvider,
              model: session.settings.embeddingModel || 'text-embedding-3-small',
              text: content,
            }),
          });

          if (embResponse.ok) {
            const embData = await embResponse.json();
            if (embData.embeddings && embData.embeddings[0]) {
              msg.embedding = embData.embeddings[0];

              // Store in global embeddings for search
              embeddings.set(id, {
                id: `emb_${id}`,
                itemId: id,
                embedding: embData.embeddings[0],
                model: session.settings.embeddingModel || 'text-embedding-3-small',
                provider: session.settings.embeddingProvider,
              });
            }
          }
        } catch (embError) {
          console.error('Session message embedding error:', embError);
        }
      }

      const messages = sessionMessages.get(sessionId) || [];
      messages.push(msg);
      sessionMessages.set(sessionId, messages);

      // Update session stats
      session.stats.messageCount = messages.length;
      session.updatedAt = Date.now();
      if (memberId && !session.participants.includes(memberId)) {
        session.participants.push(memberId);
      }
      sessions.set(sessionId, session);

      return NextResponse.json({ success: true, message: msg });

    } else if (action === 'index') {
      // Index all messages in session
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (!session.settings.embeddingProvider) {
        return NextResponse.json({ error: 'Session has no embedding provider configured' }, { status: 400 });
      }

      const messages = sessionMessages.get(sessionId) || [];
      const results: Array<{ id: string; success: boolean }> = [];

      for (const msg of messages) {
        if (msg.embedding) continue; // Already indexed

        try {
          const embResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: session.settings.embeddingProvider,
              model: session.settings.embeddingModel || 'text-embedding-3-small',
              text: msg.content,
            }),
          });

          if (embResponse.ok) {
            const embData = await embResponse.json();
            if (embData.embeddings && embData.embeddings[0]) {
              msg.embedding = embData.embeddings[0];
              embeddings.set(msg.id, {
                id: `emb_${msg.id}`,
                itemId: msg.id,
                embedding: embData.embeddings[0],
                model: session.settings.embeddingModel || 'text-embedding-3-small',
                provider: session.settings.embeddingProvider,
              });
              results.push({ id: msg.id, success: true });
            }
          } else {
            results.push({ id: msg.id, success: false });
          }
        } catch {
          results.push({ id: msg.id, success: false });
        }
      }

      sessionMessages.set(sessionId, messages);

      return NextResponse.json({
        success: true,
        indexed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// PUT - Update session or search sessions
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, sessionId, updates, query, workspaceId } = data;

    if (action === 'update' && sessionId) {
      // Update session settings
      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const updated = {
        ...session,
        ...updates,
        updatedAt: Date.now(),
      };
      sessions.set(sessionId, updated);

      return NextResponse.json({ success: true, session: updated });

    } else if (action === 'search') {
      // Search sessions by content
      if (!query || !workspaceId) {
        return NextResponse.json({ error: 'query and workspaceId are required' }, { status: 400 });
      }

      const workspace = workspaces.get(workspaceId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      // Generate query embedding
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

      // Search through all session messages
      const results: Array<{
        sessionId: string;
        sessionTitle: string;
        message: SessionMessage;
        similarity: number;
      }> = [];

      for (const [sid, msgs] of sessionMessages.entries()) {
        const sess = sessions.get(sid);
        if (!sess || sess.workspaceId !== workspaceId) continue;

        for (const msg of msgs) {
          if (!msg.embedding) continue;

          const similarity = cosineSimilarity(queryEmbedding, msg.embedding);
          if (similarity >= workspace.settings.similarityThreshold) {
            results.push({
              sessionId: sid,
              sessionTitle: sess.title,
              message: msg,
              similarity,
            });
          }
        }
      }

      results.sort((a, b) => b.similarity - a.similarity);

      return NextResponse.json({
        query,
        results: results.slice(0, 20),
        total: results.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE - Delete session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Delete associated embeddings
    const messages = sessionMessages.get(sessionId) || [];
    for (const msg of messages) {
      embeddings.delete(msg.id);
    }

    sessionMessages.delete(sessionId);
    sessions.delete(sessionId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

// Cosine similarity
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
