import { BrowserRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth/auth-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <TooltipProvider delayDuration={150}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
