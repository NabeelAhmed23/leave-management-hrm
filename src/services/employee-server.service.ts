import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { emailService } from "@/services/email.service";
import { AppError } from "@/utils/app-error";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  QueryEmployeesInput,
  InviteEmployeeInput,
  SetupPasswordInput,
} from "@/schemas/employee.schema";
import {
  DetailedEmployee,
  EmployeeWithLeaveBalances,
  EmployeesListResponse,
  EmployeeResponse,
  EmployeeInviteResponse,
} from "@/types/employee.types";
import { Role, InviteStatus, Prisma } from "../../generated/prisma";

// Helper function to generate unique employee number
async function generateEmployeeNumber(organizationId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const orgPrefix =
    org?.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "") || "EMP";

  // Find the highest employee number for this organization
  const lastEmployee = await prisma.employee.findFirst({
    where: {
      organizationId,
      employeeNumber: {
        startsWith: orgPrefix,
      },
    },
    orderBy: {
      employeeNumber: "desc",
    },
  });

  let nextNumber = 1;
  if (lastEmployee?.employeeNumber) {
    const currentNumber = parseInt(
      lastEmployee.employeeNumber.replace(orgPrefix, ""),
      10
    );
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `${orgPrefix}${nextNumber.toString().padStart(3, "0")}`;
}

// Create employee (without user account)
export async function createEmployee(
  organizationId: string,
  data: CreateEmployeeInput
): Promise<DetailedEmployee> {
  try {
    logger.info("Creating employee", {
      organizationId,
      email: data.email,
    });

    // Check if employee number already exists in the organization
    const existingEmployee = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
      },
    });

    if (existingEmployee) {
      throw new AppError(
        "Employee with email already exists in this organization",
        409
      );
    }

    // Validate manager and department belong to the same organization
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: data.managerId,
          organizationId,
        },
      });
      if (!manager) {
        throw new AppError("Manager not found in this organization", 404);
      }
    }

    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          organizationId,
        },
      });
      if (!department) {
        throw new AppError("Department not found in this organization", 404);
      }
    }

    // Generate employee number if not provided
    const employeeNumber = await generateEmployeeNumber(organizationId);

    // Create employee without user account
    const employee = await prisma.employee.create({
      data: {
        employeeNumber,
        organizationId,
        departmentId: data.departmentId,
        role: data.role as Role,
        jobTitle: data.jobTitle,
        managerId: data.managerId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
      },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
    });

    // Send invite email if requested
    if (data.sendInvite) {
      await sendEmployeeInvite(employee.id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    }

    logger.info("Employee created successfully", {
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
      organizationId,
    });

    return employee as DetailedEmployee;
  } catch (error) {
    logger.error("Error creating employee", {
      error: error as Error,
      organizationId,
      email: data.email,
    });
    throw AppError.from(error);
  }
}

// Send employee invite
export async function sendEmployeeInvite(
  employeeId: string,
  inviteData: InviteEmployeeInput
): Promise<EmployeeInviteResponse> {
  try {
    logger.info("Sending employee invite", {
      employeeId,
      email: inviteData.email,
    });

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.employeeInvite.findFirst({
      where: {
        employeeId,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      // Cancel existing invite
      await prisma.employeeInvite.update({
        where: { id: existingInvite.id },
        data: { status: InviteStatus.CANCELLED },
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite record
    const invite = await prisma.employeeInvite.create({
      data: {
        email: inviteData.email.toLowerCase(),
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        token,
        employeeId,
        expiresAt,
      },
    });

    // Generate setup URL
    const setupUrl = `${process.env.APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(inviteData.email)}`;

    // Send invite email
    const templateData = {
      firstName: inviteData.firstName,
      lastName: inviteData.lastName,
      email: inviteData.email,
      organizationName: employee.organization.name,
      employeeNumber: employee.employeeNumber,
      jobTitle: employee.jobTitle || undefined,
      departmentName: employee.department?.name,
      startDate: employee.startDate.toLocaleDateString(),
      setupUrl,
      appName: process.env.APP_NAME || "Leave Management System",
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_FROM,
      expiryDays: 7,
      expiryDate: expiresAt.toLocaleDateString(),
    };

    await emailService.sendTemplateEmail(
      inviteData.email,
      `Welcome to ${employee.organization.name} - Set Up Your Account`,
      "employee-invite",
      templateData
    );

    logger.info("Employee invite sent successfully", {
      employeeId,
      inviteId: invite.id,
      email: inviteData.email,
    });

    return {
      success: true,
      message: "Employee invite sent successfully",
      data: {
        inviteId: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
      },
    };
  } catch (error) {
    logger.error("Error sending employee invite", {
      error: error as Error,
      employeeId,
      email: inviteData.email,
    });
    throw AppError.from(error);
  }
}

// Setup password from invite token
export async function setupPassword(
  data: SetupPasswordInput
): Promise<EmployeeResponse> {
  try {
    logger.info("Setting up password from invite", {
      token: data.token.substring(0, 8) + "...",
    });

    // Find and validate invite
    const invite = await prisma.employeeInvite.findUnique({
      where: { token: data.token },
      include: {
        employee: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      throw new AppError("Invalid or expired invite token", 400);
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new AppError("Invite has already been used or cancelled", 400);
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await prisma.employeeInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new AppError("Invite token has expired", 400);
    }

    if (!invite.employee) {
      throw new AppError("Employee not found for this invite", 404);
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and link to employee
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        passwordHash,
      },
    });

    // Update employee with user ID
    const updatedEmployee = await prisma.employee.update({
      where: { id: invite.employeeId! },
      data: { userId: user.id },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
    });

    // Mark invite as accepted
    await prisma.employeeInvite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Send confirmation email
    const loginUrl = `${process.env.APP_URL}/auth/login`;
    const confirmationData = {
      firstName: invite.firstName,
      email: invite.email,
      organizationName: invite.employee.organization.name,
      loginUrl,
      appName: process.env.APP_NAME || "Leave Management System",
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_FROM,
    };

    await emailService.sendTemplateEmail(
      invite.email,
      "Account Setup Complete - Welcome Aboard!",
      "password-setup-confirmation",
      confirmationData
    );

    logger.info("Password setup completed successfully", {
      userId: user.id,
      employeeId: updatedEmployee.id,
      email: invite.email,
    });

    return {
      success: true,
      message: "Password setup completed successfully",
      data: updatedEmployee as DetailedEmployee,
    };
  } catch (error) {
    logger.error("Error setting up password", {
      error: error as Error,
      token: data.token.substring(0, 8) + "...",
    });
    throw AppError.from(error);
  }
}

// Get employees with pagination and filtering
export async function getEmployees(
  organizationId: string,
  query: QueryEmployeesInput
): Promise<EmployeesListResponse["data"]> {
  try {
    const { search, departmentId, role, isActive, page, limit } = query;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { employeeNumber: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (role) {
      where.role = role;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // Calculate pagination
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Get employees
    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit > 1 ? limit : undefined,
    });

    logger.info("Retrieved employees", {
      organizationId,
      count: employees.length,
      total,
      page,
      limit,
    });

    return {
      employees: employees as DetailedEmployee[],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error("Error retrieving employees", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}

// Get employee by ID
export async function getEmployeeById(
  employeeId: string,
  organizationId: string
): Promise<DetailedEmployee | null> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    logger.info("Retrieved employee by ID", {
      employeeId,
      organizationId,
    });

    return employee as DetailedEmployee;
  } catch (error) {
    logger.error("Error retrieving employee by ID", {
      error: error as Error,
      employeeId,
      organizationId,
    });
    throw AppError.from(error);
  }
}

// Update employee
export async function updateEmployee(
  employeeId: string,
  organizationId: string,
  data: UpdateEmployeeInput
): Promise<DetailedEmployee | null> {
  try {
    logger.info("Updating employee", {
      employeeId,
      organizationId,
    });

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        user: true,
      },
    });

    if (!existingEmployee) {
      return null;
    }

    // If updating employee number, check for conflicts
    if (
      data.employeeNumber &&
      data.employeeNumber !== existingEmployee.employeeNumber
    ) {
      const existingWithNumber = await prisma.employee.findFirst({
        where: {
          employeeNumber: data.employeeNumber,
          organizationId,
          id: { not: employeeId },
        },
      });

      if (existingWithNumber) {
        throw new AppError(
          "Employee number already exists in this organization",
          409
        );
      }
    }

    // If updating email, check for conflicts
    if (
      data.email &&
      existingEmployee.user &&
      data.email !== existingEmployee.user.email
    ) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser && existingUser.id !== existingEmployee.user.id) {
        throw new AppError("User with this email already exists", 409);
      }
    }

    // Validate manager and department belong to the same organization
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: data.managerId,
          organizationId,
        },
      });
      if (!manager) {
        throw new AppError("Manager not found in this organization", 404);
      }
    }

    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          organizationId,
        },
      });
      if (!department) {
        throw new AppError("Department not found in this organization", 404);
      }
    }

    // Prepare update data
    const updateData: Prisma.EmployeeUpdateInput = {};
    const userUpdateData: Prisma.UserUpdateInput = {};

    // Employee fields
    if (data.employeeNumber) updateData.employeeNumber = data.employeeNumber;
    if (data.departmentId !== undefined) {
      updateData.department = data.departmentId
        ? { connect: { id: data.departmentId } }
        : { disconnect: true };
    }
    if (data.role) updateData.role = data.role as Role;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.managerId !== undefined) {
      updateData.manager = data.managerId
        ? { connect: { id: data.managerId } }
        : { disconnect: true };
    }
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;

    // User fields (if user exists)
    if (existingEmployee.user) {
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.email) userUpdateData.email = data.email.toLowerCase();
    }

    // Update in transaction
    const updatedEmployee = await prisma.$transaction(async tx => {
      // Update user if needed and user exists
      if (existingEmployee.user && Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.user.id },
          data: userUpdateData,
        });
      }

      // Update employee
      return await tx.employee.update({
        where: { id: employeeId },
        data: updateData,
        include: {
          user: true,
          organization: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          department: {
            include: {
              manager: {
                include: {
                  user: true,
                },
              },
            },
          },
          manager: {
            include: {
              user: true,
            },
          },
          subordinates: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              subordinates: true,
              leaveBalances: true,
            },
          },
        },
      });
    });

    logger.info("Employee updated successfully", {
      employeeId,
      organizationId,
    });

    return updatedEmployee as DetailedEmployee;
  } catch (error) {
    logger.error("Error updating employee", {
      error: error as Error,
      employeeId,
      organizationId,
    });
    throw AppError.from(error);
  }
}

// Delete employee (soft delete)
export async function deleteEmployee(
  employeeId: string,
  organizationId: string
): Promise<DetailedEmployee | null> {
  try {
    logger.info("Deleting employee", {
      employeeId,
      organizationId,
    });

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
    });

    if (!existingEmployee) {
      return null;
    }

    // Soft delete by setting isActive to false
    const deletedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: false },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
    });

    logger.info("Employee deleted successfully", {
      employeeId,
      organizationId,
    });

    return deletedEmployee as DetailedEmployee;
  } catch (error) {
    logger.error("Error deleting employee", {
      error: error as Error,
      employeeId,
      organizationId,
    });
    throw AppError.from(error);
  }
}

// Get employee with leave balances
export async function getEmployeeWithLeaveBalances(
  employeeId: string,
  organizationId: string
): Promise<EmployeeWithLeaveBalances | null> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        department: {
          include: {
            manager: {
              include: {
                user: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
        leaveBalances: {
          include: {
            leaveType: true,
          },
          orderBy: {
            leaveType: {
              name: "asc",
            },
          },
        },
        _count: {
          select: {
            subordinates: true,
            leaveBalances: true,
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    logger.info("Retrieved employee with leave balances", {
      employeeId,
      organizationId,
      leaveBalancesCount: employee.leaveBalances.length,
    });

    return employee as EmployeeWithLeaveBalances;
  } catch (error) {
    logger.error("Error retrieving employee with leave balances", {
      error: error as Error,
      employeeId,
      organizationId,
    });
    throw AppError.from(error);
  }
}
