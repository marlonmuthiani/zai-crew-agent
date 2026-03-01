import { NextRequest, NextResponse } from 'next/server';
import { type Skill, type SkillStep, type SkillParameter, type SkillExample } from '@/lib/store';

// In-memory store for server-side skill operations
declare global {
  var skillsStore: Skill[];
}

if (!global.skillsStore) {
  global.skillsStore = [];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ============================================
// GET /api/skills - List all skills
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let filtered = [...global.skillsStore];

  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }

  if (agentId) {
    filtered = filtered.filter(s => 
      s.autoAssignToNewAgents || 
      s.assignedToAgents?.includes(agentId)
    );
  }

  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.tags?.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  return NextResponse.json({
    skills: filtered,
    total: filtered.length,
  });
}

// ============================================
// POST /api/skills - Create new skill
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category = 'custom',
      tags = [],
      complexity = 'simple',
      parameters = [],
      steps = [],
      code,
      requiredPlugins = [],
      requiredSkills = [],
      requiredCapabilities = [],
      examples = [],
      documentation,
      assignedToAgents = [],
      autoAssignToNewAgents = false,
      learnFromUsage = true,
      adaptationRules = [],
      isOneTimeUse = false,
      keepAfterUse = true,
      isDeterministic = true,
      cacheResults = false,
      version = '1.0.0',
      author,
      createdBy,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const skill: Skill = {
      id: generateId(),
      name,
      description,
      category,
      tags,
      complexity,
      parameters: parameters as SkillParameter[],
      steps: steps as SkillStep[],
      code,
      requiredPlugins,
      requiredSkills,
      requiredCapabilities,
      examples: examples as SkillExample[],
      documentation,
      assignedToAgents,
      autoAssignToNewAgents,
      learnFromUsage,
      adaptationRules,
      status: 'available',
      isOneTimeUse,
      keepAfterUse,
      isDeterministic,
      cacheResults,
      version,
      author,
      createdAt: now,
      updatedAt: now,
      createdBy,
      usageCount: 0,
      successRate: 1.0,
      averageExecutionTime: 0,
    };

    global.skillsStore.push(skill);

    return NextResponse.json({
      success: true,
      skill,
      message: `Skill "${name}" created successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create skill', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/skills - Update skill
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    const skillIndex = global.skillsStore.findIndex(s => s.id === id);
    if (skillIndex === -1) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const now = Date.now();
    const existingSkill = global.skillsStore[skillIndex];

    global.skillsStore[skillIndex] = {
      ...existingSkill,
      ...updates,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      skill: global.skillsStore[skillIndex],
      message: `Skill "${existingSkill.name}" updated successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to update skill', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/skills - Delete skill
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    const skillIndex = global.skillsStore.findIndex(s => s.id === id);
    if (skillIndex === -1) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const deletedSkill = global.skillsStore.splice(skillIndex, 1)[0];

    return NextResponse.json({
      success: true,
      message: `Skill "${deletedSkill.name}" deleted successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to delete skill', details: errorMessage },
      { status: 500 }
    );
  }
}
