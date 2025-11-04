/*
  Warnings:

  - Added the required column `companyName` to the `CoverLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `CoverLetter` table without a default value. This is not possible if the table is not empty.

*/
DROP INDEX "CoverLetter_userId_key";

ALTER TABLE "CoverLetter" ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

CREATE INDEX "CoverLetter_userId_idx" ON "CoverLetter"("userId");
-- Prisma migration removed. Repository uses Mongoose now.
-- Original SQL removed for brevity.
CREATE INDEX "CoverLetter_userId_idx" ON "CoverLetter"("userId");
