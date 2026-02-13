"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { SkillArionLogo } from "@/components/skillarion-logo"

export default function Verify2FAPage() {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")

  function handleVerify() {
    if (otp.length !== 6) return
    setIsVerifying(true)
    setError("")
    setTimeout(() => {
      setIsVerifying(false)
      // Mock: show error for demo
      if (otp !== "123456") {
        setError("Invalid verification code. Please try again.")
      }
    }, 1500)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      {/* Logo */}
      <SkillArionLogo />

      {/* Shield icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-10 w-10 text-primary" />
      </div>

      {/* Content */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Two-factor authentication</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Enter the 6-digit code from your authenticator app to verify your identity.
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex flex-col items-center gap-4">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Verify Button */}
      <Button
        size="lg"
        className="h-12 w-full text-base font-semibold"
        disabled={otp.length !== 6 || isVerifying}
        onClick={handleVerify}
      >
        {isVerifying ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Verifying...
          </span>
        ) : (
          "Verify Code"
        )}
      </Button>

      {/* Help text */}
      <div className="w-full rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {"Lost access to your authenticator? Contact your admin at "}
          <span className="font-medium text-foreground">admin@skillariondevelopment.in</span>
          {" for assistance."}
        </p>
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
