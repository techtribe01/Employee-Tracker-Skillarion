"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SkillArionLogo } from "@/components/skillarion-logo"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetAdminPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleReset() {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "manoj@skillariondevelopment.in",
          newPassword: "TechTribe01",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Password reset successful! You can now login with TechTribe01",
        })
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to reset password",
        })
      }
    } catch (error) {
      console.error("[v0] Reset error:", error)
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <SkillArionLogo />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Reset Admin Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset password for manoj@skillariondevelopment.in
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {message && (
            <div
              className={`flex items-center gap-3 rounded-lg p-4 ${
                message.type === "success"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> manoj@skillariondevelopment.in
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>New Password:</strong> TechTribe01
            </p>
          </div>

          <Button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Resetting..." : "Reset Password to TechTribe01"}
          </Button>

          {message?.type === "success" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = "/login"}
            >
              Go to Login
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
