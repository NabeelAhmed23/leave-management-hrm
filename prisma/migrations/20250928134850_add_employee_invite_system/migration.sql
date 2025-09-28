-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."employees" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."employee_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "employeeId" TEXT,
    "status" "public"."InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_token_key" ON "public"."employee_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_employeeId_key" ON "public"."employee_invites"("employeeId");

-- AddForeignKey
ALTER TABLE "public"."employee_invites" ADD CONSTRAINT "employee_invites_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
