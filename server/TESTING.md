# Testing Guide

This document provides comprehensive instructions for setting up and running tests for the SummonScroll backend.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20+
- PostgreSQL 18+
- npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Test Database

Create a separate database for testing to avoid affecting your development data:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE summonscroll_test;

# Grant permissions (if needed)
GRANT ALL PRIVILEGES ON DATABASE summonscroll_test TO your_user;

# Exit psql
\q
```

### 3. Configure Test Environment

The `.env.test` file is already configured with sensible defaults. Update it if your database credentials differ:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll_test"
```

**Important**: The test database URL MUST include "test" in the database name. This is a safety check to prevent accidentally running tests against your development or production database.

### 4. Run Database Migrations

Apply all migrations to the test database:

```bash
npm run test:setup
```

This command will:
- Load environment variables from `.env.test`
- Apply all Prisma migrations to the test database
- Generate Prisma client

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Automatically re-run tests when files change:

```bash
npm run test:watch
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

### Run Specific Test File

```bash
npm test -- iconService.test.ts
```

### Run Tests Matching a Pattern

```bash
npm test -- --testNamePattern="should register"
```

### Run Tests for a Specific Suite

```bash
npm test -- --testNamePattern="IconService"
```

## Test Structure

```
server/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts              # Global test setup and utilities
│   │   └── README.md             # Test documentation
│   └── services/
│       └── __tests__/
│           ├── iconService.test.ts    # IconService unit tests
│           └── authService.test.ts    # Auth routes integration tests
├── jest.config.js                # Jest configuration
├── .env.test                     # Test environment variables
└── TESTING.md                    # This file
```

## Test Coverage

Current test coverage:

### IconService Tests

- ✅ `getIcons()` - Retrieve all icons
- ✅ `getIcons(type)` - Filter icons by type
- ✅ `getIconById()` - Retrieve icon by ID
- ✅ `getIconByName()` - Retrieve icon by name
- ✅ `uploadIcon()` - Create new icon
- ✅ `updateIcon()` - Update existing icon
- ✅ `deleteIcon()` - Delete icon
- ✅ `validateFileUpload()` - File validation

### AuthService Tests

- ✅ `POST /auth/register` - User registration
- ✅ `POST /auth/login` - User login
- ✅ `POST /auth/refresh` - Token refresh
- ✅ `GET /auth/me` - Get current user
- ✅ `POST /auth/logout` - User logout
- ✅ `POST /auth/login-reward` - Claim daily reward
- ✅ `GET /auth/login-reward/status` - Get reward status

## Writing Tests

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
import { describe, it, expect } from '@jest/globals'
import { myService } from '../myService.js'
import { createTestUser } from '../../__tests__/setup.js'

describe('MyService', () => {
  describe('myMethod', () => {
    it('should do something specific', async () => {
      // Arrange - Set up test data
      const user = await createTestUser()

      // Act - Execute the code being tested
      const result = await myService.myMethod(user.id)

      // Assert - Verify the results
      expect(result).toBeDefined()
      expect(result.id).toBe(user.id)
    })
  })
})
```

### Test Utilities

The `setup.ts` file provides helper functions:

#### `createTestUser(overrides)`

Create a test user with default values:

```typescript
const user = await createTestUser({
  username: 'customuser',
  email: 'custom@example.com',
  spiritCrystals: 500,
})
```

#### `createTestIcon(overrides)`

Create a test icon:

```typescript
const icon = await createTestIcon({
  name: 'test_icon',
  displayName: 'Test Icon',
  type: 'currency',
})
```

#### `createMockFile(overrides)`

Create a mock file upload:

```typescript
const file = createMockFile({
  mimetype: 'image/svg+xml',
  size: 2048,
})
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
   - ✅ `should reject registration with duplicate email`
   - ❌ `test registration`

2. **Test One Thing**: Each test should verify one specific behavior

3. **Use Test Utilities**: Use the provided helper functions to create test data

4. **Clean Tests**: Tests are automatically cleaned up after each run

5. **Async/Await**: Always use async/await for database operations

6. **Mock External Services**: Mock external APIs and services to keep tests fast and reliable

### Example: Testing a New Service

```typescript
import { describe, it, expect } from '@jest/globals'
import { myNewService } from '../myNewService.js'
import { prisma } from '../../lib/prisma.js'
import { createTestUser } from '../../__tests__/setup.js'

describe('MyNewService', () => {
  describe('createItem', () => {
    it('should create a new item', async () => {
      // Arrange
      const user = await createTestUser()
      const itemData = {
        name: 'Test Item',
        description: 'A test item',
      }

      // Act
      const item = await myNewService.createItem(user.id, itemData)

      // Assert
      expect(item).toBeDefined()
      expect(item.name).toBe('Test Item')
      expect(item.userId).toBe(user.id)
    })

    it('should reject invalid data', async () => {
      // Arrange
      const user = await createTestUser()
      const invalidData = { name: '' }

      // Act & Assert
      await expect(
        myNewService.createItem(user.id, invalidData)
      ).rejects.toThrow('Name is required')
    })
  })
})
```

## Troubleshooting

### Database Connection Errors

**Error**: `Cannot connect to database`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check the `DATABASE_URL` in `.env.test`
3. Ensure the test database exists
4. Verify database credentials

### Migration Errors

**Error**: `Migrations not applied`

**Solution**:
```bash
npm run test:setup
```

### Module Resolution Errors

**Error**: `Cannot find module`

**Solution**:
1. Ensure all imports use `.js` extensions (TypeScript ESM requirement)
2. Check that `jest.config.js` has the correct `moduleNameMapper`
3. Verify `tsconfig.json` matches Jest configuration

### Test Timeouts

**Error**: `Test exceeded timeout`

**Solution**:
1. Check database connectivity
2. Increase `testTimeout` in `jest.config.js`
3. Verify no infinite loops in test code
4. Check for unresolved promises

### Logger Spam

**Issue**: Too many log messages during tests

**Solution**: The logger is automatically mocked in `setup.ts`. If you see logs, verify the mock is working:

```typescript
// In setup.ts
jest.mock('../lib/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))
```

### Test Database Safety

**Error**: `Tests must use a test database`

**Solution**: This is a safety check. Ensure your `DATABASE_URL` in `.env.test` includes "test" in the database name:

```env
# ✅ Good
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll_test"

# ❌ Bad
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: summonscroll_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./server
        
      - name: Generate Prisma Client
        run: npm run db:generate
        working-directory: ./server
        
      - name: Run migrations
        run: npm run test:setup
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/summonscroll_test
          
      - name: Run tests
        run: npm test
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/summonscroll_test
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage/lcov.info
```

## Coverage Goals

Target coverage metrics:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

If you encounter issues not covered in this guide:

1. Check the test output for specific error messages
2. Review the test setup in `src/__tests__/setup.ts`
3. Verify your environment configuration in `.env.test`
4. Check that all dependencies are installed: `npm install`
