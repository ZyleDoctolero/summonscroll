-- CreateTable
CREATE TABLE "CurrencyIcon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'currency',
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'svg',
    "width" INTEGER NOT NULL DEFAULT 64,
    "height" INTEGER NOT NULL DEFAULT 64,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyIcon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyIcon_name_key" ON "CurrencyIcon"("name");

-- CreateIndex
CREATE INDEX "CurrencyIcon_type_idx" ON "CurrencyIcon"("type");

-- CreateIndex
CREATE INDEX "CurrencyIcon_name_idx" ON "CurrencyIcon"("name");
