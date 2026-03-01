import { NextRequest, NextResponse } from 'next/server';
import { type Plugin, type PluginExecution } from '@/lib/store';

// In-memory store for server-side plugin operations
// In production, this would use a database
declare global {
  var pluginsStore: Plugin[];
  var pluginExecutionsStore: PluginExecution[];
}

if (!global.pluginsStore) {
  global.pluginsStore = [];
}
if (!global.pluginExecutionsStore) {
  global.pluginExecutionsStore = [];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate checksum for hot reload detection
const generateChecksum = (code: string): string => {
  return Buffer.from(code).toString('base64').slice(0, 32);
};

// ============================================
// GET /api/plugins - List all plugins
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const agentId = searchParams.get('agentId');
  const category = searchParams.get('category');
  const enabled = searchParams.get('enabled');

  let filtered = [...global.pluginsStore];

  if (scope) {
    filtered = filtered.filter(p => p.scope === scope);
  }

  if (agentId) {
    filtered = filtered.filter(p => 
      p.scope === 'global' || 
      (p.scope === 'agent' && p.allowedAgentIds?.includes(agentId))
    );
  }

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  if (enabled !== null) {
    const isEnabled = enabled === 'true';
    filtered = filtered.filter(p => p.enabled === isEnabled);
  }

  return NextResponse.json({
    plugins: filtered,
    total: filtered.length,
  });
}

// ============================================
// POST /api/plugins - Create new plugin
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      version = '1.0.0',
      author,
      category = 'utility',
      tags = [],
      scope = 'global',
      allowedAgentIds = [],
      allowedTeamIds = [],
      allowedWorkspaceIds = [],
      trigger = 'manual',
      triggerConfig,
      code,
      config,
      configSchema,
      permissions = [],
      enabled = true,
      isOneTimeUse = false,
      keepAfterUse = true,
      icon,
      createdBy,
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const plugin: Plugin = {
      id: generateId(),
      name,
      description,
      version,
      author,
      category,
      tags,
      scope,
      allowedAgentIds,
      allowedTeamIds,
      allowedWorkspaceIds,
      trigger,
      triggerConfig,
      code,
      config,
      configSchema,
      permissions,
      status: 'active',
      enabled,
      lastError: undefined,
      lastExecutedAt: undefined,
      executionCount: 0,
      isOneTimeUse,
      keepAfterUse,
      checksum: generateChecksum(code),
      loadedAt: now,
      icon,
      createdAt: now,
      updatedAt: now,
      createdBy,
      stats: {
        successCount: 0,
        failureCount: 0,
        averageExecutionTime: 0,
      },
    };

    global.pluginsStore.push(plugin);

    return NextResponse.json({
      success: true,
      plugin,
      message: `Plugin "${name}" created successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create plugin', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/plugins - Update plugin
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    const pluginIndex = global.pluginsStore.findIndex(p => p.id === id);
    if (pluginIndex === -1) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    const now = Date.now();
    const existingPlugin = global.pluginsStore[pluginIndex];

    // If code changed, update checksum and loadedAt
    if (updates.code && updates.code !== existingPlugin.code) {
      updates.checksum = generateChecksum(updates.code);
      updates.loadedAt = now;
      updates.status = 'active';
      updates.lastError = undefined;
    }

    global.pluginsStore[pluginIndex] = {
      ...existingPlugin,
      ...updates,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      plugin: global.pluginsStore[pluginIndex],
      message: `Plugin "${existingPlugin.name}" updated successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to update plugin', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/plugins - Delete plugin
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    const pluginIndex = global.pluginsStore.findIndex(p => p.id === id);
    if (pluginIndex === -1) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    const deletedPlugin = global.pluginsStore.splice(pluginIndex, 1)[0];

    // Also remove related executions
    global.pluginExecutionsStore = global.pluginExecutionsStore.filter(e => e.pluginId !== id);

    return NextResponse.json({
      success: true,
      message: `Plugin "${deletedPlugin.name}" deleted successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to delete plugin', details: errorMessage },
      { status: 500 }
    );
  }
}
