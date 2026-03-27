import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    throw new Error(
      "Rork did not set EXPO_PUBLIC_RORK_API_BASE_URL, please use support",
    );
  }

  return url;
};

const fetchWithFallback = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      console.error(`[tRPC] HTTP error ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error("[tRPC] Fetch failed - backend may be unavailable:", error);
    throw error;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: fetchWithFallback,
    }),
  ],
});
