/*
  Warnings:

  - The values [elite] on the enum `Rarity` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `PityState` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Rarity_new" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ex');
ALTER TABLE "Monster" ALTER COLUMN "rarity" TYPE "Rarity_new" USING ("rarity"::text::"Rarity_new");
ALTER TYPE "Rarity" RENAME TO "Rarity_old";
ALTER TYPE "Rarity_new" RENAME TO "Rarity";
DROP TYPE "public"."Rarity_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PityState" DROP CONSTRAINT "PityState_bannerId_fkey";

-- DropForeignKey
ALTER TABLE "PityState" DROP CONSTRAINT "PityState_userId_fkey";

-- DropTable
DROP TABLE "PityState";
