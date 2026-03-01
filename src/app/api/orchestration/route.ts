import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for orchestration (in production, use SurrealDB)
const orchestrationState: {
  sessions: Map<string, any>;
  communications: any[];
} = {
  sessions: new Map(),
  communications: [],
};

// ============================================
// ORCHESTRATION ENDPOINTS
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  switch (action) {
    case 'sessions':
      return NextResponse.json({
        sessions: Array.from(orchestrationState.sessions.values()),
      });
      
    case 'communications':
      const agentId = searchParams.get('agentId');
      const comms = agentId
        ? orchestrationState.communications.filter(
            (c) => c.fromAgentId === agentId || c.toAgentId === agentId
          )
        : orchestrationState.communications;
      return NextResponse.json({ communications: comms });
      
    case 'status':
      const sessionId = searchParams.get('sessionId');
      if (sessionId) {
        const session = orchestrationState.sessions.get(sessionId);
        return NextResponse.json({ session });
      }
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
      
    default:
      return NextResponse.json({
        status: 'ok',
        activeSessions: orchestrationState.sessions.size,
        totalCommunications: orchestrationState.communications.length,
      });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;
  
  switch (action) {
    // ============================================
    // START ORCHESTRATION SESSION
    // ============================================
    case 'start_orchestration': {
      const { mainAgentId, beanId, subagentIds } = body;
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const session = {
        id: sessionId,
        mainAgentId,
        beanId,
        subagentIds: subagentIds || [],
        status: 'running',
        startedAt: Date.now(),
        subagentExecutions: [],
        communications: [],
        result: null,
      };
      
      orchestrationState.sessions.set(sessionId, session);
      
      return NextResponse.json({
        success: true,
        sessionId,
        message: 'Orchestration session started',
        session,
      });
    }
    
    // ============================================
    // AGENT COMMUNICATION
    // ============================================
    case 'communicate': {
      const { fromAgentId, toAgentId, messageType, content } = body;
      
      const communication = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        fromAgentId,
        toAgentId,
        messageType: messageType || 'message',
        content,
        timestamp: Date.now(),
        status: 'delivered',
      };
      
      orchestrationState.communications.push(communication);
      
      if (orchestrationState.communications.length > 1000) {
        orchestrationState.communications = orchestrationState.communications.slice(-1000);
      }
      
      return NextResponse.json({
        success: true,
        communication,
      });
    }
    
    // ============================================
    // DELEGATE TASK TO SUBAGENT
    // ============================================
    case 'delegate_task': {
      const { sessionId, subagentId, task, context } = body;
      
      const session = orchestrationState.sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      
      const execution = {
        id: `exec_${Date.now()}`,
        subagentId,
        task,
        context,
        status: 'pending',
        startedAt: Date.now(),
        result: null,
      };
      
      session.subagentExecutions.push(execution);
      
      orchestrationState.communications.push({
        id: `comm_${Date.now()}`,
        fromAgentId: session.mainAgentId,
        toAgentId: subagentId,
        messageType: 'task',
        content: JSON.stringify({ task, context }),
        timestamp: Date.now(),
        status: 'delivered',
      });
      
      return NextResponse.json({
        success: true,
        execution,
        message: 'Task delegated to subagent',
      });
    }
    
    // ============================================
    // REPORT SUBAGENT RESULT
    // ============================================
    case 'report_result': {
      const { sessionId, executionId, subagentId, result, status } = body;
      
      const session = orchestrationState.sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      
      const execution = session.subagentExecutions.find((e: any) => e.id === executionId);
      if (!execution) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
      }
      
      execution.status = status || 'completed';
      execution.result = result;
      execution.completedAt = Date.now();
      
      orchestrationState.communications.push({
        id: `comm_${Date.now()}`,
        fromAgentId: subagentId,
        toAgentId: session.mainAgentId,
        messageType: 'response',
        content: JSON.stringify({ result, status }),
        timestamp: Date.now(),
        status: 'delivered',
      });
      
      return NextResponse.json({
        success: true,
        execution,
        message: 'Result recorded',
      });
    }
    
    // ============================================
    // COMPLETE ORCHESTRATION
    // ============================================
    case 'complete_orchestration': {
      const { sessionId, result, status } = body;
      
      const session = orchestrationState.sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      
      session.status = status || 'completed';
      session.result = result;
      session.completedAt = Date.now();
      
      return NextResponse.json({
        success: true,
        session,
        message: 'Orchestration completed',
      });
    }
    
    // ============================================
    // ORCHESTRATED CHAT
    // ============================================
    case 'orchestrated_chat': {
      const { orchestrator, subagents, userMessage } = body;
      
      const orchestratorResponse = {
        id: `orch_${Date.now()}`,
        timestamp: Date.now(),
        orchestrator,
        analysis: {
          taskType: 'multi_step',
          requiredSubagents: subagents.map((s: any) => s.id),
          executionPlan: [
            { step: 1, agent: subagents[0]?.id, task: 'Process initial request' },
            { step: 2, agent: subagents[1]?.id, task: 'Analyze results' },
          ],
        },
        communications: [],
        finalResponse: 'Orchestration in progress...',
      };
      
      return NextResponse.json({
        success: true,
        orchestration: orchestratorResponse,
        message: 'Orchestrated chat initiated',
      });
    }
    
    // ============================================
    // BROADCAST TO ALL SUBAGENTS
    // ============================================
    case 'broadcast': {
      const { fromAgentId, toAgentIds, content } = body;
      
      const communications = toAgentIds.map((toId: string) => ({
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        fromAgentId,
        toAgentId: toId,
        messageType: 'broadcast',
        content,
        timestamp: Date.now(),
        status: 'delivered',
      }));
      
      orchestrationState.communications.push(...communications);
      
      return NextResponse.json({
        success: true,
        broadcastCount: communications.length,
        communications,
      });
    }
    
    // ============================================
    // INTER-TEAM COMMUNICATION (via orchestrator only)
    // ============================================
    case 'inter_team_message': {
      const { fromTeamId, toTeamId, orchestratorId, content } = body;
      
      const communication = {
        id: `inter_${Date.now()}`,
        type: 'inter_team',
        fromTeamId,
        toTeamId,
        orchestratorId,
        content,
        timestamp: Date.now(),
        status: 'pending_review',
      };
      
      orchestrationState.communications.push(communication);
      
      return NextResponse.json({
        success: true,
        message: 'Inter-team message queued for orchestrator review',
        communication,
      });
    }
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (sessionId) {
    orchestrationState.sessions.delete(sessionId);
    return NextResponse.json({ success: true, message: 'Session deleted' });
  }
  
  return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
}
