"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Role } from "@prisma/client";
import axios from "axios";
import { apiClient } from "@/lib/axios";
import { AppError } from "@/utils/app-error";

// Auth User Interface
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employee?: {
    id: string;
    employeeNumber: string;
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

// API Response Types
interface SessionResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

// Auth Context Interface
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  refetchSession: () => void;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Create a separate axios instance for session checks without interceptors
const sessionClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// API Functions
const fetchSession = async (): Promise<SessionResponse> => {
  try {
    // Use session client without interceptors to avoid redirect loops
    const response = await sessionClient.get<SessionResponse>("/auth/session");
    return response.data;
  } catch (error) {
    // Handle any errors gracefully without throwing
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return { success: false, message: "Not authenticated" };
      }
    }
    // For any other errors, return a failed session response
    return { success: false, message: "Session check failed" };
  }
};

const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    throw AppError.from(error);
  }
};

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Session query using React Query
  const {
    data: sessionData,
    isLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry auth checks
    refetchOnWindowFocus: false, // Disable automatic refetch on focus
    refetchOnReconnect: false, // Disable automatic refetch on reconnect
    refetchOnMount: "always", // Only refetch when component mounts
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      // Always clear local state regardless of success or failure
      queryClient.clear();
      setUser(null);
      // Use replace to prevent back button issues
      window.location.replace("/login");
    },
  });

  // Update user state when session data changes
  useEffect(() => {
    if (sessionData?.success && sessionData.user) {
      setUser(sessionData.user);
    } else {
      setUser(null);
    }
  }, [sessionData]);

  const logout = (): void => {
    logoutMutation.mutate();
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    logout,
    refetchSession: () => {
      refetchSession();
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
