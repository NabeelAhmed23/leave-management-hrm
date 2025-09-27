import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/app-error";
import type { RegisterInput } from "@/schemas/auth.schema";
import type { User, Employee, Role } from "../../generated/prisma";

type UserWithEmployee = User & {
  employee:
    | (Employee & {
        organization: {
          id: string;
          name: string;
          domain: string;
          settings: unknown;
          carryOverDays: number;
          createdAt: Date;
          updatedAt: Date;
        };
        department: {
          id: string;
          name: string;
          description: string | null;
          organizationId: string;
          managerId: string | null;
          createdAt: Date;
          updatedAt: Date;
        } | null;
      })
    | null;
};

export class AuthService {
  /**
   * Register a new HR Manager with their organization
   */
  static async register(data: RegisterInput): Promise<{
    user: Omit<User, "passwordHash">;
    organization: {
      id: string;
      name: string;
      domain: string;
      carryOverDays: number;
      createdAt: Date;
    };
    employee: Employee;
  }> {
    const { email, password, firstName, lastName, organizationName, domain } =
      data;

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
          updatedAt: true,
        },
      });

      // 2. Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          domain:
            domain ||
            `${organizationName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          carryOverDays: 0,
        },
      });

      // 3. Create employee with HR_ADMIN role
      const employee = await tx.employee.create({
        data: {
          employeeId: `HR${Date.now()}`,
          userId: user.id,
          organizationId: organization.id,
          role: "HR_ADMIN",
          jobTitle: "HR Manager",
          startDate: new Date(),
          isActive: true,
        },
      });

      return { user, organization, employee };
    });

    return result;
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(
    email: string,
    password: string
  ): Promise<UserWithEmployee | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          include: {
            organization: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserWithEmployee | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            organization: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserWithEmployee | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          include: {
            organization: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * Get employee by ID with organization data
   */
  static async getEmployeeById(employeeId: string): Promise<Employee | null> {
    return await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: true,
        department: true,
        manager: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: string,
    newPassword: string
  ): Promise<void> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /**
   * Verify current password
   */
  static async verifyPassword(
    userId: string,
    password: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Check if employee has required role
   */
  static hasRole(employeeRole: Role, requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      EMPLOYEE: 1,
      MANAGER: 2,
      HR_ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    return roleHierarchy[employeeRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if employee belongs to organization
   */
  static belongsToOrganization(
    employee: Employee,
    organizationId: string
  ): boolean {
    return employee.organizationId === organizationId;
  }

  /**
   * Get employee for user
   */
  static getEmployee(user: UserWithEmployee): Employee | null {
    return user.employee && user.employee.isActive ? user.employee : null;
  }
}
