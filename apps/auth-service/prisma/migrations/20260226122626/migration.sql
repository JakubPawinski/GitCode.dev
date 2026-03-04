-- DropIndex
DROP INDEX "oauth_tokens_user_id_provider_key";

-- AlterTable
ALTER TABLE "oauth_tokens" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "revoked_at" TIMESTAMP(3);
