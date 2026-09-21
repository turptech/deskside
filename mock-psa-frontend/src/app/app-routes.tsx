import { Navigate, Route, Routes } from "react-router"

import { AssetDetailPage } from "@/features/assets/asset-detail-page"
import { AssetDirectoryPage } from "@/features/assets/asset-directory-page"
import { AppShell } from "@/components/layout/app-shell"
import { CompanyDetailPage } from "@/features/companies/company-detail-page"
import { CompanyDirectoryPage } from "@/features/companies/company-directory-page"
import { ContactDetailPage } from "@/features/contacts/contact-detail-page"
import { ContactDirectoryPage } from "@/features/contacts/contact-directory-page"
import { ArticleDetailPage } from "@/features/knowledge-articles/article-detail-page"
import { ArticleDirectoryPage } from "@/features/knowledge-articles/article-directory-page"
import { SiteDetailPage } from "@/features/sites/site-detail-page"
import { TicketQueuePage } from "@/features/tickets/ticket-queue-page"
import { TicketDetailPage } from "@/features/tickets/ticket-detail-page"
import { NotFoundPage } from "@/pages/not-found-page"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tickets" replace />} />
      <Route element={<AppShell />}>
        <Route path="/tickets" element={<TicketQueuePage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/companies" element={<CompanyDirectoryPage />} />
        <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
        <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        <Route path="/contacts" element={<ContactDirectoryPage />} />
        <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
        <Route path="/assets" element={<AssetDirectoryPage />} />
        <Route path="/assets/:assetId" element={<AssetDetailPage />} />
        <Route path="/knowledge-articles" element={<ArticleDirectoryPage />} />
        <Route
          path="/knowledge-articles/:articleId"
          element={<ArticleDetailPage />}
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
