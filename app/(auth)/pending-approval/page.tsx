"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, ArrowLeft, RefreshCw, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillArionLogo } from "@/components/skillarion-logo"
import { checkApprovalStatus, signOut } from "@/lib/auth-actions"

const STEPS = [
  { label: "Account created", done: true },
  { label: "Email verified", done: true },
  { label: "Admin review", done: false, active: true },
  { label: "Access granted", done: false },
]

export default function PendingApprovalPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function handleCheckStatus() {
    setIsChecking(true)
    setStatusMessage("")

    const result = await checkApprovalStatus()

    if (result.status === "approved") {
      setStatusMessage("Your account has been approved! Redirecting...")
      setTimeout(() => router.push("/dashboard"), 1500)
    } else if (result.status === "rejected") {
      setStatusMessage("Your account has been rejected. Please contact admin.")
    } else {
      setStatusMessage("Still pending approval. Please check back later.")
    }

    setIsChecking(false)
  }

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      {/* Logo */}
      <SkillArionLogo />

      {/* Clock icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10">
        <Clock className="h-10 w-10 text-warning" />
      </div>

      {/* Content */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending approval</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your account has been created and is awaiting admin approval. You will receive an email once your account is approved.
        </p>
      </div>

      {/* Progress steps */}
      <div className="w-full rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    step.done
                      ? "border-success bg-success"
                      : step.active
                        ? "border-warning bg-warning/10"
                        : "border-muted bg-muted"
                  }`}
                >
                  {step.done ? (
                    <svg className="h-3.5 w-3.5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.active ? (
                    <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-6 w-0.5 ${
                      step.done ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`pt-1 text-sm ${
                  step.done
                    ? "font-medium text-foreground"
                    : step.active
                      ? "font-medium text-warning"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
                {step.active && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    In progress
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="w-full rounded-lg border border-border bg-card p-3">
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <Button
          variant="outline"
          className="h-12 w-full gap-2"
          onClick={handleCheckStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking status...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Check approval status
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="w-full rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {"Approval typically takes 1-2 business days. If you haven't heard back, contact "}
          <span className="font-medium text-foreground">admin@skillariondevelopment.in</span>
        </p>
      </div>

      {/* Footer links */}
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Sign in
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
