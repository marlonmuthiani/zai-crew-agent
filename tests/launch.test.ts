import { describe, expect, test } from 'bun:test';
import { db } from '../src/lib/db';

describe('Launch Readiness Verification', () => {
  test('PRD Test User is correctly seeded with password and accessible in DB', async () => {
    const user = await db.user.findUnique({
      where: { email: 'zoozoo@zaazaa.com' },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('zoozoo@zaazaa.com');
    expect(user?.name).toBe('PRD Test Account');
    expect(user?.password).toBe('123456789.A');
  });

  test('Database connection and post operations work', async () => {
    const testPost = await db.post.create({
      data: {
        title: 'Launch Readiness Test Post',
        content: 'Verification of post creation on staging baseline.',
        published: true,
        authorId: 'test-author',
      },
    });

    expect(testPost.id).toBeDefined();
    expect(testPost.title).toBe('Launch Readiness Test Post');

    const fetchedPost = await db.post.findUnique({
      where: { id: testPost.id },
    });
    expect(fetchedPost).not.toBeNull();
    expect(fetchedPost?.published).toBe(true);

    // Cleanup
    await db.post.delete({ where: { id: testPost.id } });
  });
});
