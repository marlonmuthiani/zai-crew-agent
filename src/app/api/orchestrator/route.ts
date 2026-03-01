import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Orchestrator tool call API
// This allows agents to access dashboard data and perform orchestrations

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, agentId, params } = body;
    
    // Initialize ZAI for AI processing if needed
    const zai = await ZAI.create();
    
    switch (tool) {
      case 'get_dashboard': {
        // Get observability dashboard data
        const timeRange = params?.timeRange || '24h';
        const now = Date.now();
        const timeFilters: Record<string, number> = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
        };
        
        // Simulate dashboard data fetch
        const dashboardData = {
          metrics: {
            activeAgents: 5,
            totalAgents: 7,
            busyAgents: 3,
            idleAgents: 2,
            errorAgents: 0,
            pendingTasks: 12,
            runningTasks: 3,
            completedTasksToday: 45,
            failedTasksToday: 2,
            systemHealth: 'healthy' as const,
            lastUpdated: now,
          },
          recentActivity: [
            { time: now - 60000, event: 'Agent "Research Bot" completed task', type: 'success' },
            { time: now - 120000, event: 'New bean assigned to "Code Assistant"', type: 'info' },
            { time: now - 300000, event: 'Agent "Data Analyzer" started processing', type: 'info' },
          ],
          topAgents: [
            { id: '1', name: 'Research Bot', tasksCompleted: 23, status: 'idle' },
            { id: '2', name: 'Code Assistant', tasksCompleted: 18, status: 'busy' },
            { id: '3', name: 'Data Analyzer', tasksCompleted: 15, status: 'busy' },
          ],
        };
        
        return NextResponse.json({
          success: true,
          data: dashboardData,
          message: 'Dashboard data retrieved successfully',
        });
      }
      
      case 'get_agent_status': {
        // Get status of all agents or specific agent
        const targetAgentId = params?.agentId;
        
        const agents = [
          { id: '1', name: 'Research Bot', status: 'idle', currentTask: null, completedTasks: 23 },
          { id: '2', name: 'Code Assistant', status: 'busy', currentTask: 'Refactoring module X', completedTasks: 18 },
          { id: '3', name: 'Data Analyzer', status: 'busy', currentTask: 'Processing dataset Y', completedTasks: 15 },
          { id: '4', name: 'Writer Bot', status: 'idle', currentTask: null, completedTasks: 12 },
          { id: '5', name: 'QA Agent', status: 'error', currentTask: null, completedTasks: 8, lastError: 'API timeout' },
        ];
        
        const result = targetAgentId 
          ? agents.find(a => a.id === targetAgentId)
          : agents;
        
        return NextResponse.json({
          success: true,
          data: result,
          message: targetAgentId ? 'Agent status retrieved' : 'All agent statuses retrieved',
        });
      }
      
      case 'get_task_queue': {
        // Get current task queue status
        const queue = {
          pending: [
            { id: 'b1', title: 'Analyze Q4 sales data', priority: 'high', assignedTo: null },
            { id: 'b2', title: 'Generate weekly report', priority: 'normal', assignedTo: null },
            { id: 'b3', title: 'Review code changes', priority: 'low', assignedTo: null },
          ],
          running: [
            { id: 'b4', title: 'Process customer feedback', priority: 'high', assignedTo: 'Data Analyzer', progress: 65 },
            { id: 'b5', title: 'Update documentation', priority: 'normal', assignedTo: 'Writer Bot', progress: 30 },
          ],
          completed: [
            { id: 'b6', title: 'Fix login bug', priority: 'critical', completedBy: 'Code Assistant', completedAt: Date.now() - 3600000 },
          ],
        };
        
        return NextResponse.json({
          success: true,
          data: queue,
          message: 'Task queue retrieved successfully',
        });
      }
      
      case 'assign_task': {
        // Assign a task to an agent
        const { beanId, targetAgentId } = params;
        
        if (!beanId || !targetAgentId) {
          return NextResponse.json({
            success: false,
            error: 'beanId and targetAgentId are required',
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            beanId,
            assignedTo: targetAgentId,
            assignedAt: Date.now(),
          },
          message: `Task ${beanId} assigned to agent ${targetAgentId}`,
        });
      }
      
      case 'get_schedules': {
        // Get schedules visible to orchestrator
        const schedules = [
          {
            id: 's1',
            name: 'Daily Report Generation',
            status: 'active',
            nextExecution: Date.now() + 3600000,
            lastExecution: Date.now() - 82800000,
            executionCount: 45,
          },
          {
            id: 's2',
            name: 'Weekly Data Sync',
            status: 'active',
            nextExecution: Date.now() + 172800000,
            lastExecution: Date.now() - 432000000,
            executionCount: 12,
          },
        ];
        
        return NextResponse.json({
          success: true,
          data: schedules,
          message: 'Schedules retrieved successfully',
        });
      }
      
      case 'trigger_schedule': {
        // Manually trigger a schedule
        const { scheduleId } = params;
        
        if (!scheduleId) {
          return NextResponse.json({
            success: false,
            error: 'scheduleId is required',
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            scheduleId,
            triggeredAt: Date.now(),
            status: 'running',
          },
          message: `Schedule ${scheduleId} triggered successfully`,
        });
      }
      
      case 'broadcast_message': {
        // Send a message to all agents or specific agents
        const { message, targetAgents } = params;
        
        if (!message) {
          return NextResponse.json({
            success: false,
            error: 'message is required',
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            message,
            broadcastTo: targetAgents || 'all',
            broadcastAt: Date.now(),
          },
          message: 'Message broadcasted successfully',
        });
      }
      
      case 'get_metrics': {
        // Get performance metrics
        const metrics = {
          period: params?.period || '24h',
          tasks: {
            total: 65,
            completed: 58,
            failed: 2,
            pending: 5,
            successRate: 96.7,
          },
          agents: {
            averageResponseTime: 1.2, // seconds
            totalTokensUsed: 1250000,
            averageTasksPerAgent: 9.3,
          },
          system: {
            uptime: 99.9,
            apiCalls: 450,
            errorRate: 0.3,
          },
        };
        
        return NextResponse.json({
          success: true,
          data: metrics,
          message: 'Metrics retrieved successfully',
        });
      }
      
      case 'analyze_with_ai': {
        // Use AI to analyze data or generate insights
        const { prompt, data } = params;
        
        if (!prompt) {
          return NextResponse.json({
            success: false,
            error: 'prompt is required',
          }, { status: 400 });
        }
        
        try {
          const completion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant helping to analyze dashboard data and provide insights for an orchestrator agent. Be concise and actionable.',
              },
              {
                role: 'user',
                content: `${prompt}\n\nData: ${JSON.stringify(data || {})}`,
              },
            ],
          });
          
          const analysis = completion.choices[0]?.message?.content;
          
          return NextResponse.json({
            success: true,
            data: { analysis },
            message: 'AI analysis completed',
          });
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: error.message || 'AI analysis failed',
          }, { status: 500 });
        }
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown tool: ${tool}`,
          availableTools: [
            'get_dashboard',
            'get_agent_status',
            'get_task_queue',
            'assign_task',
            'get_schedules',
            'trigger_schedule',
            'broadcast_message',
            'get_metrics',
            'analyze_with_ai',
          ],
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Tool execution failed',
    }, { status: 500 });
  }
}

// GET - List available orchestrator tools
export async function GET() {
  return NextResponse.json({
    success: true,
    tools: [
      {
        name: 'get_dashboard',
        description: 'Get the observability dashboard data',
        params: { timeRange: 'Time range: 1h, 6h, 24h, 7d' },
      },
      {
        name: 'get_agent_status',
        description: 'Get status of all agents or a specific agent',
        params: { agentId: 'Optional agent ID to get specific agent' },
      },
      {
        name: 'get_task_queue',
        description: 'Get current task queue status',
        params: {},
      },
      {
        name: 'assign_task',
        description: 'Assign a task to an agent',
        params: { beanId: 'Task ID', targetAgentId: 'Agent ID' },
      },
      {
        name: 'get_schedules',
        description: 'Get schedules visible to orchestrator',
        params: {},
      },
      {
        name: 'trigger_schedule',
        description: 'Manually trigger a schedule',
        params: { scheduleId: 'Schedule ID to trigger' },
      },
      {
        name: 'broadcast_message',
        description: 'Send a message to all agents or specific agents',
        params: { message: 'Message content', targetAgents: 'Optional array of agent IDs' },
      },
      {
        name: 'get_metrics',
        description: 'Get performance metrics',
        params: { period: 'Time period: 1h, 6h, 24h, 7d, 30d' },
      },
      {
        name: 'analyze_with_ai',
        description: 'Use AI to analyze data and provide insights',
        params: { prompt: 'Analysis prompt', data: 'Data to analyze' },
      },
    ],
  });
}
