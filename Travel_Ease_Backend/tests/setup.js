/**
 * Test setup and configuration
 */

import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'local'; // Use local JWT for testing
process.env.JWT_SECRET = 'test-secret-key';

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

// Helper function to create a test user and get token
export async function createTestUser(userData = {}) {
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');
  
  const hashedPassword = await bcrypt.default.genSalt(10).then(salt =>
    bcrypt.default.hash(userData.password || 'testpass123', salt)
  );

  const user = await prisma.user.create({
    data: {
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      email: userData.email || `test${Date.now()}@example.com`,
      contact_no: userData.contact_no || '1234567890',
      password: hashedPassword
    }
  });

  const token = jwt.default.sign(
    { id: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

// Helper to clean up test data
export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await prisma.participant.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.travelPlan.deleteMany();
  await prisma.businessReview.deleteMany();
  await prisma.businessFavorite.deleteMany();
  await prisma.businessCategory.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.business.deleteMany();
  // Don't delete users in case they're needed across tests
}
