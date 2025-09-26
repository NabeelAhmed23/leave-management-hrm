import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// JWT Payload Interface
export interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// User data interface for token generation
export interface UserTokenData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId?: string;
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "organizations:create",
    "organizations:read",
    "organizations:update",
    "organizations:delete",
    "leaves:create",
    "leaves:read",
    "leaves:update",
    "leaves:delete",
    "leaves:approve",
    "reports:read",
    "settings:update",
  ],
  HR_ADMIN: [
    "users:create",
    "users:read",
    "users:update",
    "leaves:read",
    "leaves:approve",
    "leaves:update",
    "reports:read",
    "settings:update",
  ],
  MANAGER: ["users:read", "leaves:read", "leaves:approve", "reports:read"],
  EMPLOYEE: ["leaves:create", "leaves:read", "leaves:update"],
};

/**
 * Generate JWT token for user authentication
 */
export function generateToken(userData: UserTokenData): string {
  const permissions = ROLE_PERMISSIONS[userData.role] || [];

  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    userId: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    organizationId: userData.organizationId,
    permissions,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string | number,
    issuer: "leave-management-hrm",
    audience: "leave-management-users",
  } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "leave-management-hrm",
      audience: "leave-management-users",
    } as jwt.VerifyOptions) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission =>
    userPermissions.includes(permission)
  );
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );
}

/**
 * Get cookie configuration for session token
 */
export function getSessionCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: "session-token",
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    },
  };
}
