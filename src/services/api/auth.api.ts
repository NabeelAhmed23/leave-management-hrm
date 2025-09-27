import { apiClient } from "@/lib/axios";
import { Role } from "@prisma/client";
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/schemas/auth.schema";

// API Response Types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employee?: {
    id: string;
    employeeId: string;
    role: Role;
    organizationId: string;
    organization: {
      id: string;
      name: string;
      domain: string;
    };
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Auth API Service
export const authApi = {
  // Register a new user
  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      data
    );
    return response.data;
  },

  // Login user
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  // Request password reset
  forgotPassword: async (
    data: ForgotPasswordInput
  ): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  },

  // Reset password with token
  resetPassword: async (
    data: ResetPasswordInput & { email?: string }
  ): Promise<ResetPasswordResponse> => {
    const { email, ...resetData } = data;
    const url = email
      ? `/auth/reset-password?email=${encodeURIComponent(email)}`
      : "/auth/reset-password";

    const response = await apiClient.post<ResetPasswordResponse>(
      url,
      resetData
    );
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/verify-email",
      {
        token,
      }
    );
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/resend-verification",
      { email }
    );
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>("/auth/refresh");
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<AuthUser> => {
    const response = await apiClient.get<{ user: AuthUser }>("/auth/profile");
    return response.data.user;
  },
};
