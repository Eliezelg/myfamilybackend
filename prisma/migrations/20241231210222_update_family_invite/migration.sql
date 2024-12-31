/*
  Warnings:

  - You are about to drop the column `token` on the `FamilyInvite` table. All the data in the column will be lost.
  - Added the required column `email` to the `FamilyInvite` table without a default value. This is not possible if the table is not empty.
  - Made the column `code` on table `FamilyInvite` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "FamilyInvite_token_key";

-- AlterTable
ALTER TABLE "FamilyInvite" DROP COLUMN "token",
ADD COLUMN     "accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "relationship" TEXT,
ALTER COLUMN "code" SET NOT NULL;
