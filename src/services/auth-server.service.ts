import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
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
