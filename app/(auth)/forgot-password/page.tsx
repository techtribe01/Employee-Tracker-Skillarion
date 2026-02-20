"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SkillArionLogo } from "@/components/skillarion-logo"
import { forgotPassword } from "@/lib/auth-actions"

const DOMAIN = "@skillariondevelopment.in"

export default function ForgotPasswordPage() {
  const [emailPrefix, setEmailPrefix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await forgotPassword(`${emailPrefix}${DOMAIN}`)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setIsSent(true)
  }

  if (isSent) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {"We've sent a password reset link to "}
            <span className="font-medium text-foreground">
              {emailPrefix}
              {DOMAIN}
            </span>
          </p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {"Didn't receive the email? Check your spam folder or make sure you entered the correct email address."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => {
              setIsSent(false)
              setEmailPrefix("")
            }}
          >
            Try a different email
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="h-12 w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <SkillArionLogo />
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {"Enter your work email and we'll send you a reset link"}
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
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

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Sending link...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send Reset Link
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  )
}
