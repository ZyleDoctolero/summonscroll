import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Removes all demo user data from the database while preserving game content.
 * This script identifies demo users and cascades deletion through all related tables.
 */
async function removeDemoData() {
  console.log('🧹 Starting demo data cleanup...\n')

  // List of demo usernames to remove
  const demoUsernames = ['CrimsonBlade', 'TestUser', 'DemoPlayer']

  for (const username of demoUsernames) {
    console.log(`🔍 Looking for demo user: ${username}`)
    
    const user = await prisma.user.findUnique({ where: { username } })
    
    if (!user) {
      console.log(`   ⚠️  User '${username}' not found, skipping...\n`)
      continue
    }

    console.log(`   ✓ Found user: ${user.email} (ID: ${user.id})`)
    console.log(`   🗑️  Deleting related data...`)

    try {
      await prisma.$transaction([
        // 1. Delete LoginRewards
        prisma.loginReward.deleteMany({ where: { userId: user.id } }),
        
        // 2. Delete BattleResults
        prisma.battleResult.deleteMany({ where: { userId: user.id } }),
        
        // 3. Delete PityStates
        prisma.pityState.deleteMany({ where: { userId: user.id } }),
        
        // 4. Delete UserSkins
        prisma.userSkin.deleteMany({ where: { userId: user.id } }),
        
        // 5. Delete UserMonsters
        prisma.userMonster.deleteMany({ where: { userId: user.id } }),
        
        // 6. Delete Todos
        prisma.todo.deleteMany({ where: { userId: user.id } }),
        
        // 7. Delete Dailies
        prisma.daily.deleteMany({ where: { userId: user.id } }),
        
        // 8. Delete Habits
        prisma.habit.deleteMany({ where: { userId: user.id } }),
        
        // 9. Delete User
        prisma.user.delete({ where: { id: user.id } }),
      ])

      console.log(`   ✅ Successfully removed demo user: ${username}\n`)
    } catch (error) {
      console.error(`   ❌ Error removing user '${username}':`, error)
      throw error
    }
  }

  console.log('✅ Demo data cleanup completed!')
  console.log('📊 Game content (Realms, Monsters, Banners, ShopItems) preserved.')
}

async function main() {
  try {
    await removeDemoData()
  } catch (error) {
    console.error('❌ Demo data cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
