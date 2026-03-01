import { NextRequest, NextResponse } from 'next/server';

// Teams and Admin Management API
// In production, use proper database and authentication

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: {
    allowMemberInvite: boolean;
    requireApproval: boolean;
    maxMembers: number;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
  };
  createdAt: number;
  updatedAt: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin: boolean;
  teams: string[];
  createdAt: number;
}

// In-memory storage
const teams = new Map<string, Team>();
const teamMembers = new Map<string, TeamMember[]>();
const users = new Map<string, User>();

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initialize with a default admin user
const defaultAdminId = 'admin_default';
users.set(defaultAdminId, {
  id: defaultAdminId,
  email: 'admin@teamhub.ai',
  name: 'Admin User',
  isAdmin: true,
  teams: [],
  createdAt: Date.now(),
});

// GET - List teams or get team details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');

  if (teamId) {
    // Get specific team
    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const members = teamMembers.get(teamId) || [];
    const memberDetails = members.map(m => {
      const user = users.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        role: m.role,
        joinedAt: m.joinedAt,
      };
    });

    return NextResponse.json({
      team,
      members: memberDetails,
    });
  }

  if (userId) {
    // Get user's teams
    const user = users.get(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userTeams = user.teams
      .map(tid => teams.get(tid))
      .filter(Boolean) as Team[];

    return NextResponse.json({ teams: userTeams });
  }

  // Get all teams (admin only in production)
  const allTeams = Array.from(teams.values());
  return NextResponse.json({ teams: allTeams });
}

// POST - Create new team
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, ownerId, settings } = data;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Team name and owner ID are required' },
        { status: 400 }
      );
    }

    // Verify owner exists
    let owner = users.get(ownerId);
    if (!owner) {
      // Create user if doesn't exist
      owner = {
        id: ownerId,
        email: `user_${ownerId}@teamhub.ai`,
        name: `User ${ownerId}`,
        isAdmin: false,
        teams: [],
        createdAt: Date.now(),
      };
      users.set(ownerId, owner);
    }

    const id = `team_${generateId()}`;
    const team: Team = {
      id,
      name,
      description,
      ownerId,
      settings: {
        allowMemberInvite: settings?.allowMemberInvite ?? true,
        requireApproval: settings?.requireApproval ?? false,
        maxMembers: settings?.maxMembers ?? 50,
      },
      stats: {
        totalMembers: 1,
        activeMembers: 1,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    teams.set(id, team);

    // Add owner as admin member
    const member: TeamMember = {
      id: `member_${generateId()}`,
      userId: ownerId,
      teamId: id,
      role: 'admin',
      joinedAt: Date.now(),
    };
    teamMembers.set(id, [member]);

    // Update user's teams
    owner.teams.push(id);
    users.set(ownerId, owner);

    return NextResponse.json({
      success: true,
      team,
      member,
    });

  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// PUT - Update team or add/remove members
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, teamId, userId, role, requesterId } = data;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    switch (action) {
      case 'update':
        // Update team settings
        const updated = {
          ...team,
          ...data.updates,
          updatedAt: Date.now(),
        };
        teams.set(teamId, updated);
        return NextResponse.json({ success: true, team: updated });

      case 'addMember':
        // Add new member
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        let user = users.get(userId);
        if (!user) {
          user = {
            id: userId,
            email: `user_${userId}@teamhub.ai`,
            name: `User ${userId}`,
            isAdmin: false,
            teams: [],
            createdAt: Date.now(),
          };
          users.set(userId, user);
        }

        const members = teamMembers.get(teamId) || [];
        if (members.some(m => m.userId === userId)) {
          return NextResponse.json({ error: 'User already in team' }, { status: 400 });
        }

        const newMember: TeamMember = {
          id: `member_${generateId()}`,
          userId,
          teamId,
          role: role || 'member',
          joinedAt: Date.now(),
        };
        members.push(newMember);
        teamMembers.set(teamId, members);

        user.teams.push(teamId);
        users.set(userId, user);

        team.stats.totalMembers = members.length;
        teams.set(teamId, team);

        return NextResponse.json({ success: true, member: newMember });

      case 'removeMember':
        // Remove member
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const currentMembers = teamMembers.get(teamId) || [];
        const memberIndex = currentMembers.findIndex(m => m.userId === userId);
        
        if (memberIndex === -1) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        currentMembers.splice(memberIndex, 1);
        teamMembers.set(teamId, currentMembers);

        const memberUser = users.get(userId);
        if (memberUser) {
          memberUser.teams = memberUser.teams.filter(tid => tid !== teamId);
          users.set(userId, memberUser);
        }

        team.stats.totalMembers = currentMembers.length;
        teams.set(teamId, team);

        return NextResponse.json({ success: true });

      case 'updateRole':
        // Update member role
        if (!userId || !role) {
          return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
        }

        const teamMembs = teamMembers.get(teamId) || [];
        const memb = teamMembs.find(m => m.userId === userId);
        if (!memb) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        memb.role = role;
        teamMembers.set(teamId, teamMembs);

        return NextResponse.json({ success: true, member: memb });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE - Delete team
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const requesterId = searchParams.get('requesterId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const team = teams.get(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // In production, verify requester is admin or owner
    // For now, allow deletion

    // Remove team from all members
    const members = teamMembers.get(teamId) || [];
    for (const member of members) {
      const user = users.get(member.userId);
      if (user) {
        user.teams = user.teams.filter(tid => tid !== teamId);
        users.set(member.userId, user);
      }
    }

    teamMembers.delete(teamId);
    teams.delete(teamId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
