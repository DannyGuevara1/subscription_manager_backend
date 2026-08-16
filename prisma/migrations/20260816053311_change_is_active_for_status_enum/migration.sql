/*
  Warnings:

  - You are about to drop the column `isActive` on the `Subscription` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."StatusSubscription" AS ENUM ('PAUSED', 'ACTIVE', 'CANCELED');

-- AlterTable
ALTER TABLE "public"."Subscription" DROP COLUMN "isActive",
ADD COLUMN     "status" "public"."StatusSubscription" NOT NULL DEFAULT 'ACTIVE';
