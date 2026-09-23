import { useMemo } from "react"
import createFetchClient from "openapi-fetch"

import type { paths } from "@/api/generated-schema"
import { useAuth } from "@/features/auth/auth-context"

export function useApiClient() {
  const { authenticatedFetch } = useAuth()
  return useMemo(
    () =>
      createFetchClient<paths>({
        baseUrl: new URL("/api", window.location.origin).toString(),
        fetch: (request) => {
          const url = new URL(request.url, window.location.origin)
          return authenticatedFetch(
            `${url.pathname.replace(/^\/api/, "")}${url.search}`,
            {
              method: request.method,
              headers: request.headers,
              signal: request.signal,
            },
          )
        },
      }),
    [authenticatedFetch],
  )
}
