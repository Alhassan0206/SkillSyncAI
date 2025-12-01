import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Cache for CSRF token
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const res = await fetch('/api/csrf-token', {
    credentials: 'include',
  });

  if (res.ok) {
    const data = await res.json();
    csrfToken = data.token;
    return csrfToken;
  }

  return '';
}

// Clear CSRF token (useful after logout)
export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) {
      headers["x-csrf-token"] = token;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If CSRF validation failed, clear cached token and retry once
  if (res.status === 403) {
    const text = await res.clone().text();
    if (text.includes('CSRF')) {
      csrfToken = null;
      const newToken = await getCsrfToken();
      if (newToken) {
        headers["x-csrf-token"] = newToken;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        await throwIfResNotOk(retryRes);
        return retryRes;
      }
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
