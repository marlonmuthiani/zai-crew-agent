import { describe, expect, test, beforeEach } from 'bun:test'
import { PrismaClient } from '@prisma/client'
import { useAppStore } from '../lib/store'

const prisma = new PrismaClient()

describe('Database Persistent Test Account Verification', () => {
  test('Official PRD User Test Account exists with correct credentials', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'zoozoo@zaazaa.com' },
    })

    expect(user).not.toBeNull()
    expect(user?.email).toBe('zoozoo@zaazaa.com')
    expect(user?.password).toBe('123456789.A')
    expect(user?.role).toBe('admin')
  })
})

describe('State Store & Application Logic', () => {
  beforeEach(() => {
    useAppStore.setState({
      agents: [],
      beans: [],
      schedules: [],
      communications: [],
      activities: [],
    })
  })

  test('Agent creation, linking, and hierarchy management', () => {
    const mainAgentId = useAppStore.getState().addAgent({
      name: 'Main Orchestrator',
      description: 'Orchestrates worker agents',
      type: 'orchestrator',
      status: 'idle',
      provider: 'openai',
      model: 'gpt-4o',
      hasApiKey: true,
      systemPrompt: 'You are the orchestrator.',
      temperature: 0.7,
      maxTokens: 4096,
      icon: '🤖',
    })

    const subAgentId = useAppStore.getState().addAgent({
      name: 'Worker Agent 1',
      description: 'Handles worker subtasks',
      type: 'worker',
      status: 'idle',
      provider: 'openai',
      model: 'gpt-4o-mini',
      hasApiKey: true,
      systemPrompt: 'You execute tasks.',
      temperature: 0.5,
      maxTokens: 2048,
      icon: '⚙️',
    })

    useAppStore.getState().linkSubagent(mainAgentId, subAgentId)

    const updatedMain = useAppStore.getState().getAgent(mainAgentId)
    const updatedSub = useAppStore.getState().getAgent(subAgentId)

    expect(updatedMain?.subagentIds).toContain(subAgentId)
    expect(updatedSub?.parentAgentId).toBe(mainAgentId)

    useAppStore.getState().unlinkSubagent(mainAgentId, subAgentId)
    const unlinkedSub = useAppStore.getState().getAgent(subAgentId)
    expect(unlinkedSub?.parentAgentId).toBeUndefined()
  })

  test('Bean task creation, assignment, and status updates', () => {
    const beanId = useAppStore.getState().addBean({
      title: 'Analyze Data Pipeline',
      description: 'Run automated analysis on incoming telemetry',
      content: 'Detailed telemetry analysis prompt',
      status: 'pending',
      priority: 'high',
      category: 'Analysis',
    })

    let bean = useAppStore.getState().beans.find((b) => b.id === beanId)
    expect(bean).toBeDefined()
    expect(bean?.title).toBe('Analyze Data Pipeline')
    expect(bean?.status).toBe('pending')

    const agentId = useAppStore.getState().addAgent({
      name: 'Data Analyst',
      type: 'main',
      status: 'idle',
      provider: 'openai',
      model: 'gpt-4o',
      hasApiKey: true,
      systemPrompt: 'Analyst',
      temperature: 0.7,
      maxTokens: 4096,
    })

    useAppStore.getState().assignBean(beanId, agentId)
    bean = useAppStore.getState().beans.find((b) => b.id === beanId)
    expect(bean?.assignedAgentId).toBe(agentId)
    expect(bean?.status).toBe('queued')

    useAppStore.getState().updateBean(beanId, { status: 'completed', result: 'Successfully analyzed.' })
    bean = useAppStore.getState().beans.find((b) => b.id === beanId)
    expect(bean?.status).toBe('completed')
    expect(bean?.result).toBe('Successfully analyzed.')
  })

  test('Schedule creation and execution tracking', async () => {
    const scheduleId = useAppStore.getState().addSchedule({
      name: 'Hourly Backup Task',
      description: 'Run workspace data sync',
      trigger: {
        type: 'interval',
        intervalMinutes: 60,
        timezone: 'UTC',
      },
      action: {
        type: 'sync_data',
      },
      status: 'active',
      enabled: true,
      visibleToOrchestrator: true,
    })

    const schedule = useAppStore.getState().schedules.find((s) => s.id === scheduleId)
    expect(schedule).toBeDefined()
    expect(schedule?.name).toBe('Hourly Backup Task')
    expect(schedule?.status).toBe('active')

    const execution = await useAppStore.getState().executeSchedule(scheduleId)
    expect(execution.status).toBe('completed')
  })
})
