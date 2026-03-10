/*
  Warnings:

  - A unique constraint covering the columns `[user_id,provider]` on the table `oauth_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "oauth_tokens_user_id_provider_key" ON "oauth_tokens"("user_id", "provider");
