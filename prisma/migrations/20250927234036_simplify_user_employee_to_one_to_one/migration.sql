-- DropIndex
DROP INDEX "public"."employees_userId_organizationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "public"."employees"("userId");