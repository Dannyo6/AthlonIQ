import { QueryClient } from "@tanstack/react-query";

/**
 * Global in-memory QueryClient for AthlonIQ.
 * Zero persistence to disk or localStorage.
 * Automatically cleared on athlete sign-out.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    },
  },
});
