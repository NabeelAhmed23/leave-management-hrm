"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps): React.ReactElement | null {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
      router.push("/unauthorized");
      return;
    }
  }, [user, isLoading, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <div>{fallback || "Redirecting to login..."}</div>;
  }

  if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
    return <div>{fallback || "Unauthorized access"}</div>;
  }

  return <>{children}</>;
}

function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    EMPLOYEE: 1,
    MANAGER: 2,
    HR_ADMIN: 3,
    SUPER_ADMIN: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
