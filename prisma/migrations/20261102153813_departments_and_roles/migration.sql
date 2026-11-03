/*
  Warnings:

  - The values [ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contactEmail` on the `Department` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[headEmail]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departmentId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headEmail` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headName` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'FACULTY', 'DEPARTMENT_HEAD', 'SUPERUSER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (CASE WHEN "role"::text = 'ADMIN' THEN 'SUPERUSER' ELSE "role"::text END::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "departmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "contactEmail",
ADD COLUMN     "headEmail" TEXT NOT NULL,
ADD COLUMN     "headName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departmentId" TEXT;

-- CreateIndex
CREATE INDEX "Category_departmentId_idx" ON "Category"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_headEmail_key" ON "Department"("headEmail");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
