/**
 * Google Auth Verification Tests
 * 
 * Tests for the requireGoogleAuth middleware that ensures:
 * 1. User authenticated via Google OAuth
 * 2. Google email matches registered email in database
 * 3. Unregistered Google accounts are rejected
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies before importing the middleware
vi.mock('../src/lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../src/lib/prismaHelpers.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  executeWithRetry: vi.fn((fn) => fn()),
}));

// Set production mode for these tests (not test mode)
const originalEnv = process.env.NODE_ENV;

describe('requireGoogleAuth middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set to production mode to test Google auth
    process.env.NODE_ENV = 'production';
    
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    
    mockReq = {
      headers: {},
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should reject requests without authorization header', async () => {
    // Import fresh module to get production behavior
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject non-Google OAuth sessions', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    // Mock Supabase returning a password-based user
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: { provider: 'email' }, // Not Google
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'GOOGLE_AUTH_REQUIRED',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should auto-provision new Google OAuth users and proceed', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { prisma } = await import('../src/lib/prismaHelpers.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    const newEmail = 'unregistered@gmail.com';
    const mockNewUser = {
      user_id: 99,
      auth_id: 'google-user-123',
      email: newEmail,
      first_name: 'unregistered',
      last_name: '',
      contact_no: null,
      password: null,
      auth_provider: 'google',
      has_email_identity: false,
      profile_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Mock Supabase returning a Google user
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'google-user-123',
          email: newEmail,
          app_metadata: { provider: 'google' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    // Mock user not found in database (neither by email nor auth_id)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    // Mock user creation succeeds
    vi.mocked(prisma.user.create).mockResolvedValue(mockNewUser);
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    // Should auto-provision and proceed
    expect(mockNext).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 99,
      auth_id: 'google-user-123',
      email: newEmail,
      first_name: 'unregistered',
      last_name: '',
      auth_provider: 'google',
      profile_completed: false,
    });
  });

  it('should allow registered Google users and attach user info', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { prisma } = await import('../src/lib/prismaHelpers.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    const googleEmail = 'registered@gmail.com';
    const mockDbUser = {
      user_id: 1,
      auth_id: 'google-user-123',
      email: googleEmail,
      first_name: 'Test',
      last_name: 'User',
      contact_no: '1234567890',
      password: null,
      auth_provider: 'google',
      has_email_identity: false,
      profile_completed: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Mock Supabase returning a Google user
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'google-user-123',
          email: googleEmail,
          app_metadata: { provider: 'google' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    // Mock user found in database (first lookup by email succeeds)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser);
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 1,
      auth_id: 'google-user-123',
      email: googleEmail,
      first_name: 'Test',
      last_name: 'User',
      auth_provider: 'google',
      profile_completed: true,
    });
  });

  it('should reject Google accounts with missing email', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    // Mock Supabase returning a Google user without email
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'google-user-123',
          email: undefined, // No email
          app_metadata: { provider: 'google' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'OAUTH_EMAIL_MISSING',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle P2002 race condition gracefully during auto-provisioning', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { prisma } = await import('../src/lib/prismaHelpers.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    const newEmail = 'race-condition@gmail.com';
    const mockRaceUser = {
      user_id: 100,
      auth_id: 'google-user-race',
      email: newEmail,
      first_name: 'Race',
      last_name: 'User',
      contact_no: null,
      password: null,
      auth_provider: 'google',
      has_email_identity: false,
      profile_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Mock Supabase returning a Google user
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'google-user-race',
          email: newEmail,
          app_metadata: { provider: 'google' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    // Mock: First two findUnique calls return null (by email, by auth_id)
    // Then create throws P2002, then findUnique succeeds
    let findCallCount = 0;
    vi.mocked(prisma.user.findUnique).mockImplementation(() => {
      findCallCount++;
      // First two calls: user not found
      if (findCallCount <= 2) {
        return Promise.resolve(null);
      }
      // After P2002, user found by auth_id
      return Promise.resolve(mockRaceUser);
    });
    
    // Mock create throws P2002 (unique constraint error)
    const p2002Error = new Error('Unique constraint failed on the fields: (`auth_id`)');
    (p2002Error as any).code = 'P2002';
    (p2002Error as any).meta = { target: ['auth_id'] };
    vi.mocked(prisma.user.create).mockRejectedValue(p2002Error);
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    // Should handle P2002 gracefully and proceed with the user found after race condition
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 100,
      auth_id: 'google-user-race',
      email: newEmail,
      first_name: 'Race',
      last_name: 'User',
      auth_provider: 'google',
      profile_completed: false,
    });
  });
});

