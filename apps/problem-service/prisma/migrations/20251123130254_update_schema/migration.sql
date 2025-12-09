/*
  Warnings:

  - You are about to drop the column `explanation` on the `examples` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `examples` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `hints` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "examples" DROP COLUMN "explanation",
DROP COLUMN "image_url";

-- AlterTable
ALTER TABLE "hints" DROP COLUMN "difficulty";
