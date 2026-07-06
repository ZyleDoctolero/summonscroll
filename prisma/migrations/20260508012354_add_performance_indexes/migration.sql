-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE INDEX "Banner_bannerType_idx" ON "Banner"("bannerType");

-- CreateIndex
CREATE INDEX "Banner_startsAt_endsAt_idx" ON "Banner"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Monster_realmId_idx" ON "Monster"("realmId");

-- CreateIndex
CREATE INDEX "Monster_rarity_idx" ON "Monster"("rarity");

-- CreateIndex
CREATE INDEX "Monster_element_idx" ON "Monster"("element");

-- CreateIndex
CREATE INDEX "Monster_isEx_idx" ON "Monster"("isEx");

-- CreateIndex
CREATE INDEX "PityState_userId_idx" ON "PityState"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_guildId_idx" ON "User"("guildId");

-- CreateIndex
CREATE INDEX "UserMonster_monsterId_idx" ON "UserMonster"("monsterId");

-- CreateIndex
CREATE INDEX "UserMonster_userId_isOnTeam_idx" ON "UserMonster"("userId", "isOnTeam");
