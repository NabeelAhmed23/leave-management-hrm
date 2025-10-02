-- CreateTable
CREATE TABLE "leave_request_employees" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_request_employees_leaveRequestId_employeeId_key" ON "leave_request_employees"("leaveRequestId", "employeeId");

-- AddForeignKey
ALTER TABLE "leave_request_employees" ADD CONSTRAINT "leave_request_employees_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request_employees" ADD CONSTRAINT "leave_request_employees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from leave_requests.employeeId to leave_request_employees pivot table
INSERT INTO "leave_request_employees" ("id", "leaveRequestId", "employeeId", "createdAt")
SELECT
    gen_random_uuid(),
    lr."id",
    lr."employeeId",
    lr."createdAt"
FROM "leave_requests" lr
WHERE lr."employeeId" IS NOT NULL;

-- AlterTable: Remove organizationId from leave_comments
ALTER TABLE "leave_comments" DROP CONSTRAINT "leave_comments_organizationId_fkey";
ALTER TABLE "leave_comments" DROP COLUMN "organizationId";

-- AlterTable: Drop employeeId from leave_requests
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_employeeId_fkey";
ALTER TABLE "leave_requests" DROP COLUMN "employeeId";
