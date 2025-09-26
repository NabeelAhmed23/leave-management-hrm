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
import { logger } from "@/services/logger.service";

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
    onSuccess: data => {
      // Optionally handle success (e.g., show success message)
      logger.info(`Registration successful: ${data.message}`);
    },
    onError: (error: AppError) => {
      logger.error(`Registration failed: ${error.message}`);
    },
  });
}

// Login Mutation Hook
export function useLoginMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: data => {
      // Store token if provided
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token);
      }

      // Set user data in cache
      queryClient.setQueryData(authQueryKeys.profile(), data.user);

      // Redirect to dashboard
      router.push("/");
      router.refresh();
    },
    onError: (error: AppError) => {
      logger.error(`Login failed: ${error.message}`);
    },
  });
}

// Logout Mutation Hook
export function useLogoutMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear token
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
      }

      // Clear all cached data
      queryClient.clear();

      // Redirect to login
      router.push("/login");
    },
    onError: (error: AppError) => {
      logger.error(`Logout failed: ${error.message}`);
      // Even if logout fails on server, clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
      }
      queryClient.clear();
      router.push("/login");
    },
  });
}

// Forgot Password Mutation Hook
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => authApi.forgotPassword(data),
    onSuccess: data => {
      logger.info(`Password reset email sent: ${data.message}`);
    },
    onError: (error: AppError) => {
      logger.error(`Forgot password failed: ${error.message}`);
    },
  });
}

// Reset Password Mutation Hook
export function useResetPasswordMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordInput) => authApi.resetPassword(data),
    onSuccess: data => {
      logger.info(`Password reset successful: ${data.message}`);
      router.push("/login");
    },
    onError: (error: AppError) => {
      logger.error(`Password reset failed: ${error.message}`);
    },
  });
}

// Verify Email Mutation Hook
export function useVerifyEmailMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: data => {
      logger.info(`Email verified: ${data.message}`);
      router.push("/login");
    },
    onError: (error: AppError) => {
      logger.error(`Email verification failed: ${error.message}`);
    },
  });
}

// Resend Verification Mutation Hook
export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: data => {
      logger.info(`Verification email sent: ${data.message}`);
    },
    onError: (error: AppError) => {
      logger.error(`Resend verification failed: ${error.message}`);
    },
  });
}

// Get User Profile Query Hook
export function useProfile() {
  return useQuery({
    queryKey: authQueryKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem("authToken"),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: { status?: number }) => {
      // Don't retry on authentication errors
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Custom hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { data: user, isLoading } = useProfile();

  if (isLoading) return false;
  return !!user;
}
