import request from 'supertest'
import { app } from '../../index.js'
import { prisma } from '../../lib/prisma.js'
import bcrypt from 'bcryptjs'

describe('Banners API Integration Tests', () => {
  let accessToken: string
  let userId: string
  let realmId: string
  let bannerId: string
  let monsterId: string

  beforeEach(async () => {
    // Create test realm
    const realm = await prisma.realm.create({
      data: {
        number: 1,
        name: 'Test Realm',
        slug: 'test-realm',
        element: 'fire',
        habitAffinity: ['study'],
        description: 'A test realm',
        colorHex: '#FF0000',
      },
    })
    realmId = realm.id

    // Create test monster
    const monster = await prisma.monster.create({
      data: {
        name: 'Test Monster',
        slug: 'test-monster',
        rarity: 'rare',
        element: 'fire',
        realmId: realmId,
        bannerType: 'standard',
        description: 'A test monster',
        lore: 'Test lore',
        baseStats: { hp: 100, attack: 50, defense: 30, speed: 40 },
        growthRates: { hp: 1.1, attack: 1.2, defense: 1.1, speed: 1.0 },
        isEx: false,
      },
    })
    monsterId = monster.id

    // Create test banner
    const banner = await prisma.banner.create({
      data: {
        name: 'Test Banner',
        slug: 'test-banner',
        bannerType: 'standard',
        realmId: realmId,
        pullCost: 160,
        pullCurrency: 'spiritCrystals',
        isActive: true,
        startsAt: new Date(Date.now() - 86400000), // Yesterday
        endsAt: new Date(Date.now() + 86400000), // Tomorrow
        description: 'A test banner',
      },
    })
    bannerId = banner.id

    // Create test user with currency
    const user = await prisma.user.create({
      data: {
        username: 'banneruser',
        email: 'banner@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        spiritCrystals: 5000,
        voidShards: 50,
        pactSeals: 10,
      },
    })
    userId = user.id

    // Login to get access token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'banner@example.com',
        password: 'Password123!',
      })

    accessToken = loginRes.body.data.tokens.accessToken
  })

  describe('GET /api/banners', () => {
    it('should return list of active banners', async () => {
      const res = await request(app)
        .get('/api/banners')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0]).toHaveProperty('id')
      expect(res.body.data[0]).toHaveProperty('name')
      expect(res.body.data[0]).toHaveProperty('bannerType')
      expect(res.body.data[0]).toHaveProperty('realm')
      expect(res.body.total).toBe(res.body.data.length)
    })

    it('should include cache headers', async () => {
      const res = await request(app)
        .get('/api/banners')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.headers['cache-control']).toContain('public')
      expect(res.headers['cache-control']).toContain('max-age=60')
    })

    it('should reject request without authorization', async () => {
      const res = await request(app)
        .get('/api/banners')
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })
  })

  describe('GET /api/banners/:id', () => {
    it('should return specific banner by id', async () => {
      const res = await request(app)
        .get(`/api/banners/${bannerId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.data.id).toBe(bannerId)
      expect(res.body.data.name).toBe('Test Banner')
      expect(res.body.data.bannerType).toBe('standard')
      expect(res.body.data).toHaveProperty('realm')
      expect(res.body.data.realm.id).toBe(realmId)
    })

    it('should return 404 for non-existent banner', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await request(app)
        .get(`/api/banners/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)

      expect(res.body.message).toBe('Banner not found')
    })

    it('should reject request without authorization', async () => {
      const res = await request(app)
        .get(`/api/banners/${bannerId}`)
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })
  })

  describe('POST /api/banners/:id/pull', () => {
    it('should perform a single pull successfully', async () => {
      const userBefore = await prisma.user.findUnique({ where: { id: userId } })
      const crystalsBefore = userBefore!.spiritCrystals

      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 1 })
        .expect(200)

      expect(res.body.data.results).toBeInstanceOf(Array)
      expect(res.body.data.results.length).toBe(1)
      expect(res.body.data.results[0]).toHaveProperty('monster')
      expect(res.body.data.results[0]).toHaveProperty('isNew')
      expect(res.body.data.results[0]).toHaveProperty('isDuplicate')
      expect(res.body.data.results[0].monster).toHaveProperty('id')
      expect(res.body.data.results[0].monster).toHaveProperty('name')
      expect(res.body.data.results[0].monster).toHaveProperty('rarity')
      expect(res.body.data.currencySpent.spiritCrystals).toBe(160)
      expect(res.body.data).toHaveProperty('pityState')

      // Verify currency was deducted
      const userAfter = await prisma.user.findUnique({ where: { id: userId } })
      expect(userAfter!.spiritCrystals).toBe(crystalsBefore - 160)
    })

    it('should perform a 10-pull successfully', async () => {
      const userBefore = await prisma.user.findUnique({ where: { id: userId } })
      const crystalsBefore = userBefore!.spiritCrystals

      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 10 })
        .expect(200)

      expect(res.body.data.results).toBeInstanceOf(Array)
      expect(res.body.data.results.length).toBe(10)
      expect(res.body.data.currencySpent.spiritCrystals).toBe(1600)

      // Verify currency was deducted
      const userAfter = await prisma.user.findUnique({ where: { id: userId } })
      expect(userAfter!.spiritCrystals).toBe(crystalsBefore - 1600)
    })

    it('should create user monster on new pull', async () => {
      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 1 })
        .expect(200)

      const pulledMonsterId = res.body.data.results[0].monster.id

      const userMonster = await prisma.userMonster.findFirst({
        where: {
          userId: userId,
          monsterId: pulledMonsterId,
        },
      })

      expect(userMonster).toBeTruthy()
    })

    it('should reject pull with insufficient currency', async () => {
      // Set user currency to 0
      await prisma.user.update({
        where: { id: userId },
        data: { spiritCrystals: 0 },
      })

      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 1 })
        .expect(402)

      expect(res.body.message).toContain('Insufficient')
    })

    it('should reject pull with invalid count', async () => {
      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 5 })
        .expect(400)

      expect(res.body.message).toBe('Count must be 1 or 10')
    })

    it('should reject pull on inactive banner', async () => {
      // Deactivate banner
      await prisma.banner.update({
        where: { id: bannerId },
        data: { isActive: false },
      })

      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 1 })
        .expect(404)

      expect(res.body.message).toBe('Banner not found or inactive')
    })

    it('should reject pull without authorization', async () => {
      const res = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .send({ count: 1 })
        .expect(401)

      expect(res.body.message).toBe('Authorization header required')
    })

    it('should handle duplicate monster correctly', async () => {
      // First pull
      const res1 = await request(app)
        .post(`/api/banners/${bannerId}/pull`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ count: 1 })
        .expect(200)

      const firstMonsterId = res1.body.data.results[0].monster.id
      expect(res1.body.data.results[0].isNew).toBe(true)

      // Create another monster of same type to ensure we can pull it again
      await prisma.monster.create({
        data: {
          name: 'Test Monster 2',
          slug: 'test-monster-2',
          rarity: 'rare',
          element: 'fire',
          realmId: realmId,
          bannerType: 'standard',
          description: 'Another test monster',
          lore: 'Test lore 2',
          baseStats: { hp: 100, attack: 50, defense: 30, speed: 40 },
          growthRates: { hp: 1.1, attack: 1.2, defense: 1.1, speed: 1.0 },
          isEx: false,
        },
      })

      // Pull multiple times to potentially get duplicate
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post(`/api/banners/${bannerId}/pull`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ count: 1 })

        // Check if we got a duplicate
        if (res.body.data.results[0].monster.id === firstMonsterId) {
          expect(res.body.data.results[0].isDuplicate).toBe(true)
          expect(res.body.data.results[0].isNew).toBe(false)
          break
        }
      }
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on pull endpoint', async () => {
      // Make 11 pull requests rapidly (limit is 10 per minute)
      const requests = []
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .post(`/api/banners/${bannerId}/pull`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ count: 1 })
        )
      }

      const responses = await Promise.all(requests)

      // At least one should be rate limited
      const rateLimited = responses.some((res) => res.status === 429)
      expect(rateLimited).toBe(true)
    }, 15000) // Increase timeout for this test
  })
})
