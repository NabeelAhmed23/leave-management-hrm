/*
  Warnings:

  - You are about to drop the column `employeeId` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeNumber]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeNumber` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."employees_employeeId_key";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "employeeId",
ADD COLUMN     "employeeNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "public"."employees"("employeeNumber");
