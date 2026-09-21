import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const seedScript = join(repoRoot, 'prisma', 'seed.ts')
const testUser = {
  email: 'zoozoo@zaazaa.com',
  name: 'Official PRD Lead Tester',
  password: '123456789.A',
}

let temporaryDirectory: string
let databaseUrl: string
let prisma: PrismaClient

function runSeed(url = databaseUrl) {
  return Bun.spawnSync({
    cmd: [process.execPath, seedScript],
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: url },
    stdout: 'pipe',
    stderr: 'pipe',
  })
}

describe('official PRD test-user seed', () => {
  beforeAll(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'zai-crew-seed-'))
    databaseUrl = `file:${join(temporaryDirectory, 'seed-test.db')}`

    const push = Bun.spawnSync({
      cmd: [
        process.execPath,
        'x',
        'prisma',
        'db',
        'push',
        '--skip-generate',
        '--schema',
        'prisma/schema.prisma',
      ],
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdout: 'pipe',
      stderr: 'pipe',
    })

    expect(push.exitCode).toBe(0)
    prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    if (prisma) await prisma.$disconnect()
    rmSync(temporaryDirectory, { recursive: true, force: true })
  })

  test('creates the configured user with all persistent credentials', async () => {
    const result = runSeed()

    expect(result.stderr.toString()).toBe('')
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain('Seeded official test user:')

    const users = await prisma.user.findMany()
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject(testUser)
    expect(users[0].id).toBeTruthy()
    expect(users[0].createdAt).toBeInstanceOf(Date)
    expect(users[0].updatedAt).toBeInstanceOf(Date)
  })

  test('repairs an existing test user without replacing it or changing other users', async () => {
    const existing = await prisma.user.create({
      data: {
        email: testUser.email,
        name: 'Stale tester name',
        password: 'stale-password',
      },
    })
    const unrelated = await prisma.user.create({
      data: {
        email: 'another-user@example.com',
        name: 'Another User',
        password: 'unchanged-password',
      },
    })

    const firstResult = runSeed()
    const secondResult = runSeed()

    expect(firstResult.exitCode).toBe(0)
    expect(secondResult.exitCode).toBe(0)
    expect(await prisma.user.count()).toBe(2)
    expect(await prisma.user.findUnique({ where: { email: testUser.email } })).toMatchObject({
      id: existing.id,
      ...testUser,
    })
    expect(await prisma.user.findUnique({ where: { email: unrelated.email } })).toMatchObject({
      id: unrelated.id,
      email: unrelated.email,
      name: unrelated.name,
      password: unrelated.password,
    })
  })

  test('reports a failure and exits non-zero when the database URL is invalid', () => {
    const result = runSeed('not-a-valid-sqlite-url')

    expect(result.exitCode).toBe(1)
    expect(result.stderr.toString()).not.toBe('')
  })
})
