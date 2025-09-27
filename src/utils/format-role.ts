import { Role } from "@prisma/client";

/**
 * Formats a role from snake_case to proper display format
 * @param role - The role in snake_case format (e.g., HR_ADMIN, SUPER_ADMIN)
 * @returns Formatted role string (e.g., HR Admin, Super Admin)
 */
export function formatRole(role: Role): string {
  if (!role) return "";

  // Handle special cases
  const specialCases: Record<string, string> = {
    HR_ADMIN: "HR Admin",
    SUPER_ADMIN: "Super Admin",
  };

  if (specialCases[role]) {
    return specialCases[role];
  }

  // For other roles, convert snake_case to Title Case
  return role
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
