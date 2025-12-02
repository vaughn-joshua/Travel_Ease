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

  it('should reject Google accounts not registered in database', async () => {
    const { supabaseAdmin } = await import('../src/lib/supabase.js');
    const { prisma } = await import('../src/lib/prismaHelpers.js');
    const { requireGoogleAuth } = await import('../src/middleware/auth.js');
    
    mockReq.headers = { authorization: 'Bearer valid-token' };
    
    // Mock Supabase returning a Google user
    vi.mocked(supabaseAdmin!.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'google-user-123',
          email: 'unregistered@gmail.com',
          app_metadata: { provider: 'google' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
      },
      error: null,
    });
    
    // Mock user not found in database
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ACCOUNT_NOT_REGISTERED',
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
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
    
    // Mock user found in database
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser);
    
    await requireGoogleAuth(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 1,
      auth_id: 'google-user-123',
      email: googleEmail,
      first_name: 'Test',
      last_name: 'User',
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
});

