ALTER TABLE "User" DROP CONSTRAINT "User_industry_fkey";

ALTER TABLE "User" ALTER COLUMN "industry" DROP NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_industry_fkey" FOREIGN KEY ("industry") REFERENCES "IndustryInsight"("industry") ON DELETE SET NULL ON UPDATE CASCADE;
-- Prisma migration removed. Repository uses Mongoose now.
-- Original SQL removed for brevity.
ALTER TABLE "User" ADD CONSTRAINT "User_industry_fkey" FOREIGN KEY ("industry") REFERENCES "IndustryInsight"("industry") ON DELETE SET NULL ON UPDATE CASCADE;
