-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'uncommon', 'rare', 'elite', 'epic', 'legendary', 'mythic', 'ex');

-- CreateEnum
CREATE TYPE "Element" AS ENUM ('fire', 'water', 'earth', 'wind', 'light', 'dark', 'void', 'digital', 'ice', 'thunder', 'nature', 'stellar', 'primordial', 'synthetic', 'arcane', 'chaos', 'dread', 'death', 'divine');

-- CreateEnum
CREATE TYPE "MonsterRole" AS ENUM ('attacker', 'tank', 'healer', 'debuffer', 'support');

-- CreateEnum
CREATE TYPE "AwakeningStage" AS ENUM ('ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateEnum
CREATE TYPE "CorruptionState" AS ENUM ('pure', 'corrupted', 'divine', 'hollow');

-- CreateEnum
CREATE TYPE "RankForm" AS ENUM ('standard', 'champion', 'sovereign');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('standard', 'featured', 'streak', 'pact_seal', 'event');

-- CreateEnum
CREATE TYPE "HabitDifficulty" AS ENUM ('trivial', 'easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "HabitCategory" AS ENUM ('study', 'fitness', 'meditation', 'sleep', 'nutrition', 'productivity', 'custom');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('seasonal', 'event', 'achievement', 'default');

-- CreateEnum
CREATE TYPE "BattleMode" AS ENUM ('dungeon', 'chaos_tower', 'guild_raid', 'event');

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('consumable', 'material', 'skin', 'currency_pack');

-- CreateTable
CREATE TABLE "Realm" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "habitAffinity" "HabitCategory"[],
    "description" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Realm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "role" "MonsterRole" NOT NULL,
    "element" "Element" NOT NULL,
    "origin" TEXT NOT NULL,
    "lore" TEXT NOT NULL DEFAULT '',
    "artUrl" TEXT,
    "isEx" BOOLEAN NOT NULL DEFAULT false,
    "realmSkill" TEXT,
    "baseHp" INTEGER NOT NULL DEFAULT 1000,
    "baseAtk" INTEGER NOT NULL DEFAULT 100,
    "baseDef" INTEGER NOT NULL DEFAULT 80,
    "baseSpd" INTEGER NOT NULL DEFAULT 90,
    "bannerType" "BannerType" NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "unlockBondPercent" INTEGER NOT NULL DEFAULT 0,
    "cooldown" INTEGER NOT NULL DEFAULT 0,
    "element" "Element",

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterSkin" (
    "id" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "skinName" TEXT NOT NULL,
    "skinType" "SkinType" NOT NULL,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "unlockCondition" TEXT,
    "artUrl" TEXT,

    CONSTRAINT "MonsterSkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExMonsterLog" (
    "monsterId" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "firstPulledById" TEXT,
    "timesPulled" INTEGER NOT NULL DEFAULT 0,
    "transcendenceStonesIssued" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExMonsterLog_pkey" PRIMARY KEY ("monsterId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 1000,
    "spiritCrystals" INTEGER NOT NULL DEFAULT 100,
    "voidShards" INTEGER NOT NULL DEFAULT 5,
    "pactSeals" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "guildId" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMonster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "awakeningStage" INTEGER NOT NULL DEFAULT 0,
    "corruptionState" "CorruptionState" NOT NULL DEFAULT 'pure',
    "rankForm" "RankForm" NOT NULL DEFAULT 'standard',
    "bondXp" INTEGER NOT NULL DEFAULT 0,
    "bondPercent" INTEGER NOT NULL DEFAULT 0,
    "equippedSkinId" TEXT,
    "isOnTeam" BOOLEAN NOT NULL DEFAULT false,
    "teamSlot" INTEGER,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMonster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkin" (
    "userId" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "equippedOn" TEXT,

    CONSTRAINT "UserSkin_pkey" PRIMARY KEY ("userId","skinId")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "HabitCategory" NOT NULL DEFAULT 'custom',
    "difficulty" "HabitDifficulty" NOT NULL DEFAULT 'medium',
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "streakHealth" INTEGER NOT NULL DEFAULT 100,
    "lastCompletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "questFrameEnabled" BOOLEAN NOT NULL DEFAULT false,
    "questDeadline" TIMESTAMP(3),
    "realmAffinity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Daily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "HabitCategory" NOT NULL DEFAULT 'custom',
    "difficulty" "HabitDifficulty" NOT NULL DEFAULT 'medium',
    "completedToday" BOOLEAN NOT NULL DEFAULT false,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "dueTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "HabitDifficulty" NOT NULL DEFAULT 'medium',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bannerType" "BannerType" NOT NULL,
    "realmId" TEXT,
    "featuredMonsterId" TEXT,
    "artUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pullCost" INTEGER NOT NULL DEFAULT 160,
    "pullCurrency" TEXT NOT NULL DEFAULT 'spiritCrystals',

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PityState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "pullsSinceRare" INTEGER NOT NULL DEFAULT 0,
    "pullsSinceElite" INTEGER NOT NULL DEFAULT 0,
    "pullsSinceEpic" INTEGER NOT NULL DEFAULT 0,
    "pullsSinceLegendary" INTEGER NOT NULL DEFAULT 0,
    "pullsSinceMythic" INTEGER NOT NULL DEFAULT 0,
    "pullsSinceEx" INTEGER NOT NULL DEFAULT 0,
    "totalPulls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PityState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "BattleMode" NOT NULL,
    "won" BOOLEAN NOT NULL,
    "floorReached" INTEGER,
    "crystalsEarned" INTEGER NOT NULL DEFAULT 0,
    "shardsEarned" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionRecipe" (
    "id" TEXT NOT NULL,
    "resultMonsterId" TEXT NOT NULL,
    "isCrossRealm" BOOLEAN NOT NULL DEFAULT false,
    "successRate" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "FusionRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "FusionIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "raidBossHp" INTEGER NOT NULL DEFAULT 1000000,
    "raidBossMaxHp" INTEGER NOT NULL DEFAULT 1000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" "ShopItemType" NOT NULL,
    "cost" INTEGER NOT NULL,
    "costCurrency" TEXT NOT NULL DEFAULT 'spiritCrystals',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "limitedUntil" TIMESTAMP(3),
    "artUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tab" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weekStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realm_number_key" ON "Realm"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Realm_slug_key" ON "Realm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserMonster_userId_idx" ON "UserMonster"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMonster_userId_monsterId_awakeningStage_corruptionState_key" ON "UserMonster"("userId", "monsterId", "awakeningStage", "corruptionState", "rankForm");

-- CreateIndex
CREATE INDEX "Habit_userId_isActive_idx" ON "Habit"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Daily_userId_completedToday_idx" ON "Daily"("userId", "completedToday");

-- CreateIndex
CREATE INDEX "PityState_userId_bannerId_idx" ON "PityState"("userId", "bannerId");

-- CreateIndex
CREATE UNIQUE INDEX "PityState_userId_bannerId_key" ON "PityState"("userId", "bannerId");

-- CreateIndex
CREATE INDEX "BattleResult_userId_completedAt_idx" ON "BattleResult"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_name_key" ON "Guild"("name");

-- AddForeignKey
ALTER TABLE "Monster" ADD CONSTRAINT "Monster_realmId_fkey" FOREIGN KEY ("realmId") REFERENCES "Realm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterSkin" ADD CONSTRAINT "MonsterSkin_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExMonsterLog" ADD CONSTRAINT "ExMonsterLog_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExMonsterLog" ADD CONSTRAINT "ExMonsterLog_realmId_fkey" FOREIGN KEY ("realmId") REFERENCES "Realm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExMonsterLog" ADD CONSTRAINT "ExMonsterLog_firstPulledById_fkey" FOREIGN KEY ("firstPulledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMonster" ADD CONSTRAINT "UserMonster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMonster" ADD CONSTRAINT "UserMonster_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkin" ADD CONSTRAINT "UserSkin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkin" ADD CONSTRAINT "UserSkin_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "MonsterSkin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Daily" ADD CONSTRAINT "Daily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_realmId_fkey" FOREIGN KEY ("realmId") REFERENCES "Realm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PityState" ADD CONSTRAINT "PityState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PityState" ADD CONSTRAINT "PityState_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleResult" ADD CONSTRAINT "BattleResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionRecipe" ADD CONSTRAINT "FusionRecipe_resultMonsterId_fkey" FOREIGN KEY ("resultMonsterId") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionIngredient" ADD CONSTRAINT "FusionIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "FusionRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionIngredient" ADD CONSTRAINT "FusionIngredient_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginReward" ADD CONSTRAINT "LoginReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
