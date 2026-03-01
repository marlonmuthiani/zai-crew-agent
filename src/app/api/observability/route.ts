import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo - in production use proper database
let observabilityData = {
  agentActivities: [] as any[],
  taskObservabilities: [] as any[],
  recentErrors: [] as any[],
  lastUpdated: Date.now(),
};

// GET - Retrieve observability dashboard data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agentId = searchParams.get('agentId');
  const timeRange = searchParams.get('timeRange') || '24h';
  
  // Calculate time filter
  const now = Date.now();
  const timeFilters: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const timeFilter = timeFilters[timeRange] || timeFilters['24h'];
  const cutoff = now - timeFilter;
  
  // Filter data based on time range and agent
  const filteredActivities = observabilityData.agentActivities
    .filter(a => a.timestamp > cutoff && (!agentId || a.agentId === agentId));
  
  const filteredErrors = observabilityData.recentErrors
    .filter(e => e.timestamp > cutoff && (!agentId || e.agentId === agentId));
  
  return NextResponse.json({
    success: true,
    data: {
      agentActivities: filteredActivities,
      taskObservabilities: observabilityData.taskObservabilities,
      recentErrors: filteredErrors,
      lastUpdated: observabilityData.lastUpdated,
    },
  });
}

// POST - Record new agent activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentName, type, description, metadata } = body;
    
    const activity = {
      id: Math.random().toString(36).substring(2, 15),
      agentId,
      agentName,
      type,
      description,
      timestamp: Date.now(),
      metadata,
    };
    
    observabilityData.agentActivities.unshift(activity);
    
    // Keep only last 1000 activities
    observabilityData.agentActivities = observabilityData.agentActivities.slice(0, 1000);
    
    // Track errors
    if (type === 'error') {
      observabilityData.recentErrors.unshift({
        id: activity.id,
        timestamp: activity.timestamp,
        agentId,
        beanId: metadata?.beanId,
        error: metadata?.error || description,
      });
      observabilityData.recentErrors = observabilityData.recentErrors.slice(0, 100);
    }
    
    observabilityData.lastUpdated = Date.now();
    
    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to record activity',
    }, { status: 400 });
  }
}

// PUT - Update task observability
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { beanId, updates } = body;
    
    const existingIndex = observabilityData.taskObservabilities
      .findIndex(t => t.beanId === beanId);
    
    if (existingIndex >= 0) {
      observabilityData.taskObservabilities[existingIndex] = {
        ...observabilityData.taskObservabilities[existingIndex],
        ...updates,
      };
    } else {
      observabilityData.taskObservabilities.push({
        id: Math.random().toString(36).substring(2, 15),
        beanId,
        ...updates,
      });
    }
    
    observabilityData.lastUpdated = Date.now();
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update task observability',
    }, { status: 400 });
  }
}
