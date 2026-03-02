# page.tsx - Main Dashboard Component

## Overview

`src/app/page.tsx` is the **single-page application** that powers the entire Team AI Collaboration Dashboard. This file contains all UI components, state management integrations, and user interaction handlers for the dashboard experience.

## Purpose

This file serves as the central hub where users interact with all dashboard features. It brings together:
- Team member management
- Agent configuration and orchestration
- Bean (task) management
- Plugin and skill management
- Observability monitoring
- Scheduler configuration
- Workspace and data management

## File Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | ~4,700 |
| Components | 20+ defined within |
| State Variables | 100+ |
| Event Handlers | 50+ |

## Component Architecture

```
TeamAIDashboard (Main Component)
├── Sidebar
│   ├── Logo & Header
│   ├── Search Input
│   ├── Navigation Tabs (Core, Management, Extensions)
│   ├── Quick Actions
│   └── Stats Footer
│
├── Header Bar
│   ├── Breadcrumbs
│   ├── Command Palette Trigger
│   └── Settings/Theme Toggles
│
├── Main Content Area (Tab-based)
│   ├── Team Tab (Member chat)
│   ├── Agents Tab (Agent management)
│   ├── Beans Tab (Task management)
│   ├── Observe Tab (Observability)
│   ├── Scheduler Tab (Scheduling)
│   ├── Workspaces Tab (Data management)
│   ├── Teams Tab (Team management)
│   ├── Plugins Tab (Plugin management)
│   └── Skills Tab (Skill management)
│
└── Dialogs & Modals
    ├── Add Member Dialog
    ├── Add Agent Dialog
    ├── Add Bean Dialog
    ├── Settings Dialog
    └── Command Palette
```

## Key Sections

### 1. Audio Recording Hook

```typescript
function useAudioRecording() {
  // Handles microphone access
  // Records audio blobs
  // Transcribes via API
}
```

**Purpose:** Enables voice input for messages. Users can click the microphone icon to record audio, which is then transcribed using the `/api/speech` endpoint.

---

### 2. Agent Hierarchy View Component

```typescript
function AgentHierarchyView({ agents, onLink, onUnlink })
```

**Purpose:** Visualizes the parent-child relationships between main agents and their subagents. Provides drag-and-drop or click-based linking/unlinking.

**Visual Structure:**
```
┌─────────────────────────┐
│ 🤖 Main Agent           │
│ ├── 📋 Subagent 1       │
│ ├── 📋 Subagent 2       │
│ └── [ + Link Subagent ] │
└─────────────────────────┘
```

---

### 3. Orchestration Sessions View Component

```typescript
function OrchestrationSessionsView({ sessions, agents, beans })
```

**Purpose:** Displays active and historical orchestration sessions where main agents coordinate subagents to complete beans.

**Displays:**
- Session status (pending, running, completed, failed)
- Subagent execution results
- Timing information

---

### 4. Main Dashboard Component

```typescript
export default function TeamAIDashboard()
```

This is the primary component containing all dashboard functionality.

#### State Management

The component manages extensive local state while also connecting to the global Zustand store:

**Local State Examples:**
- `inputMessage` - Current chat input
- `isLoading` - Loading states for async operations
- `showSettings` - Dialog visibility flags
- Form states for various dialogs

**Global Store Connection:**
```typescript
const { 
  teamMembers, agents, beans, plugins, skills,
  addTeamMember, addAgent, addBean, 
  // ... many more
} = useAppStore();
```

---

## Navigation Structure

### Sidebar Tabs

The sidebar organizes navigation into three sections:

| Section | Tabs | Purpose |
|---------|------|---------|
| **Core** | Team, Agents, Beans | Primary workflow features |
| **Management** | Observe, Scheduler, Data, Teams | Administration features |
| **Extensions** | Plugins, Skills | Extensibility features |

### Tab Metadata

Each tab has associated metadata for display:

```typescript
const tabMeta = {
  team: { icon: Users, label: 'Team', section: 'core' },
  agents: { icon: BotMessageSquare, label: 'Agents', badge: activeCount, section: 'core' },
  beans: { icon: Activity, label: 'Beans', badge: pendingCount, section: 'core' },
  // ...
};
```

---

## User Interactions

### 1. Team Member Management

**Create Member Flow:**
1. Click "Add Member" in sidebar
2. Fill dialog form (name, role, system prompt)
3. Select AI provider and model
4. Submit → `addTeamMember()` called
5. Member appears in sidebar

**Chat Flow:**
1. Select member from sidebar
2. Type message or use voice input
3. Message sent to `/api/ai/chat`
4. Response displayed in chat area

### 2. Agent Management

**Create Agent Flow:**
1. Navigate to Agents tab
2. Click "Add Agent"
3. Configure:
   - Name, description, type
   - Provider and model
   - System prompt
   - Temperature and max tokens
4. Submit → `addAgent()` called

**Link Subagent Flow:**
1. View agent hierarchy
2. Click "Link Subagent"
3. Select from available subagents
4. Relationship established

### 3. Bean Management

**Create Bean Flow:**
1. Navigate to Beans tab
2. Click "Add Bean"
3. Define:
   - Title and description
   - Priority level
   - Dependencies
   - Tags
4. Assign to agent or leave unassigned

**Execute Bean:**
1. Bean assigned to agent
2. Agent processes task
3. Status updates through workflow
4. Result recorded when complete

### 4. Plugin Management

**Create Plugin Flow:**
1. Navigate to Plugins tab
2. Click "Add Plugin"
3. Define:
   - Name, description, category
   - Scope (global, agent, team, workspace)
   - Trigger type
   - JavaScript/TypeScript code
   - Permissions required
4. Enable plugin

### 5. Skill Management

**Create Skill Flow:**
1. Navigate to Skills tab
2. Click "Add Skill"
3. Define:
   - Name, description, category
   - Parameters with validation
   - Step-by-step execution plan
   - Dependencies
   - Examples

---

## API Integrations

The component makes calls to multiple API endpoints:

| Endpoint | Purpose | Trigger |
|----------|---------|---------|
| `/api/keys` | Check API key status | On mount |
| `/api/ai/chat` | AI completions | On message send |
| `/api/speech` | Audio transcription | On voice input |
| `/api/models` | Model discovery | On provider selection |
| `/api/teams` | Team management | CRUD operations |
| `/api/scheduler` | Schedule management | CRUD operations |
| `/api/observability` | Metrics retrieval | Tab navigation |
| `/api/workspaces` | Workspace management | CRUD operations |

---

## Styling Approach

### Current Design (Normalized)

The UI uses a clean, professional dark theme:

```css
/* Background */
bg-slate-950

/* Sidebar/Header */
bg-slate-900 border-slate-700

/* Cards */
bg-slate-800 border-slate-700

/* Active States */
bg-indigo-500/20 border-indigo-500/50

/* Accent Color */
indigo-500
```

### Responsive Behavior

- Sidebar collapses to icon-only view on narrow screens
- Tab content areas adapt to available space
- Dialogs use responsive sizing

---

## Performance Considerations

### Optimization Techniques

1. **Conditional Rendering**: Tab content only renders when active
2. **Event Delegation**: Shared handlers where possible
3. **Memoization**: Heavy computations wrapped in useMemo
4. **Lazy Loading**: Large dialogs load on demand

### Known Performance Concerns

- Large agent/bean lists may need virtualization
- Real-time observability updates could impact rendering
- Embedding generation is CPU-intensive

---

## Relationships with Other Files

```
page.tsx
├── Imports from store.ts
│   └── All state management and types
│
├── Imports from ai-providers.ts
│   └── AI_PROVIDERS, PROVIDER_COUNT, getProvidersByCategory
│
├── Imports from ui/ components
│   ├── Button, Input, Textarea
│   ├── Card, Dialog, Sheet
│   ├── Tabs, Select, Slider
│   └── 30+ more components
│
├── Calls API routes
│   ├── /api/ai/chat
│   ├── /api/keys
│   ├── /api/speech
│   └── many more
│
└── Imports hooks
    ├── useAudioRecording (defined inline)
    └── from use-toast.ts
```

---

## Extension Points

To add new features to this file:

1. **New Tab**: Add to `tabMeta` object and create corresponding content section
2. **New Dialog**: Add state variable, dialog component, and trigger
3. **New API Integration**: Create handler function and call from appropriate event
4. **New Store Connection**: Add to the `useAppStore()` destructuring

---

## Common Modifications

### Adding a New Navigation Tab

1. Add entry to `tabMeta`:
```typescript
newTab: { icon: NewIcon, label: 'New Tab', section: 'management' },
```

2. Add to `filteredTabs` array

3. Create content section:
```typescript
{mainTab === 'newTab' && (
  <NewTabContent />
)}
```

### Adding a New Form Field

1. Create state variable:
```typescript
const [newField, setNewField] = useState('');
```

2. Add to form in dialog

3. Include in submission handler

---

## Testing Considerations

Key scenarios to test:
- Agent creation with various providers
- Bean assignment and status transitions
- Plugin execution with different triggers
- Skill creation and parameter validation
- Scheduler execution timing
- WebSocket real-time updates
