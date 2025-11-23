/*
  Warnings:

  - The `theme` column on the `user_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `privacyLevel` column on the `user_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "user_preferences" DROP COLUMN "theme",
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'LIGHT',
DROP COLUMN "privacyLevel",
ADD COLUMN     "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'PUBLIC';
