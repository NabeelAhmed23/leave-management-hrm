import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type RegisterResponse } from "@/services/api/auth.api";
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/schemas/auth.schema";
import { AppError } from "@/utils/app-error";
import { useAuth, type AuthUser } from "@/components/auth/auth-provider";

// Query Keys
export const authQueryKeys = {
  all: ["auth"] as const,
  profile: () => [...authQueryKeys.all, "profile"] as const,
} as const;

// Register Mutation Hook
export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterInput): Promise<RegisterResponse> =>
      authApi.register(data),
  });
}

// Login Mutation Hook
export function useLoginMutation() {
  const router = useRouter();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new AppError(result.message || "Login failed", response.status);
      }

      return result;
    },
    onSuccess: data => {
      // Update auth context with user data
      if (data.success && data.user) {
        setUser(data.user);
      }

      // Redirect to dashboard
      router.push("/");
      router.refresh();
    },
  });
}

// Logout Mutation Hook
export function useLogoutMutation() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new AppError(result.message || "Logout failed", response.status);
      }

      return result;
    },
    onSuccess: () => {
      // Use auth context logout (which handles redirect)
      logout();
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      logout();
    },
  });
}

// Forgot Password Mutation Hook
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => authApi.forgotPassword(data),
  });
}

// Reset Password Mutation Hook
export function useResetPasswordMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordInput) => authApi.resetPassword(data),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

// Verify Email Mutation Hook
export function useVerifyEmailMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

// Resend Verification Mutation Hook
export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
  });
}

// Get current user from auth context
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

// Check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Check if user has specific permission
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth();
  // For now, we'll implement a basic role-based check
  // You can enhance this with more granular permissions later
  if (!user) return false;

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ["*"], // All permissions
    HR_ADMIN: ["users:read", "users:create", "leaves:approve", "reports:read"],
    MANAGER: ["leaves:approve", "reports:read"],
    EMPLOYEE: ["leaves:create", "leaves:read"],
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes("*") || userPermissions.includes(permission);
}
