/*
  Warnings:

  - The values [CANCELED] on the enum `StatusSubscription` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StatusSubscription_new" AS ENUM ('PAUSED', 'ACTIVE', 'CANCELLED');
ALTER TABLE "public"."Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Subscription" ALTER COLUMN "status" TYPE "public"."StatusSubscription_new" USING ("status"::text::"public"."StatusSubscription_new");
ALTER TYPE "public"."StatusSubscription" RENAME TO "StatusSubscription_old";
ALTER TYPE "public"."StatusSubscription_new" RENAME TO "StatusSubscription";
DROP TYPE "public"."StatusSubscription_old";
ALTER TABLE "public"."Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;
