import { NextRequest, NextResponse } from 'next/server';
import { type CapabilityQuery, type SkillCreationRequest, type Skill, type Plugin } from '@/lib/store';

// In-memory stores
declare global {
  var skillsStore: Skill[];
  var pluginsStore: Plugin[];
  var capabilityQueriesStore: CapabilityQuery[];
  var skillCreationRequestsStore: SkillCreationRequest[];
}

if (!global.capabilityQueriesStore) {
  global.capabilityQueriesStore = [];
}
if (!global.skillCreationRequestsStore) {
  global.skillCreationRequestsStore = [];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ============================================
// POST /api/capabilities/query - Query capabilities for an agent
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, query, context } = body;

    if (!agentId || !query) {
      return NextResponse.json(
        { error: 'Agent ID and query are required' },
        { status: 400 }
      );
    }

    // Search for matching skills
    const queryLower = query.toLowerCase();
    const matchedSkills = (global.skillsStore || [])
      .filter((s: Skill) => {
        if (s.status !== 'available') return false;
        
        // Check if agent has access
        const hasAccess = s.autoAssignToNewAgents || s.assignedToAgents?.includes(agentId);
        if (!hasAccess) return false;
        
        // Check if skill matches query
        return (
          s.name.toLowerCase().includes(queryLower) ||
          s.description.toLowerCase().includes(queryLower) ||
          s.tags?.some((t: string) => t.toLowerCase().includes(queryLower)) ||
          s.category.toLowerCase().includes(queryLower)
        );
      })
      .map((s: Skill) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        complexity: s.complexity,
      }));

    // Search for matching plugins
    const matchedPlugins = (global.pluginsStore || [])
      .filter((p: Plugin) => {
        if (!p.enabled) return false;
        
        // Check if agent has access
        const hasAccess = 
          p.scope === 'global' ||
          (p.scope === 'agent' && p.allowedAgentIds?.includes(agentId));
        if (!hasAccess) return false;
        
        // Check if plugin matches query
        return (
          p.name.toLowerCase().includes(queryLower) ||
          (p.description?.toLowerCase().includes(queryLower)) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(queryLower)) ||
          p.category.toLowerCase().includes(queryLower)
        );
      })
      .map((p: Plugin) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        trigger: p.trigger,
      }));

    // Create capability query record
    const capabilityQuery: CapabilityQuery = {
      id: generateId(),
      agentId,
      query,
      context,
      status: matchedSkills.length > 0 || matchedPlugins.length > 0 ? 'resolved' : 'pending',
      matchedSkills: matchedSkills.map((s: any) => s.id),
      matchedPlugins: matchedPlugins.map((p: any) => p.id),
      createdAt: Date.now(),
    };

    // If no matches, suggest creating a new capability
    if (matchedSkills.length === 0 && matchedPlugins.length === 0) {
      // Generate deterministic skill suggestion based on query
      const suggestedSkill = generateSkillSuggestion(query, context);
      
      capabilityQuery.suggestedCreation = {
        type: 'skill',
        suggestedName: formatCapabilityName(query),
        suggestedCode: suggestedSkill.code,
        reasoning: `No existing capability found for "${query}". A new skill can be created to handle this task.`,
      };
      capabilityQuery.status = 'pending';
    }

    global.capabilityQueriesStore.push(capabilityQuery);

    return NextResponse.json({
      success: true,
      query: capabilityQuery,
      matchedSkills,
      matchedPlugins,
      suggestion: capabilityQuery.suggestedCreation,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to query capabilities', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/capabilities/create - Request to create a new skill/plugin
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      agentId, 
      requestedCapability, 
      suggestedSkill, 
      suggestedPlugin,
      userDecision // 'keep', 'one_time', 'reject'
    } = body;

    if (!agentId || !requestedCapability) {
      return NextResponse.json(
        { error: 'Agent ID and requested capability are required' },
        { status: 400 }
      );
    }

    // If user decision provided, process it
    if (userDecision) {
      const requestIndex = global.skillCreationRequestsStore.findIndex(
        (r: SkillCreationRequest) => r.agentId === agentId && r.requestedCapability === requestedCapability && r.status === 'pending'
      );

      if (requestIndex === -1) {
        return NextResponse.json(
          { error: 'No pending request found' },
          { status: 404 }
        );
      }

      const request = global.skillCreationRequestsStore[requestIndex];

      if (userDecision === 'reject') {
        global.skillCreationRequestsStore[requestIndex].status = 'rejected';
        global.skillCreationRequestsStore[requestIndex].userDecision = 'reject';
        
        return NextResponse.json({
          success: true,
          message: 'Skill creation request rejected',
        });
      }

      // Create the skill or plugin
      const isOneTime = userDecision === 'one_time';
      const now = Date.now();

      if (request.suggestedSkill) {
        const skill: Skill = {
          id: generateId(),
          name: request.suggestedSkill.name || requestedCapability,
          description: request.suggestedSkill.description || `Created for: ${requestedCapability}`,
          category: request.suggestedSkill.category || 'custom',
          tags: request.suggestedSkill.tags || [],
          complexity: request.suggestedSkill.complexity || 'simple',
          parameters: request.suggestedSkill.parameters || [],
          steps: request.suggestedSkill.steps || [],
          code: request.suggestedSkill.code,
          examples: request.suggestedSkill.examples || [],
          isOneTimeUse: isOneTime,
          keepAfterUse: !isOneTime,
          isDeterministic: request.suggestedSkill.isDeterministic ?? true,
          cacheResults: request.suggestedSkill.cacheResults ?? false,
          autoAssignToNewAgents: false,
          learnFromUsage: true,
          status: 'available',
          version: '1.0.0',
          createdBy: agentId,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
          successRate: 1.0,
          averageExecutionTime: 0,
        };

        if (!global.skillsStore) global.skillsStore = [];
        global.skillsStore.push(skill);

        // Assign to agent
        if (!skill.assignedToAgents) skill.assignedToAgents = [];
        skill.assignedToAgents.push(agentId);
      }

      if (request.suggestedPlugin) {
        const plugin: Plugin = {
          id: generateId(),
          name: request.suggestedPlugin.name || requestedCapability,
          description: request.suggestedPlugin.description || `Created for: ${requestedCapability}`,
          version: request.suggestedPlugin.version || '1.0.0',
          category: request.suggestedPlugin.category || 'utility',
          scope: request.suggestedPlugin.scope || 'agent',
          trigger: request.suggestedPlugin.trigger || 'manual',
          code: request.suggestedPlugin.code || '',
          permissions: request.suggestedPlugin.permissions || [],
          isOneTimeUse: isOneTime,
          keepAfterUse: !isOneTime,
          enabled: true,
          status: 'active',
          createdBy: agentId,
          createdAt: now,
          updatedAt: now,
          loadedAt: now,
          checksum: Buffer.from(request.suggestedPlugin.code || '').toString('base64').slice(0, 32),
          executionCount: 0,
          stats: {
            successCount: 0,
            failureCount: 0,
            averageExecutionTime: 0,
          },
        };

        if (!global.pluginsStore) global.pluginsStore = [];
        global.pluginsStore.push(plugin);

        if (plugin.scope === 'agent' && plugin.allowedAgentIds) {
          plugin.allowedAgentIds.push(agentId);
        }
      }

      global.skillCreationRequestsStore[requestIndex].status = 'created';
      global.skillCreationRequestsStore[requestIndex].userDecision = userDecision;

      return NextResponse.json({
        success: true,
        message: `Capability "${requestedCapability}" created successfully`,
        isOneTimeUse: isOneTime,
      });
    }

    // Create new request
    const request: SkillCreationRequest = {
      id: generateId(),
      agentId,
      requestedCapability,
      suggestedSkill,
      suggestedPlugin,
      status: 'pending',
      createdAt: Date.now(),
    };

    global.skillCreationRequestsStore.push(request);

    return NextResponse.json({
      success: true,
      request,
      message: `Capability request created. Waiting for user decision.`,
      requiresUserDecision: true,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to process capability request', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/capabilities - Get pending requests
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const requests = (global.skillCreationRequestsStore || [])
    .filter((r: SkillCreationRequest) => r.status === status)
    .sort((a: any, b: any) => b.createdAt - a.createdAt);

  return NextResponse.json({
    requests,
    total: requests.length,
  });
}

// ============================================
// Helper Functions
// ============================================

function formatCapabilityName(query: string): string {
  // Convert query to a proper skill name
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSkillSuggestion(query: string, context?: any): { code: string } {
  // Generate a deterministic skill template based on the query
  const skillName = formatCapabilityName(query);
  
  // Create a basic skill template
  const code = `
// Auto-generated skill: ${skillName}
// Query: ${query}
// Context: ${context ? JSON.stringify(context) : 'None'}

async function execute(params, context) {
  // TODO: Implement the logic for "${query}"
  // This skill was auto-generated based on the agent's request
  
  const result = {
    action: "${query}",
    params: params,
    timestamp: Date.now(),
    status: 'executed'
  };
  
  // Add your implementation here
  // Available: params (input parameters), context (agent and skill info)
  
  return result;
}

return await execute(params, context);
`;

  return { code: code.trim() };
}
