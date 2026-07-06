import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { initPrisma, prisma, disconnectPrisma } from '../lib/prisma.js'

// Database setup and teardown
beforeAll(async () => {
  // Ensure we're using a test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must use a test database. Set DATABASE_URL to a test database.')
  }
  
  // Initialize Prisma client
  await initPrisma()
})

afterAll(async () => {
  // Disconnect from database after all tests
  await disconnectPrisma()
})

// Clean up database between tests
beforeEach(async () => {
  // Start with a clean slate for each test
  // This ensures tests don't interfere with each other
})

afterEach(async () => {
  // Clean up test data after each test
  // Delete in reverse order of foreign key dependencies
  await prisma.loginReward.deleteMany()
  await prisma.battleResult.deleteMany()
  await prisma.pityState.deleteMany()
  await prisma.userSkin.deleteMany()
  await prisma.userMonster.deleteMany()
  await prisma.todo.deleteMany()
  await prisma.daily.deleteMany()
  await prisma.habit.deleteMany()
  await prisma.currencyIcon.deleteMany()
  await prisma.user.deleteMany()
})

// Test utilities
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYqYqYqYq', // "password123"
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    spiritCrystals: 100,
    voidShards: 0,
    pactSeals: 0,
    currentStreak: 0,
    longestStreak: 0,
    ...overrides,
  }

  return await prisma.user.create({
    data: defaultUser,
  })
}

export const createTestIcon = async (overrides = {}) => {
  const defaultIcon = {
    name: `test_icon_${Date.now()}`,
    displayName: 'Test Icon',
    type: 'currency',
    url: 'https://example.com/icon.svg',
    format: 'svg',
    width: 64,
    height: 64,
    ...overrides,
  }

  return await prisma.currencyIcon.create({
    data: defaultIcon,
  })
}

// Mock file upload helper
export const createMockFile = (overrides = {}): Express.Multer.File => {
  return {
    fieldname: 'file',
    originalname: 'test-icon.svg',
    encoding: '7bit',
    mimetype: 'image/svg+xml',
    size: 1024,
    destination: '/tmp',
    filename: 'test-icon.svg',
    path: '/tmp/test-icon.svg',
    buffer: Buffer.from('<svg></svg>'),
    stream: null as any,
    ...overrides,
  }
}
