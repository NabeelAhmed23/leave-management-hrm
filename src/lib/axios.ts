import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AppError } from "@/utils/app-error";

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available (for future use)
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(AppError.from(error));
  }
);

const throwErrorWithSwitch = (status: number, data: unknown) => {
  switch (status) {
    case 401:
      // Handle unauthorized - only clear token for authenticated requests
      // Don't redirect for login attempts (let the component handle the error)
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (token) {
          // Only redirect if user was previously authenticated
          localStorage.removeItem("authToken");
          window.location.href = "/auth/login";
        }
      }
      // Always throw error to let React Query handle it
      throw new AppError(
        (data as { message?: string })?.message || "Unauthorized",
        401,
        data as Record<string, unknown>
      );
    case 403:
      throw new AppError("Access forbidden", 403);
    case 404:
      throw new AppError("Resource not found", 404);
    case 409:
      throw new AppError(
        (data as { message?: string })?.message || "Conflict occurred",
        409,
        data as Record<string, unknown>
      );
    case 422:
      throw new AppError(
        (data as { message?: string })?.message || "Validation failed",
        422,
        data as Record<string, unknown>
      );
    case 429:
      throw new AppError("Too many requests. Please try again later.", 429);
    case 500:
      throw new AppError("Internal server error", 500);
    default:
      throw new AppError(
        (data as { message?: string })?.message ||
          "An unexpected error occurred",
        status,
        data as Record<string, unknown>
      );
  }
};

const errorFunction = (error: AxiosError) => {
  // Handle common error cases
  if (error.response) {
    const { status, data } = error.response;
    throwErrorWithSwitch(status, data);
  } else if (error.request) {
    // Network error
    throw new AppError("Network error. Please check your connection.", 0, {
      originalError: error.message,
    });
  }

  // Convert to AppError for consistent error handling
  return Promise.reject(AppError.from(error));
};

// Response interceptor
apiClient.interceptors.response.use((response: AxiosResponse) => {
  return response;
}, errorFunction);

// Helper function to handle API responses with proper typing
export async function apiRequest<T = unknown>(
  config: InternalAxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    throw AppError.from(error);
  }
}

export default apiClient;
