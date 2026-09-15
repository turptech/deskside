import { BrowserRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
