'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SkillArionLogo } from '@/components/skillarion-logo'
import { createClient } from '@/lib/supabase/client'

// Prevent prerendering this page - it requires dynamic interaction
export const dynamic = 'force-dynamic'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if user is authenticated with recovery token
    const checkAuth = async () => {
      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Session expired. Please request a new password reset link.')
      }
    }
    checkAuth()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    try {
      const supabase = await createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        console.error('[v0] Password update error:', updateError)
        setError(updateError.message || 'Failed to update password')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      console.error('[v0] Error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your password has been successfully reset. Redirecting to login...
          </p>
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
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Enter your new password below
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
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-password"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="show-password" className="text-sm font-medium text-foreground cursor-pointer">
            Show password
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base font-semibold"
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Updating password...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Update Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
