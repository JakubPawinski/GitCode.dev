-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SECURITY', 'BILLING', 'SYSTEM', 'SUPPORT', 'SOCIAL', 'MARKETING');

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channels" "ChannelType"[] DEFAULT ARRAY['EMAIL', 'IN_APP']::"ChannelType"[],
    "type" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL,
    "kind" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "channels_sent" "ChannelType"[],
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_config" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "kind" TEXT NOT NULL DEFAULT '*',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preference_user_id_idx" ON "notification_preference"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_user_id_type_key" ON "notification_preference"("user_id", "type");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_id_key" ON "notifications"("user_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_config_type_kind_key" ON "notification_config"("type", "kind");
