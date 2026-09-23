import { Navigate, Route, Routes } from "react-router"
import { useEffect, useRef, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AssetDetailPage } from "@/features/assets/asset-detail-page"
import { AssetDirectoryPage } from "@/features/assets/asset-directory-page"
import { AppShell } from "@/components/layout/app-shell"
import { CompanyDetailPage } from "@/features/companies/company-detail-page"
import { CompanyDirectoryPage } from "@/features/companies/company-directory-page"
import { ContactDetailPage } from "@/features/contacts/contact-detail-page"
import { ContactDirectoryPage } from "@/features/contacts/contact-directory-page"
import { LoginPage } from "@/features/auth/login-page"
import { LogoutPage } from "@/features/auth/logout-page"
import {
  RequireAuthentication,
  RequireUnauthenticated,
} from "@/features/auth/session-gates"
import { ArticleDetailPage } from "@/features/knowledge-articles/article-detail-page"
import { ArticleDirectoryPage } from "@/features/knowledge-articles/article-directory-page"
import { SiteDetailPage } from "@/features/sites/site-detail-page"
import { TicketQueuePage } from "@/features/tickets/ticket-queue-page"
import { TicketDetailPage } from "@/features/tickets/ticket-detail-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { useAuth } from "@/features/auth/auth-context"

export function AppRoutes() {
  const { status, user } = useAuth()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  )
  const previousUserId = useRef(user?.id)

  useEffect(() => {
    if (status !== "authenticated" || previousUserId.current !== user?.id)
      queryClient.clear()
    previousUserId.current = status === "authenticated" ? user?.id : undefined
  }, [queryClient, status, user?.id])

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<RequireUnauthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/logout" element={<LogoutPage />} />
        <Route element={<RequireAuthentication />}>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route element={<AppShell />}>
            <Route path="/tickets" element={<TicketQueuePage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="/companies" element={<CompanyDirectoryPage />} />
            <Route
              path="/companies/:companyId"
              element={<CompanyDetailPage />}
            />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />
            <Route path="/contacts" element={<ContactDirectoryPage />} />
            <Route
              path="/contacts/:contactId"
              element={<ContactDetailPage />}
            />
            <Route path="/assets" element={<AssetDirectoryPage />} />
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
            <Route
              path="/knowledge-articles"
              element={<ArticleDirectoryPage />}
            />
            <Route
              path="/knowledge-articles/:articleId"
              element={<ArticleDetailPage />}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  )
}
