/*
  Warnings:

  - A unique constraint covering the columns `[user_id,id]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_id_key" ON "notifications"("user_id", "id");
