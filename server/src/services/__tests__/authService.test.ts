import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../../routes/auth.js'
import { prisma } from '../../lib/prisma.js'
import { createTestUser } from '../../__tests__/setup.js'
import bcrypt from 'bcryptjs'
import { signAccessToken } from '../../lib/jwt.js'

// Create a test Express app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/auth', authRouter)
  return app
}

describe('AuthService (Auth Routes)', () => {
  let app: express.Application

  beforeEach(() => {
    app = createTestApp()
  })

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.username).toBe('newuser')
      expect(response.body.data.user.email).toBe('newuser@example.com')
      expect(response.body.data.user.passwordHash).toBeUndefined() // Should not expose password hash
      expect(response.body.data.tokens).toBeDefined()
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()
      expect(response.body.data.tokens.expiresIn).toBe(900)
    })

    it('should reject registration with invalid username', async () => {
      // Arrange
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      // Assert
      expect(response.body.message).toBe('Invalid input')
    })

    it('should reject registration with invalid email', async () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'invalid-email',
        password: 'password123',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      // Assert
      expect(response.body.message).toBe('Invalid input')
    })

    it('should reject registration with short password', async () => {
      // Arrange
      const userData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: 'short',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      // Assert
      expect(response.body.message).toBe('Invalid input')
    })

    it('should reject registration with duplicate email', async () => {
      // Arrange
      await createTestUser({ email: 'existing@example.com' })
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409)

      // Assert
      expect(response.body.message).toBe('Username or email already taken')
    })

    it('should reject registration with duplicate username', async () => {
      // Arrange
      await createTestUser({ username: 'existinguser' })
      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      }

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409)

      // Assert
      expect(response.body.message).toBe('Username or email already taken')
    })

    it('should hash password before storing', async () => {
      // Arrange
      const userData = {
        username: 'hashtest',
        email: 'hashtest@example.com',
        password: 'password123',
      }

      // Act
      await request(app).post('/auth/register').send(userData).expect(201)

      // Assert
      const user = await prisma.user.findUnique({ where: { email: 'hashtest@example.com' } })
      expect(user).not.toBeNull()
      expect(user?.passwordHash).not.toBe('password123')
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/) // bcrypt hash pattern
    })
  })

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const password = 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      await createTestUser({
        email: 'login@example.com',
        passwordHash,
      })

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: password,
        })
        .expect(200)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe('login@example.com')
      expect(response.body.data.user.passwordHash).toBeUndefined()
      expect(response.body.data.user.refreshToken).toBeUndefined()
      expect(response.body.data.tokens).toBeDefined()
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()
    })

    it('should reject login with non-existent email', async () => {
      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)

      // Assert
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should reject login with incorrect password', async () => {
      // Arrange
      const passwordHash = await bcrypt.hash('correctpassword', 12)
      await createTestUser({
        email: 'wrongpass@example.com',
        passwordHash,
      })

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      // Assert
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should reject login with invalid email format', async () => {
      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400)

      // Assert
      expect(response.body.message).toBe('Invalid input')
    })

    it('should store refresh token in database', async () => {
      // Arrange
      const password = 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await createTestUser({
        email: 'refreshtest@example.com',
        passwordHash,
      })

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'refreshtest@example.com',
          password: password,
        })
        .expect(200)

      // Assert
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(updatedUser?.refreshToken).toBe(response.body.data.tokens.refreshToken)
    })
  })

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Arrange
      const password = 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      await createTestUser({
        email: 'refresh@example.com',
        passwordHash,
      })

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'refresh@example.com',
          password: password,
        })

      const refreshToken = loginResponse.body.data.tokens.refreshToken

      // Act
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.expiresIn).toBe(900)
    })

    it('should reject refresh with missing token', async () => {
      // Act
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400)

      // Assert
      expect(response.body.message).toBe('Refresh token required')
    })

    it('should reject refresh with invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      // Assert
      expect(response.body.message).toBe('Invalid refresh token')
    })

    it('should reject refresh with token not in database', async () => {
      // Arrange
      const password = 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await createTestUser({
        email: 'tokentest@example.com',
        passwordHash,
      })

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'tokentest@example.com',
          password: password,
        })

      const refreshToken = loginResponse.body.data.tokens.refreshToken

      // Clear the refresh token from database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      })

      // Act
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401)

      // Assert
      expect(response.body.message).toBe('Invalid refresh token')
    })
  })

  describe('GET /auth/me', () => {
    it('should return user data with valid token', async () => {
      // Arrange
      const user = await createTestUser({
        username: 'metest',
        email: 'metest@example.com',
      })
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(user.id)
      expect(response.body.data.username).toBe('metest')
      expect(response.body.data.email).toBe('metest@example.com')
      expect(response.body.data.passwordHash).toBeUndefined()
    })

    it('should reject request without token', async () => {
      // Act
      const response = await request(app).get('/auth/me').expect(401)

      // Assert
      expect(response.body.message).toBe('Unauthorized')
    })

    it('should reject request with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      // Assert
      expect(response.body.message).toBe('Invalid or expired token')
    })
  })

  describe('POST /auth/logout', () => {
    it('should clear refresh token on logout', async () => {
      // Arrange
      const password = 'password123'
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await createTestUser({
        email: 'logout@example.com',
        passwordHash,
      })

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'logout@example.com',
          password: password,
        })

      const accessToken = loginResponse.body.data.tokens.accessToken

      // Act
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)

      // Assert
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(updatedUser?.refreshToken).toBeNull()
    })

    it('should reject logout without token', async () => {
      // Act
      const response = await request(app).post('/auth/logout').expect(401)

      // Assert
      expect(response.body.message).toBe('Unauthorized')
    })
  })

  describe('POST /auth/login-reward', () => {
    it('should claim daily login reward', async () => {
      // Arrange
      const user = await createTestUser({
        spiritCrystals: 100,
        voidShards: 0,
        pactSeals: 0,
      })
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Act
      const response = await request(app)
        .post('/auth/login-reward')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.day).toBe(1)
      expect(response.body.data.reward).toBeDefined()
      expect(response.body.data.reward.spiritCrystals).toBe(20)
      expect(response.body.data.nextDay).toBe(2)

      // Verify currency was added
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(updatedUser?.spiritCrystals).toBe(120) // 100 + 20
    })

    it('should reject claiming reward twice in same day', async () => {
      // Arrange
      const user = await createTestUser()
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Claim first time
      await request(app)
        .post('/auth/login-reward')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Act - Try to claim again
      const response = await request(app)
        .post('/auth/login-reward')
        .set('Authorization', `Bearer ${token}`)
        .expect(409)

      // Assert
      expect(response.body.message).toBe('Login reward already claimed today')
    })

    it('should give Pact Seal on day 7', async () => {
      // Arrange
      const user = await createTestUser({
        spiritCrystals: 0,
        voidShards: 0,
        pactSeals: 0,
      })
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Get week start
      const now = new Date()
      const dayOfWeek = now.getUTCDay()
      const daysSinceMonday = (dayOfWeek + 6) % 7
      const weekStart = new Date(now)
      weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday)
      weekStart.setUTCHours(0, 0, 0, 0)

      // Create 6 previous rewards
      for (let day = 1; day <= 6; day++) {
        await prisma.loginReward.create({
          data: {
            userId: user.id,
            day,
            weekStart,
            claimedAt: new Date(weekStart.getTime() + (day - 1) * 24 * 60 * 60 * 1000),
          },
        })
      }

      // Act - Claim day 7
      const response = await request(app)
        .post('/auth/login-reward')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Assert
      expect(response.body.data.day).toBe(7)
      expect(response.body.data.reward.pactSeals).toBe(1)
      expect(response.body.data.nextDay).toBeNull()

      // Verify Pact Seal was added
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(updatedUser?.pactSeals).toBe(1)
    })
  })

  describe('GET /auth/login-reward/status', () => {
    it('should return login reward status', async () => {
      // Arrange
      const user = await createTestUser()
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Act
      const response = await request(app)
        .get('/auth/login-reward/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Assert
      expect(response.body.data).toBeDefined()
      expect(response.body.data.claimedDays).toEqual([])
      expect(response.body.data.nextDay).toBe(1)
      expect(response.body.data.canClaimToday).toBe(true)
    })

    it('should show claimed days', async () => {
      // Arrange
      const user = await createTestUser()
      const token = signAccessToken({ userId: user.id, username: user.username })

      // Claim day 1
      await request(app)
        .post('/auth/login-reward')
        .set('Authorization', `Bearer ${token}`)

      // Act
      const response = await request(app)
        .get('/auth/login-reward/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Assert
      expect(response.body.data.claimedDays).toEqual([1])
      expect(response.body.data.nextDay).toBe(2)
      expect(response.body.data.canClaimToday).toBe(false)
    })
  })
})
