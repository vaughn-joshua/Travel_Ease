import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import { randomUUID } from 'crypto';
import request from 'supertest';

let app;
let prisma;
let supabaseAdmin;
let authenticateToken;

const originalEnv = { ...process.env };

describe('Supabase Auth Middleware', () => {
  beforeAll(async () => {
    // Ensure Supabase clients initialize
    process.env.NODE_ENV = 'supabase-test';
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
    process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';

    ({ prisma } = await import('../src/lib/prisma.js'));
    ({ supabaseAdmin } = await import('../src/lib/supabase.js'));
    ({ authenticateToken } = await import('../src/middleware/auth.js'));

    app = express();
    app.use(express.json());
    app.get('/protected', authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_ANON_KEY = originalEnv.SUPABASE_ANON_KEY;

    await prisma.user.deleteMany({
      where: { email: { contains: 'supabase-test-user' } }
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-creates a local profile when Supabase user exists', async () => {
    const authId = randomUUID();
    const email = `${authId}-user@example.com`;

    await prisma.user.deleteMany({ where: { auth_id: authId } });

    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: authId,
          email,
          user_metadata: {
            first_name: 'Supabase',
            last_name: 'User',
            contact_no: '1234567890'
          }
        }
      },
      error: null
    });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer dummy-token');

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);

    const profile = await prisma.user.findUnique({ where: { auth_id: authId } });
    expect(profile).not.toBeNull();
    expect(profile?.first_name).toBe('Supabase');
  });

  it('rejects missing tokens', async () => {
    const response = await request(app).get('/protected');
    expect(response.status).toBe(401);
  });

  it('rejects invalid Supabase tokens', async () => {
    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: new Error('invalid')
    });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bad-token');

    expect(response.status).toBe(403);
  });
});
