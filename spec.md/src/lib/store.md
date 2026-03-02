# store.ts - State Management

## Overview

`src/lib/store.ts` is the **central nervous system** of the Team AI Collaboration Dashboard. It defines all TypeScript types and implements the Zustand store that manages global application state.

## Purpose

This file serves as the single source of truth for:
- All data entities (agents, beans, team members, etc.)
- UI state (sidebar, modals, themes)
- Activity logging and audit trails
- Real-time metrics and observability data

## File Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | ~1,400+ |
| TypeScript Interfaces | 30+ |
| Store Actions | 80+ |
| State Slices | 15+ |

## Type Definitions

### Core Entities

#### Message
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: number;
  audioUrl?: string;      // Voice message support
  agentId?: string;       // If from an agent
  agentName?: string;     // Display name
}
```

**Purpose:** Represents a single message in any conversation context.

---

#### Agent
```typescript
interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;           // 'main' | 'subagent' | 'orchestrator' | 'worker'
  status: AgentStatus;       // 'idle' | 'busy' | 'error' | 'offline'
  
  // Hierarchy
  parentAgentId?: string;    // For subagents
  subagentIds?: string[];    // For main agents
  
  // Provider Configuration
  provider: string;          // AI provider ID
  model: string;             // Model identifier
  hasApiKey: boolean;        // Key availability
  customEndpoint?: string;   // Custom API endpoint
  systemPrompt: string;      // Agent's instructions
  temperature: number;       // Response randomness
  maxTokens: number;         // Output limit
  
  // Capabilities
  capabilities?: AgentCapability[];
  tools?: string[];
  canCommunicateWith?: string[];
  communicationStyle?: 'direct' | 'broadcast' | 'orchestrated';
  
  // Orchestrator Settings
  orchestratorConfig?: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryAttempts: number;
    priorityMode: 'fifo' | 'priority' | 'smart';
  };
  
  // Metadata
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  
  // Statistics
  stats?: {
    tasksCompleted: number;
    tasksFailed: number;
    totalMessages: number;
    averageResponseTime: number;
  };
}
```

**Purpose:** Defines an AI agent with all its configuration, capabilities, and relationships.

**Key Concepts:**
- **Type Hierarchy**: Main agents can have subagents; orchestrators coordinate tasks
- **Provider Agnostic**: Any AI provider can be configured
- **Communication**: Agents can be configured to communicate with specific other agents

---

#### Bean
```typescript
interface Bean {
  id: string;
  title: string;
  description?: string;
  content?: string;          // Detailed task content
  
  // Scheduling
  status: BeanStatus;        // 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: BeanPriority;    // 'low' | 'normal' | 'high' | 'critical'
  
  // Assignment
  assignedAgentId?: string;
  assignedBy?: string;
  assignedAt?: number;
  
  // Execution
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
  
  // Dependencies
  dependencies?: string[];   // Bean IDs that must complete first
  blockedBy?: string[];
  
  // Metadata
  tags?: string[];
  category?: string;
  messages?: AgentCommunication[];
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

**Purpose:** A "Bean" is a task specifically designed for AI agent execution. Unlike traditional tasks, beans track AI-specific metadata like tokens, agent communications, and execution results.

**Why "Bean"?**
- Distinct naming to differentiate from traditional tasks
- Short, memorable term for AI-specific work units
- Represents a "seed" that grows into completed work

---

#### TeamMember
```typescript
interface TeamMember {
  id: string;
  name: string;
  role: string;              // Job title
  avatar: string;            // Color gradient class
  teamId?: string;
  agentId?: string;
  agent: {
    name: string;
    provider: string;
    model: string;
    hasApiKey: boolean;
    customEndpoint?: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
  };
  messages: Message[];
  createdAt: number;
}
```

**Purpose:** Represents a human team member with an associated AI assistant. Each member gets their own AI agent for personalized assistance.

---

### Extension Entities

#### Plugin
```typescript
interface Plugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  
  // Classification
  category: string;          // 'utility', 'integration', 'analysis', 'automation'
  tags?: string[];
  
  // Scope & Access
  scope: PluginScope;        // 'global' | 'agent' | 'team' | 'workspace'
  allowedAgentIds?: string[];
  allowedTeamIds?: string[];
  allowedWorkspaceIds?: string[];
  
  // Execution
  trigger: PluginTrigger;    // 'manual' | 'event' | 'schedule' | 'api' | 'keyword'
  triggerConfig?: {
    events?: string[];
    schedule?: string;       // Cron expression
    keywords?: string[];
    apiEndpoint?: string;
  };
  
  // Code & Config
  code: string;              // JavaScript/TypeScript code
  config?: PluginConfig;
  configSchema?: { ... };
  
  // Permissions
  permissions: PluginPermission[];
  
  // State
  status: PluginStatus;      // 'active' | 'inactive' | 'error' | 'loading'
  enabled: boolean;
  lastError?: string;
  lastExecutedAt?: number;
  executionCount: number;
  
  // Lifecycle
  isOneTimeUse: boolean;
  keepAfterUse?: boolean;
  
  // Hot Reload
  checksum: string;          // For detecting changes
  loadedAt: number;
  
  // Statistics
  stats?: {
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
    lastUsedBy?: string;
  };
}
```

**Purpose:** Plugins are user-defined code that extends agent capabilities. They can be triggered manually, on events, on schedules, or via API.

---

#### Skill
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  
  // Classification
  category: SkillCategory;   // 'analysis' | 'generation' | 'transformation' | ...
  tags?: string[];
  complexity: SkillComplexity; // 'simple' | 'moderate' | 'complex'
  
  // Parameters
  parameters: SkillParameter[];
  
  // Execution
  steps: SkillStep[];        // Multi-step execution plan
  code?: string;             // Alternative: raw code
  
  // Dependencies
  requiredPlugins?: string[];
  requiredSkills?: string[];
  requiredCapabilities?: string[];
  
  // Documentation
  examples: SkillExample[];
  documentation?: string;
  
  // Agent Assignment
  assignedToAgents?: string[];
  autoAssignToNewAgents: boolean;
  
  // Learning
  learnFromUsage: boolean;
  adaptationRules?: string[];
  
  // State
  status: SkillStatus;       // 'available' | 'learning' | 'deprecated' | 'error'
  
  // Lifecycle
  isOneTimeUse: boolean;
  keepAfterUse?: boolean;
  
  // Determinism
  isDeterministic: boolean;
  cacheResults: boolean;
  
  // Statistics
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
}
```

**Purpose:** Skills are reusable, multi-step capabilities that agents can perform. Unlike plugins (which are raw code), skills define structured execution plans.

---

### Observability Entities

#### AgentActivityEvent
```typescript
interface AgentActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: AgentActivityType;   // 'thinking' | 'executing_task' | 'waiting_for_input' | ...
  description: string;
  timestamp: number;
  duration?: number;
  metadata?: {
    beanId?: string;
    taskId?: string;
    targetAgentId?: string;
    tokens?: number;
    model?: string;
    provider?: string;
    error?: string;
    result?: string;
  };
}
```

**Purpose:** Records real-time agent activities for the observability dashboard.

---

#### Schedule
```typescript
interface Schedule {
  id: string;
  name: string;
  description?: string;
  
  // Trigger
  trigger: ScheduleTrigger;  // cron | interval | once
  
  // Action
  action: ScheduleActionConfig;
  
  // State
  status: ScheduleStatus;    // 'active' | 'paused' | 'disabled' | 'error'
  enabled: boolean;
  
  // Execution Tracking
  lastExecutedAt?: number;
  lastExecutionStatus?: 'success' | 'failed' | 'skipped';
  nextExecutionAt?: number;
  executionCount: number;
  failureCount: number;
  consecutiveFailures: number;
  
  // History
  recentExecutions: ScheduleExecution[];
  
  // Orchestrator Integration
  orchestratorAgentId?: string;
  visibleToOrchestrator: boolean;
}
```

**Purpose:** Defines automated, scheduled actions like cron jobs but with AI-specific actions (run bean, run plugin, etc.).

---

## Store Structure

### State Slices

```typescript
interface AppState {
  // === CORE ENTITIES ===
  teamMembers: TeamMember[];
  activeMemberId: string | null;
  
  agents: Agent[];
  activeAgentId: string | null;
  
  beans: Bean[];
  
  // === COMMUNICATION ===
  communications: AgentCommunication[];
  orchestrationSessions: OrchestrationSession[];
  
  // === EXTENSIONS ===
  plugins: Plugin[];
  pluginExecutions: PluginExecution[];
  
  skills: Skill[];
  skillCreationRequests: SkillCreationRequest[];
  
  // === OBSERVABILITY ===
  observabilityDashboard: ObservabilityDashboard;
  agentActivities: AgentActivityEvent[];
  taskObservabilities: TaskObservability[];
  
  // === AUTOMATION ===
  schedules: Schedule[];
  scheduleExecutions: ScheduleExecution[];
  
  // === SETTINGS ===
  userSettings: UserSettings;
  apiKeyStatus: Record<string, boolean>;
  
  // === UI STATE ===
  isRecording: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  
  // === LEGACY ===
  tasks: Task[];             // Backward compatibility
  activities: Activity[];    // Activity log
}
```

---

## Key Actions

### Team Member Actions

```typescript
addTeamMember(member: Omit<TeamMember, 'id' | 'messages' | 'createdAt'>): string
updateTeamMember(id: string, updates: Partial<TeamMember>): void
deleteTeamMember(id: string): void
setActiveMember(id: string | null): void
```

**Flow:** Create → Store → Assign Avatar → Log Activity → Return ID

---

### Agent Actions

```typescript
addAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): string
updateAgent(id: string, updates: Partial<Agent>): void
deleteAgent(id: string): void
setActiveAgent(id: string | null): void
getAgent(id: string): Agent | undefined
getMainAgents(): Agent[]
getSubagents(mainAgentId: string): Agent[]
linkSubagent(mainAgentId: string, subagentId: string): void
unlinkSubagent(mainAgentId: string, subagentId: string): void
```

**Hierarchy Management:**
- `linkSubagent` updates both the main agent's `subagentIds` array AND the subagent's `parentAgentId`
- `unlinkSubagent` cleans up both sides of the relationship

---

### Bean Actions

```typescript
addBean(bean: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>): string
updateBean(id: string, updates: Partial<Bean>): void
deleteBean(id: string): void
getBeansByStatus(status: BeanStatus): Bean[]
getBeansByAgent(agentId: string): Bean[]
assignBean(beanId: string, agentId: string): void
```

**Assignment Flow:**
1. Call `assignBean(beanId, agentId)`
2. Bean's `assignedAgentId` is set
3. Status changes to 'queued'
4. Activity is logged

---

### Plugin Actions

```typescript
addPlugin(plugin: Omit<Plugin, 'id' | 'createdAt' | ...>): string
updatePlugin(id: string, updates: Partial<Plugin>): void
deletePlugin(id: string): void
getPlugin(id: string): Plugin | undefined
getPluginsByScope(scope: PluginScope): Plugin[]
getPluginsForAgent(agentId: string): Plugin[]
executePlugin(pluginId: string, input: Record<string, unknown>, triggeredBy: string, agentId?: string): Promise<PluginExecution>
enablePlugin(id: string): void
disablePlugin(id: string): void
reloadPlugin(id: string): void
hotReloadPlugins(): void
```

**Hot Reload:** Detects code changes via checksum and reloads modified plugins.

---

### Skill Actions

```typescript
addSkill(skill: Omit<Skill, 'id' | 'createdAt' | ...>): string
updateSkill(id: string, updates: Partial<Skill>): void
deleteSkill(id: string): void
getSkill(id: string): Skill | undefined
getSkillsByCategory(category: SkillCategory): Skill[]
getSkillsForAgent(agentId: string): Skill[]
executeSkill(skillId: string, params: Record<string, unknown>, agentId: string): Promise<unknown>
assignSkillToAgent(skillId: string, agentId: string): void
unassignSkillFromAgent(skillId: string, agentId: string): void
```

---

### Observability Actions

```typescript
addAgentActivity(activity: Omit<AgentActivityEvent, 'id'>): void
updateTaskObservability(beanId: string, updates: Partial<TaskObservability>): void
getObservabilityDashboard(): ObservabilityDashboard
refreshDashboardMetrics(): void
recordAgentActivity(agentId: string, type: AgentActivityType, description: string, metadata?: {...}): void
```

---

### Scheduler Actions

```typescript
addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | ...>): string
updateSchedule(id: string, updates: Partial<Schedule>): void
deleteSchedule(id: string): void
pauseSchedule(id: string): void
resumeSchedule(id: string): void
executeSchedule(id: string): Promise<ScheduleExecution>
getScheduleNextExecution(id: string): number | null
getSchedulesForOrchestrator(agentId: string): Schedule[]
```

---

## Persistence

The store uses Zustand's persist middleware:

```typescript
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'team-ai-dashboard',  // Local storage key
    }
  )
);
```

**What Gets Persisted:**
- All entity data (agents, beans, members, etc.)
- User settings
- UI preferences

**What Doesn't Get Persisted:**
- Real-time observability data
- Activity logs (limited to 200 entries)
- Temporary UI state

---

## Helper Functions

### ID Generation
```typescript
const generateId = () => Math.random().toString(36).substring(2, 15);
```

### Avatar Color Assignment
```typescript
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    // ... 8 color options
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};
```

### Default Settings
```typescript
const defaultUserSettings: UserSettings = {
  displayName: 'User',
  email: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  darkMode: true,
  compactMode: false,
  showNotifications: true,
  soundEnabled: true,
  autoSave: true,
  fontSize: 'medium',
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o',
  streamResponses: true,
  // ... more defaults
};
```

---

## Relationships with Other Files

```
store.ts
├── Imports from ai-providers.ts
│   └── AI_PROVIDERS (for default model lookup)
│
├── Used by page.tsx
│   └── All state management
│
├── Used by API routes
│   └── Potential shared types
│
└── Exports to all components
    └── useAppStore hook
```

---

## Usage Example

```typescript
// In any component
import { useAppStore, type Agent, type Bean } from '@/lib/store';

function MyComponent() {
  // Get state
  const agents = useAppStore(state => state.agents);
  const beans = useAppStore(state => state.beans);
  
  // Get actions
  const addAgent = useAppStore(state => state.addAgent);
  const assignBean = useAppStore(state => state.assignBean);
  
  // Use
  const handleCreateAgent = () => {
    const id = addAgent({
      name: 'Research Assistant',
      type: 'worker',
      status: 'idle',
      provider: 'openai',
      model: 'gpt-4o',
      hasApiKey: true,
      systemPrompt: 'You are a research assistant.',
      temperature: 0.7,
      maxTokens: 4096,
    });
    console.log('Created agent:', id);
  };
}
```

---

## Extension Points

To add a new entity type:

1. Define the TypeScript interface
2. Add to AppState interface
3. Create CRUD actions
4. Add default state
5. Update persistence if needed
