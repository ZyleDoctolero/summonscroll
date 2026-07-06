# SummonScroll Server Tests

This directory contains unit and integration tests for the SummonScroll backend.

## Setup

### 1. Create Test Database

Before running tests, create a separate test database to avoid affecting your development data:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE summonscroll_test;

# Exit psql
\q
```

### 2. Configure Test Environment

The test suite uses `.env.test` for configuration. Update the `DATABASE_URL` in `.env.test` if needed:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll_test"
```

### 3. Run Migrations

Apply database migrations to the test database:

```bash
# From the server directory
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll_test" npm run db:migrate
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- iconService.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should register"
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Test utilities and global setup
│   └── README.md             # This file
└── services/
    └── __tests__/
        ├── iconService.test.ts    # IconService unit tests
        └── authService.test.ts    # Auth routes integration tests
```

## Test Utilities

The `setup.ts` file provides helper functions for creating test data:

- `createTestUser(overrides)` - Create a test user
- `createTestIcon(overrides)` - Create a test icon
- `createMockFile(overrides)` - Create a mock file upload

## Important Notes

1. **Test Database**: Always use a separate test database. The test suite cleans up data after each test.

2. **Test Isolation**: Each test runs in isolation. Data is cleaned up automatically after each test.

3. **Mocked Logger**: The logger is mocked during tests to prevent console spam.

4. **Environment**: Tests run with `NODE_ENV=test` and load configuration from `.env.test`.

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect } from '@jest/globals'
import { myService } from '../myService.js'
import { createTestUser } from '../../__tests__/setup.js'

describe('MyService', () => {
  describe('myMethod', () => {
    it('should do something', async () => {
      // Arrange
      const user = await createTestUser()

      // Act
      const result = await myService.myMethod(user.id)

      // Assert
      expect(result).toBeDefined()
    })
  })
})
```

### Best Practices

1. **Arrange-Act-Assert**: Structure tests with clear sections
2. **Descriptive Names**: Use clear test names that describe the behavior
3. **Test One Thing**: Each test should verify one specific behavior
4. **Clean Data**: Use the provided utilities to create test data
5. **Async/Await**: Always use async/await for database operations

## Troubleshooting

### Database Connection Errors

If you see database connection errors:

1. Verify PostgreSQL is running
2. Check the `DATABASE_URL` in `.env.test`
3. Ensure the test database exists
4. Verify migrations have been applied

### Module Resolution Errors

If you see module resolution errors:

1. Ensure all imports use `.js` extensions
2. Check that `jest.config.js` has the correct `moduleNameMapper`
3. Verify TypeScript configuration matches Jest configuration

### Test Timeouts

If tests timeout:

1. Check database connectivity
2. Increase `testTimeout` in `jest.config.js`
3. Verify no infinite loops in test code

## Coverage

Test coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Target coverage goals:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## CI/CD Integration

Tests should be run in CI/CD pipelines before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm run db:migrate
    npm test
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```
