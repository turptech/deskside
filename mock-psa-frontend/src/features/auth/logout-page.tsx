import { ArrowRight, Check } from "lucide-react"
import { useEffect } from "react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthLayout } from "@/features/auth/auth-layout"
import { useAuth } from "@/features/auth/auth-context"

export function LogoutPage() {
  const { signOut } = useAuth()
  useEffect(() => signOut(), [signOut])

  return (
    <AuthLayout>
      <Card className="shadow-lg shadow-foreground/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl border bg-muted/40">
            <Check className="size-5 text-primary" />
          </div>
          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight">
              You’re signed out
            </h1>
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Your DeskSide session has been removed from this browser tab.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/login">
              Return to login
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
