"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({
  children,
}: QueryProviderProps): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time before data is considered stale
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Time before cached data is garbage collected
            gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
            // Retry failed requests
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408, 429
              const status = (error as { status?: number })?.status;
              if (status && status >= 400 && status < 500) {
                if (status === 408 || status === 429) {
                  return failureCount < 2;
                }
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Delay between retries (exponential backoff)
            retryDelay: attemptIndex =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Don't refetch on reconnect in development
            refetchOnReconnect: process.env.NODE_ENV === "production",
          },
          mutations: {
            // Retry failed mutations
            retry: (failureCount, error) => {
              // Don't retry client errors (4xx) except specific cases
              const status = (error as { status?: number })?.status;
              if (status && status >= 400 && status < 500) {
                return false;
              }
              // Retry server errors up to 2 times
              return failureCount < 2;
            },
            // Delay between mutation retries
            retryDelay: attemptIndex =>
              Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools only in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
