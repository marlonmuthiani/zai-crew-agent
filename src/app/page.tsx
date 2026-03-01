'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Plus, Settings, Mic, Send, Trash2, Check, 
  User, Sparkles, Search, Moon, Sun,
  CheckCircle2, Circle, AlertCircle, Key,
  ChevronRight, X, Loader2, AudioWaveform, FolderTree,
  Database, FileText, FolderOpen, File,
  Play, RefreshCw, Layers, Hash, Network,
  Upload, Download, Users, Shield, Globe, Lock,
  Link, Unlink, MessageSquare, History,
  BotMessageSquare, Palette, Bell, Volume2, Save,
  Zap, Clock, Languages, UserCircle, KeyRound,
  Building2, Crown, Edit, Copy, Command, 
  PanelLeftClose, PanelLeft, ChevronDown, ChevronUp,
  GitBranch, Workflow, Activity, ArrowRightLeft,
  List, NetworkIcon, Calendar, Flag, AlertTriangle,
  PlayCircle, PauseCircle, CheckCircle, XCircle,
  Eye, Timer, Radio, BarChart3, TrendingUp, TrendingDown,
  Cpu, HardDrive, Wifi, WifiOff, RotateCcw, Pause, FastForward,
  Plug, LayoutGrid, Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Command as CommandComponent, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useAppStore, type Agent, type Bean, type AgentCommunication, type OrchestrationSession, type Plugin, type Skill, type PluginScope, type PluginTrigger, type SkillCategory, type SkillComplexity, type SkillCreationRequest, type Schedule, type ScheduleExecution, type AgentActivityEvent, type TaskObservability, type DashboardMetrics, type ObservabilityDashboard, type ScheduleType, type ScheduleAction, type ScheduleStatus } from '@/lib/store';
import { AI_PROVIDERS, PROVIDER_COUNT, getProvidersByCategory } from '@/lib/ai-providers';

// ============================================
// WORKSPACE TYPES
// ============================================
interface WorkspaceFolder {
  id: string;
  workspaceId: string;
  parentId?: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  content?: string;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: number;
  updatedAt: number;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  indexType: 'global' | 'local';
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  settings: {
    autoIndex: boolean;
    indexDepth: number;
    similarityThreshold: number;
    indexSessions: boolean;
    indexFiles: boolean;
  };
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalEmbeddings: number;
    totalSessions: number;
    lastIndexed?: number;
  };
  access: {
    ownerId: string;
    sharedWith: string[];
    isPublic: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: { allowMemberInvite: boolean; requireApproval: boolean; maxMembers: number };
  stats: { totalMembers: number; activeMembers: number };
  createdAt: number;
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: number;
}

// ============================================
// EMBEDDING PROVIDERS
// ============================================
const EMBEDDING_PROVIDERS: Record<string, { name: string; icon: string; models: string[] }> = {
  openai: { name: 'OpenAI', icon: '🟢', models: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'] },
  voyage: { name: 'Voyage AI', icon: '🧭', models: ['voyage-3', 'voyage-3-lite', 'voyage-2'] },
  cohere: { name: 'Cohere', icon: '🔴', models: ['embed-english-v3.0', 'embed-multilingual-v3.0'] },
  jina: { name: 'Jina AI', icon: '🔗', models: ['jina-embeddings-v3', 'jina-embeddings-v2-base-en'] },
  google: { name: 'Google AI', icon: '🔵', models: ['text-embedding-004'] },
  mistral: { name: 'Mistral', icon: '🌀', models: ['mistral-embed'] },
  zai: { name: 'Z.ai', icon: '🤖', models: ['embedding-2', 'embedding-3'] },
};

// ============================================
// AUDIO RECORDING HOOK
// ============================================
function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async (): Promise<string> => {
    if (!audioBlob) return '';
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await fetch('/api/speech', { method: 'POST', body: formData });
      const data = await response.json();
      setAudioBlob(null);
      return data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
      return '';
    }
  }, [audioBlob]);

  return { isRecording, startRecording, stopRecording, transcribeAudio };
}

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================
function CommandPalette({ 
  open, 
  onOpenChange, 
  onNavigate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string) => void;
}) {
  const [search, setSearch] = useState('');
  
  const commands = [
    { group: 'Navigation', items: [
      { id: 'team', label: 'Go to Team', icon: Users, shortcut: 'G T' },
      { id: 'agents', label: 'Go to Agents', icon: BotMessageSquare, shortcut: 'G A' },
      { id: 'beans', label: 'Go to Beans', icon: Activity, shortcut: 'G B' },
      { id: 'workspaces', label: 'Go to Workspaces', icon: Database, shortcut: 'G W' },
      { id: 'teams', label: 'Go to Teams', icon: Shield, shortcut: 'G M' },
    ]},
    { group: 'Actions', items: [
      { id: 'add-member', label: 'Add Team Member', icon: UserPlus, shortcut: 'N M' },
      { id: 'add-agent', label: 'Create New Agent', icon: Plus, shortcut: 'N A' },
      { id: 'add-bean', label: 'Create New Bean', icon: Plus, shortcut: 'N B' },
      { id: 'add-workspace', label: 'Create New Workspace', icon: Plus, shortcut: 'N W' },
      { id: 'settings', label: 'Open Settings', icon: Settings, shortcut: '⌘ ,' },
    ]},
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <CommandComponent className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input-wrapper]]:h-12 [&_[cmdk-input]]:h-12">
          <CommandInput 
            placeholder="Type a command or search..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No results found.</CommandEmpty>
            {commands.map((group) => (
              <CommandGroup key={group.group} heading={group.group} className="p-2">
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => {
                      if (item.id.startsWith('add-') || item.id === 'settings') {
                        // These will be handled by the parent component
                        onOpenChange(false);
                      } else {
                        onNavigate(item.id);
                        onOpenChange(false);
                      }
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      {item.shortcut}
                    </kbd>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandComponent>
      </DialogContent>
    </Dialog>
  );
}

// Helper component icon
const UserPlus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
);

// ============================================
// AGENT HIERARCHY VIEW COMPONENT
// ============================================
function AgentHierarchyView({ 
  agents, 
  onSelectAgent, 
  selectedAgentId,
  onLinkSubagent,
  onUnlinkSubagent 
}: { 
  agents: Agent[];
  onSelectAgent: (id: string) => void;
  selectedAgentId: string | null;
  onLinkSubagent: (mainId: string, subId: string) => void;
  onUnlinkSubagent: (mainId: string, subId: string) => void;
}) {
  const [showLinkDialog, setShowLinkDialog] = useState<string | null>(null);
  
  const mainAgents = agents.filter(a => a.type === 'main' || a.type === 'orchestrator');
  const subagents = agents.filter(a => a.type === 'subagent' || a.type === 'worker');
  const unlinkedSubagents = subagents.filter(s => !s.parentAgentId);

  return (
    <div className="space-y-4">
      {mainAgents.map((mainAgent) => {
        const linkedSubagents = agents.filter(a => mainAgent.subagentIds?.includes(a.id));
        
        return (
          <Card key={mainAgent.id} className={cn(
            'transition-all',
            selectedAgentId === mainAgent.id && 'ring-2 ring-primary'
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => onSelectAgent(mainAgent.id)}
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl">
                    {mainAgent.icon || '🤖'}
                  </div>
                  <div>
                    <CardTitle className="text-base">{mainAgent.name}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {mainAgent.type === 'orchestrator' ? 'Orchestrator' : 'Main Agent'}
                      </Badge>
                      <span>{linkedSubagents.length} subagent(s)</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowLinkDialog(mainAgent.id)}
                >
                  <Link className="h-4 w-4 mr-1" /> Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linkedSubagents.length > 0 ? (
                <div className="ml-4 border-l-2 border-muted pl-4 space-y-2">
                  {linkedSubagents.map((sub) => (
                    <div 
                      key={sub.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer',
                        selectedAgentId === sub.id && 'bg-muted'
                      )}
                      onClick={() => onSelectAgent(sub.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm">
                          {sub.icon || '⚙️'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{sub.name}</div>
                          <div className="text-xs text-muted-foreground">{sub.type}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnlinkSubagent(mainAgent.id, sub.id);
                        }}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground ml-4 border-l-2 border-muted pl-4">
                  No subagents linked
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {/* Unlinked Subagents */}
      {unlinkedSubagents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Unlinked Subagents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unlinkedSubagents.map((sub) => (
              <div 
                key={sub.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer',
                  selectedAgentId === sub.id && 'bg-muted'
                )}
                onClick={() => onSelectAgent(sub.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-500 flex items-center justify-center text-sm">
                    {sub.icon || '⚙️'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{sub.name}</div>
                    <div className="text-xs text-muted-foreground">{sub.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Link Subagent Dialog */}
      <Dialog open={!!showLinkDialog} onOpenChange={() => setShowLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Subagent</DialogTitle>
            <DialogDescription>Select a subagent to link to this main agent</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-64">
            <div className="space-y-2 p-2">
              {unlinkedSubagents.map((sub) => (
                <Button
                  key={sub.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    if (showLinkDialog) {
                      onLinkSubagent(showLinkDialog, sub.id);
                      setShowLinkDialog(null);
                    }
                  }}
                >
                  <span className="mr-2">{sub.icon || '⚙️'}</span>
                  {sub.name}
                </Button>
              ))}
              {unlinkedSubagents.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No unlinked subagents available</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// COMMUNICATION LOG COMPONENT
// ============================================
function CommunicationLog({ 
  communications, 
  agents 
}: { 
  communications: AgentCommunication[];
  agents: Agent[];
}) {
  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || 'Unknown';
  const getAgentIcon = (id: string) => agents.find(a => a.id === id)?.icon || '🤖';

  const messageTypeIcons = {
    request: <ArrowRightLeft className="h-4 w-4 text-blue-500" />,
    response: <ArrowRightLeft className="h-4 w-4 text-green-500" />,
    broadcast: <Network className="h-4 w-4 text-purple-500" />,
    task: <Activity className="h-4 w-4 text-amber-500" />,
    status: <Circle className="h-4 w-4 text-gray-500" />,
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No communications yet</p>
          </div>
        ) : (
          communications.map((comm) => (
            <Card key={comm.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {messageTypeIcons[comm.messageType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{getAgentIcon(comm.fromAgentId)} {getAgentName(comm.fromAgentId)}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>{getAgentIcon(comm.toAgentId)} {getAgentName(comm.toAgentId)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{comm.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{comm.messageType}</Badge>
                      <Badge variant={comm.status === 'processed' ? 'default' : 'secondary'} className="text-xs">
                        {comm.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comm.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// ORCHESTRATION SESSIONS COMPONENT
// ============================================
function OrchestrationSessionsView({ 
  sessions, 
  agents,
  beans 
}: { 
  sessions: OrchestrationSession[];
  agents: Agent[];
  beans: Bean[];
}) {
  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name || 'Unknown';
  const getBeanTitle = (id: string) => beans.find(b => b.id === id)?.title || 'Unknown';

  const statusColors = {
    pending: 'bg-yellow-500',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    running: <Loader2 className="h-4 w-4 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4" />,
    failed: <XCircle className="h-4 w-4" />,
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No orchestration sessions yet</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcons[session.status]}
                    <CardTitle className="text-sm">
                      {getAgentName(session.mainAgentId)}
                    </CardTitle>
                  </div>
                  <Badge className={cn('text-white', statusColors[session.status])}>
                    {session.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Bean: {getBeanTitle(session.beanId)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Subagent Executions:</div>
                  {session.subagentExecutions.map((exec, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {getAgentName(exec.agentId)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exec.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
                  {session.completedAt && (
                    <span>Duration: {((session.completedAt - session.startedAt) / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function TeamAIDashboard() {
  // Store
  const { teamMembers, activeMemberId, setActiveMember, addTeamMember, deleteTeamMember,
    updateTeamMember, addMessage, apiKeyStatus, setApiKeyStatus,
    agents, activeAgentId, addAgent, updateAgent, deleteAgent, setActiveAgent,
    userSettings, updateUserSettings,
    // New store items
    beans, addBean, updateBean, deleteBean, assignBean, getBeansByStatus, getBeansByAgent,
    communications, addCommunication, getAgentCommunications, 
    orchestrationSessions, startOrchestration, updateOrchestrationSession,
    linkSubagent, unlinkSubagent, getMainAgents, getSubagents,
    sidebarCollapsed, setSidebarCollapsed, commandPaletteOpen, setCommandPaletteOpen,
    // Plugin store items
    plugins, addPlugin, updatePlugin, deletePlugin, enablePlugin, disablePlugin, pluginExecutions,
    // Skill store items
    skills, addSkill, updateSkill, deleteSkill, skillCreationRequests, respondToSkillRequest,
    // Observability store items
    observabilityDashboard, agentActivities, taskObservabilities, addAgentActivity, 
    getObservabilityDashboard, refreshDashboardMetrics, recordAgentActivity,
    // Scheduler store items
    schedules, scheduleExecutions, addSchedule, updateSchedule, deleteSchedule, 
    pauseSchedule, resumeSchedule, executeSchedule, getScheduleNextExecution
  } = useAppStore();

  // State
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberSystemPrompt, setNewMemberSystemPrompt] = useState('');
  const [newMemberModel, setNewMemberModel] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [darkMode, setDarkMode] = useState(userSettings.darkMode);
  const [showAddMember, setShowAddMember] = useState(false);
  
  // Chat state - model/provider selector
  const [chatProvider, setChatProvider] = useState(userSettings.defaultProvider);
  const [chatModel, setChatModel] = useState(userSettings.defaultModel);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  // Main tabs
  const [mainTab, setMainTab] = useState<'team' | 'workspaces' | 'teams' | 'agents' | 'beans' | 'observe' | 'scheduler' | 'plugins' | 'skills'>('team');
  
  // Settings tabs
  const [settingsTab, setSettingsTab] = useState<'profile' | 'experience' | 'chat' | 'workspace' | 'api' | 'data'>('profile');
  
  // Agent management state
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newAgentProvider, setNewAgentProvider] = useState('openai');
  const [newAgentModel, setNewAgentModel] = useState('');
  const [newAgentSystemPrompt, setNewAgentSystemPrompt] = useState('');
  const [newAgentTemperature, setNewAgentTemperature] = useState(0.7);
  const [newAgentMaxTokens, setNewAgentMaxTokens] = useState(4096);
  const [newAgentIcon, setNewAgentIcon] = useState('🤖');
  const [newAgentType, setNewAgentType] = useState<Agent['type']>('main');
  
  // Agent view state
  const [agentViewMode, setAgentViewMode] = useState<'list' | 'hierarchy'>('list');
  const [showCommunicationLog, setShowCommunicationLog] = useState(false);
  const [showOrchestrationSessions, setShowOrchestrationSessions] = useState(false);
  
  // Bean management state
  const [showAddBean, setShowAddBean] = useState(false);
  const [editingBean, setEditingBean] = useState<Bean | null>(null);
  const [newBeanTitle, setNewBeanTitle] = useState('');
  const [newBeanDescription, setNewBeanDescription] = useState('');
  const [newBeanContent, setNewBeanContent] = useState('');
  const [newBeanPriority, setNewBeanPriority] = useState<Bean['priority']>('normal');
  const [newBeanCategory, setNewBeanCategory] = useState('');
  const [beanFilter, setBeanFilter] = useState<Bean['status'] | 'all'>('all');
  
  // Plugin management state
  const [showAddPlugin, setShowAddPlugin] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDescription, setNewPluginDescription] = useState('');
  const [newPluginCategory, setNewPluginCategory] = useState('utility');
  const [newPluginCode, setNewPluginCode] = useState('');
  const [newPluginScope, setNewPluginScope] = useState<PluginScope>('global');
  const [newPluginTrigger, setNewPluginTrigger] = useState<PluginTrigger>('manual');
  const [newPluginIcon, setNewPluginIcon] = useState('🔌');
  const [newPluginOneTime, setNewPluginOneTime] = useState(false);
  
  // Skill management state
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('custom');
  const [newSkillCode, setNewSkillCode] = useState('');
  const [newSkillComplexity, setNewSkillComplexity] = useState<SkillComplexity>('simple');
  const [newSkillOneTime, setNewSkillOneTime] = useState(false);
  const [newSkillDeterministic, setNewSkillDeterministic] = useState(true);
  const [showSkillRequests, setShowSkillRequests] = useState(false);
  
  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<WorkspaceFolder | null>(null);
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showImportFiles, setShowImportFiles] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; stats: any } | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // New workspace form
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [newWorkspaceIndexType, setNewWorkspaceIndexType] = useState<'global' | 'local'>(userSettings.defaultIndexType);
  const [newWorkspaceEmbeddingProvider, setNewWorkspaceEmbeddingProvider] = useState(userSettings.embeddingProvider);
  const [newWorkspaceEmbeddingModel, setNewWorkspaceEmbeddingModel] = useState(userSettings.embeddingModel);
  const [newWorkspaceIndexSessions, setNewWorkspaceIndexSessions] = useState(true);
  
  // New folder form
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'folder' | 'file'>('folder');
  const [newFolderContent, setNewFolderContent] = useState('');
  
  // Model discovery state
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, string[]>>({});
  const [isDiscoveringModels, setIsDiscoveringModels] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  
  // File import
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [autoIndexImports, setAutoIndexImports] = useState(userSettings.autoIndex);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Scheduler state
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleDescription, setNewScheduleDescription] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<ScheduleType>('interval');
  const [newScheduleCron, setNewScheduleCron] = useState('0 9 * * 1-5');
  const [newScheduleInterval, setNewScheduleInterval] = useState(60);
  const [newScheduleAction, setNewScheduleAction] = useState<ScheduleAction>('run_bean');
  const [newScheduleTimezone, setNewScheduleTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleStatus | 'all'>('all');
  
  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamMemberEmail, setNewTeamMemberEmail] = useState('');
  const [newTeamMemberRole, setNewTeamMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionMessages, setSessionMessages] = useState<any[]>([]);

  // Audio recording
  const { isRecording, startRecording, stopRecording, transcribeAudio } = useAudioRecording();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ============================================
  // MODEL DISCOVERY FUNCTIONS
  // ============================================
  
  // Discover models for a specific provider
  const discoverModels = useCallback(async (providerId: string) => {
    setIsDiscoveringModels(true);
    setDiscoveryError(null);
    
    try {
      const response = await fetch(`/api/models?provider=${providerId}`);
      const data = await response.json();
      
      if (response.ok && data.models) {
        setDiscoveredModels(prev => ({
          ...prev,
          [providerId]: data.models
        }));
        return data.models;
      } else {
        // Fall back to static models
        const staticModels = AI_PROVIDERS[providerId]?.models || [];
        setDiscoveredModels(prev => ({
          ...prev,
          [providerId]: staticModels
        }));
        return staticModels;
      }
    } catch (error) {
      console.error('Model discovery error:', error);
      setDiscoveryError('Failed to discover models');
      // Fall back to static models
      const staticModels = AI_PROVIDERS[providerId]?.models || [];
      setDiscoveredModels(prev => ({
        ...prev,
        [providerId]: staticModels
      }));
      return staticModels;
    } finally {
      setIsDiscoveringModels(false);
    }
  }, []);
  
  // Get models for a provider (discovered or static)
  const getModelsForProvider = useCallback((providerId: string): string[] => {
    if (discoveredModels[providerId]) {
      return discoveredModels[providerId];
    }
    return AI_PROVIDERS[providerId]?.models || [];
  }, [discoveredModels]);
  
  // Handle provider change with automatic model discovery
  const handleProviderChangeWithDiscovery = useCallback(async (providerId: string, context: 'chat' | 'agent' | 'member' | 'settings') => {
    // Immediately set provider
    if (context === 'chat') {
      setChatProvider(providerId);
    } else if (context === 'agent') {
      setNewAgentProvider(providerId);
    } else if (context === 'member') {
      setSelectedProvider(providerId);
    } else if (context === 'settings') {
      // Settings context updates userSettings immediately with default model
      const provider = AI_PROVIDERS[providerId];
      updateUserSettings({ 
        defaultProvider: providerId, 
        defaultModel: provider?.defaultModel || '' 
      });
    }
    
    // Discover models
    const models = await discoverModels(providerId);
    
    // Set the first model as default
    if (models.length > 0) {
      const defaultModel = AI_PROVIDERS[providerId]?.defaultModel || models[0];
      const selectedModel = models.includes(defaultModel) ? defaultModel : models[0];
      
      if (context === 'chat') {
        setChatModel(selectedModel);
      } else if (context === 'agent') {
        setNewAgentModel(selectedModel);
      } else if (context === 'member') {
        setNewMemberModel(selectedModel);
      } else if (context === 'settings') {
        updateUserSettings({ defaultModel: selectedModel });
      }
    }
  }, [discoverModels, updateUserSettings]);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMembers.find(m => m.id === activeMemberId)?.messages]);

  useEffect(() => {
    fetchApiKeyStatus();
    fetchWorkspaces();
    fetchTeams();
    // Discover models for default provider on mount
    discoverModels(userSettings.defaultProvider);
  }, []);
  
  // Sync dark mode with settings
  useEffect(() => {
    setDarkMode(userSettings.darkMode);
  }, [userSettings.darkMode]);

  // Keyboard shortcuts for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      Object.entries(data.keyStatus).forEach(([provider, hasKey]) => {
        setApiKeyStatus(provider, hasKey as boolean);
      });
    } catch (error) {
      console.error('Failed to fetch API key status:', error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const fetchFolders = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/folders?workspaceId=${workspaceId}&tree=true`);
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchGraphData = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/graph?workspaceId=${workspaceId}`);
      const data = await response.json();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams?teamId=${teamId}`);
      const data = await response.json();
      setTeamMembersList(data.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchSessions = async (workspaceId?: string) => {
    try {
      const url = workspaceId 
        ? `/api/sessions?workspaceId=${workspaceId}` 
        : '/api/sessions';
      const response = await fetch(url);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  // Computed
  const activeMember = teamMembers.find(m => m.id === activeMemberId);
  const selectedProviderData = AI_PROVIDERS[selectedProvider];
  const selectedEmbeddingProvider = EMBEDDING_PROVIDERS[newWorkspaceEmbeddingProvider];
  const chatProviderData = AI_PROVIDERS[chatProvider];
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  
  // Filtered beans
  const filteredBeans = beanFilter === 'all' ? beans : beans.filter(b => b.status === beanFilter);

  // Handlers
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeMember || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage(activeMember.id, { role: 'user', content: userMessage });
    setIsLoading(true);

    // Use selected agent if available, otherwise use chat provider/model or member's default
    const effectiveProvider = selectedAgent?.provider || chatProvider || activeMember.agent.provider;
    const effectiveModel = selectedAgent?.model || chatModel || activeMember.agent.model;
    const effectiveSystemPrompt = selectedAgent?.systemPrompt || activeMember.agent.systemPrompt;
    const effectiveTemperature = selectedAgent?.temperature || activeMember.agent.temperature;
    const effectiveMaxTokens = selectedAgent?.maxTokens || activeMember.agent.maxTokens;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: effectiveProvider,
          model: effectiveModel,
          messages: [...activeMember.messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role, content: m.content,
          })),
          systemPrompt: effectiveSystemPrompt,
          temperature: effectiveTemperature,
          maxTokens: effectiveMaxTokens,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      addMessage(activeMember.id, { role: 'assistant', content: data.content });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      addMessage(activeMember.id, { role: 'assistant', content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      stopRecording();
      setTimeout(async () => {
        const text = await transcribeAudio();
        if (text) setInputMessage(prev => prev + ' ' + text);
      }, 500);
    } else {
      await startRecording();
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error('Please enter a member name');
      return;
    }

    const provider = AI_PROVIDERS[selectedProvider];
    const id = addTeamMember({
      name: newMemberName,
      role: newMemberRole || 'Team Member',
      avatar: '',
      agent: {
        name: `${newMemberName}'s Assistant`,
        provider: selectedProvider,
        model: newMemberModel || provider.defaultModel,
        hasApiKey: apiKeyStatus[selectedProvider] || false,
        systemPrompt: newMemberSystemPrompt || `You are ${newMemberName}'s personal AI assistant.`,
        temperature: 0.7,
        maxTokens: 4096,
      },
    });

    if (newApiKey) saveApiKey(selectedProvider, newApiKey);
    setShowAddMember(false);
    resetAddMemberForm();
    setActiveMember(id);
    toast.success(`Added ${newMemberName} with ${provider.name}`);
  };
  
  // Agent management handlers
  const handleAddAgent = () => {
    if (!newAgentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    const provider = AI_PROVIDERS[newAgentProvider];
    addAgent({
      name: newAgentName,
      description: newAgentDescription,
      type: newAgentType,
      status: 'idle',
      provider: newAgentProvider,
      model: newAgentModel || provider.defaultModel,
      hasApiKey: apiKeyStatus[newAgentProvider] || false,
      systemPrompt: newAgentSystemPrompt || `You are a helpful AI assistant.`,
      temperature: newAgentTemperature,
      maxTokens: newAgentMaxTokens,
      icon: newAgentIcon,
    });

    setShowAddAgent(false);
    resetAgentForm();
    toast.success(`Created agent: ${newAgentName}`);
  };
  
  const handleUpdateAgent = () => {
    if (!editingAgent) return;
    
    updateAgent(editingAgent.id, {
      name: newAgentName,
      description: newAgentDescription,
      type: newAgentType,
      provider: newAgentProvider,
      model: newAgentModel,
      systemPrompt: newAgentSystemPrompt,
      temperature: newAgentTemperature,
      maxTokens: newAgentMaxTokens,
      icon: newAgentIcon,
    });
    
    setEditingAgent(null);
    resetAgentForm();
    toast.success('Agent updated');
  };
  
  const handleDeleteAgent = (id: string) => {
    if (!confirm('Delete this agent?')) return;
    deleteAgent(id);
    if (selectedAgentId === id) setSelectedAgentId(null);
    toast.success('Agent deleted');
  };
  
  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setNewAgentName(agent.name);
    setNewAgentDescription(agent.description || '');
    setNewAgentType(agent.type);
    setNewAgentProvider(agent.provider);
    setNewAgentModel(agent.model);
    setNewAgentSystemPrompt(agent.systemPrompt);
    setNewAgentTemperature(agent.temperature);
    setNewAgentMaxTokens(agent.maxTokens);
    setNewAgentIcon(agent.icon || '🤖');
    setShowAddAgent(true);
  };
  
  const resetAgentForm = () => {
    setNewAgentName('');
    setNewAgentDescription('');
    setNewAgentType('main');
    setNewAgentProvider('openai');
    setNewAgentModel('');
    setNewAgentSystemPrompt('');
    setNewAgentTemperature(0.7);
    setNewAgentMaxTokens(4096);
    setNewAgentIcon('🤖');
    setEditingAgent(null);
  };

  // Plugin management handlers
  const handleAddPlugin = () => {
    if (!newPluginName.trim()) {
      toast.error('Please enter a plugin name');
      return;
    }
    if (!newPluginCode.trim()) {
      toast.error('Please enter plugin code');
      return;
    }

    addPlugin({
      name: newPluginName,
      description: newPluginDescription,
      category: newPluginCategory,
      scope: newPluginScope,
      trigger: newPluginTrigger,
      code: newPluginCode,
      icon: newPluginIcon,
      version: '1.0.0',
      permissions: [],
      enabled: true,
      status: 'active',
      isOneTimeUse: newPluginOneTime,
      keepAfterUse: !newPluginOneTime,
    });

    setShowAddPlugin(false);
    resetPluginForm();
    toast.success(`Created plugin: ${newPluginName}`);
  };

  const handleUpdatePlugin = () => {
    if (!editingPlugin) return;
    
    updatePlugin(editingPlugin.id, {
      name: newPluginName,
      description: newPluginDescription,
      category: newPluginCategory,
      scope: newPluginScope,
      trigger: newPluginTrigger,
      code: newPluginCode,
      icon: newPluginIcon,
      isOneTimeUse: newPluginOneTime,
    });
    
    setEditingPlugin(null);
    resetPluginForm();
    toast.success('Plugin updated');
  };

  const handleDeletePlugin = (id: string) => {
    if (!confirm('Delete this plugin?')) return;
    deletePlugin(id);
    toast.success('Plugin deleted');
  };

  const handleEditPlugin = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setNewPluginName(plugin.name);
    setNewPluginDescription(plugin.description || '');
    setNewPluginCategory(plugin.category);
    setNewPluginScope(plugin.scope);
    setNewPluginTrigger(plugin.trigger);
    setNewPluginCode(plugin.code);
    setNewPluginIcon(plugin.icon || '🔌');
    setNewPluginOneTime(plugin.isOneTimeUse);
    setShowAddPlugin(true);
  };

  const resetPluginForm = () => {
    setNewPluginName('');
    setNewPluginDescription('');
    setNewPluginCategory('utility');
    setNewPluginScope('global');
    setNewPluginTrigger('manual');
    setNewPluginCode('');
    setNewPluginIcon('🔌');
    setNewPluginOneTime(false);
    setEditingPlugin(null);
  };

  // Skill management handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }
    if (!newSkillDescription.trim()) {
      toast.error('Please enter a skill description');
      return;
    }

    addSkill({
      name: newSkillName,
      description: newSkillDescription,
      category: newSkillCategory,
      complexity: newSkillComplexity,
      code: newSkillCode,
      parameters: [],
      steps: [],
      examples: [],
      isOneTimeUse: newSkillOneTime,
      keepAfterUse: !newSkillOneTime,
      isDeterministic: newSkillDeterministic,
      cacheResults: newSkillDeterministic,
      autoAssignToNewAgents: false,
      learnFromUsage: true,
      status: 'available',
      version: '1.0.0',
    });

    setShowAddSkill(false);
    resetSkillForm();
    toast.success(`Created skill: ${newSkillName}`);
  };

  const handleUpdateSkill = () => {
    if (!editingSkill) return;
    
    updateSkill(editingSkill.id, {
      name: newSkillName,
      description: newSkillDescription,
      category: newSkillCategory,
      complexity: newSkillComplexity,
      code: newSkillCode,
      isOneTimeUse: newSkillOneTime,
      isDeterministic: newSkillDeterministic,
    });
    
    setEditingSkill(null);
    resetSkillForm();
    toast.success('Skill updated');
  };

  const handleDeleteSkill = (id: string) => {
    if (!confirm('Delete this skill?')) return;
    deleteSkill(id);
    toast.success('Skill deleted');
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setNewSkillName(skill.name);
    setNewSkillDescription(skill.description);
    setNewSkillCategory(skill.category);
    setNewSkillComplexity(skill.complexity);
    setNewSkillCode(skill.code || '');
    setNewSkillOneTime(skill.isOneTimeUse);
    setNewSkillDeterministic(skill.isDeterministic);
    setShowAddSkill(true);
  };

  const resetSkillForm = () => {
    setNewSkillName('');
    setNewSkillDescription('');
    setNewSkillCategory('custom');
    setNewSkillComplexity('simple');
    setNewSkillCode('');
    setNewSkillOneTime(false);
    setNewSkillDeterministic(true);
    setEditingSkill(null);
  };

  // Bean management handlers
  const handleAddBean = () => {
    if (!newBeanTitle.trim()) {
      toast.error('Please enter a bean title');
      return;
    }

    addBean({
      title: newBeanTitle,
      description: newBeanDescription,
      content: newBeanContent,
      status: 'pending',
      priority: newBeanPriority,
      category: newBeanCategory,
    });

    setShowAddBean(false);
    resetBeanForm();
    toast.success(`Created bean: ${newBeanTitle}`);
  };

  const handleUpdateBean = () => {
    if (!editingBean) return;
    
    updateBean(editingBean.id, {
      title: newBeanTitle,
      description: newBeanDescription,
      content: newBeanContent,
      priority: newBeanPriority,
      category: newBeanCategory,
    });
    
    setEditingBean(null);
    resetBeanForm();
    toast.success('Bean updated');
  };

  const handleDeleteBean = (id: string) => {
    if (!confirm('Delete this bean?')) return;
    deleteBean(id);
    toast.success('Bean deleted');
  };

  const handleEditBean = (bean: Bean) => {
    setEditingBean(bean);
    setNewBeanTitle(bean.title);
    setNewBeanDescription(bean.description || '');
    setNewBeanContent(bean.content || '');
    setNewBeanPriority(bean.priority);
    setNewBeanCategory(bean.category || '');
    setShowAddBean(true);
  };

  const resetBeanForm = () => {
    setNewBeanTitle('');
    setNewBeanDescription('');
    setNewBeanContent('');
    setNewBeanPriority('normal');
    setNewBeanCategory('');
    setEditingBean(null);
  };

  const handleAssignBean = (beanId: string, agentId: string) => {
    assignBean(beanId, agentId);
    toast.success('Bean assigned to agent');
  };

  const handleStartBean = (beanId: string) => {
    updateBean(beanId, { status: 'running', startedAt: Date.now() });
    toast.success('Bean execution started');
  };

  const saveApiKey = async (provider: string, key: string) => {
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: key }),
      });
      setApiKeyStatus(provider, true);
      toast.success(`API key saved for ${AI_PROVIDERS[provider]?.name || provider}`);
    } catch (error) {
      toast.error('Failed to save API key');
    }
  };

  const resetAddMemberForm = () => {
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberSystemPrompt('');
    setNewMemberModel('');
    setNewApiKey('');
    setSelectedProvider('openai');
    setProviderSearch('');
  };

  // Workspace handlers
  const handleAddWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDescription,
          indexType: newWorkspaceIndexType,
          embeddingProvider: newWorkspaceEmbeddingProvider,
          embeddingModel: newWorkspaceEmbeddingModel,
          settings: {
            indexSessions: newWorkspaceIndexSessions,
            indexFiles: true,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWorkspaces([...workspaces, data.workspace]);
        setActiveWorkspace(data.workspace);
        setShowAddWorkspace(false);
        resetWorkspaceForm();
        toast.success(`Created ${newWorkspaceIndexType} workspace: ${newWorkspaceName}`);
      }
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  };

  const resetWorkspaceForm = () => {
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setNewWorkspaceIndexType('local');
    setNewWorkspaceEmbeddingProvider('openai');
    setNewWorkspaceEmbeddingModel('text-embedding-3-small');
    setNewWorkspaceIndexSessions(true);
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Delete this workspace?')) return;
    
    try {
      await fetch(`/api/workspaces?id=${id}`, { method: 'DELETE' });
      setWorkspaces(workspaces.filter(w => w.id !== id));
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(null);
        setFolders([]);
        setGraphData(null);
      }
      toast.success('Workspace deleted');
    } catch (error) {
      toast.error('Failed to delete workspace');
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !activeWorkspace) return;

    try {
      const response = await fetch('/api/workspaces/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          parentId: selectedFolder?.id,
          name: newFolderName,
          type: newFolderType,
          content: newFolderContent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFolders([...folders, data.folder]);
        setShowAddFolder(false);
        resetFolderForm();
        fetchGraphData(activeWorkspace.id);
        toast.success(`Created ${newFolderType}: ${newFolderName}`);
      }
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const resetFolderForm = () => {
    setNewFolderName('');
    setNewFolderType('folder');
    setNewFolderContent('');
  };

  const handleImportFiles = async () => {
    if (!importFiles || importFiles.length === 0 || !activeWorkspace) return;

    const formData = new FormData();
    for (let i = 0; i < importFiles.length; i++) {
      formData.append('files', importFiles[i]);
    }
    formData.append('workspaceId', activeWorkspace.id);
    formData.append('autoIndex', autoIndexImports.toString());

    try {
      const response = await fetch('/api/files/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      toast.success(`Imported ${data.imported} files`);
      fetchFolders(activeWorkspace.id);
      fetchGraphData(activeWorkspace.id);
      setShowImportFiles(false);
      setImportFiles(null);
    } catch (error) {
      toast.error('Failed to import files');
    }
  };

  const handleIndexWorkspace = async () => {
    if (!activeWorkspace) return;
    
    setIsIndexing(true);
    try {
      const response = await fetch('/api/workspaces/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id }),
      });

      const data = await response.json();
      toast.success(`Indexed ${data.indexed} items`);
      fetchFolders(activeWorkspace.id);
      fetchGraphData(activeWorkspace.id);
    } catch (error) {
      toast.error('Failed to index workspace');
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSearch = async () => {
    if (!activeWorkspace || !searchQuery.trim()) return;
    
    try {
      const response = await fetch('/api/workspaces/index', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id, query: searchQuery }),
      });

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleExportIndex = async () => {
    try {
      const url = activeWorkspace 
        ? `/api/export?workspaceId=${activeWorkspace.id}&includeEmbeddings=true`
        : '/api/export?includeEmbeddings=true';
      
      const response = await fetch(url);
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `index-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Index exported successfully');
    } catch (error) {
      toast.error('Failed to export index');
    }
  };

  const handleImportIndex = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      toast.success(result.message || 'Index imported');
      fetchWorkspaces();
    } catch (error) {
      toast.error('Failed to import index');
    }
  };

  // Team handlers
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
          ownerId: 'current_user',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTeams([...teams, data.team]);
        setShowCreateTeam(false);
        setNewTeamName('');
        setNewTeamDescription('');
        toast.success(`Created team: ${newTeamName}`);
      }
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleAddTeamMember = async () => {
    if (!newTeamMemberEmail.trim() || !activeTeam) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMember',
          teamId: activeTeam.id,
          userId: newTeamMemberEmail,
          role: newTeamMemberRole,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTeamMembers(activeTeam.id);
        setShowAddTeamMember(false);
        setNewTeamMemberEmail('');
        setNewTeamMemberRole('member');
        toast.success('Member added');
      }
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };

  // Command palette navigation
  const handleCommandNavigation = (tab: string) => {
    setMainTab(tab as any);
  };

  // Sidebar search state
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Filter tabs based on search
  const filteredTabs = sidebarSearch 
    ? ['team', 'agents', 'beans', 'observe', 'scheduler', 'workspaces', 'teams', 'plugins', 'skills'].filter(tab =>
        tab.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : ['team', 'agents', 'beans', 'observe', 'scheduler', 'workspaces', 'teams', 'plugins', 'skills'];

  // Tab metadata for enhanced display
  const tabMeta: Record<string, { icon: any; label: string; badge?: number; section: 'core' | 'management' | 'extensions' }> = {
    team: { icon: Users, label: 'Team', section: 'core' },
    agents: { icon: BotMessageSquare, label: 'Agents', badge: agents.filter(a => a.status === 'active').length, section: 'core' },
    beans: { icon: Activity, label: 'Beans', badge: beans.filter(b => b.status === 'pending' || b.status === 'in_progress').length, section: 'core' },
    observe: { icon: Eye, label: 'Observe', badge: agents.filter(a => a.status === 'busy').length, section: 'management' },
    scheduler: { icon: Clock, label: 'Scheduler', badge: schedules.filter(s => s.status === 'active').length, section: 'management' },
    workspaces: { icon: Database, label: 'Data', section: 'management' },
    teams: { icon: Shield, label: 'Teams', section: 'management' },
    plugins: { icon: Layers, label: 'Plugins', badge: plugins.filter(p => p.enabled).length, section: 'extensions' },
    skills: { icon: Sparkles, label: 'Skills', badge: skills.length, section: 'extensions' },
  };

  return (
    <div className={cn('min-h-screen bg-slate-950', darkMode && 'dark')}>
      <div className="flex h-screen">
        {/* Collapsible Sidebar */}
        <aside className={cn(
          'flex flex-col transition-all duration-300 ease-out relative',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}>
          {/* Solid background */}
          <div className="absolute inset-0 bg-slate-900 border-r border-slate-700" />
          
          {/* Content wrapper */}
          <div className="relative z-10 flex flex-col h-full">
          {/* Logo and Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white">AI Hub</span>
                  <p className="text-[10px] text-slate-400 -mt-0.5">Team Collaboration</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
                className="ml-auto"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="mt-2"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sidebar Search */}
          {!sidebarCollapsed && (
            <div className="p-2 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search navigation..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="pl-8 h-9 text-xs bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Main Navigation with Section Groups */}
          <div className={cn('flex-1 overflow-hidden flex flex-col', sidebarCollapsed && 'p-1')}>
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <TabsList className={cn(
                  'w-full flex flex-col gap-1 h-auto bg-transparent p-1',
                  !sidebarCollapsed && 'px-2'
                )}>
                  {/* Core Section */}
                  {!sidebarCollapsed && filteredTabs.some(t => tabMeta[t]?.section === 'core') && (
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Core
                    </div>
                  )}
                  {filteredTabs.filter(t => tabMeta[t]?.section === 'core').map((tab) => {
                    const meta = tabMeta[tab];
                    const Icon = meta.icon;
                    return (
                      <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl justify-start relative transition-all',
                          'data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-800',
                          'data-[state=active]:bg-indigo-500/20',
                          'data-[state=active]:text-white',
                          'data-[state=active]:border data-[state=active]:border-indigo-500/50',
                          sidebarCollapsed && 'justify-center w-full'
                        )}
                      >
                        <Icon className="h-4 w-4 data-[state=active]:text-indigo-400" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="text-xs flex-1 text-left font-medium">{meta.label}</span>
                            {meta.badge !== undefined && meta.badge > 0 && (
                              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-indigo-500 border-0 text-white">
                                {meta.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        {sidebarCollapsed && meta.badge !== undefined && meta.badge > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-indigo-400 rounded-full" />
                        )}
                      </TabsTrigger>
                    );
                  })}

                  {/* Management Section */}
                  {!sidebarCollapsed && filteredTabs.some(t => tabMeta[t]?.section === 'management') && (
                    <div className="px-2 py-1.5 mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Management
                    </div>
                  )}
                  {filteredTabs.filter(t => tabMeta[t]?.section === 'management').map((tab) => {
                    const meta = tabMeta[tab];
                    const Icon = meta.icon;
                    return (
                      <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl justify-start relative transition-all',
                          'data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-800',
                          'data-[state=active]:bg-indigo-500/20',
                          'data-[state=active]:text-white',
                          'data-[state=active]:border data-[state=active]:border-indigo-500/50',
                          sidebarCollapsed && 'justify-center w-full'
                        )}
                      >
                        <Icon className="h-4 w-4 data-[state=active]:text-indigo-400" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="text-xs flex-1 text-left font-medium">{meta.label}</span>
                            {meta.badge !== undefined && meta.badge > 0 && (
                              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-indigo-500 border-0 text-white">
                                {meta.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </TabsTrigger>
                    );
                  })}

                  {/* Extensions Section */}
                  {!sidebarCollapsed && filteredTabs.some(t => tabMeta[t]?.section === 'extensions') && (
                    <div className="px-2 py-1.5 mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Extensions
                    </div>
                  )}
                  {filteredTabs.filter(t => tabMeta[t]?.section === 'extensions').map((tab) => {
                    const meta = tabMeta[tab];
                    const Icon = meta.icon;
                    return (
                      <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl justify-start relative transition-all',
                          'data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-800',
                          'data-[state=active]:bg-indigo-500/20',
                          'data-[state=active]:text-white',
                          'data-[state=active]:border data-[state=active]:border-indigo-500/50',
                          sidebarCollapsed && 'justify-center w-full'
                        )}
                      >
                        <Icon className="h-4 w-4 data-[state=active]:text-indigo-400" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="text-xs flex-1 text-left font-medium">{meta.label}</span>
                            {meta.badge !== undefined && meta.badge > 0 && (
                              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-indigo-500 border-0 text-white">
                                {meta.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ScrollArea>
            </Tabs>

            {/* Quick Actions Footer */}
            {!sidebarCollapsed && (
              <div className="p-3 border-t border-slate-700 mt-auto">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Quick Actions
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start h-9 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-all"
                    onClick={() => setShowAddMember(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-slate-400" /> Add Member
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start h-9 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-all"
                    onClick={() => setShowAddAgent(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-slate-400" /> Add Agent
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start h-9 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-all"
                    onClick={() => setShowAddBean(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-slate-400" /> Add Bean
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Footer */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-700 bg-slate-800/50 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {teamMembers.length} members
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  {agents.filter(a => a.status === 'active').length} active
                </span>
              </div>
            </div>
          )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Header Bar */}
          <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 relative z-20">
            
            <div className="flex items-center gap-4">
              {sidebarCollapsed && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize text-slate-300 font-medium">{mainTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 transition-all">
                    <Command className="h-4 w-4 text-slate-400" />
                    <span className="text-xs">⌘K</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 border-slate-700 bg-slate-800" align="end">
                  <CommandComponent>
                    <CommandInput placeholder="Search commands..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => { setMainTab('team'); }}>Team</CommandItem>
                        <CommandItem onSelect={() => { setMainTab('agents'); }}>Agents</CommandItem>
                        <CommandItem onSelect={() => { setMainTab('beans'); }}>Beans</CommandItem>
                        <CommandItem onSelect={() => { setMainTab('plugins'); }}>Plugins</CommandItem>
                        <CommandItem onSelect={() => { setMainTab('skills'); }}>Skills</CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading="Actions">
                        <CommandItem onSelect={() => { setShowAddMember(true); }}>Add Team Member</CommandItem>
                        <CommandItem onSelect={() => { setShowAddAgent(true); }}>Create Agent</CommandItem>
                        <CommandItem onSelect={() => { setShowAddBean(true); }}>Create Bean</CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </CommandComponent>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Team Tab */}
          {mainTab === 'team' && (
            activeMember ? (
              <>
                <div className="p-4 border-b border-slate-700 bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="ring-2 ring-slate-600">
                        <AvatarFallback className="bg-indigo-500 text-white">{activeMember.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-white">{activeMember.name}</h2>
                        <p className="text-sm text-slate-400">
                          {AI_PROVIDERS[activeMember.agent.provider]?.icon} {AI_PROVIDERS[activeMember.agent.provider]?.name}
                        </p>
                      </div>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 transition-all"><Sparkles className="h-4 w-4 mr-2 text-slate-400" /> Configure</Button>
                      </SheetTrigger>
                      <SheetContent className="bg-slate-900 border-slate-700">
                        <SheetHeader><SheetTitle className="text-white">Configure Agent</SheetTitle></SheetHeader>
                        <div className="mt-6 space-y-4">
                          <div><Label className="text-slate-300">System Prompt</Label>
                            <Textarea value={activeMember.agent.systemPrompt}
                              onChange={(e) => updateTeamMember(activeMember.id, { agent: { ...activeMember.agent, systemPrompt: e.target.value } })}
                              rows={4} className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500" />
                          </div>
                          <div><Label className="text-slate-300">Temperature: {activeMember.agent.temperature}</Label>
                            <Slider value={[activeMember.agent.temperature]}
                              onValueChange={([v]) => updateTeamMember(activeMember.id, { agent: { ...activeMember.agent, temperature: v } })}
                              max={2} step={0.1} />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {activeMember.messages.length === 0 ? (
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-8 text-center">
                          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-indigo-500 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg text-white mb-2">Start a conversation</h3>
                          <p className="text-slate-400">I'm {activeMember.agent.name}. How can I help?</p>
                        </CardContent>
                      </Card>
                    ) : (
                      activeMember.messages.map((message) => (
                        <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                          <Card className={cn(
                            'max-w-[80%] border-0 shadow-lg',
                            message.role === 'user' 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-slate-800 border border-slate-700 text-white'
                          )}>
                            <CardContent className="p-4"><p className="whitespace-pre-wrap">{message.content}</p></CardContent>
                          </Card>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <Card className="bg-slate-800 border-slate-700 shadow-lg"><CardContent className="p-4 flex items-center gap-2 text-slate-300">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Thinking...
                        </CardContent></Card>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-700 bg-slate-900">
                  <div className="max-w-4xl mx-auto space-y-2">
                    {/* Model/Provider Selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedAgent && (
                        <Badge className="gap-1 bg-indigo-500 border-0 text-white">
                          {selectedAgent.icon} {selectedAgent.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedAgentId(null)} />
                        </Badge>
                      )}
                      <Select 
                        value={chatProvider} 
                        onValueChange={(v) => handleProviderChangeWithDiscovery(v, 'chat')}
                        disabled={isDiscoveringModels}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Provider" />
                          {isDiscoveringModels && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(AI_PROVIDERS).slice(0, 15).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {chatProvider && (
                        <Select value={chatModel} onValueChange={setChatModel}>
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsForProvider(chatProvider).map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {agents.length > 0 && (
                        <Select value={selectedAgentId || 'none'} onValueChange={(v) => setSelectedAgentId(v === 'none' ? null : v)}>
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue placeholder="Use Agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Agent</SelectItem>
                            {agents.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => discoverModels(chatProvider)}
                        disabled={isDiscoveringModels}
                        title="Refresh models"
                      >
                        <RefreshCw className={cn('h-3 w-3', isDiscoveringModels && 'animate-spin')} />
                      </Button>
                    </div>
                    {/* Input Area */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Type or use voice..."
                          className="min-h-[44px] pr-12 resize-none"
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                        <Button variant="ghost" size="icon"
                          className={cn('absolute right-2 top-1/2 -translate-y-1/2', isRecording && 'text-red-500 animate-pulse')}
                          onClick={handleVoiceInput}>
                          {isRecording ? <AudioWaveform className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      </div>
                      <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md text-center">
                  <CardContent className="p-8">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-xl mb-2">Team AI Hub</h3>
                    <p className="text-muted-foreground mb-6">Add team members and assign AI agents</p>
                    <Button onClick={() => setShowAddMember(true)}><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
                  </CardContent>
                </Card>
              </div>
            )
          )}

          {/* Agents Tab */}
          {mainTab === 'agents' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Main Agent Content */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">AI Agents</h2>
                      <p className="text-muted-foreground">Create and manage AI agents with hierarchy and orchestration</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex border rounded-lg">
                        <Button
                          variant={agentViewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAgentViewMode('list')}
                          className="rounded-r-none"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={agentViewMode === 'hierarchy' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAgentViewMode('hierarchy')}
                          className="rounded-l-none"
                        >
                          <GitBranch className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={() => setShowAddAgent(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Agent
                      </Button>
                    </div>
                  </div>

                  {agents.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <BotMessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold text-xl mb-2">No Agents Yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first AI agent with a custom personality</p>
                        <Button onClick={() => setShowAddAgent(true)}>
                          <Plus className="h-4 w-4 mr-2" /> Create Agent
                        </Button>
                      </CardContent>
                    </Card>
                  ) : agentViewMode === 'hierarchy' ? (
                    <AgentHierarchyView
                      agents={agents}
                      onSelectAgent={setSelectedAgentId}
                      selectedAgentId={selectedAgentId}
                      onLinkSubagent={linkSubagent}
                      onUnlinkSubagent={unlinkSubagent}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agents.map((agent) => {
                        const provider = AI_PROVIDERS[agent.provider];
                        return (
                          <Card key={agent.id} className={cn('transition-all hover:shadow-md', selectedAgentId === agent.id && 'ring-2 ring-primary')}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-2xl">
                                    {agent.icon || '🤖'}
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      {provider?.icon} {provider?.name} • {agent.model}
                                    </div>
                                    <Badge variant="outline" className="mt-1 text-xs">{agent.type}</Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditAgent(agent)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {agent.description && (
                                <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
                              )}
                              <div className="bg-muted rounded-lg p-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1">System Prompt</div>
                                <p className="text-sm line-clamp-3">{agent.systemPrompt}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Temp: {agent.temperature}</span>
                                <span>Max: {agent.maxTokens} tokens</span>
                                {agent.hasApiKey && <Badge variant="secondary" className="text-xs"><Key className="h-3 w-3 mr-1" /> Key Set</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Side Panel for Communications/Sessions */}
              {(showCommunicationLog || showOrchestrationSessions) && (
                <div className="w-80 border-l bg-muted/20 flex flex-col">
                  <div className="p-4 border-b">
                    <Tabs value={showCommunicationLog ? 'comms' : 'sessions'} onValueChange={(v) => {
                      setShowCommunicationLog(v === 'comms');
                      setShowOrchestrationSessions(v === 'sessions');
                    }}>
                      <TabsList className="w-full">
                        <TabsTrigger value="comms" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" /> Comms</TabsTrigger>
                        <TabsTrigger value="sessions" className="text-xs"><Workflow className="h-3 w-3 mr-1" /> Sessions</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {showCommunicationLog && (
                      <CommunicationLog communications={communications} agents={agents} />
                    )}
                    {showOrchestrationSessions && (
                      <OrchestrationSessionsView sessions={orchestrationSessions} agents={agents} beans={beans} />
                    )}
                  </div>
                </div>
              )}

              {/* Toggle buttons for side panels */}
              {!showCommunicationLog && !showOrchestrationSessions && (
                <div className="flex flex-col gap-2 p-2 border-l">
                  <Button variant="ghost" size="sm" onClick={() => setShowCommunicationLog(true)} title="Communication Log">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowOrchestrationSessions(true)} title="Orchestration Sessions">
                    <Workflow className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {(showCommunicationLog || showOrchestrationSessions) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => { setShowCommunicationLog(false); setShowOrchestrationSessions(false); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Beans Tab */}
          {mainTab === 'beans' && (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Beans</h2>
                    <p className="text-muted-foreground">Task management for AI agents</p>
                  </div>
                  <Button onClick={() => setShowAddBean(true)}>
                    <Plus className="h-4 w-4 mr-2" /> New Bean
                  </Button>
                </div>

                {/* Bean Statistics */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  {(['pending', 'queued', 'running', 'completed', 'failed'] as const).map((status) => {
                    const count = beans.filter(b => b.status === status).length;
                    const colors = {
                      pending: 'text-gray-500',
                      queued: 'text-blue-500',
                      running: 'text-amber-500',
                      completed: 'text-green-500',
                      failed: 'text-red-500',
                    };
                    const icons = {
                      pending: Clock,
                      queued: Activity,
                      running: PlayCircle,
                      completed: CheckCircle,
                      failed: XCircle,
                    };
                    const Icon = icons[status];
                    return (
                      <Card key={status} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setBeanFilter(status)}>
                        <CardContent className="p-4 text-center">
                          <Icon className={cn('h-5 w-5 mx-auto mb-2', colors[status])} />
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground capitalize">{status}</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Bean Filter */}
                <div className="flex items-center gap-2 mb-4">
                  <Select value={beanFilter} onValueChange={(v) => setBeanFilter(v as typeof beanFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Beans</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bean List */}
                {filteredBeans.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-xl mb-2">No Beans Yet</h3>
                      <p className="text-muted-foreground mb-6">Create beans to assign tasks to agents</p>
                      <Button onClick={() => setShowAddBean(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Bean
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredBeans.map((bean) => {
                      const assignedAgent = agents.find(a => a.id === bean.assignedAgentId);
                      const statusColors = {
                        pending: 'bg-gray-500',
                        queued: 'bg-blue-500',
                        running: 'bg-amber-500',
                        completed: 'bg-green-500',
                        failed: 'bg-red-500',
                        cancelled: 'bg-gray-400',
                      };
                      const priorityColors = {
                        low: 'text-gray-500',
                        normal: 'text-blue-500',
                        high: 'text-amber-500',
                        critical: 'text-red-500',
                      };
                      
                      return (
                        <Card key={bean.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={cn('h-3 w-3 rounded-full mt-1.5', statusColors[bean.status])} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">{bean.title}</h3>
                                    <Flag className={cn('h-4 w-4', priorityColors[bean.priority])} />
                                  </div>
                                  {bean.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{bean.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-xs">{bean.status}</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{bean.priority}</Badge>
                                    {bean.category && <Badge variant="secondary" className="text-xs">{bean.category}</Badge>}
                                    {assignedAgent && (
                                      <Badge variant="default" className="text-xs">
                                        {assignedAgent.icon} {assignedAgent.name}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Created {new Date(bean.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {bean.status === 'pending' && (
                                  <Select onValueChange={(agentId) => handleAssignBean(bean.id, agentId)}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                      <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {agents.filter(a => a.type === 'main' || a.type === 'orchestrator').map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                          {agent.icon} {agent.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                {bean.status === 'queued' && (
                                  <Button size="sm" variant="outline" onClick={() => handleStartBean(bean.id)}>
                                    <Play className="h-3 w-3 mr-1" /> Run
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleEditBean(bean)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteBean(bean.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {bean.result && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Result</div>
                                <p className="text-sm">{bean.result}</p>
                              </div>
                            )}
                            {bean.error && (
                              <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                                <div className="text-xs font-medium text-destructive mb-1">Error</div>
                                <p className="text-sm text-destructive">{bean.error}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observe Tab - Observability Dashboard */}
          {mainTab === 'observe' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Eye className="h-6 w-6" /> Observability Dashboard
                    </h2>
                    <p className="text-muted-foreground">Real-time monitoring and system health</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={observabilityDashboard.filters.timeRange} onValueChange={(v) => {
                      // Would update time range filter here
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Last 1 hour</SelectItem>
                        <SelectItem value="6h">Last 6 hours</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => refreshDashboardMetrics()}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* System Health Banner */}
                  <Card className={cn(
                    'border-2',
                    observabilityDashboard.metrics.systemHealth === 'healthy' && 'border-green-500/50 bg-green-500/5',
                    observabilityDashboard.metrics.systemHealth === 'degraded' && 'border-amber-500/50 bg-amber-500/5',
                    observabilityDashboard.metrics.systemHealth === 'critical' && 'border-red-500/50 bg-red-500/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {observabilityDashboard.metrics.systemHealth === 'healthy' && (
                            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Wifi className="h-5 w-5 text-green-500" />
                            </div>
                          )}
                          {observabilityDashboard.metrics.systemHealth === 'degraded' && (
                            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>
                          )}
                          {observabilityDashboard.metrics.systemHealth === 'critical' && (
                            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                              <WifiOff className="h-5 w-5 text-red-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-lg capitalize">{observabilityDashboard.metrics.systemHealth}</div>
                            <div className="text-sm text-muted-foreground">System Status</div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          Last updated: {new Date(observabilityDashboard.metrics.lastUpdated).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs">Active Agents</span>
                        </div>
                        <div className="text-2xl font-bold">{observabilityDashboard.metrics.activeAgents}</div>
                        <div className="text-xs text-muted-foreground">of {observabilityDashboard.metrics.totalAgents} total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Activity className="h-4 w-4" />
                          <span className="text-xs">Running Tasks</span>
                        </div>
                        <div className="text-2xl font-bold">{observabilityDashboard.metrics.runningTasks}</div>
                        <div className="text-xs text-muted-foreground">{observabilityDashboard.metrics.pendingTasks} pending</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Completed Today</span>
                        </div>
                        <div className="text-2xl font-bold text-green-500">{observabilityDashboard.metrics.completedTasksToday}</div>
                        <div className="text-xs text-muted-foreground">{observabilityDashboard.metrics.failedTasksToday} failed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Zap className="h-4 w-4" />
                          <span className="text-xs">API Calls Today</span>
                        </div>
                        <div className="text-2xl font-bold">{observabilityDashboard.metrics.apiCallsToday}</div>
                        <div className="text-xs text-muted-foreground">{observabilityDashboard.metrics.totalTokensUsed.toLocaleString()} tokens</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Agent Activity Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Cpu className="h-4 w-4" /> Agent Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {agents.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">No agents yet</div>
                          ) : (
                            agents.map((agent) => (
                              <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm">
                                    {agent.icon || '🤖'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{agent.name}</div>
                                    <div className="text-xs text-muted-foreground">{agent.type}</div>
                                  </div>
                                </div>
                                <Badge variant={
                                  agent.status === 'idle' ? 'secondary' :
                                  agent.status === 'busy' ? 'default' :
                                  agent.status === 'error' ? 'destructive' : 'outline'
                                }>
                                  {agent.status}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Timer className="h-4 w-4" /> Task Queue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {beans.filter(b => b.status === 'running' || b.status === 'queued').length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">No active tasks</div>
                          ) : (
                            beans.filter(b => b.status === 'running' || b.status === 'queued').map((bean) => (
                              <div key={bean.id} className="p-2 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium truncate">{bean.title}</div>
                                  <Badge variant={bean.status === 'running' ? 'default' : 'secondary'}>
                                    {bean.status}
                                  </Badge>
                                </div>
                                {bean.assignedAgentId && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Agent: {agents.find(a => a.id === bean.assignedAgentId)?.name || 'Unknown'}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity Feed */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Radio className="h-4 w-4" /> Activity Feed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {agentActivities.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">No recent activity</div>
                        ) : (
                          agentActivities.slice(0, 20).map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                              <div className={cn(
                                'h-2 w-2 rounded-full mt-2',
                                activity.type === 'error' && 'bg-red-500',
                                activity.type === 'completed_task' && 'bg-green-500',
                                activity.type === 'started_task' && 'bg-blue-500',
                                activity.type === 'thinking' && 'bg-amber-500',
                                activity.type === 'idle' && 'bg-gray-400'
                              )} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm">{activity.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  {activity.agentName} • {new Date(activity.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Errors */}
                  {observabilityDashboard.recentErrors.length > 0 && (
                    <Card className="border-destructive/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Recent Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {observabilityDashboard.recentErrors.map((error) => (
                            <div key={error.id} className="p-2 rounded-lg bg-destructive/10 text-sm">
                              <div className="font-mono text-xs">{error.error}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(error.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Scheduler Tab */}
          {mainTab === 'scheduler' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="h-6 w-6" /> Scheduler
                    </h2>
                    <p className="text-muted-foreground">Manage scheduled tasks and automation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={scheduleFilter} onValueChange={(v) => setScheduleFilter(v as ScheduleStatus | 'all')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Schedules</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowAddSchedule(true)}>
                      <Plus className="h-4 w-4 mr-2" /> New Schedule
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {schedules.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-xl mb-2">No Schedules Yet</h3>
                      <p className="text-muted-foreground mb-6">Create scheduled tasks to automate your workflow</p>
                      <Button onClick={() => setShowAddSchedule(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Schedule
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(scheduleFilter === 'all' ? schedules : schedules.filter(s => s.status === scheduleFilter)).map((schedule) => (
                      <Card key={schedule.id} className={cn(
                        'transition-all',
                        schedule.status === 'active' && 'border-green-500/30',
                        schedule.status === 'paused' && 'border-amber-500/30',
                        schedule.status === 'disabled' && 'border-gray-500/30',
                        schedule.status === 'error' && 'border-red-500/30'
                      )}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-sm',
                                schedule.status === 'active' && 'bg-green-500/20 text-green-500',
                                schedule.status === 'paused' && 'bg-amber-500/20 text-amber-500',
                                schedule.status === 'disabled' && 'bg-gray-500/20 text-gray-500',
                                schedule.status === 'error' && 'bg-red-500/20 text-red-500'
                              )}>
                                {schedule.trigger.type === 'cron' && <Calendar className="h-4 w-4" />}
                                {schedule.trigger.type === 'interval' && <RotateCcw className="h-4 w-4" />}
                                {schedule.trigger.type === 'once' && <FastForward className="h-4 w-4" />}
                              </div>
                              <div>
                                <CardTitle className="text-base">{schedule.name}</CardTitle>
                                <div className="text-xs text-muted-foreground">
                                  {schedule.trigger.type === 'cron' && `Cron: ${schedule.trigger.cronExpression}`}
                                  {schedule.trigger.type === 'interval' && `Every ${schedule.trigger.intervalMinutes} min`}
                                  {schedule.trigger.type === 'once' && `Once at ${schedule.trigger.scheduledTime ? new Date(schedule.trigger.scheduledTime).toLocaleString() : 'TBD'}`}
                                </div>
                              </div>
                            </div>
                            <Badge variant={
                              schedule.status === 'active' ? 'default' :
                              schedule.status === 'paused' ? 'secondary' :
                              'outline'
                            }>
                              {schedule.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {schedule.description && (
                            <p className="text-sm text-muted-foreground mb-3">{schedule.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="p-2 bg-muted rounded">
                              <div className="text-muted-foreground">Action</div>
                              <div className="font-medium capitalize">{schedule.action.type.replace('_', ' ')}</div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                              <div className="text-muted-foreground">Executions</div>
                              <div className="font-medium">{schedule.executionCount}</div>
                            </div>
                          </div>

                          {schedule.nextExecutionAt && (
                            <div className="text-xs text-muted-foreground mb-3">
                              Next run: {new Date(schedule.nextExecutionAt).toLocaleString()}
                            </div>
                          )}

                          {/* Recent Executions */}
                          {schedule.recentExecutions.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Recent Executions</div>
                              <div className="space-y-1">
                                {schedule.recentExecutions.slice(0, 3).map((exec) => (
                                  <div key={exec.id} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {new Date(exec.triggeredAt).toLocaleTimeString()}
                                    </span>
                                    <Badge variant={
                                      exec.status === 'completed' ? 'default' :
                                      exec.status === 'failed' ? 'destructive' :
                                      'secondary'
                                    } className="text-[10px]">
                                      {exec.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            {schedule.status === 'active' && (
                              <Button variant="outline" size="sm" onClick={() => pauseSchedule(schedule.id)}>
                                <Pause className="h-3 w-3 mr-1" /> Pause
                              </Button>
                            )}
                            {schedule.status === 'paused' && (
                              <Button variant="outline" size="sm" onClick={() => resumeSchedule(schedule.id)}>
                                <Play className="h-3 w-3 mr-1" /> Resume
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => executeSchedule(schedule.id)}>
                              <FastForward className="h-3 w-3 mr-1" /> Run Now
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingSchedule(schedule);
                              setNewScheduleName(schedule.name);
                              setNewScheduleDescription(schedule.description || '');
                              setNewScheduleType(schedule.trigger.type);
                              setNewScheduleCron(schedule.trigger.cronExpression || '0 9 * * 1-5');
                              setNewScheduleInterval(schedule.trigger.intervalMinutes || 60);
                              setNewScheduleAction(schedule.action.type);
                              setShowAddSchedule(true);
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              if (confirm('Delete this schedule?')) {
                                deleteSchedule(schedule.id);
                              }
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Plugins Tab */}
          {mainTab === 'plugins' && (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Plugins</h2>
                    <p className="text-muted-foreground">Extend the app with custom plugins</p>
                  </div>
                  <Button onClick={() => setShowAddPlugin(true)}>
                    <Plus className="h-4 w-4 mr-2" /> New Plugin
                  </Button>
                </div>

                {/* Plugin Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <Layers className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{plugins.length}</div>
                      <div className="text-xs text-muted-foreground">Total Plugins</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{plugins.filter(p => p.enabled).length}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <XCircle className="h-5 w-5 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold">{plugins.filter(p => p.status === 'error').length}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <Play className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                      <div className="text-2xl font-bold">{pluginExecutions.length}</div>
                      <div className="text-xs text-muted-foreground">Executions</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Plugin List */}
                {plugins.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-xl mb-2">No Plugins Yet</h3>
                      <p className="text-muted-foreground mb-6">Create plugins to extend the app's capabilities</p>
                      <Button onClick={() => setShowAddPlugin(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Plugin
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {plugins.map((plugin) => (
                      <Card key={plugin.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{plugin.icon || '🔌'}</span>
                              <div>
                                <h3 className="font-semibold">{plugin.name}</h3>
                                <p className="text-xs text-muted-foreground">v{plugin.version}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={plugin.enabled ? 'default' : 'outline'} className={plugin.status === 'error' ? 'border-red-500' : ''}>
                                {plugin.status}
                              </Badge>
                              <Switch 
                                checked={plugin.enabled} 
                                onCheckedChange={() => plugin.enabled ? disablePlugin(plugin.id) : enablePlugin(plugin.id)}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plugin.description || 'No description'}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" /> {plugin.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" /> {plugin.scope}
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" /> {plugin.trigger}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {plugin.executionCount} executions • {plugin.stats?.successCount || 0} success
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditPlugin(plugin)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeletePlugin(plugin.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {mainTab === 'skills' && (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Skills</h2>
                    <p className="text-muted-foreground">Define capabilities for AI agents</p>
                  </div>
                  <div className="flex gap-2">
                    {skillCreationRequests.filter(r => r.status === 'pending').length > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {skillCreationRequests.filter(r => r.status === 'pending').length} Pending Requests
                      </Badge>
                    )}
                    <Button onClick={() => setShowAddSkill(true)}>
                      <Plus className="h-4 w-4 mr-2" /> New Skill
                    </Button>
                  </div>
                </div>

                {/* Skill Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <Sparkles className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">{skills.length}</div>
                      <div className="text-xs text-muted-foreground">Total Skills</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{skills.filter(s => s.status === 'available').length}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="text-center">
                      <Activity className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                      <div className="text-2xl font-bold">{skills.reduce((sum, s) => sum + s.usageCount, 0)}</div>
                      <div className="text-xs text-muted-foreground">Total Uses</div>
                    </CardContent>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:shadow-md" onClick={() => setShowSkillRequests(true)}>
                    <CardContent className="text-center">
                      <Clock className="h-5 w-5 mx-auto mb-2 text-red-500" />
                      <div className="text-2xl font-bold">{skillCreationRequests.filter(r => r.status === 'pending').length}</div>
                      <div className="text-xs text-muted-foreground">Pending Requests</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Skill List */}
                {skills.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-xl mb-2">No Skills Yet</h3>
                      <p className="text-muted-foreground mb-6">Create skills to define agent capabilities</p>
                      <Button onClick={() => setShowAddSkill(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Skill
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <Card key={skill.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{skill.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{skill.category}</Badge>
                                <Badge variant="secondary">{skill.complexity}</Badge>
                                {skill.isOneTimeUse && (
                                  <Badge variant="destructive">One-time</Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant={skill.status === 'available' ? 'default' : 'outline'}>
                              {skill.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{skill.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span>📊 {skill.usageCount} uses</span>
                            <span>✅ {(skill.successRate * 100).toFixed(0)}% success</span>
                            <span>⚡ {skill.averageExecutionTime.toFixed(0)}ms avg</span>
                          </div>
                          {skill.assignedToAgents && skill.assignedToAgents.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                              <Users className="h-3 w-3" />
                              {skill.assignedToAgents.length} agent{skill.assignedToAgents.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              v{skill.version}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSkill(skill)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSkill(skill.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workspaces Tab */}
          {mainTab === 'workspaces' && (
            activeWorkspace ? (
              <div className="flex-1 flex">
                {/* Folder Tree */}
                <div className="w-64 border-r bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      {activeWorkspace.indexType === 'global' ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-amber-500" />}
                      {activeWorkspace.name}
                    </h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setShowImportFiles(true)}><Upload className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddFolder(true)}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-1">
                      {folders.map((folder) => (
                        <div 
                          key={folder.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted',
                            selectedFolder?.id === folder.id && 'bg-muted'
                          )}
                          onClick={() => setSelectedFolder(folder)}
                          style={{ paddingLeft: `${(folder.path.split('/').length - 1) * 12}px` }}
                        >
                          {folder.type === 'folder' ? <FolderOpen className="h-4 w-4 text-amber-500" /> : <File className="h-4 w-4 text-blue-500" />}
                          <span className="text-sm truncate">{folder.name}</span>
                          {folder.embedding && <Hash className="h-3 w-3 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b flex items-center gap-4">
                    <Badge variant="outline">{activeWorkspace.indexType}</Badge>
                    <Badge variant="outline">{activeWorkspace.embeddingProvider}/{activeWorkspace.embeddingModel}</Badge>
                    <div className="flex-1 flex gap-2">
                      <Input placeholder="Search workspace..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="max-w-xs" />
                      <Button size="sm" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
                    </div>
                    <Button size="sm" onClick={handleIndexWorkspace} disabled={isIndexing}>
                      {isIndexing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      Index
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExportIndex}>
                      <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </div>

                  <Tabs defaultValue="content" className="flex-1 flex flex-col">
                    <TabsList className="w-full justify-start px-4 border-b rounded-none">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="graph">Graph</TabsTrigger>
                      <TabsTrigger value="search">Search</TabsTrigger>
                      <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="flex-1 p-4 m-0 overflow-auto">
                      {selectedFolder ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {selectedFolder.type === 'folder' ? <FolderOpen className="h-5 w-5" /> : <File className="h-5 w-5" />}
                              {selectedFolder.name}
                            </CardTitle>
                            <CardDescription>{selectedFolder.path}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {selectedFolder.content ? (
                              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                                {selectedFolder.content}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground">No content</p>
                            )}
                            {selectedFolder.embedding && (
                              <Badge variant="secondary" className="mt-4">
                                <Hash className="h-3 w-3 mr-1" /> Indexed with {selectedFolder.embeddingModel}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Select a folder or file</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="graph" className="flex-1 p-4 m-0">
                      {graphData ? (
                        <div className="grid grid-cols-5 gap-4 mb-4">
                          <Card><CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{graphData.stats.nodes}</div>
                            <div className="text-xs text-muted-foreground">Nodes</div>
                          </CardContent></Card>
                          <Card><CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{graphData.stats.edges}</div>
                            <div className="text-xs text-muted-foreground">Edges</div>
                          </CardContent></Card>
                          <Card><CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{graphData.stats.embedded}</div>
                            <div className="text-xs text-muted-foreground">Embedded</div>
                          </CardContent></Card>
                          <Card><CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{graphData.stats.maxDepth}</div>
                            <div className="text-xs text-muted-foreground">Max Depth</div>
                          </CardContent></Card>
                          <Card><CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{activeWorkspace.stats.totalSessions || 0}</div>
                            <div className="text-xs text-muted-foreground">Sessions</div>
                          </CardContent></Card>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="search" className="flex-1 p-4 m-0">
                      <div className="space-y-4">
                        {searchResults.map((result, i) => (
                          <Card key={i} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedFolder(folders.find(f => f.id === result.folder?.id) || null)}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{result.folder?.name}</h4>
                                  <p className="text-sm text-muted-foreground">{result.folder?.path}</p>
                                </div>
                                <Badge>{(result.similarity * 100).toFixed(1)}%</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {searchResults.length === 0 && (
                          <div className="text-center py-8">
                            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Search your indexed content</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="flex-1 p-4 m-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Team Sessions</h3>
                        <Badge variant="outline">Auto-index: {activeWorkspace.settings.indexSessions ? 'ON' : 'OFF'}</Badge>
                      </div>
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Chat sessions are indexed for semantic search</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md text-center">
                  <CardContent className="p-8">
                    <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-xl mb-2">Workspace Management</h3>
                    <p className="text-muted-foreground mb-6">Create workspaces to index and search content</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setShowAddWorkspace(true)}><Plus className="h-4 w-4 mr-2" /> Create</Button>
                      <Button variant="outline" onClick={() => document.getElementById('importIndex')?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Import
                      </Button>
                      <input id="importIndex" type="file" accept=".json" className="hidden" onChange={handleImportIndex} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}

          {/* Teams Tab */}
          {mainTab === 'teams' && (
            activeTeam ? (
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{activeTeam.name}</h2>
                    <p className="text-muted-foreground">{activeTeam.description}</p>
                  </div>
                  <Button onClick={() => setShowAddTeamMember(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Member
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{activeTeam.stats.totalMembers}</div>
                      <div className="text-xs text-muted-foreground">Total Members</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{teamMembersList.filter(m => m.role === 'admin').length}</div>
                      <div className="text-xs text-muted-foreground">Admins</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{workspaces.filter(w => w.teamId === activeTeam.id).length}</div>
                      <div className="text-xs text-muted-foreground">Workspaces</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {teamMembersList.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar><AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md text-center">
                  <CardContent className="p-8">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-xl mb-2">Team Management</h3>
                    <p className="text-muted-foreground mb-6">Create teams to organize members and workspaces</p>
                    <Button onClick={() => setShowCreateTeam(true)}><Plus className="h-4 w-4 mr-2" /> Create Team</Button>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </main>
      </div>
    </div>

    {/* Command Palette */}
    <CommandPalette 
      open={commandPaletteOpen} 
      onOpenChange={setCommandPaletteOpen}
      onNavigate={handleCommandNavigation}
    />

    {/* Add Member Dialog */}
    <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><Label>Member Name *</Label>
                <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name" />
              </div>
              <div><Label>Role</Label>
                <Input value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} placeholder="Developer, PM..." />
              </div>
              <div><Label>Agent Personality</Label>
                <Textarea value={newMemberSystemPrompt} onChange={(e) => setNewMemberSystemPrompt(e.target.value)} rows={3} />
              </div>
            </div>
            <div>
              <Label>Select Provider</Label>
              <Input value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} placeholder="Search..." className="mb-2" />
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2">
                  {Object.values(AI_PROVIDERS).filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())).slice(0, 20).map((p) => (
                    <Button key={p.id} variant={selectedProvider === p.id ? 'default' : 'ghost'}
                      className="w-full justify-start" onClick={() => handleProviderChangeWithDiscovery(p.id, 'member')} disabled={isDiscoveringModels}>
                      <span className="mr-2">{p.icon}</span>{p.name}
                      {selectedProvider === p.id && isDiscoveringModels && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              {selectedProviderData && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div><Label>Model {isDiscoveringModels && <Loader2 className="h-3 w-3 inline ml-1 animate-spin" />}</Label>
                      <Select value={newMemberModel} onValueChange={setNewMemberModel} disabled={isDiscoveringModels}>
                        <SelectTrigger><SelectValue placeholder="Select model..." /></SelectTrigger>
                        <SelectContent>
                          {getModelsForProvider(selectedProvider).map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!selectedProviderData.local && (
                      <div className="mt-2"><Label>API Key</Label>
                        <Input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddMember(false); resetAddMemberForm(); }}>Cancel</Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bean Dialog */}
      <Dialog open={showAddBean} onOpenChange={(v) => { setShowAddBean(v); if (!v) resetBeanForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBean ? 'Edit Bean' : 'Create New Bean'}</DialogTitle>
            <DialogDescription>A bean is a task that can be assigned to an AI agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bean Title *</Label>
                <Input value={newBeanTitle} onChange={(e) => setNewBeanTitle(e.target.value)} placeholder="Enter bean title..." />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newBeanPriority} onValueChange={(v) => setNewBeanPriority(v as Bean['priority'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newBeanDescription} onChange={(e) => setNewBeanDescription(e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={newBeanCategory} onChange={(e) => setNewBeanCategory(e.target.value)} placeholder="e.g., Analysis, Research, Coding..." />
            </div>
            <div>
              <Label>Detailed Content</Label>
              <Textarea 
                value={newBeanContent} 
                onChange={(e) => setNewBeanContent(e.target.value)} 
                rows={5} 
                placeholder="Detailed instructions for the agent..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddBean(false); resetBeanForm(); }}>Cancel</Button>
            <Button onClick={editingBean ? handleUpdateBean : handleAddBean}>
              {editingBean ? 'Update Bean' : 'Create Bean'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Plugin Dialog */}
      <Dialog open={showAddPlugin} onOpenChange={(v) => { setShowAddPlugin(v); if (!v) resetPluginForm(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlugin ? 'Edit Plugin' : 'Create New Plugin'}</DialogTitle>
            <DialogDescription>Plugins extend the app with custom functionality</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={newPluginName} onChange={(e) => setNewPluginName(e.target.value)} placeholder="Plugin name..." />
              </div>
              <div>
                <Label>Icon</Label>
                <Input value={newPluginIcon} onChange={(e) => setNewPluginIcon(e.target.value)} placeholder="🔌" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newPluginDescription} onChange={(e) => setNewPluginDescription(e.target.value)} placeholder="What does this plugin do?" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={newPluginCategory} onValueChange={setNewPluginCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scope</Label>
                <Select value={newPluginScope} onValueChange={(v) => setNewPluginScope(v as PluginScope)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="workspace">Workspace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={newPluginTrigger} onValueChange={(v) => setNewPluginTrigger(v as PluginTrigger)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Code *</Label>
              <Textarea 
                value={newPluginCode} 
                onChange={(e) => setNewPluginCode(e.target.value)} 
                rows={10} 
                className="font-mono text-sm"
                placeholder={`// Plugin code (JavaScript/TypeScript)
// Available: input, config, console, JSON, fetch

async function execute() {
  // Your code here
  return { result: 'success' };
}

return execute();`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newPluginOneTime} onCheckedChange={setNewPluginOneTime} />
              <Label>One-time use (auto-delete after execution)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddPlugin(false); resetPluginForm(); }}>Cancel</Button>
            <Button onClick={editingPlugin ? handleUpdatePlugin : handleAddPlugin}>
              {editingPlugin ? 'Update Plugin' : 'Create Plugin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onOpenChange={(v) => { setShowAddSkill(v); if (!v) resetSkillForm(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Edit Skill' : 'Create New Skill'}</DialogTitle>
            <DialogDescription>Skills define capabilities that agents can use</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Skill name..." />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newSkillCategory} onValueChange={(v) => setNewSkillCategory(v as SkillCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="generation">Generation</SelectItem>
                    <SelectItem value="transformation">Transformation</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea 
                value={newSkillDescription} 
                onChange={(e) => setNewSkillDescription(e.target.value)} 
                rows={2}
                placeholder="Describe what this skill does and when to use it..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Complexity</Label>
                <Select value={newSkillComplexity} onValueChange={(v) => setNewSkillComplexity(v as SkillComplexity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={newSkillDeterministic} onCheckedChange={setNewSkillDeterministic} />
                  <Label>Deterministic (same input = same output)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newSkillOneTime} onCheckedChange={setNewSkillOneTime} />
                  <Label>One-time use</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Skill Code (optional)</Label>
              <Textarea 
                value={newSkillCode} 
                onChange={(e) => setNewSkillCode(e.target.value)} 
                rows={8} 
                className="font-mono text-sm"
                placeholder={`// Skill code (optional)
// Available: params (input), context (agent/skill info)

async function execute(params, context) {
  // Your implementation
  return { result: 'success' };
}

return execute(params, context);`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSkill(false); resetSkillForm(); }}>Cancel</Button>
            <Button onClick={editingSkill ? handleUpdateSkill : handleAddSkill}>
              {editingSkill ? 'Update Skill' : 'Create Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Creation Requests Dialog */}
      <Dialog open={showSkillRequests} onOpenChange={setShowSkillRequests}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Skill Creation Requests</DialogTitle>
            <DialogDescription>Review and approve skill/plugin requests from agents</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {skillCreationRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                skillCreationRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{request.requestedCapability}</h4>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {agents.find(a => a.id === request.agentId)?.name || 'Unknown Agent'}
                          </p>
                          <Badge variant={request.status === 'pending' ? 'outline' : request.status === 'created' ? 'default' : 'destructive'} className="mt-2">
                            {request.status}
                          </Badge>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => respondToSkillRequest(request.id, 'reject')}>
                              Reject
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => respondToSkillRequest(request.id, 'one_time')}>
                              One-time
                            </Button>
                            <Button size="sm" onClick={() => respondToSkillRequest(request.id, 'keep')}>
                              Keep
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkillRequests(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Workspace Dialog */}
      <Dialog open={showAddWorkspace} onOpenChange={setShowAddWorkspace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>Create a workspace for indexing and search</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label>
              <Input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Workspace name" />
            </div>
            <div><Label>Description</Label>
              <Input value={newWorkspaceDescription} onChange={(e) => setNewWorkspaceDescription(e.target.value)} />
            </div>
            <div>
              <Label>Index Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Card className={cn('cursor-pointer transition-all', newWorkspaceIndexType === 'local' && 'ring-2 ring-primary')}
                  onClick={() => setNewWorkspaceIndexType('local')}>
                  <CardContent className="p-4 text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <div className="font-medium">Local</div>
                    <div className="text-xs text-muted-foreground">Private to you</div>
                  </CardContent>
                </Card>
                <Card className={cn('cursor-pointer transition-all', newWorkspaceIndexType === 'global' && 'ring-2 ring-primary')}
                  onClick={() => setNewWorkspaceIndexType('global')}>
                  <CardContent className="p-4 text-center">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="font-medium">Global</div>
                    <div className="text-xs text-muted-foreground">Shared with team</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Embedding Provider</Label>
                <Select value={newWorkspaceEmbeddingProvider} onValueChange={(v) => { setNewWorkspaceEmbeddingProvider(v); setNewWorkspaceEmbeddingModel(EMBEDDING_PROVIDERS[v]?.models[0] || ''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMBEDDING_PROVIDERS).map(([id, p]) => (
                      <SelectItem key={id} value={id}>{p.icon} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Model</Label>
                <Select value={newWorkspaceEmbeddingModel} onValueChange={setNewWorkspaceEmbeddingModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedEmbeddingProvider?.models || []).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Index Team Sessions</Label>
                <p className="text-xs text-muted-foreground">Include chat sessions in search index</p>
              </div>
              <Switch checked={newWorkspaceIndexSessions} onCheckedChange={setNewWorkspaceIndexSessions} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddWorkspace(false); resetWorkspaceForm(); }}>Cancel</Button>
            <Button onClick={handleAddWorkspace}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Files Dialog */}
      <Dialog open={showImportFiles} onOpenChange={setShowImportFiles}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Files</DialogTitle>
            <DialogDescription>Import files to workspace for indexing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click or drag files to upload</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" 
                onChange={(e) => setImportFiles(e.target.files)} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Select Files
              </Button>
              {importFiles && importFiles.length > 0 && (
                <p className="text-sm mt-2">{importFiles.length} file(s) selected</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: .txt, .md, .json, .csv, .xml, .pdf, .docx, .html, .js, .ts, .py, .java, .go, .rs, and 40+ more
            </p>
            <div className="flex items-center justify-between">
              <Label>Auto-index files</Label>
              <Switch checked={autoIndexImports} onCheckedChange={setAutoIndexImports} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportFiles(false)}>Cancel</Button>
            <Button onClick={handleImportFiles} disabled={!importFiles || importFiles.length === 0}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Folder Dialog */}
      <Dialog open={showAddFolder} onOpenChange={setShowAddFolder}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Workspace</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name" />
            </div>
            <div><Label>Type</Label>
              <Select value={newFolderType} onValueChange={(v) => setNewFolderType(v as 'folder' | 'file')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="folder">Folder</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFolderType === 'file' && (
              <div><Label>Content</Label>
                <Textarea value={newFolderContent} onChange={(e) => setNewFolderContent(e.target.value)} rows={5} placeholder="File content..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddFolder(false); resetFolderForm(); }}>Cancel</Button>
            <Button onClick={handleAddFolder}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Team</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Team Name *</Label>
              <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team name" />
            </div>
            <div><Label>Description</Label>
              <Input value={newTeamDescription} onChange={(e) => setNewTeamDescription(e.target.value)} placeholder="Description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateTeam(false); setNewTeamName(''); setNewTeamDescription(''); }}>Cancel</Button>
            <Button onClick={handleCreateTeam}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Dialog */}
      <Dialog open={showAddTeamMember} onOpenChange={setShowAddTeamMember}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email *</Label>
              <Input type="email" value={newTeamMemberEmail} onChange={(e) => setNewTeamMemberEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div><Label>Role</Label>
              <Select value={newTeamMemberRole} onValueChange={(v) => setNewTeamMemberRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddTeamMember(false); setNewTeamMemberEmail(''); }}>Cancel</Button>
            <Button onClick={handleAddTeamMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={showAddSchedule} onOpenChange={(v) => { setShowAddSchedule(v); if (!v) setEditingSchedule(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
            <DialogDescription>Configure automated task scheduling</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={newScheduleName} onChange={(e) => setNewScheduleName(e.target.value)} placeholder="Schedule name..." />
              </div>
              <div>
                <Label>Schedule Type</Label>
                <Select value={newScheduleType} onValueChange={(v) => setNewScheduleType(v as ScheduleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interval">Interval</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="once">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newScheduleDescription} onChange={(e) => setNewScheduleDescription(e.target.value)} placeholder="What does this schedule do?" />
            </div>
            
            {newScheduleType === 'interval' && (
              <div>
                <Label>Interval (minutes)</Label>
                <Input type="number" value={newScheduleInterval} onChange={(e) => setNewScheduleInterval(parseInt(e.target.value) || 60)} placeholder="60" />
              </div>
            )}
            
            {newScheduleType === 'cron' && (
              <div>
                <Label>Cron Expression</Label>
                <Input value={newScheduleCron} onChange={(e) => setNewScheduleCron(e.target.value)} placeholder="0 9 * * 1-5" />
                <p className="text-xs text-muted-foreground mt-1">Example: "0 9 * * 1-5" runs at 9 AM on weekdays</p>
              </div>
            )}

            <div>
              <Label>Action Type</Label>
              <Select value={newScheduleAction} onValueChange={(v) => setNewScheduleAction(v as ScheduleAction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="run_bean">Run Bean</SelectItem>
                  <SelectItem value="run_plugin">Run Plugin</SelectItem>
                  <SelectItem value="send_report">Send Report</SelectItem>
                  <SelectItem value="sync_data">Sync Data</SelectItem>
                  <SelectItem value="cleanup">Cleanup</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select value={newScheduleTimezone} onValueChange={setNewScheduleTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSchedule(false); setEditingSchedule(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!newScheduleName.trim()) {
                toast.error('Please enter a schedule name');
                return;
              }
              
              if (editingSchedule) {
                updateSchedule(editingSchedule.id, {
                  name: newScheduleName,
                  description: newScheduleDescription,
                  trigger: {
                    type: newScheduleType,
                    cronExpression: newScheduleType === 'cron' ? newScheduleCron : undefined,
                    intervalMinutes: newScheduleType === 'interval' ? newScheduleInterval : undefined,
                    timezone: newScheduleTimezone,
                  },
                  action: {
                    type: newScheduleAction,
                  },
                });
                toast.success('Schedule updated');
              } else {
                addSchedule({
                  name: newScheduleName,
                  description: newScheduleDescription,
                  trigger: {
                    type: newScheduleType,
                    cronExpression: newScheduleType === 'cron' ? newScheduleCron : undefined,
                    intervalMinutes: newScheduleType === 'interval' ? newScheduleInterval : undefined,
                    timezone: newScheduleTimezone,
                  },
                  action: {
                    type: newScheduleAction,
                  },
                  status: 'active',
                  enabled: true,
                  visibleToOrchestrator: true,
                });
                toast.success('Schedule created');
              }
              
              setShowAddSchedule(false);
              setEditingSchedule(null);
              setNewScheduleName('');
              setNewScheduleDescription('');
              setNewScheduleType('interval');
              setNewScheduleCron('0 9 * * 1-5');
              setNewScheduleInterval(60);
              setNewScheduleAction('run_bean');
            }}>
              {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription>Manage your account, experience, and application preferences</DialogDescription>
          </DialogHeader>
          
          <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start flex-wrap">
              <TabsTrigger value="profile" className="gap-1"><UserCircle className="h-4 w-4" /> Profile</TabsTrigger>
              <TabsTrigger value="experience" className="gap-1"><Palette className="h-4 w-4" /> Experience</TabsTrigger>
              <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-4 w-4" /> Chat</TabsTrigger>
              <TabsTrigger value="workspace" className="gap-1"><Database className="h-4 w-4" /> Workspace</TabsTrigger>
              <TabsTrigger value="api" className="gap-1"><KeyRound className="h-4 w-4" /> API Keys</TabsTrigger>
              <TabsTrigger value="data" className="gap-1"><Save className="h-4 w-4" /> Data</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Display Name</Label>
                        <Input value={userSettings.displayName} onChange={(e) => updateUserSettings({ displayName: e.target.value })} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={userSettings.email} onChange={(e) => updateUserSettings({ email: e.target.value })} placeholder="user@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Timezone</Label>
                        <Select value={userSettings.timezone} onValueChange={(v) => updateUserSettings({ timezone: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Language</Label>
                        <Select value={userSettings.language} onValueChange={(v) => updateUserSettings({ language: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                            <SelectItem value="ja">日本語</SelectItem>
                            <SelectItem value="ko">한국어</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Experience Tab */}
              <TabsContent value="experience" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                      </div>
                      <Switch checked={userSettings.darkMode} onCheckedChange={(v) => { updateUserSettings({ darkMode: v }); setDarkMode(v); }} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                      </div>
                      <Switch checked={userSettings.compactMode} onCheckedChange={(v) => updateUserSettings({ compactMode: v })} />
                    </div>
                    <Separator />
                    <div>
                      <Label>Font Size</Label>
                      <Select value={userSettings.fontSize} onValueChange={(v) => updateUserSettings({ fontSize: v as any })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-base">Notifications & Sound</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Show Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive desktop notifications</p>
                        </div>
                      </div>
                      <Switch checked={userSettings.showNotifications} onCheckedChange={(v) => updateUserSettings({ showNotifications: v })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Sound Effects</Label>
                          <p className="text-sm text-muted-foreground">Play sounds for messages</p>
                        </div>
                      </div>
                      <Switch checked={userSettings.soundEnabled} onCheckedChange={(v) => updateUserSettings({ soundEnabled: v })} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Default Model Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Default Provider</Label>
                        <Select 
                          value={userSettings.defaultProvider} 
                          onValueChange={(v) => handleProviderChangeWithDiscovery(v, 'settings')}
                          disabled={isDiscoveringModels}
                        >
                          <SelectTrigger>
                            <SelectValue />
                            {isDiscoveringModels && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(AI_PROVIDERS).slice(0, 20).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Default Model</Label>
                        <Select 
                          value={userSettings.defaultModel} 
                          onValueChange={(v) => updateUserSettings({ defaultModel: v })}
                          disabled={isDiscoveringModels}
                        >
                          <SelectTrigger><SelectValue placeholder="Select model..." /></SelectTrigger>
                          <SelectContent>
                            {getModelsForProvider(userSettings.defaultProvider).map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-base">Chat Behavior</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Stream Responses</Label>
                          <p className="text-sm text-muted-foreground">Show responses as they're generated</p>
                        </div>
                      </div>
                      <Switch checked={userSettings.streamResponses} onCheckedChange={(v) => updateUserSettings({ streamResponses: v })} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Token Count</Label>
                        <p className="text-sm text-muted-foreground">Display token usage for each message</p>
                      </div>
                      <Switch checked={userSettings.showTokenCount} onCheckedChange={(v) => updateUserSettings({ showTokenCount: v })} />
                    </div>
                    <Separator />
                    <div>
                      <Label>Max History Messages</Label>
                      <p className="text-sm text-muted-foreground mb-2">Number of messages to keep in context</p>
                      <Select value={userSettings.maxHistoryMessages.toString()} onValueChange={(v) => updateUserSettings({ maxHistoryMessages: parseInt(v) })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Workspace Tab */}
              <TabsContent value="workspace" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Default Workspace Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Index Files</Label>
                        <p className="text-sm text-muted-foreground">Automatically index uploaded files</p>
                      </div>
                      <Switch checked={userSettings.autoIndex} onCheckedChange={(v) => updateUserSettings({ autoIndex: v })} />
                    </div>
                    <Separator />
                    <div>
                      <Label>Default Index Type</Label>
                      <p className="text-sm text-muted-foreground mb-2">Choose default visibility for new workspaces</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Card className={cn('cursor-pointer transition-all', userSettings.defaultIndexType === 'local' && 'ring-2 ring-primary')}
                          onClick={() => updateUserSettings({ defaultIndexType: 'local' })}>
                          <CardContent className="p-3 text-center">
                            <Lock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                            <div className="font-medium text-sm">Local</div>
                          </CardContent>
                        </Card>
                        <Card className={cn('cursor-pointer transition-all', userSettings.defaultIndexType === 'global' && 'ring-2 ring-primary')}
                          onClick={() => updateUserSettings({ defaultIndexType: 'global' })}>
                          <CardContent className="p-3 text-center">
                            <Globe className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                            <div className="font-medium text-sm">Global</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-base">Embedding Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Embedding Provider</Label>
                        <Select value={userSettings.embeddingProvider} onValueChange={(v) => updateUserSettings({ embeddingProvider: v, embeddingModel: EMBEDDING_PROVIDERS[v]?.models[0] || '' })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(EMBEDDING_PROVIDERS).map(([id, p]) => (
                              <SelectItem key={id} value={id}>{p.icon} {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Embedding Model</Label>
                        <Select value={userSettings.embeddingModel} onValueChange={(v) => updateUserSettings({ embeddingModel: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {EMBEDDING_PROVIDERS[userSettings.embeddingProvider]?.models.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* API Keys Tab */}
              <TabsContent value="api" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" /> API Key Management
                    </CardTitle>
                    <CardDescription>Keys are stored securely server-side and never exposed to the client</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-4">
                      Configure API keys for different providers. Keys are encrypted and stored server-side.
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {Object.entries(AI_PROVIDERS).slice(0, 20).map(([id, provider]) => (
                          <div key={id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{provider.icon}</span>
                              <span className="font-medium">{provider.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {apiKeyStatus[id] ? (
                                <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Connected</Badge>
                              ) : (
                                <Badge variant="secondary">Not Set</Badge>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    {apiKeyStatus[id] ? 'Update' : 'Add Key'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>API Key for {provider.name}</DialogTitle>
                                    <DialogDescription>Enter your API key. It will be stored securely server-side.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>API Key</Label>
                                      <Input type="password" placeholder={provider.keyPlaceholder} id={`key-${id}`} />
                                    </div>
                                    <Button onClick={() => {
                                      const input = document.getElementById(`key-${id}`) as HTMLInputElement;
                                      if (input?.value) {
                                        saveApiKey(id, input.value);
                                        input.value = '';
                                      }
                                    }}>Save Key</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Data Tab */}
              <TabsContent value="data" className="mt-0 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Export & Import Data</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleExportIndex}>
                        <Download className="h-4 w-4 mr-2" /> Export All Data
                      </Button>
                      <Button variant="outline" onClick={() => document.getElementById('importIndexSettings2')?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Import Data
                      </Button>
                      <input id="importIndexSettings2" type="file" accept=".json" className="hidden" onChange={handleImportIndex} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Export includes workspaces, folders, agents, settings, and optionally embeddings. API keys are never exported for security reasons.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-base">Storage Statistics</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{teamMembers.length}</div>
                        <div className="text-xs text-muted-foreground">Team Members</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{agents.length}</div>
                        <div className="text-xs text-muted-foreground">AI Agents</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{workspaces.length}</div>
                        <div className="text-xs text-muted-foreground">Workspaces</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-destructive/50">
                  <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Clear All Data</Label>
                        <p className="text-sm text-muted-foreground">Delete all local data and reset the application</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('This will delete all your data. Are you sure?')) {
                          localStorage.removeItem('team-ai-hub-storage');
                          window.location.reload();
                        }
                      }}>
                        Clear Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Add Agent Dialog */}
      <Dialog open={showAddAgent} onOpenChange={(v) => { setShowAddAgent(v); if (!v) resetAgentForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
            <DialogDescription>Configure your AI agent with a unique personality</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Agent Name *</Label>
                <Input value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="My Assistant" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={newAgentDescription} onChange={(e) => setNewAgentDescription(e.target.value)} placeholder="Brief description..." />
              </div>
              <div>
                <Label>Agent Type</Label>
                <Select value={newAgentType} onValueChange={(v) => setNewAgentType(v as Agent['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Agent</SelectItem>
                    <SelectItem value="orchestrator">Orchestrator</SelectItem>
                    <SelectItem value="subagent">Subagent</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {['🤖', '🧠', '💡', '🎯', '🔥', '⚡', '🌟', '🎨', '📚', '🔮', '🦾', '🚀'].map((icon) => (
                    <Button key={icon} variant={newAgentIcon === icon ? 'default' : 'outline'} size="sm"
                      onClick={() => setNewAgentIcon(icon)}>{icon}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>System Prompt *</Label>
                <Textarea value={newAgentSystemPrompt} onChange={(e) => setNewAgentSystemPrompt(e.target.value)} 
                  rows={5} placeholder="You are a helpful assistant that..." />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select 
                  value={newAgentProvider} 
                  onValueChange={(v) => handleProviderChangeWithDiscovery(v, 'agent')}
                  disabled={isDiscoveringModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                    {isDiscoveringModels && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AI_PROVIDERS).slice(0, 15).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select value={newAgentModel} onValueChange={setNewAgentModel}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {getModelsForProvider(newAgentProvider).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperature: {newAgentTemperature}</Label>
                <Slider value={[newAgentTemperature]} onValueChange={([v]) => setNewAgentTemperature(v)} max={2} step={0.1} />
                <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
              </div>
              <div>
                <Label>Max Tokens</Label>
                <Select value={newAgentMaxTokens.toString()} onValueChange={(v) => setNewAgentMaxTokens(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1,024</SelectItem>
                    <SelectItem value="2048">2,048</SelectItem>
                    <SelectItem value="4096">4,096</SelectItem>
                    <SelectItem value="8192">8,192</SelectItem>
                    <SelectItem value="16384">16,384</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddAgent(false); resetAgentForm(); }}>Cancel</Button>
            <Button onClick={editingAgent ? handleUpdateAgent : handleAddAgent}>
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
