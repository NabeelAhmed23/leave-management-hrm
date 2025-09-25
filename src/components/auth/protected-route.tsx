"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@prisma/client";

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
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, requiredRole, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!session) {
    return <div>{fallback || "Redirecting to login..."}</div>;
  }

  if (requiredRole && !hasRequiredRole(session.user.role, requiredRole)) {
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
