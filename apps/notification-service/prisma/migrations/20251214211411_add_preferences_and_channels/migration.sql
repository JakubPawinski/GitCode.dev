/*
  Warnings:

  - You are about to drop the column `message` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `kind` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payload` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SECURITY', 'SYSTEM', 'SOCIAL', 'MARKETING', 'PROBLEM');

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "message",
DROP COLUMN "metadata",
DROP COLUMN "title",
ADD COLUMN     "channels_sent" "ChannelType"[],
ADD COLUMN     "kind" TEXT NOT NULL,
ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "severity" "NotificationSeverity" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channels" "ChannelType"[],
    "types" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_types_key" ON "notification_preferences"("user_id", "types");
