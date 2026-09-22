import { LoaderCircle, RotateCw } from "lucide-react"
import { Navigate, Outlet } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { AuthLayout } from "@/features/auth/auth-layout"

function SessionLoading() {
  return (
    <AuthLayout>
      <Card className="shadow-lg shadow-foreground/5">
        <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
          <LoaderCircle className="size-6 animate-spin text-primary" />
          <h1 className="mt-4 text-sm font-medium">Checking your session</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Connecting to the DeskSide API…
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

function SessionUnavailable() {
  const { retrySessionValidation, signOut } = useAuth()
  return (
    <AuthLayout>
      <Card className="shadow-lg shadow-foreground/5">
        <CardHeader className="text-center">
          <CardTitle>
            <h1 className="text-xl font-semibold">Unable to verify session</h1>
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            DeskSide could not reach the API. Your saved session has not been
            removed.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button onClick={retrySessionValidation}>
            <RotateCw />
            Try again
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign in again
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export function RequireAuthentication() {
  const { status } = useAuth()
  if (status === "checking") return <SessionLoading />
  if (status === "unavailable") return <SessionUnavailable />
  if (status === "unauthenticated") return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireUnauthenticated() {
  const { status } = useAuth()
  if (status === "checking") return <SessionLoading />
  if (status === "unavailable") return <SessionUnavailable />
  if (status === "authenticated") return <Navigate to="/tickets" replace />
  return <Outlet />
}
