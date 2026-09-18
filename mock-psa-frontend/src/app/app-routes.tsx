import { Navigate, Route, Routes } from "react-router"

import { AppShell } from "@/components/layout/app-shell"
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
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
