import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { type Express, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';

let app: Express;
let prisma: PrismaClient;
let supabaseAdmin: { auth: { getUser: ReturnType<typeof vi.fn> } };
let authenticateToken: (req: Request, res: Response, next: () => void) => void;

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
    app.get('/protected', authenticateToken, (req: Request, res: Response) => {
      res.json({ user: (req as Request & { user: unknown }).user });
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

  it('authenticates user when Supabase token is valid and user exists locally', async () => {
    const authId = randomUUID();
    const email = `supabase-test-user-${authId}@example.com`;

    // Clean up any existing user with this auth_id
    await prisma.user.deleteMany({ where: { auth_id: authId } });
    await prisma.user.deleteMany({ where: { email } });

    // Create user locally first (user must exist for auth to succeed)
    await prisma.user.create({
      data: {
        auth_id: authId,
        email,
        first_name: 'Supabase',
        last_name: 'User',
      }
    });

    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: authId,
          email,
          app_metadata: { provider: 'google' },
          user_metadata: {
            first_name: 'Supabase',
            last_name: 'User',
            contact_no: '1234567890'
          }
        }
      },
      error: null
    } as any);

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer dummy-token');

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);

    // Cleanup
    await prisma.user.deleteMany({ where: { auth_id: authId } });
  });

  it('rejects Supabase user without local profile', async () => {
    const authId = randomUUID();
    const email = `supabase-test-user-${authId}@example.com`;

    // Ensure no local user exists
    await prisma.user.deleteMany({ where: { auth_id: authId } });
    await prisma.user.deleteMany({ where: { email } });

    vi.spyOn(supabaseAdmin.auth, 'getUser').mockResolvedValue({
      data: {
        user: {
          id: authId,
          email,
          app_metadata: { provider: 'google' },
          user_metadata: {}
        }
      },
      error: null
    } as any);

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer dummy-token');

    // Should reject because user doesn't exist locally
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ACCOUNT_NOT_REGISTERED');
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

