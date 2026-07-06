import request from 'supertest'
import { app } from '../../index.js'
import { prisma } from '../../lib/prisma.js'
import bcrypt from 'bcryptjs'

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(res.body.data).toHaveProperty('user')
      expect(res.body.data).toHaveProperty('tokens')
      expect(res.body.data.user.username).toBe('newuser')
      expect(res.body.data.user.email).toBe('newuser@example.com')
      expect(res.body.data.user).not.toHaveProperty('passwordHash')
      expect(res.body.data.tokens).toHaveProperty('accessToken')
      expect(res.body.data.tokens).toHaveProperty('refreshToken')
      expect(res.body.data.tokens.expiresIn).toBe(900)

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' },
      })
      expect(user).toBeTruthy()
      expect(user?.username).toBe('newuser')
    })

    it('should reject registration with invalid username', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'Password123!',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(res.body.message).toBe('Invalid input')
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'not-an-email',
        password: 'Password123!',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(res.body.message).toBe('Invalid input')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(res.body.message).toBe('Invalid input')
    })

    it('should reject duplicate username', async () => {
      // Create first user
      await prisma.user.create({
        data: {
          username: 'existinguser',
          email: 'existing@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
        },
      })

      // Try to register with same username
      const userData = {
        username: 'existinguser',
        email: 'different@example.com',
        password: 'Password123!',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(res.body.message).toBe('Username or email already taken')
    })

    it('should reject duplicate email', async () => {
      // Create first user
      await prisma.user.create({
        data: {
          username: 'user1',
          email: 'duplicate@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
        },
      })

      // Try to register with same email
      const userData = {
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'Password123!',
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(res.body.message).toBe('Username or email already taken')
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser: { email: string; password: string }

    beforeEach(async () => {
      testUser = {
        email: 'logintest@example.com',
        password: 'Password123!',
      }

      await prisma.user.create({
        data: {
          username: 'loginuser',
          email: testUser.email,
          passwordHash: await bcrypt.hash(testUser.password, 12),
        },
      })
    })

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(res.body.data).toHaveProperty('user')
      expect(res.body.data).toHaveProperty('tokens')
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.user).not.toHaveProperty('passwordHash')
      expect(res.body.data.user).not.toHaveProperty('refreshToken')
      expect(res.body.data.tokens).toHaveProperty('accessToken')
      expect(res.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401)

      expect(res.body.message).toBe('Invalid credentials')
    })

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401)

      expect(res.body.message).toBe('Invalid credentials')
    })

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400)

      expect(res.body.message).toBe('Invalid input')
    })

    it('should update refresh token in database on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      expect(user?.refreshToken).toBe(res.body.data.tokens.refreshToken)
    })
  })

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string
    let userId: string

    beforeEach(async () => {
      // Create user and login to get refresh token
      const user = await prisma.user.create({
        data: {
          username: 'refreshuser',
          email: 'refresh@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
        },
      })
      userId = user.id

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        })

      refreshToken = loginRes.body.data.tokens.refreshToken
    })

    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(res.body.data).toHaveProperty('accessToken')
      expect(res.body.data).toHaveProperty('refreshToken')
      expect(res.body.data.expiresIn).toBe(900)

      // Verify new refresh token is stored in database
      const user = await prisma.user.findUnique({ where: { id: userId } })
      expect(user?.refreshToken).toBe(res.body.data.refreshToken)
    })

    it('should reject refresh with missing token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400)

      expect(res.body.message).toBe('Refresh token required')
    })

    it('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(res.body.message).toBe('Invalid refresh token')
    })

    it('should reject refresh with revoked token', async () => {
      // Revoke the token by clearing it from database
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      })

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401)

      expect(res.body.message).toBe('Invalid refresh token')
    })
  })

  describe('GET /api/auth/me', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Create user and login
      const user = await prisma.user.create({
        data: {
          username: 'meuser',
          email: 'me@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          level: 5,
          xp: 250,
          spiritCrystals: 1000,
        },
      })
      userId = user.id

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'Password123!',
        })

      accessToken = loginRes.body.data.tokens.accessToken
    })

    it('should return current user data with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data.id).toBe(userId)
      expect(res.body.data.username).toBe('meuser')
      expect(res.body.data.email).toBe('me@example.com')
      expect(res.body.data.level).toBe(5)
      expect(res.body.data.xp).toBe(250)
      expect(res.body.data.spiritCrystals).toBe(1000)
      expect(res.body.data).not.toHaveProperty('passwordHash')
      expect(res.body.data).not.toHaveProperty('refreshToken')
    })

    it('should reject request without authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(res.body.message).toBe('Invalid token')
    })
  })

  describe('POST /api/auth/logout', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Create user and login
      const user = await prisma.user.create({
        data: {
          username: 'logoutuser',
          email: 'logout@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
        },
      })
      userId = user.id

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'Password123!',
        })

      accessToken = loginRes.body.data.tokens.accessToken
    })

    it('should logout successfully and clear refresh token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)

      // Verify refresh token was cleared
      const user = await prisma.user.findUnique({ where: { id: userId } })
      expect(user?.refreshToken).toBeNull()
    })

    it('should reject logout without authorization', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })
  })

  describe('POST /api/auth/login-reward', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Create user and login
      const user = await prisma.user.create({
        data: {
          username: 'rewarduser',
          email: 'reward@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          spiritCrystals: 100,
        },
      })
      userId = user.id

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'reward@example.com',
          password: 'Password123!',
        })

      accessToken = loginRes.body.data.tokens.accessToken
    })

    it('should claim day 1 login reward successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login-reward')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data.day).toBe(1)
      expect(res.body.data.reward).toEqual({
        spiritCrystals: 20,
        voidShards: 0,
        pactSeals: 0,
      })
      expect(res.body.data.nextDay).toBe(2)

      // Verify currency was added
      const user = await prisma.user.findUnique({ where: { id: userId } })
      expect(user?.spiritCrystals).toBe(120) // 100 + 20
    })

    it('should reject claiming reward twice on same day', async () => {
      // Claim first time
      await request(app)
        .post('/api/auth/login-reward')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Try to claim again
      const res = await request(app)
        .post('/api/auth/login-reward')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409)

      expect(res.body.message).toBe('Login reward already claimed today')
    })

    it('should reject claiming without authorization', async () => {
      const res = await request(app)
        .post('/api/auth/login-reward')
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })
  })

  describe('GET /api/auth/login-reward/status', () => {
    let accessToken: string
    let userId: string

    beforeEach(async () => {
      // Create user and login
      const user = await prisma.user.create({
        data: {
          username: 'statususer',
          email: 'status@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
        },
      })
      userId = user.id

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'status@example.com',
          password: 'Password123!',
        })

      accessToken = loginRes.body.data.tokens.accessToken
    })

    it('should return login reward status with no claims', async () => {
      const res = await request(app)
        .get('/api/auth/login-reward/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data.claimedDays).toEqual([])
      expect(res.body.data.nextDay).toBe(1)
      expect(res.body.data.canClaimToday).toBe(true)
    })

    it('should return login reward status after claiming', async () => {
      // Claim day 1
      await request(app)
        .post('/api/auth/login-reward')
        .set('Authorization', `Bearer ${accessToken}`)

      const res = await request(app)
        .get('/api/auth/login-reward/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data.claimedDays).toEqual([1])
      expect(res.body.data.nextDay).toBe(2)
      expect(res.body.data.canClaimToday).toBe(false)
    })

    it('should reject status check without authorization', async () => {
      const res = await request(app)
        .get('/api/auth/login-reward/status')
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })
  })
})
