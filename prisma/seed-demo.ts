/**
 * SummonScroll — Development Seed with Demo Data
 * Seeds all game content PLUS demo users for testing
 * Run from SummonScroll root: npx tsx prisma/seed-demo.ts
 */

import { PrismaClient } from '../server/node_modules/.prisma/client/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

// Initialize Prisma with pg adapter
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'summonscroll',
  user: 'shirooalister',
  password: 'Junebride083111!',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function seedDemoUsers() {
  console.log('\n👤 Seeding demo users for development...')

  // Get guild for demo users
  const guild = await prisma.guild.findUnique({ where: { name: 'Spectral Vanguard' } })
  
  // Get some monsters for demo users
  const monsters = await prisma.monster.findMany({ take: 10 })

  // Demo User 1: CrimsonBlade
  console.log('  Creating demo user: CrimsonBlade...')
  const passwordHash1 = await bcrypt.hash('CrimsonBlade123!', 12)

  const demoUser1 = await prisma.user.upsert({
    where: { email: 'crimsonblade@summonscroll.dev' },
    update: {},
    create: {
      username: 'CrimsonBlade',
      email: 'crimsonblade@summonscroll.dev',
      passwordHash: passwordHash1,
      level: 42,
      xp: 6700,
      xpToNextLevel: 10000,
      spiritCrystals: 12450,
      voidShards: 234,
      pactSeals: 3,
      currentStreak: 14,
      longestStreak: 30,
      guildId: guild?.id,
    },
  })

  // Give CrimsonBlade some monsters
  for (let i = 0; i < Math.min(7, monsters.length); i++) {
    const monster = monsters[i]
    await prisma.userMonster.upsert({
      where: {
        userId_monsterId_awakeningStage_corruptionState_rankForm: {
          userId: demoUser1.id,
          monsterId: monster.id,
          awakeningStage: 0,
          corruptionState: 'pure',
          rankForm: 'standard',
        },
      },
      update: {},
      create: {
        userId: demoUser1.id,
        monsterId: monster.id,
        level: Math.floor(Math.random() * 40) + 1,
        bondPercent: Math.floor(Math.random() * 80) + 10,
        bondXp: Math.floor(Math.random() * 5000),
        isOnTeam: i < 5,
        teamSlot: i < 5 ? i + 1 : null,
      },
    })
  }

  // Give CrimsonBlade some habits
  await prisma.habit.upsert({
    where: { id: 'demo-habit-1' },
    update: {},
    create: {
      id: 'demo-habit-1',
      userId: demoUser1.id,
      title: 'Morning Meditation',
      category: 'meditation',
      difficulty: 'medium',
      streakCount: 14,
      streakHealth: 100,
      isActive: true,
      realmAffinity: 3, // Outer Dark
    },
  })

  console.log('  ✓ CrimsonBlade created with 7 monsters and 1 habit')

  // Demo User 2: DemoPlayer
  console.log('  Creating demo user: DemoPlayer...')
  const passwordHash2 = await bcrypt.hash('Demo1234!', 12)

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'demo@summonscroll.com' },
    update: {},
    create: {
      username: 'DemoPlayer',
      email: 'demo@summonscroll.com',
      passwordHash: passwordHash2,
      level: 10,
      xp: 1200,
      xpToNextLevel: 2000,
      spiritCrystals: 5000,
      voidShards: 50,
      pactSeals: 10,
      currentStreak: 3,
      longestStreak: 7,
      guildId: guild?.id,
    },
  })

  // Give DemoPlayer some monsters
  for (let i = 0; i < Math.min(5, monsters.length); i++) {
    const monster = monsters[i]
    await prisma.userMonster.upsert({
      where: {
        userId_monsterId_awakeningStage_corruptionState_rankForm: {
          userId: demoUser2.id,
          monsterId: monster.id,
          awakeningStage: 0,
          corruptionState: 'pure',
          rankForm: 'standard',
        },
      },
      update: {},
      create: {
        userId: demoUser2.id,
        monsterId: monster.id,
        level: Math.floor(Math.random() * 20) + 1,
        bondPercent: Math.floor(Math.random() * 50) + 10,
        bondXp: Math.floor(Math.random() * 2000),
        isOnTeam: i < 3,
        teamSlot: i < 3 ? i + 1 : null,
      },
    })
  }

  console.log('  ✓ DemoPlayer created with 5 monsters')

  console.log('\n✅ Demo users seeded successfully!')
  console.log('   Demo users: 2')
  console.log('   - CrimsonBlade (Level 42, 7 monsters)')
  console.log('   - DemoPlayer (Level 10, 5 monsters)')
}

async function main() {
  console.log('🌱 Starting SummonScroll development seed (with demo data)...\n')

  // Check if production seed has been run
  const realmCount = await prisma.realm.count()
  
  if (realmCount === 0) {
    console.log('⚠️  Production seed data not found!')
    console.log('   Please run the production seed first: npx prisma db seed')
    console.log('   Then run this script to add demo users.\n')
    process.exit(1)
  }

  console.log(`✓ Found ${realmCount} realms (production seed already run)`)

  // Only seed demo users if NODE_ENV is not production
  if (process.env['NODE_ENV'] === 'production') {
    console.log('\n⚠️  NODE_ENV is set to production')
    console.log('   Skipping demo user creation for production environment.')
    console.log('   To create demo users, run with NODE_ENV=development\n')
    return
  }

  await seedDemoUsers()
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
