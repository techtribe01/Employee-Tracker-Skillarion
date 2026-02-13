"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillArionLogo } from "@/components/skillarion-logo"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  function handleResend() {
    setIsResending(true)
    setTimeout(() => {
      setIsResending(false)
      setResendCount((prev) => prev + 1)
    }, 1500)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      {/* Logo */}
      <SkillArionLogo />

      {/* Mail icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Mail className="h-10 w-10 text-primary" />
      </div>

      {/* Content */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {"We've sent a verification link to your work email. Click the link to verify your account."}
        </p>
      </div>

      {/* Steps */}
      <div className="w-full rounded-xl border border-border bg-card p-5">
        <ol className="flex flex-col gap-3 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span className="pt-0.5">Open your email inbox</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span className="pt-0.5">Click the verification link</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span className="pt-0.5">Wait for admin approval</span>
          </li>
        </ol>
      </div>

      {/* Resend */}
      <div className="flex w-full flex-col gap-3">
        <Button
          variant="outline"
          className="h-12 w-full gap-2"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
        {resendCount > 0 && (
          <p className="text-xs text-success">
            Verification email resent successfully!
          </p>
        )}
      </div>

      {/* Footer */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  )
}
