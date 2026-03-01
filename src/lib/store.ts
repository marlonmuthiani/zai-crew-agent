import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AI_PROVIDERS } from './ai-providers';

// ============================================
// BASE TYPES
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: number;
  audioUrl?: string;
  agentId?: string;
  agentName?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assigneeId?: string;
  assigneeType?: 'agent' | 'member' | 'team';
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  tags?: string[];
  dependencies?: string[];
}

// ============================================
// AGENT TYPES - MAIN AGENT & SUBAGENT SYSTEM
// ============================================

export type AgentType = 'main' | 'subagent' | 'orchestrator' | 'worker';
export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  tools?: string[];
}

export interface AgentCommunication {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'request' | 'response' | 'broadcast' | 'task' | 'status';
  content: string;
  timestamp: number;
  status: 'pending' | 'delivered' | 'processed';
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;
  
  // Hierarchy
  parentAgentId?: string; // For subagents, this is the main agent
  subagentIds?: string[]; // For main agents, these are their subagents
  
  // Provider config
  provider: string;
  model: string;
  hasApiKey: boolean;
  customEndpoint?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  
  // Capabilities & Tools
  capabilities?: AgentCapability[];
  tools?: string[];
  
  // Communication
  canCommunicateWith?: string[]; // Agent IDs this agent can communicate with
  communicationStyle?: 'direct' | 'broadcast' | 'orchestrated';
  
  // Orchestrator settings
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
  
  // Stats
  stats?: {
    tasksCompleted: number;
    tasksFailed: number;
    totalMessages: number;
    averageResponseTime: number;
  };
}

// ============================================
// BEANS SYSTEM - TASK MANAGEMENT FOR AGENTS
// ============================================

export type BeanStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type BeanPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Bean {
  id: string;
  title: string;
  description?: string;
  content?: string; // Detailed task content
  
  // Scheduling
  status: BeanStatus;
  priority: BeanPriority;
  
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
  dependencies?: string[]; // Bean IDs that must complete first
  blockedBy?: string[];
  
  // Metadata
  tags?: string[];
  category?: string;
  
  // Communication tracking
  messages?: AgentCommunication[];
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ============================================
// TEAM MEMBER TYPES
// ============================================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  teamId?: string;
  agentId?: string; // Reference to Agent
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

// ============================================
// USER SETTINGS
// ============================================

export interface UserSettings {
  // Profile
  displayName: string;
  email: string;
  avatar?: string;
  timezone: string;
  language: string;
  
  // Experience
  darkMode: boolean;
  compactMode: boolean;
  showNotifications: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Chat
  defaultProvider: string;
  defaultModel: string;
  streamResponses: boolean;
  showTokenCount: boolean;
  maxHistoryMessages: number;
  
  // Workspace
  autoIndex: boolean;
  defaultIndexType: 'global' | 'local';
  embeddingProvider: string;
  embeddingModel: string;
  
  // Orchestration
  defaultOrchestratorId?: string;
  autoAssignBeans: boolean;
  maxConcurrentAgents: number;
  communicationMode: 'direct' | 'orchestrated' | 'hybrid';
}

// ============================================
// ORCHESTRATION STATE
// ============================================

export interface OrchestrationSession {
  id: string;
  mainAgentId: string;
  beanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  subagentExecutions: {
    agentId: string;
    status: string;
    result?: string;
    startedAt?: number;
    completedAt?: number;
  }[];
  communications: AgentCommunication[];
  startedAt: number;
  completedAt?: number;
  result?: string;
}

// ============================================

export interface Activity {
  id: string;
  message: string;
  timestamp: number;
  type?: 'info' | 'success' | 'warning' | 'error';
  agentId?: string;
}

// ============================================
// PLUGIN SYSTEM - EXTENSIBILITY
// ============================================

export type PluginStatus = 'active' | 'inactive' | 'error' | 'loading';
export type PluginScope = 'global' | 'agent' | 'team' | 'workspace';
export type PluginTrigger = 'manual' | 'event' | 'schedule' | 'api' | 'keyword';

export interface PluginPermission {
  type: 'read' | 'write' | 'execute' | 'network' | 'file' | 'agent' | 'workspace';
  target?: string; // Specific resource ID if needed
  granted: boolean;
}

export interface PluginConfig {
  [key: string]: string | number | boolean | object;
}

export interface PluginExecution {
  id: string;
  pluginId: string;
  triggeredBy: 'user' | 'agent' | 'system' | 'event';
  agentId?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  error?: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
}

export interface Plugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  
  // Classification
  category: string; // 'utility', 'integration', 'analysis', 'automation', etc.
  tags?: string[];
  
  // Scope & Access
  scope: PluginScope;
  allowedAgentIds?: string[]; // If scope is 'agent'
  allowedTeamIds?: string[]; // If scope is 'team'
  allowedWorkspaceIds?: string[]; // If scope is 'workspace'
  
  // Execution
  trigger: PluginTrigger;
  triggerConfig?: {
    events?: string[]; // Event names to listen to
    schedule?: string; // Cron expression
    keywords?: string[]; // Keywords to trigger
    apiEndpoint?: string; // Custom API endpoint
  };
  
  // Code & Config
  code: string; // JavaScript/TypeScript code to execute
  config?: PluginConfig; // Plugin-specific configuration
  configSchema?: { // JSON schema for config validation
    [key: string]: {
      type: string;
      required?: boolean;
      default?: unknown;
      description?: string;
    };
  };
  
  // Permissions
  permissions: PluginPermission[];
  
  // State
  status: PluginStatus;
  enabled: boolean;
  lastError?: string;
  lastExecutedAt?: number;
  executionCount: number;
  
  // Lifecycle
  isOneTimeUse: boolean; // Created for a single task
  keepAfterUse?: boolean; // If one-time, ask to keep
  
  // Hot Reload
  checksum: string; // For detecting changes
  loadedAt: number;
  
  // Metadata
  icon?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string; // User or agent ID
  
  // Stats
  stats?: {
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
    lastUsedBy?: string;
  };
}

// ============================================
// SKILL SYSTEM - AGENT CAPABILITIES
// ============================================

export type SkillCategory = 'analysis' | 'generation' | 'transformation' | 'communication' | 'research' | 'coding' | 'data' | 'integration' | 'custom';
export type SkillComplexity = 'simple' | 'moderate' | 'complex';
export type SkillStatus = 'available' | 'learning' | 'deprecated' | 'error';

export interface SkillStep {
  id: string;
  name: string;
  description?: string;
  action: string; // Action type: 'call_api', 'run_code', 'use_plugin', 'delegate_agent', etc.
  params?: Record<string, unknown>;
  condition?: string; // Conditional expression
  onError?: 'skip' | 'retry' | 'abort' | 'fallback';
  retryCount?: number;
}

export interface SkillExample {
  input: string;
  output: string;
  context?: Record<string, unknown>;
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: string; // Regex or validation expression
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  
  // Classification
  category: SkillCategory;
  tags?: string[];
  complexity: SkillComplexity;
  
  // Parameters
  parameters: SkillParameter[];
  
  // Execution
  steps: SkillStep[];
  code?: string; // Alternative: raw code execution
  
  // Dependencies
  requiredPlugins?: string[]; // Plugin IDs
  requiredSkills?: string[]; // Skill IDs (nested skills)
  requiredCapabilities?: string[]; // Agent capabilities needed
  
  // Examples & Documentation
  examples: SkillExample[];
  documentation?: string;
  
  // Agent Assignment
  assignedToAgents?: string[]; // Agent IDs that can use this skill
  autoAssignToNewAgents: boolean;
  
  // Learning
  learnFromUsage: boolean; // Improve skill based on usage
  adaptationRules?: string[]; // Rules for adaptation
  
  // State
  status: SkillStatus;
  
  // Lifecycle
  isOneTimeUse: boolean;
  keepAfterUse?: boolean;
  
  // Determinism
  isDeterministic: boolean; // Same input always produces same output
  cacheResults: boolean; // Cache results for repeated inputs
  
  // Metadata
  version: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  
  // Stats
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastUsedAt?: number;
  lastUsedBy?: string;
}

// ============================================
// CAPABILITY QUERY & CREATION
// ============================================

export interface CapabilityQuery {
  id: string;
  agentId: string;
  query: string; // What capability is needed
  context?: Record<string, unknown>;
  status: 'pending' | 'resolved' | 'creating' | 'failed';
  matchedSkills?: string[];
  matchedPlugins?: string[];
  suggestedCreation?: {
    type: 'plugin' | 'skill';
    suggestedName: string;
    suggestedCode?: string;
    reasoning: string;
  };
  createdAt: number;
  resolvedAt?: number;
}

export interface SkillCreationRequest {
  id: string;
  agentId: string;
  requestedCapability: string;
  suggestedSkill?: Partial<Skill>;
  suggestedPlugin?: Partial<Plugin>;
  status: 'pending' | 'approved' | 'rejected' | 'created';
  userDecision?: 'keep' | 'one_time' | 'reject';
  createdAt: number;
}

// ============================================
// OBSERVABILITY SYSTEM
// ============================================

export type AgentActivityType = 
  | 'thinking' 
  | 'executing_task' 
  | 'waiting_for_input' 
  | 'communicating' 
  | 'idle' 
  | 'error'
  | 'completed_task'
  | 'started_task';

export interface AgentActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: AgentActivityType;
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

export interface TaskObservability {
  id: string;
  beanId: string;
  beanTitle: string;
  status: BeanStatus;
  progress: number; // 0-100
  startedAt?: number;
  completedAt?: number;
  estimatedCompletion?: number;
  
  // Agent tracking
  assignedAgentId?: string;
  assignedAgentName?: string;
  agentActivities: AgentActivityEvent[];
  
  // Metrics
  metrics: {
    tokensUsed: number;
    apiCalls: number;
    retryCount: number;
    errorCount: number;
    averageResponseTime: number;
  };
  
  // Timeline
  timeline: {
    timestamp: number;
    event: string;
    details?: string;
  }[];
}

export interface DashboardMetrics {
  // Real-time stats
  activeAgents: number;
  totalAgents: number;
  busyAgents: number;
  idleAgents: number;
  errorAgents: number;
  
  // Task stats
  pendingTasks: number;
  runningTasks: number;
  completedTasksToday: number;
  failedTasksToday: number;
  
  // Performance
  averageTaskDuration: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  apiCallsToday: number;
  
  // System health
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdated: number;
}

export interface ObservabilityDashboard {
  metrics: DashboardMetrics;
  agentActivities: AgentActivityEvent[];
  taskObservabilities: TaskObservability[];
  recentErrors: {
    id: string;
    timestamp: number;
    agentId?: string;
    beanId?: string;
    error: string;
    stack?: string;
  }[];
  
  // Filters
  filters: {
    agentIds?: string[];
    taskStatuses?: BeanStatus[];
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  };
}

// ============================================
// SCHEDULER SYSTEM (CRON-LIKE)
// ============================================

export type ScheduleStatus = 'active' | 'paused' | 'disabled' | 'error';
export type ScheduleType = 'cron' | 'interval' | 'once';
export type ScheduleAction = 
  | 'run_bean' 
  | 'run_plugin' 
  | 'check_capability' 
  | 'send_report' 
  | 'sync_data'
  | 'cleanup'
  | 'backup'
  | 'custom';

export interface ScheduleTrigger {
  type: ScheduleType;
  cronExpression?: string; // e.g., "0 9 * * 1-5" (9 AM weekdays)
  intervalMinutes?: number;
  scheduledTime?: number; // For once type
  timezone: string;
  
  // Conditions
  conditions?: {
    agentAvailable?: string; // Specific agent must be available
    minAgentsAvailable?: number;
    noRunningTasks?: boolean;
    customCondition?: string; // JavaScript expression
  };
}

export interface ScheduleActionConfig {
  type: ScheduleAction;
  
  // For run_bean
  beanId?: string;
  beanConfig?: Partial<Bean>;
  
  // For run_plugin
  pluginId?: string;
  pluginInput?: Record<string, unknown>;
  
  // For check_capability
  capabilityQuery?: string;
  targetAgentId?: string;
  
  // For send_report
  reportType?: 'daily' | 'weekly' | 'metrics' | 'errors';
  recipients?: string[];
  
  // For custom
  customCode?: string;
  
  // General
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
  notifyChannels?: ('email' | 'slack' | 'webhook')[];
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  triggeredAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  
  // Trigger config
  trigger: ScheduleTrigger;
  
  // Action config
  action: ScheduleActionConfig;
  
  // State
  status: ScheduleStatus;
  enabled: boolean;
  
  // Execution tracking
  lastExecutedAt?: number;
  lastExecutionStatus?: 'success' | 'failed' | 'skipped';
  nextExecutionAt?: number;
  executionCount: number;
  failureCount: number;
  consecutiveFailures: number;
  
  // History
  recentExecutions: ScheduleExecution[];
  
  // Orchestrator integration
  orchestratorAgentId?: string; // Agent that can view/trigger this schedule
  visibleToOrchestrator: boolean;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  tags?: string[];
}

// ============================================

interface ApiKeyStore {
  [providerId: string]: boolean;
}

interface AppState {
  // Team Members
  teamMembers: TeamMember[];
  activeMemberId: string | null;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'messages' | 'createdAt'>) => string;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  setActiveMember: (id: string | null) => void;
  
  // Agents (Main Agents & Subagents)
  agents: Agent[];
  activeAgentId: string | null;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setActiveAgent: (id: string | null) => void;
  getAgent: (id: string) => Agent | undefined;
  getMainAgents: () => Agent[];
  getSubagents: (mainAgentId: string) => Agent[];
  linkSubagent: (mainAgentId: string, subagentId: string) => void;
  unlinkSubagent: (mainAgentId: string, subagentId: string) => void;
  
  // Agent Communication
  communications: AgentCommunication[];
  addCommunication: (comm: Omit<AgentCommunication, 'id' | 'timestamp'>) => void;
  getAgentCommunications: (agentId: string) => AgentCommunication[];
  updateCommunicationStatus: (id: string, status: AgentCommunication['status']) => void;
  
  // Beans (Task Management)
  beans: Bean[];
  addBean: (bean: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBean: (id: string, updates: Partial<Bean>) => void;
  deleteBean: (id: string) => void;
  getBeansByStatus: (status: BeanStatus) => Bean[];
  getBeansByAgent: (agentId: string) => Bean[];
  assignBean: (beanId: string, agentId: string) => void;
  
  // Orchestration
  orchestrationSessions: OrchestrationSession[];
  startOrchestration: (mainAgentId: string, beanId: string) => string;
  updateOrchestrationSession: (id: string, updates: Partial<OrchestrationSession>) => void;
  
  // Messages
  addMessage: (memberId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: (memberId: string) => void;
  
  // Tasks (Legacy - keeping for compatibility)
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  // Activity
  activities: Activity[];
  addActivity: (message: string, type?: Activity['type'], agentId?: string) => void;
  
  // API Keys
  apiKeyStatus: ApiKeyStore;
  setApiKeyStatus: (providerId: string, hasKey: boolean) => void;
  
  // User Settings
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  
  // Plugins
  plugins: Plugin[];
  pluginExecutions: PluginExecution[];
  addPlugin: (plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'loadedAt' | 'checksum' | 'executionCount'>) => string;
  updatePlugin: (id: string, updates: Partial<Plugin>) => void;
  deletePlugin: (id: string) => void;
  getPlugin: (id: string) => Plugin | undefined;
  getPluginsByScope: (scope: PluginScope) => Plugin[];
  getPluginsForAgent: (agentId: string) => Plugin[];
  executePlugin: (pluginId: string, input: Record<string, unknown>, triggeredBy: PluginExecution['triggeredBy'], agentId?: string) => Promise<PluginExecution>;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  reloadPlugin: (id: string) => void;
  hotReloadPlugins: () => void;
  
  // Skills
  skills: Skill[];
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'successRate' | 'averageExecutionTime'>) => string;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  getSkill: (id: string) => Skill | undefined;
  getSkillsByCategory: (category: SkillCategory) => Skill[];
  getSkillsForAgent: (agentId: string) => Skill[];
  executeSkill: (skillId: string, params: Record<string, unknown>, agentId: string) => Promise<unknown>;
  assignSkillToAgent: (skillId: string, agentId: string) => void;
  unassignSkillFromAgent: (skillId: string, agentId: string) => void;
  
  // Capability Queries
  capabilityQueries: CapabilityQuery[];
  queryCapabilities: (agentId: string, query: string, context?: Record<string, unknown>) => CapabilityQuery;
  resolveCapabilityQuery: (id: string, resolution: Partial<CapabilityQuery>) => void;
  
  // Skill Creation Requests
  skillCreationRequests: SkillCreationRequest[];
  createSkillRequest: (agentId: string, requestedCapability: string, suggestedSkill?: Partial<Skill>, suggestedPlugin?: Partial<Plugin>) => string;
  respondToSkillRequest: (id: string, decision: 'keep' | 'one_time' | 'reject') => void;
  
  // UI State
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  
  // UI Layout State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Observability
  observabilityDashboard: ObservabilityDashboard;
  agentActivities: AgentActivityEvent[];
  taskObservabilities: TaskObservability[];
  addAgentActivity: (activity: Omit<AgentActivityEvent, 'id'>) => void;
  updateTaskObservability: (beanId: string, updates: Partial<TaskObservability>) => void;
  getObservabilityDashboard: () => ObservabilityDashboard;
  refreshDashboardMetrics: () => void;
  recordAgentActivity: (agentId: string, type: AgentActivityType, description: string, metadata?: AgentActivityEvent['metadata']) => void;
  
  // Scheduler
  schedules: Schedule[];
  scheduleExecutions: ScheduleExecution[];
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'failureCount' | 'consecutiveFailures' | 'recentExecutions'>) => string;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  pauseSchedule: (id: string) => void;
  resumeSchedule: (id: string) => void;
  executeSchedule: (id: string) => Promise<ScheduleExecution>;
  getScheduleNextExecution: (id: string) => number | null;
  getSchedulesForOrchestrator: (agentId: string) => Schedule[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-blue-500 to-cyan-600',
    'bg-gradient-to-br from-green-500 to-emerald-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-red-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-blue-600',
    'bg-gradient-to-br from-teal-500 to-green-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Default user settings
const defaultUserSettings: UserSettings = {
  displayName: 'User',
  email: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'en',
  darkMode: true,
  compactMode: false,
  showNotifications: true,
  soundEnabled: true,
  autoSave: true,
  fontSize: 'medium',
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o',
  streamResponses: true,
  showTokenCount: false,
  maxHistoryMessages: 100,
  autoIndex: true,
  defaultIndexType: 'local',
  embeddingProvider: 'openai',
  embeddingModel: 'text-embedding-3-small',
  autoAssignBeans: true,
  maxConcurrentAgents: 5,
  communicationMode: 'orchestrated',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Team Members
      teamMembers: [],
      activeMemberId: null,
      
      addTeamMember: (member) => {
        const id = generateId();
        const provider = AI_PROVIDERS[member.agent.provider];
        set((state) => ({
          teamMembers: [
            ...state.teamMembers,
            {
              ...member,
              id,
              messages: [],
              createdAt: Date.now(),
              avatar: getAvatarColor(member.name),
              agent: {
                ...member.agent,
                name: member.agent.name || `${member.name}'s Assistant`,
                model: member.agent.model || provider?.defaultModel || 'default',
              },
            },
          ],
        }));
        get().addActivity(`Added team member: ${member.name}`, 'success');
        return id;
      },
      
      updateTeamMember: (id, updates) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },
      
      deleteTeamMember: (id) => {
        const member = get().teamMembers.find((m) => m.id === id);
        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
          activeMemberId: state.activeMemberId === id ? null : state.activeMemberId,
        }));
        if (member) {
          get().addActivity(`Removed team member: ${member.name}`, 'info');
        }
      },
      
      setActiveMember: (id) => {
        set({ activeMemberId: id });
      },
      
      // Agents
      agents: [],
      activeAgentId: null,
      
      addAgent: (agent) => {
        const id = generateId();
        const provider = AI_PROVIDERS[agent.provider];
        const now = Date.now();
        set((state) => ({
          agents: [
            ...state.agents,
            {
              ...agent,
              id,
              createdAt: now,
              updatedAt: now,
              model: agent.model || provider?.defaultModel || 'default',
              stats: {
                tasksCompleted: 0,
                tasksFailed: 0,
                totalMessages: 0,
                averageResponseTime: 0,
              },
            },
          ],
        }));
        get().addActivity(`Created ${agent.type} agent: ${agent.name}`, 'success', id);
        return id;
      },
      
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          ),
        }));
      },
      
      deleteAgent: (id) => {
        const agent = get().agents.find((a) => a.id === id);
        
        // Unlink from parent if subagent
        if (agent?.parentAgentId) {
          get().unlinkSubagent(agent.parentAgentId, id);
        }
        
        // Unlink all subagents if main agent
        if (agent?.subagentIds) {
          agent.subagentIds.forEach(subId => {
            get().updateAgent(subId, { parentAgentId: undefined });
          });
        }
        
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        }));
        if (agent) {
          get().addActivity(`Deleted agent: ${agent.name}`, 'info', id);
        }
      },
      
      setActiveAgent: (id) => {
        set({ activeAgentId: id });
      },
      
      getAgent: (id) => {
        return get().agents.find((a) => a.id === id);
      },
      
      getMainAgents: () => {
        return get().agents.filter((a) => a.type === 'main' || a.type === 'orchestrator');
      },
      
      getSubagents: (mainAgentId) => {
        const mainAgent = get().agents.find((a) => a.id === mainAgentId);
        if (!mainAgent?.subagentIds) return [];
        return get().agents.filter((a) => mainAgent.subagentIds!.includes(a.id));
      },
      
      linkSubagent: (mainAgentId, subagentId) => {
        const mainAgent = get().agents.find((a) => a.id === mainAgentId);
        const subagent = get().agents.find((a) => a.id === subagentId);
        
        if (!mainAgent || !subagent) return;
        
        // Update main agent's subagent list
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === mainAgentId
              ? { ...a, subagentIds: [...(a.subagentIds || []), subagentId], updatedAt: Date.now() }
              : a
          ),
        }));
        
        // Update subagent's parent reference
        get().updateAgent(subagentId, { parentAgentId: mainAgentId });
        get().addActivity(`Linked ${subagent.name} to ${mainAgent.name}`, 'success');
      },
      
      unlinkSubagent: (mainAgentId, subagentId) => {
        const mainAgent = get().agents.find((a) => a.id === mainAgentId);
        
        if (!mainAgent?.subagentIds) return;
        
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === mainAgentId
              ? { ...a, subagentIds: a.subagentIds?.filter(id => id !== subagentId), updatedAt: Date.now() }
              : a
          ),
        }));
        
        get().updateAgent(subagentId, { parentAgentId: undefined });
        get().addActivity(`Unlinked subagent from ${mainAgent.name}`, 'info');
      },
      
      // Agent Communication
      communications: [],
      
      addCommunication: (comm) => {
        const id = generateId();
        set((state) => ({
          communications: [
            ...state.communications,
            { ...comm, id, timestamp: Date.now() },
          ],
        }));
      },
      
      getAgentCommunications: (agentId) => {
        return get().communications.filter(
          (c) => c.fromAgentId === agentId || c.toAgentId === agentId
        );
      },
      
      updateCommunicationStatus: (id, status) => {
        set((state) => ({
          communications: state.communications.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },
      
      // Beans
      beans: [],
      
      addBean: (bean) => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          beans: [
            ...state.beans,
            { ...bean, id, createdAt: now, updatedAt: now },
          ],
        }));
        get().addActivity(`Created bean: ${bean.title}`, 'success');
        return id;
      },
      
      updateBean: (id, updates) => {
        set((state) => ({
          beans: state.beans.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
          ),
        }));
      },
      
      deleteBean: (id) => {
        const bean = get().beans.find((b) => b.id === id);
        set((state) => ({
          beans: state.beans.filter((b) => b.id !== id),
        }));
        if (bean) {
          get().addActivity(`Deleted bean: ${bean.title}`, 'info');
        }
      },
      
      getBeansByStatus: (status) => {
        return get().beans.filter((b) => b.status === status);
      },
      
      getBeansByAgent: (agentId) => {
        return get().beans.filter((b) => b.assignedAgentId === agentId);
      },
      
      assignBean: (beanId, agentId) => {
        const bean = get().beans.find((b) => b.id === beanId);
        const agent = get().agents.find((a) => a.id === agentId);
        
        get().updateBean(beanId, {
          assignedAgentId: agentId,
          assignedAt: Date.now(),
          status: 'queued',
        });
        
        if (bean && agent) {
          get().addActivity(`Assigned "${bean.title}" to ${agent.name}`, 'success', agentId);
        }
      },
      
      // Orchestration
      orchestrationSessions: [],
      
      startOrchestration: (mainAgentId, beanId) => {
        const id = generateId();
        const session: OrchestrationSession = {
          id,
          mainAgentId,
          beanId,
          status: 'pending',
          subagentExecutions: [],
          communications: [],
          startedAt: Date.now(),
        };
        
        set((state) => ({
          orchestrationSessions: [...state.orchestrationSessions, session],
        }));
        
        get().addActivity(`Started orchestration session`, 'info', mainAgentId);
        return id;
      },
      
      updateOrchestrationSession: (id, updates) => {
        set((state) => ({
          orchestrationSessions: state.orchestrationSessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      
      // Messages
      addMessage: (memberId, message) => {
        const id = generateId();
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  messages: [
                    ...m.messages,
                    { ...message, id, timestamp: Date.now() },
                  ],
                }
              : m
          ),
        }));
      },
      
      clearMessages: (memberId) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === memberId ? { ...m, messages: [] } : m
          ),
        }));
      },
      
      // Tasks (Legacy)
      tasks: [],
      
      addTask: (task) => {
        const id = generateId();
        set((state) => ({
          tasks: [...state.tasks, { ...task, id, createdAt: Date.now() }],
        }));
        get().addActivity(`Created task: ${task.title}`, 'success');
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },
      
      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
        if (task) {
          get().addActivity(`Deleted task: ${task.title}`, 'info');
        }
      },
      
      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
        if (task) {
          get().addActivity(
            `${task.completed ? 'Reopened' : 'Completed'} task: ${task.title}`,
            task.completed ? 'info' : 'success'
          );
        }
      },
      
      // Activity
      activities: [],
      
      addActivity: (message, type = 'info', agentId) => {
        const id = generateId();
        set((state) => ({
          activities: [{ id, message, timestamp: Date.now(), type, agentId }, ...state.activities].slice(0, 200),
        }));
      },
      
      // API Key Status
      apiKeyStatus: {},
      
      setApiKeyStatus: (providerId, hasKey) => {
        set((state) => ({
          apiKeyStatus: { ...state.apiKeyStatus, [providerId]: hasKey },
        }));
      },
      
      // User Settings
      userSettings: defaultUserSettings,
      
      updateUserSettings: (newSettings) => {
        set((state) => ({
          userSettings: { ...state.userSettings, ...newSettings },
        }));
      },
      
      // Plugins
      plugins: [],
      pluginExecutions: [],
      
      addPlugin: (plugin) => {
        const id = generateId();
        const now = Date.now();
        const checksum = Buffer.from(plugin.code).toString('base64').slice(0, 32);
        
        set((state) => ({
          plugins: [
            ...state.plugins,
            {
              ...plugin,
              id,
              createdAt: now,
              updatedAt: now,
              loadedAt: now,
              checksum,
              executionCount: 0,
              stats: {
                successCount: 0,
                failureCount: 0,
                averageExecutionTime: 0,
              },
            },
          ],
        }));
        
        get().addActivity(`Created plugin: ${plugin.name}`, 'success');
        return id;
      },
      
      updatePlugin: (id, updates) => {
        const now = Date.now();
        let newChecksum = undefined;
        
        if (updates.code) {
          newChecksum = Buffer.from(updates.code).toString('base64').slice(0, 32);
        }
        
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === id ? { 
              ...p, 
              ...updates, 
              updatedAt: now,
              checksum: newChecksum || p.checksum,
              loadedAt: newChecksum ? now : p.loadedAt,
            } : p
          ),
        }));
      },
      
      deletePlugin: (id) => {
        const plugin = get().plugins.find((p) => p.id === id);
        set((state) => ({
          plugins: state.plugins.filter((p) => p.id !== id),
        }));
        if (plugin) {
          get().addActivity(`Deleted plugin: ${plugin.name}`, 'info');
        }
      },
      
      getPlugin: (id) => {
        return get().plugins.find((p) => p.id === id);
      },
      
      getPluginsByScope: (scope) => {
        return get().plugins.filter((p) => p.scope === scope && p.enabled);
      },
      
      getPluginsForAgent: (agentId) => {
        return get().plugins.filter((p) => {
          if (!p.enabled) return false;
          if (p.scope === 'global') return true;
          if (p.scope === 'agent' && p.allowedAgentIds?.includes(agentId)) return true;
          return false;
        });
      },
      
      executePlugin: async (pluginId, input, triggeredBy, agentId) => {
        const plugin = get().plugins.find((p) => p.id === pluginId);
        if (!plugin) {
          throw new Error(`Plugin not found: ${pluginId}`);
        }
        
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
        
        set((state) => ({
          pluginExecutions: [...state.pluginExecutions, execution],
        }));
        
        try {
          // Create sandboxed execution context
          const sandbox = {
            input,
            config: plugin.config || {},
            console: { log: () => {}, error: () => {}, warn: () => {} },
            fetch: typeof fetch !== 'undefined' ? fetch : undefined,
            JSON,
            Object,
            Array,
            String,
            Number,
            Boolean,
            Date,
            Math,
          };
          
          // Execute plugin code in sandbox
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const fn = new AsyncFunction(...Object.keys(sandbox), plugin.code);
          const output = await fn(...Object.values(sandbox));
          
          const completedAt = Date.now();
          const duration = completedAt - execution.startedAt;
          
          // Update execution record
          set((state) => ({
            pluginExecutions: state.pluginExecutions.map((e) =>
              e.id === executionId ? { 
                ...e, 
                status: 'completed', 
                output: typeof output === 'object' ? output : { result: output },
                completedAt,
                duration,
              } : e
            ),
          }));
          
          // Update plugin stats
          const stats = plugin.stats || { successCount: 0, failureCount: 0, averageExecutionTime: 0 };
          const newAvgTime = (stats.averageExecutionTime * stats.successCount + duration) / (stats.successCount + 1);
          
          get().updatePlugin(pluginId, {
            lastExecutedAt: completedAt,
            executionCount: plugin.executionCount + 1,
            stats: {
              ...stats,
              successCount: stats.successCount + 1,
              averageExecutionTime: newAvgTime,
              lastUsedBy: agentId,
            },
          });
          
          return { ...execution, status: 'completed', output, completedAt, duration };
          
        } catch (error: unknown) {
          const completedAt = Date.now();
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          set((state) => ({
            pluginExecutions: state.pluginExecutions.map((e) =>
              e.id === executionId ? { 
                ...e, 
                status: 'failed', 
                error: errorMessage,
                completedAt,
                duration: completedAt - e.startedAt,
              } : e
            ),
          }));
          
          get().updatePlugin(pluginId, {
            lastError: errorMessage,
            stats: {
              ...(plugin.stats || { successCount: 0, failureCount: 0, averageExecutionTime: 0 }),
              failureCount: (plugin.stats?.failureCount || 0) + 1,
            },
          });
          
          throw error;
        }
      },
      
      enablePlugin: (id) => {
        get().updatePlugin(id, { enabled: true, status: 'active' });
      },
      
      disablePlugin: (id) => {
        get().updatePlugin(id, { enabled: false, status: 'inactive' });
      },
      
      reloadPlugin: (id) => {
        const plugin = get().plugins.find((p) => p.id === id);
        if (plugin) {
          get().updatePlugin(id, { 
            status: 'loading',
            loadedAt: Date.now(),
            lastError: undefined,
          });
          // Simulate reload
          setTimeout(() => {
            get().updatePlugin(id, { status: 'active' });
          }, 100);
        }
      },
      
      hotReloadPlugins: () => {
        const plugins = get().plugins;
        plugins.forEach((plugin) => {
          const currentChecksum = Buffer.from(plugin.code).toString('base64').slice(0, 32);
          if (currentChecksum !== plugin.checksum) {
            get().reloadPlugin(plugin.id);
          }
        });
      },
      
      // Skills
      skills: [],
      
      addSkill: (skill) => {
        const id = generateId();
        const now = Date.now();
        
        set((state) => ({
          skills: [
            ...state.skills,
            {
              ...skill,
              id,
              createdAt: now,
              updatedAt: now,
              usageCount: 0,
              successRate: 1.0,
              averageExecutionTime: 0,
            },
          ],
        }));
        
        get().addActivity(`Created skill: ${skill.name}`, 'success');
        return id;
      },
      
      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },
      
      deleteSkill: (id) => {
        const skill = get().skills.find((s) => s.id === id);
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
        }));
        if (skill) {
          get().addActivity(`Deleted skill: ${skill.name}`, 'info');
        }
      },
      
      getSkill: (id) => {
        return get().skills.find((s) => s.id === id);
      },
      
      getSkillsByCategory: (category) => {
        return get().skills.filter((s) => s.category === category);
      },
      
      getSkillsForAgent: (agentId) => {
        return get().skills.filter((s) => {
          if (s.status !== 'available') return false;
          if (s.autoAssignToNewAgents) return true;
          if (s.assignedToAgents?.includes(agentId)) return true;
          return false;
        });
      },
      
      executeSkill: async (skillId, params, agentId) => {
        const skill = get().skills.find((s) => s.id === skillId);
        if (!skill) {
          throw new Error(`Skill not found: ${skillId}`);
        }
        
        const startTime = Date.now();
        
        try {
          let result: unknown;
          
          // If skill has code, execute it
          if (skill.code) {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction('params', 'context', skill.code);
            result = await fn(params, { agentId, skill });
          } else {
            // Execute steps
            for (const step of skill.steps) {
              // Execute step based on action type
              switch (step.action) {
                case 'call_api':
                  if (step.params?.url) {
                    const response = await fetch(step.params.url as string, {
                      method: (step.params.method as string) || 'GET',
                      headers: step.params.headers as Record<string, string>,
                      body: step.params.body ? JSON.stringify(step.params.body) : undefined,
                    });
                    result = await response.json();
                  }
                  break;
                case 'run_code':
                  if (step.params?.code) {
                    const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
                    const fn = new AsyncFn('params', 'result', step.params.code as string);
                    result = await fn(params, result);
                  }
                  break;
                case 'use_plugin':
                  if (step.params?.pluginId) {
                    const execResult = await get().executePlugin(
                      step.params.pluginId as string,
                      { ...(step.params as Record<string, unknown>), ...params },
                      'agent',
                      agentId
                    );
                    result = execResult.output;
                  }
                  break;
                default:
                  result = params;
              }
            }
          }
          
          const duration = Date.now() - startTime;
          
          // Update skill stats
          get().updateSkill(skillId, {
            usageCount: skill.usageCount + 1,
            successRate: (skill.successRate * skill.usageCount + 1) / (skill.usageCount + 1),
            averageExecutionTime: (skill.averageExecutionTime * skill.usageCount + duration) / (skill.usageCount + 1),
            lastUsedAt: Date.now(),
            lastUsedBy: agentId,
          });
          
          return result;
          
        } catch (error: unknown) {
          const duration = Date.now() - startTime;
          
          get().updateSkill(skillId, {
            usageCount: skill.usageCount + 1,
            successRate: (skill.successRate * skill.usageCount) / (skill.usageCount + 1),
            averageExecutionTime: (skill.averageExecutionTime * skill.usageCount + duration) / (skill.usageCount + 1),
            lastUsedAt: Date.now(),
            lastUsedBy: agentId,
          });
          
          throw error;
        }
      },
      
      assignSkillToAgent: (skillId, agentId) => {
        const skill = get().skills.find((s) => s.id === skillId);
        if (skill) {
          get().updateSkill(skillId, {
            assignedToAgents: [...(skill.assignedToAgents || []), agentId],
          });
        }
      },
      
      unassignSkillFromAgent: (skillId, agentId) => {
        const skill = get().skills.find((s) => s.id === skillId);
        if (skill) {
          get().updateSkill(skillId, {
            assignedToAgents: skill.assignedToAgents?.filter((id) => id !== agentId),
          });
        }
      },
      
      // Capability Queries
      capabilityQueries: [],
      
      queryCapabilities: (agentId, query, context) => {
        const id = generateId();
        
        // Find matching skills and plugins
        const matchedSkills = get().skills
          .filter((s) => 
            s.status === 'available' &&
            (s.name.toLowerCase().includes(query.toLowerCase()) ||
             s.description.toLowerCase().includes(query.toLowerCase()) ||
             s.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase())))
          )
          .map((s) => s.id);
        
        const matchedPlugins = get().plugins
          .filter((p) =>
            p.enabled &&
            (p.name.toLowerCase().includes(query.toLowerCase()) ||
             p.description?.toLowerCase().includes(query.toLowerCase()) ||
             p.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase())))
          )
          .map((p) => p.id);
        
        const capabilityQuery: CapabilityQuery = {
          id,
          agentId,
          query,
          context,
          status: matchedSkills.length > 0 || matchedPlugins.length > 0 ? 'resolved' : 'pending',
          matchedSkills,
          matchedPlugins,
          createdAt: Date.now(),
        };
        
        // If no matches, suggest creation
        if (matchedSkills.length === 0 && matchedPlugins.length === 0) {
          capabilityQuery.suggestedCreation = {
            type: 'skill',
            suggestedName: query,
            reasoning: `No existing capability found for "${query}". A new skill could be created to handle this.`,
          };
          capabilityQuery.status = 'pending';
        }
        
        set((state) => ({
          capabilityQueries: [...state.capabilityQueries, capabilityQuery],
        }));
        
        return capabilityQuery;
      },
      
      resolveCapabilityQuery: (id, resolution) => {
        set((state) => ({
          capabilityQueries: state.capabilityQueries.map((q) =>
            q.id === id ? { ...q, ...resolution, resolvedAt: Date.now() } : q
          ),
        }));
      },
      
      // Skill Creation Requests
      skillCreationRequests: [],
      
      createSkillRequest: (agentId, requestedCapability, suggestedSkill, suggestedPlugin) => {
        const id = generateId();
        
        const request: SkillCreationRequest = {
          id,
          agentId,
          requestedCapability,
          suggestedSkill,
          suggestedPlugin,
          status: 'pending',
          createdAt: Date.now(),
        };
        
        set((state) => ({
          skillCreationRequests: [...state.skillCreationRequests, request],
        }));
        
        get().addActivity(`Agent requested new capability: ${requestedCapability}`, 'warning', agentId);
        return id;
      },
      
      respondToSkillRequest: (id, decision) => {
        const request = get().skillCreationRequests.find((r) => r.id === id);
        
        if (decision === 'reject') {
          set((state) => ({
            skillCreationRequests: state.skillCreationRequests.map((r) =>
              r.id === id ? { ...r, status: 'rejected', userDecision: decision } : r
            ),
          }));
          return;
        }
        
        if (decision === 'keep' || decision === 'one_time') {
          const isOneTime = decision === 'one_time';
          
          if (request?.suggestedSkill) {
            const skillId = get().addSkill({
              ...request.suggestedSkill,
              name: request.suggestedSkill.name || request.requestedCapability,
              description: request.suggestedSkill.description || `Created for: ${request.requestedCapability}`,
              category: request.suggestedSkill.category || 'custom',
              complexity: request.suggestedSkill.complexity || 'simple',
              parameters: request.suggestedSkill.parameters || [],
              steps: request.suggestedSkill.steps || [],
              examples: request.suggestedSkill.examples || [],
              isOneTimeUse: isOneTime,
              keepAfterUse: !isOneTime,
              isDeterministic: request.suggestedSkill.isDeterministic ?? true,
              cacheResults: request.suggestedSkill.cacheResults ?? false,
              autoAssignToNewAgents: false,
              learnFromUsage: true,
              status: 'available',
              version: '1.0.0',
              createdBy: request.agentId,
            });
            
            get().assignSkillToAgent(skillId, request.agentId);
          }
          
          if (request?.suggestedPlugin) {
            get().addPlugin({
              ...request.suggestedPlugin,
              name: request.suggestedPlugin.name || request.requestedCapability,
              description: request.suggestedPlugin.description || `Created for: ${request.requestedCapability}`,
              category: request.suggestedPlugin.category || 'utility',
              scope: request.suggestedPlugin.scope || 'agent',
              trigger: request.suggestedPlugin.trigger || 'manual',
              code: request.suggestedPlugin.code || '',
              permissions: request.suggestedPlugin.permissions || [],
              isOneTimeUse: isOneTime,
              keepAfterUse: !isOneTime,
              enabled: true,
              status: 'active',
              version: request.suggestedPlugin.version || '1.0.0',
              createdBy: request.agentId,
            });
          }
          
          set((state) => ({
            skillCreationRequests: state.skillCreationRequests.map((r) =>
              r.id === id ? { ...r, status: 'created', userDecision: decision } : r
            ),
          }));
        }
      },
      
      // UI State
      isRecording: false,
      setIsRecording: (recording) => set({ isRecording: recording }),
      
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      // Observability State
      observabilityDashboard: {
        metrics: {
          activeAgents: 0,
          totalAgents: 0,
          busyAgents: 0,
          idleAgents: 0,
          errorAgents: 0,
          pendingTasks: 0,
          runningTasks: 0,
          completedTasksToday: 0,
          failedTasksToday: 0,
          averageTaskDuration: 0,
          averageResponseTime: 0,
          totalTokensUsed: 0,
          apiCallsToday: 0,
          systemHealth: 'healthy',
          lastUpdated: Date.now(),
        },
        agentActivities: [],
        taskObservabilities: [],
        recentErrors: [],
        filters: {
          timeRange: '24h',
        },
      },
      agentActivities: [],
      taskObservabilities: [],
      
      addAgentActivity: (activity) => {
        const id = generateId();
        set((state) => ({
          agentActivities: [
            { ...activity, id },
            ...state.agentActivities,
          ].slice(0, 1000), // Keep last 1000 activities
        }));
      },
      
      updateTaskObservability: (beanId, updates) => {
        set((state) => ({
          taskObservabilities: state.taskObservabilities.map((t) =>
            t.beanId === beanId ? { ...t, ...updates } : t
          ),
        }));
      },
      
      getObservabilityDashboard: () => {
        const state = get();
        const agents = state.agents;
        const beans = state.beans;
        
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        const metrics: DashboardMetrics = {
          activeAgents: agents.filter(a => a.status === 'busy' || a.status === 'idle').length,
          totalAgents: agents.length,
          busyAgents: agents.filter(a => a.status === 'busy').length,
          idleAgents: agents.filter(a => a.status === 'idle').length,
          errorAgents: agents.filter(a => a.status === 'error').length,
          pendingTasks: beans.filter(b => b.status === 'pending' || b.status === 'queued').length,
          runningTasks: beans.filter(b => b.status === 'running').length,
          completedTasksToday: beans.filter(b => b.status === 'completed' && b.completedAt && b.completedAt > oneDayAgo).length,
          failedTasksToday: beans.filter(b => b.status === 'failed' && b.completedAt && b.completedAt > oneDayAgo).length,
          averageTaskDuration: 0,
          averageResponseTime: 0,
          totalTokensUsed: 0,
          apiCallsToday: state.agentActivities.filter(a => a.timestamp > oneDayAgo).length,
          systemHealth: agents.filter(a => a.status === 'error').length > agents.length / 2 ? 'critical' : 
                        agents.filter(a => a.status === 'error').length > 0 ? 'degraded' : 'healthy',
          lastUpdated: now,
        };
        
        const recentErrors = state.agentActivities
          .filter(a => a.type === 'error' && a.timestamp > oneDayAgo)
          .map(a => ({
            id: a.id,
            timestamp: a.timestamp,
            agentId: a.agentId,
            beanId: a.metadata?.beanId,
            error: a.metadata?.error || a.description,
          }));
        
        return {
          metrics,
          agentActivities: state.agentActivities,
          taskObservabilities: state.taskObservabilities,
          recentErrors,
          filters: state.observabilityDashboard.filters,
        };
      },
      
      refreshDashboardMetrics: () => {
        const dashboard = get().getObservabilityDashboard();
        set({ observabilityDashboard: dashboard });
      },
      
      recordAgentActivity: (agentId, type, description, metadata) => {
        const agent = get().agents.find(a => a.id === agentId);
        const agentName = agent?.name || 'Unknown Agent';
        get().addAgentActivity({
          agentId,
          agentName,
          type,
          description,
          timestamp: Date.now(),
          metadata,
        });
      },
      
      // Scheduler State
      schedules: [],
      scheduleExecutions: [],
      
      addSchedule: (schedule) => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          schedules: [
            ...state.schedules,
            {
              ...schedule,
              id,
              createdAt: now,
              updatedAt: now,
              executionCount: 0,
              failureCount: 0,
              consecutiveFailures: 0,
              recentExecutions: [],
            },
          ],
        }));
        get().addActivity(`Created schedule: ${schedule.name}`, 'success');
        return id;
      },
      
      updateSchedule: (id, updates) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },
      
      deleteSchedule: (id) => {
        const schedule = get().schedules.find((s) => s.id === id);
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        }));
        if (schedule) {
          get().addActivity(`Deleted schedule: ${schedule.name}`, 'info');
        }
      },
      
      pauseSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, status: 'paused', updatedAt: Date.now() } : s
          ),
        }));
      },
      
      resumeSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, status: 'active', updatedAt: Date.now() } : s
          ),
        }));
      },
      
      executeSchedule: async (id) => {
        const schedule = get().schedules.find((s) => s.id === id);
        if (!schedule) {
          throw new Error('Schedule not found');
        }
        
        const executionId = generateId();
        const execution: ScheduleExecution = {
          id: executionId,
          scheduleId: id,
          triggeredAt: Date.now(),
          status: 'running',
        };
        
        // Add execution to history
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? {
              ...s,
              lastExecutedAt: Date.now(),
              executionCount: s.executionCount + 1,
              recentExecutions: [execution, ...s.recentExecutions].slice(0, 50),
            } : s
          ),
          scheduleExecutions: [...state.scheduleExecutions, execution],
        }));
        
        try {
          // Execute the action based on type
          let result = '';
          const action = schedule.action;
          
          switch (action.type) {
            case 'run_bean':
              if (action.beanId) {
                const bean = get().beans.find(b => b.id === action.beanId);
                if (bean) {
                  result = `Executed bean: ${bean.title}`;
                }
              }
              break;
            case 'run_plugin':
              if (action.pluginId) {
                result = `Executed plugin: ${action.pluginId}`;
              }
              break;
            case 'send_report':
              result = `Sent ${action.reportType || 'daily'} report`;
              break;
            case 'check_capability':
              result = `Checked capability: ${action.capabilityQuery}`;
              break;
            default:
              result = 'Executed custom action';
          }
          
          // Update execution as completed
          const completedExecution: ScheduleExecution = {
            ...execution,
            startedAt: execution.triggeredAt,
            completedAt: Date.now(),
            status: 'completed',
            result,
            duration: Date.now() - execution.triggeredAt,
          };
          
          set((state) => ({
            schedules: state.schedules.map((s) =>
              s.id === id ? {
                ...s,
                lastExecutionStatus: 'success',
                consecutiveFailures: 0,
                recentExecutions: [completedExecution, ...s.recentExecutions.slice(0, 49)],
              } : s
            ),
            scheduleExecutions: state.scheduleExecutions.map((e) =>
              e.id === executionId ? completedExecution : e
            ),
          }));
          
          get().addActivity(`Schedule executed: ${schedule.name}`, 'success');
          return completedExecution;
          
        } catch (error) {
          // Update execution as failed
          const failedExecution: ScheduleExecution = {
            ...execution,
            startedAt: execution.triggeredAt,
            completedAt: Date.now(),
            status: 'failed',
            error: String(error),
            duration: Date.now() - execution.triggeredAt,
          };
          
          set((state) => ({
            schedules: state.schedules.map((s) =>
              s.id === id ? {
                ...s,
                lastExecutionStatus: 'failed',
                failureCount: s.failureCount + 1,
                consecutiveFailures: s.consecutiveFailures + 1,
                recentExecutions: [failedExecution, ...s.recentExecutions.slice(0, 49)],
              } : s
            ),
            scheduleExecutions: state.scheduleExecutions.map((e) =>
              e.id === executionId ? failedExecution : e
            ),
          }));
          
          get().addActivity(`Schedule failed: ${schedule.name} - ${error}`, 'error');
          return failedExecution;
        }
      },
      
      getScheduleNextExecution: (id) => {
        const schedule = get().schedules.find((s) => s.id === id);
        if (!schedule || !schedule.enabled || schedule.status !== 'active') {
          return null;
        }
        
        const now = Date.now();
        const { type, cronExpression, intervalMinutes, scheduledTime } = schedule.trigger;
        
        if (type === 'once' && scheduledTime) {
          return scheduledTime > now ? scheduledTime : null;
        }
        
        if (type === 'interval' && intervalMinutes) {
          const lastExecuted = schedule.lastExecutedAt || now;
          return lastExecuted + intervalMinutes * 60 * 1000;
        }
        
        if (type === 'cron' && cronExpression) {
          // Simplified next execution calculation
          // In production, use a proper cron parser
          return now + 60 * 60 * 1000; // Default to 1 hour from now
        }
        
        return null;
      },
      
      getSchedulesForOrchestrator: (agentId) => {
        return get().schedules.filter((s) => 
          s.visibleToOrchestrator && 
          (s.orchestratorAgentId === agentId || !s.orchestratorAgentId)
        );
      },
    }),
    {
      name: 'team-ai-hub-storage',
      partialize: (state) => ({
        teamMembers: state.teamMembers,
        agents: state.agents,
        beans: state.beans,
        tasks: state.tasks,
        activities: state.activities,
        userSettings: state.userSettings,
        apiKeyStatus: state.apiKeyStatus,
        communications: state.communications,
        orchestrationSessions: state.orchestrationSessions,
        sidebarCollapsed: state.sidebarCollapsed,
        plugins: state.plugins,
        skills: state.skills,
        pluginExecutions: state.pluginExecutions,
        capabilityQueries: state.capabilityQueries,
        skillCreationRequests: state.skillCreationRequests,
        agentActivities: state.agentActivities,
        taskObservabilities: state.taskObservabilities,
        schedules: state.schedules,
        scheduleExecutions: state.scheduleExecutions,
      }),
    }
  )
);
