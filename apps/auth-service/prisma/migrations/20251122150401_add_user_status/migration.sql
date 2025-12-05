/*
  Warnings:

  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'DELETED');

-- DropIndex
DROP INDEX "public"."users_is_active_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
ADD COLUMN     "user_status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "users_user_status_idx" ON "users"("user_status");
