import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/app-error";
import { registerSchema } from "@/schemas/auth.schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = registerSchema.parse(body);
    const { email, password, firstName, lastName, organizationName, domain } =
      validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User already exists with this email", 409);
    }

    // Check if domain is already taken (if provided)
    if (domain) {
      const existingOrganization = await prisma.organization.findUnique({
        where: { domain },
      });

      if (existingOrganization) {
        throw new AppError(
          "Domain is already taken by another organization",
          409
        );
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user, organization, and employee in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create user first
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      // 2. Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          domain:
            domain ||
            `${organizationName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          carryOverDays: 0, // Default value
        },
        select: {
          id: true,
          name: true,
          domain: true,
          carryOverDays: true,
          createdAt: true,
        },
      });

      // 3. Create employee with HR_ADMIN role
      const employee = await tx.employee.create({
        data: {
          employeeId: `HR${Date.now()}`, // Generate HR employee ID
          userId: user.id,
          organizationId: organization.id,
          role: "HR_ADMIN",
          jobTitle: "HR Manager",
          startDate: new Date(),
          isActive: true,
        },
        select: {
          id: true,
          employeeId: true,
          role: true,
          jobTitle: true,
          startDate: true,
          isActive: true,
          organizationId: true,
        },
      });

      return { user, organization, employee };
    });

    return NextResponse.json(
      {
        message: "Organization and HR account created successfully",
        user: result.user,
        organization: result.organization,
        employee: result.employee,
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    return NextResponse.json(
      {
        message: appError.message,
        details: appError.details,
      },
      { status: appError.statusCode }
    );
  }
}
