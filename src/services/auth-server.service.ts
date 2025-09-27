import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { emailService } from "@/services/email.service";
import {
  generateToken,
  verifyToken,
  getSessionCookieConfig,
  type JWTPayload,
  type UserTokenData,
} from "@/lib/jwt";
import { Role } from "@prisma/client";

// Server-side auth user interface
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    domain: string;
  };
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth response interface
export interface AuthResponse {
  user: AuthUser;
  message: string;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    const { email, password } = credentials;

    // Find user with organization data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${user.id}`);
      throw new AppError("Invalid email or password", 401);
    }

    // Prepare user data for token
    const userData: UserTokenData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId || undefined,
    };

    // Generate JWT token
    const token = generateToken(userData);

    // Set session cookie
    const cookieConfig = getSessionCookieConfig();
    const cookieStore = await cookies();
    cookieStore.set(cookieConfig.name, token, cookieConfig.options);

    // Prepare response user data
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId || undefined,
      organization: user.organization || undefined,
    };

    logger.info(`User successfully logged in: ${user.id}`);

    return {
      user: authUser,
      message: "Login successful",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Authentication error: ${error}`);
    throw new AppError("Authentication failed", 500);
  }
}

/**
 * Get current session from request cookies
 */
export async function getCurrentSession(): Promise<AuthUser | null> {
  try {
    const cookieConfig = getSessionCookieConfig();
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieConfig.name)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      // Invalid token, clear the cookie
      const cookieStore = await cookies();
      cookieStore.delete(cookieConfig.name);
      return null;
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!user) {
      // User doesn't exist anymore, clear the cookie
      const cookieStore = await cookies();
      cookieStore.delete(cookieConfig.name);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId || undefined,
      organization: user.organization || undefined,
    };
  } catch (error) {
    logger.error(`Session validation error: ${error}`);
    return null;
  }
}

/**
 * Logout user by clearing session cookie
 */
export async function logoutUser(): Promise<{ message: string }> {
  try {
    const cookieConfig = getSessionCookieConfig();

    // Get current session for logging
    const session = await getCurrentSession();
    if (session) {
      logger.info(`User logged out: ${session.id}`);
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete(cookieConfig.name);

    return {
      message: "Logout successful",
    };
  } catch (error) {
    logger.error(`Logout error: ${error}`);
    throw new AppError("Logout failed", 500);
  }
}

/**
 * Verify user has required permission
 */
export function verifyPermission(
  userPayload: JWTPayload,
  requiredPermission: string
): boolean {
  return userPayload.permissions.includes(requiredPermission);
}

/**
 * Verify user has any of the required permissions
 */
export function verifyAnyPermission(
  userPayload: JWTPayload,
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission =>
    userPayload.permissions.includes(permission)
  );
}

/**
 * Generate secure reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash reset token for database storage
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate password reset token and send email
 */
export async function initiatePasswordReset(
  email: string
): Promise<{ message: string }> {
  try {
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage =
      "If an account with that email exists, you will receive a password reset link";

    if (!user) {
      logger.warn(
        `Password reset attempted for non-existent email: ${normalizedEmail}`
      );
      return { message: successMessage };
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate new reset token
    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store hashed token in database
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    // Generate reset URL
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send reset email
    await emailService.sendPasswordResetEmail(
      normalizedEmail,
      resetUrl,
      user.firstName
    );

    logger.info(`Password reset token generated for user: ${user.id}`);

    return { message: successMessage };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Password reset initiation error: ${error}`);
    throw new AppError("Failed to initiate password reset", 500);
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  email: string,
  newPassword: string
): Promise<{ message: string }> {
  try {
    const normalizedEmail = email.toLowerCase();
    const hashedToken = hashToken(token);

    // Find valid reset token
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        token: hashedToken,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetTokenRecord) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { used: true },
      }),
    ]);

    // Send confirmation email
    await emailService.sendPasswordResetConfirmationEmail(
      normalizedEmail,
      user.firstName
    );

    logger.info(`Password successfully reset for user: ${user.id}`);

    return { message: "Password has been successfully reset" };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Password reset error: ${error}`);
    throw new AppError("Failed to reset password", 500);
  }
}

/**
 * Clean up expired reset tokens (should be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired/used reset tokens`);
    }
  } catch (error) {
    logger.error(`Token cleanup error: ${error}`);
  }
}

/**
 * Get session from request headers (for API routes)
 */
export function getSessionFromHeaders(request: Request): JWTPayload | null {
  try {
    // Try to get from Authorization header first
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return verifyToken(token);
    }

    // Try to get from cookie header
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const cookieConfig = getSessionCookieConfig();
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>
      );

      const token = cookies[cookieConfig.name];
      if (token) {
        return verifyToken(token);
      }
    }

    return null;
  } catch (error) {
    logger.error(`Session extraction error: ${error}`);
    return null;
  }
}
