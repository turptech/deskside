import { LoaderCircle, LockKeyhole } from "lucide-react"
import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AuthLayout } from "@/features/auth/auth-layout"
import { useAuth } from "@/features/auth/auth-context"

const LOGIN_ERROR = "Unable to sign in. Check your credentials and try again."

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate("/tickets", { replace: true })
    } catch {
      setPassword("")
      setError(LOGIN_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="shadow-lg shadow-foreground/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl border bg-muted/40">
            <LockKeyhole className="size-5 text-primary" />
          </div>
          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to your service desk workspace.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                aria-describedby={error ? "login-error" : undefined}
                required
              />
            </div>
            {error && (
              <p
                id="login-error"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Authentication is provided by the local Mock PSA API.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
