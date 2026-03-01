import { NextRequest, NextResponse } from 'next/server';

// In-memory store for schedules
let schedules: any[] = [];
let executions: any[] = [];

// Helper to parse cron expression (simplified)
function getNextExecution(cronExpression: string, timezone: string): number {
  // Simplified: return 1 hour from now
  // In production, use a proper cron parser like cron-parser
  return Date.now() + 60 * 60 * 1000;
}

// GET - List schedules or get specific schedule
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const orchestratorAgentId = searchParams.get('orchestratorAgentId');
  
  if (id) {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, schedule });
  }
  
  let filteredSchedules = schedules;
  if (orchestratorAgentId) {
    filteredSchedules = schedules.filter(s => 
      s.visibleToOrchestrator && 
      (s.orchestratorAgentId === orchestratorAgentId || !s.orchestratorAgentId)
    );
  }
  
  return NextResponse.json({
    success: true,
    schedules: filteredSchedules,
    executions: executions.slice(0, 50),
  });
}

// POST - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, trigger, action, orchestratorAgentId, visibleToOrchestrator } = body;
    
    const id = Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    
    const schedule = {
      id,
      name,
      description,
      trigger,
      action,
      status: 'active' as const,
      enabled: true,
      lastExecutedAt: null,
      lastExecutionStatus: null,
      nextExecutionAt: trigger.type === 'cron' 
        ? getNextExecution(trigger.cronExpression || '', trigger.timezone)
        : trigger.type === 'interval'
        ? now + (trigger.intervalMinutes || 60) * 60 * 1000
        : trigger.scheduledTime || null,
      executionCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      recentExecutions: [],
      orchestratorAgentId,
      visibleToOrchestrator: visibleToOrchestrator ?? true,
      createdAt: now,
      updatedAt: now,
    };
    
    schedules.push(schedule);
    
    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create schedule' }, { status: 400 });
  }
}

// PUT - Update schedule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    
    const index = schedules.findIndex(s => s.id === id);
    if (index < 0) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    
    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    return NextResponse.json({ success: true, schedule: schedules[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update schedule' }, { status: 400 });
  }
}

// DELETE - Delete schedule
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ success: false, error: 'Schedule ID required' }, { status: 400 });
  }
  
  const index = schedules.findIndex(s => s.id === id);
  if (index < 0) {
    return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
  }
  
  schedules.splice(index, 1);
  return NextResponse.json({ success: true });
}

// Execute a schedule manually
export async function executeSchedule(scheduleId: string): Promise<any> {
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) {
    throw new Error('Schedule not found');
  }
  
  const executionId = Math.random().toString(36).substring(2, 15);
  const now = Date.now();
  
  const execution: any = {
    id: executionId,
    scheduleId,
    triggeredAt: now,
    status: 'running',
  };
  
  executions.unshift(execution);
  
  try {
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = `Executed ${schedule.action.type} for schedule: ${schedule.name}`;
    
    execution.startedAt = now;
    execution.completedAt = Date.now();
    execution.status = 'completed';
    execution.result = result;
    execution.duration = execution.completedAt - now;
    
    // Update schedule
    schedule.lastExecutedAt = now;
    schedule.lastExecutionStatus = 'success';
    schedule.executionCount += 1;
    schedule.consecutiveFailures = 0;
    schedule.recentExecutions.unshift(execution);
    schedule.recentExecutions = schedule.recentExecutions.slice(0, 50);
    
    return execution;
  } catch (error: any) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = Date.now();
    
    schedule.lastExecutionStatus = 'failed';
    schedule.failureCount += 1;
    schedule.consecutiveFailures += 1;
    schedule.recentExecutions.unshift(execution);
    
    throw error;
  }
}
