import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(projectRoot, "prisma/migrations/20261029000000_init/migration.sql");
const seedPath = join(projectRoot, "prisma/seed.ts");
const launchEmail = "zoozoo@zaazaa.com";
const launchName = "Official Launch Test Account";
const launchPassword = "123456789.A";

let directory: string;
let databasePath: string;
let db: Database;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "launch-seed-test-"));
  databasePath = join(directory, "test.db");
  db = new Database(databasePath, { create: true });
});

afterEach(() => {
  db.close();
  rmSync(directory, { recursive: true, force: true });
});

function applyMigration() {
  const migration = readFileSync(migrationPath, "utf8");
  for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
    db.run(statement);
  }
}

async function runSeed() {
  const child = Bun.spawn([process.execPath, "run", seedPath], {
    cwd: projectRoot,
    env: { ...Bun.env, DATABASE_URL: `file:${databasePath}` },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

function launchUser() {
  return db.query("SELECT id, email, name, password, createdAt FROM User WHERE email = ?")
    .get(launchEmail) as {
      id: string;
      email: string;
      name: string | null;
      password: string | null;
      createdAt: string;
    } | null;
}

describe("launch migration and seed", () => {
  test("creates the launch account in a freshly migrated database", async () => {
    applyMigration();

    const result = await runSeed();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(launchEmail);
    expect(launchUser()).toMatchObject({
      email: launchEmail,
      name: launchName,
      password: launchPassword,
    });
    expect(launchUser()?.id).toBeTruthy();
    expect(launchUser()?.createdAt).toBeTruthy();
  });

  test("re-seeding restores launch credentials without replacing users", async () => {
    applyMigration();
    expect((await runSeed()).exitCode).toBe(0);
    const original = launchUser();
    expect(original).not.toBeNull();

    db.run("UPDATE User SET name = ?, password = ? WHERE email = ?", ["Changed", "changed", launchEmail]);
    db.run("INSERT INTO User (id, email, name, password, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
      ["other-id", "other@example.com", "Other user", "other password"]);

    const result = await runSeed();

    expect(result.exitCode).toBe(0);
    expect(launchUser()).toEqual({ ...original!, name: launchName, password: launchPassword });
    expect(db.query("SELECT id, email, name, password FROM User WHERE id = ?").get("other-id"))
      .toEqual({ id: "other-id", email: "other@example.com", name: "Other user", password: "other password" });
    expect(db.query("SELECT COUNT(*) AS count FROM User").get()).toEqual({ count: 2 });
  });

  test("reports an upsert failure and exits unsuccessfully", async () => {
    // The database exists, but has no User table because the migration was not applied.
    const result = await runSeed();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error seeding launch test account:");
    expect(result.stdout).not.toContain("Successfully seeded");
  });

  test("migration enforces unique emails and supports nullable credentials and post defaults", () => {
    applyMigration();
    db.run("INSERT INTO User (id, email, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)", ["user-1", "person@example.com"]);
    expect(db.query("SELECT name, password FROM User WHERE id = ?").get("user-1"))
      .toEqual({ name: null, password: null });
    expect(() => db.run("INSERT INTO User (id, email, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)",
      ["user-2", "person@example.com"])).toThrow();
    db.run("INSERT INTO Post (id, title, authorId, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      ["post-1", "A post", "user-1"]);
    expect(db.query("SELECT content, published FROM Post WHERE id = ?").get("post-1"))
      .toEqual({ content: null, published: 0 });
  });
});
