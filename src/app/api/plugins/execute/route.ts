import { NextRequest, NextResponse } from 'next/server';
import { type PluginExecution } from '@/lib/store';

// In-memory store for executions
declare global {
  var pluginsStore: any[];
  var pluginExecutionsStore: PluginExecution[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ============================================
// POST /api/plugins/execute - Execute a plugin
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pluginId, input = {}, triggeredBy = 'user', agentId } = body;

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    // Find the plugin
    const plugin = global.pluginsStore?.find((p: any) => p.id === pluginId);
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    if (!plugin.enabled) {
      return NextResponse.json(
        { error: 'Plugin is not enabled' },
        { status: 400 }
      );
    }

    // Create execution record
    const executionId = generateId();
    const execution: PluginExecution = {
      id: executionId,
      pluginId,
      triggeredBy,
      agentId,
      input,
      status: 'running',
      startedAt: Date.now(),
    };

    if (!global.pluginExecutionsStore) {
      global.pluginExecutionsStore = [];
    }
    global.pluginExecutionsStore.push(execution);

    try {
      // Execute the plugin code in a sandboxed environment
      // Note: In production, this should use a proper sandbox like VM2 or isolated-vm
      const sandbox = {
        input,
        config: plugin.config || {},
        // Safe console that doesn't leak
        console: {
          log: (...args: any[]) => console.log('[Plugin]', plugin.name, ...args),
          error: (...args: any[]) => console.error('[Plugin]', plugin.name, ...args),
          warn: (...args: any[]) => console.warn('[Plugin]', plugin.name, ...args),
        },
        // Allowed globals
        JSON,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Date,
        Math,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURIComponent,
        decodeURIComponent,
        encodeURI,
        decodeURI,
      };

      // Create async function from plugin code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction(...Object.keys(sandbox), plugin.code);
      
      // Execute with timeout protection
      const timeoutMs = 30000; // 30 second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plugin execution timeout')), timeoutMs);
      });

      const output = await Promise.race([
        fn(...Object.values(sandbox)),
        timeoutPromise
      ]);

      const completedAt = Date.now();
      const duration = completedAt - execution.startedAt;

      // Update execution record
      const execIndex = global.pluginExecutionsStore.findIndex(e => e.id === executionId);
      if (execIndex !== -1) {
        global.pluginExecutionsStore[execIndex] = {
          ...execution,
          status: 'completed',
          output: typeof output === 'object' ? output : { result: output },
          completedAt,
          duration,
        };
      }

      // Update plugin stats
      const pluginIndex = global.pluginsStore.findIndex((p: any) => p.id === pluginId);
      if (pluginIndex !== -1) {
        const p = global.pluginsStore[pluginIndex];
        const stats = p.stats || { successCount: 0, failureCount: 0, averageExecutionTime: 0 };
        const newAvgTime = (stats.averageExecutionTime * stats.successCount + duration) / (stats.successCount + 1);
        
        global.pluginsStore[pluginIndex] = {
          ...p,
          lastExecutedAt: completedAt,
          executionCount: (p.executionCount || 0) + 1,
          stats: {
            ...stats,
            successCount: stats.successCount + 1,
            averageExecutionTime: newAvgTime,
            lastUsedBy: agentId,
          },
        };
      }

      // Check if this was a one-time use plugin
      if (plugin.isOneTimeUse && !plugin.keepAfterUse) {
        // Mark for cleanup (in a real app, would ask user first)
        console.log(`[Plugin] One-time plugin "${plugin.name}" executed, marked for cleanup`);
      }

      return NextResponse.json({
        success: true,
        execution: global.pluginExecutionsStore.find(e => e.id === executionId),
        output: typeof output === 'object' ? output : { result: output },
        duration,
        message: `Plugin "${plugin.name}" executed successfully`,
      });

    } catch (execError: unknown) {
      const completedAt = Date.now();
      const errorMessage = execError instanceof Error ? execError.message : String(execError);

      // Update execution record with error
      const execIndex = global.pluginExecutionsStore.findIndex(e => e.id === executionId);
      if (execIndex !== -1) {
        global.pluginExecutionsStore[execIndex] = {
          ...execution,
          status: 'failed',
          error: errorMessage,
          completedAt,
          duration: completedAt - execution.startedAt,
        };
      }

      // Update plugin with error
      const pluginIndex = global.pluginsStore.findIndex((p: any) => p.id === pluginId);
      if (pluginIndex !== -1) {
        const p = global.pluginsStore[pluginIndex];
        global.pluginsStore[pluginIndex] = {
          ...p,
          lastError: errorMessage,
          status: 'error',
          stats: {
            ...(p.stats || { successCount: 0, failureCount: 0, averageExecutionTime: 0 }),
            failureCount: (p.stats?.failureCount || 0) + 1,
          },
        };
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        execution: global.pluginExecutionsStore.find(e => e.id === executionId),
      }, { status: 500 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to execute plugin', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/plugins/execute - Get execution history
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pluginId = searchParams.get('pluginId');
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  let filtered = [...(global.pluginExecutionsStore || [])];

  if (pluginId) {
    filtered = filtered.filter(e => e.pluginId === pluginId);
  }

  if (agentId) {
    filtered = filtered.filter(e => e.agentId === agentId);
  }

  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }

  // Sort by most recent first
  filtered.sort((a, b) => b.startedAt - a.startedAt);

  // Apply limit
  filtered = filtered.slice(0, limit);

  return NextResponse.json({
    executions: filtered,
    total: filtered.length,
  });
}
