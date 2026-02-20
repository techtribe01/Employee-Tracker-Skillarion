"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SkillArionLogo } from "@/components/skillarion-logo"
import { signIn } from "@/lib/auth-actions"

const DOMAIN = "@skillariondevelopment.in"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex w-full max-w-sm flex-col items-center gap-4 pt-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackError = searchParams.get("error")

  const [showPassword, setShowPassword] = useState(false)
  const [emailPrefix, setEmailPrefix] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(
    callbackError === "auth_callback_error"
      ? "Authentication failed. Please try again."
      : callbackError === "account_rejected"
        ? "Your account has been rejected. Please contact admin."
        : ""
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn({
        email: `${emailPrefix}${DOMAIN}`,
        password,
      })

      // If we get here, there was an error (redirect happens server-side)
      if (result?.error) {
        setError(result.error === "Invalid login credentials"
          ? "Invalid email or password. Please try again."
          : result.error)
        setIsLoading(false)
      }
    } catch (error) {
      // Server action threw an error or redirected
      console.error("[v0] Login error:", error)
      // Redirect is handled server-side, so if we're here it's an unexpected error
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <SkillArionLogo />
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your SkillArion account
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email with domain suffix */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <div className="flex items-center gap-0">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="text"
                placeholder="yourname"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                className="rounded-r-none border-r-0 pl-10 h-12"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex h-12 items-center rounded-r-md border border-l-0 border-input bg-muted px-3">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {DOMAIN}
              </span>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="mt-1 h-12 w-full text-base font-semibold" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
