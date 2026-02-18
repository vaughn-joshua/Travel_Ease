/**
 * Test setup and configuration
 */

import { beforeAll, afterAll } from 'vitest';
import type { user } from '@prisma/client';

// ============================================
// Load environment variables from .env FIRST
// ============================================
import 'dotenv/config';

// ============================================
// SSL / TLS configuration for test environment
// ============================================
// Allow self-signed certificates when connecting to Supabase or other SSL DBs
// This must be set BEFORE importing Prisma client
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'local'; // Use local JWT for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Now import Prisma (after env vars are set)
const { prisma } = await import('../src/lib/prisma.js');

// Clean up database before tests
beforeAll(async () => {
  // You might want to use a separate test database
  console.log('Setting up tests...');
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
  console.log('Tests completed');
});

interface CreateTestUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  password?: string;
  auth_provider?: 'password' | 'google';
  has_email_identity?: boolean;
  profile_completed?: boolean;
  role?: 'USER' | 'TRAVEL_AGENCY' | 'SUPER_ADMIN' | 'LGU_ADMIN' | 'BUSINESS_OWNER';
}

interface TestUserResult {
  user: user;
  token: string;
}

/**
 * Helper function to create a test user and get a JWT token
 * Supports configuring auth_provider, has_email_identity, and profile_completed for testing auth flows
 */
export async function createTestUser(userData: CreateTestUserData = {}): Promise<TestUserResult> {
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');

  const hashedPassword = await bcrypt.default.genSalt(10).then(salt =>
    bcrypt.default.hash(userData.password || 'testpass123', salt)
  );

  // Derive has_email_identity from auth_provider if not explicitly provided
  const authProvider = userData.auth_provider || 'password';
  const hasEmailIdentity = userData.has_email_identity ?? (authProvider === 'password');

  const user = await prisma.user.create({
    data: {
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      email: userData.email || `test${Date.now()}@example.com`,
      contact_no: userData.contact_no || '1234567890',
      password: hashedPassword,
      auth_provider: authProvider,
      has_email_identity: hasEmailIdentity,
      profile_completed: userData.profile_completed ?? true, // Default to true for backward compatibility
      role: userData.role || 'USER',
    }
  });

  const token = jwt.default.sign(
    { id: user.user_id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );

  return { user, token };
}

// Helper to clean up test data
export async function cleanupTestData(): Promise<void> {
  // Delete top-level entities - DB Cascade should handle children
  // Order matters: delete plans first (which contain activities linking to businesses)
  await prisma.travel_plan.deleteMany();
  await prisma.business.deleteMany();
  // Don't delete users in case they're needed across tests
}

