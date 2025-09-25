import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/app-error";
import type { RegisterInput } from "@/schemas/auth.schema";
import type { User, Role } from "@prisma/client";

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    data: RegisterInput
  ): Promise<Omit<User, "passwordHash">> {
    const { email, password, firstName, lastName, organizationId } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User already exists with this email", 409);
    }

    // Verify organization exists (if provided)
    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new AppError("Organization not found", 404);
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
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
  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
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
   * Check if user has required role
   */
  static hasRole(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      EMPLOYEE: 1,
      MANAGER: 2,
      HR_ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user belongs to organization
   */
  static belongsToOrganization(user: User, organizationId: string): boolean {
    return user.organizationId === organizationId;
  }
}
