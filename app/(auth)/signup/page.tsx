"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Briefcase, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SkillArionLogo } from "@/components/skillarion-logo"
import { signUp } from "@/lib/auth-actions"

const DOMAIN = "@skillariondevelopment.in"

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Content",
  "Sales",
  "Operations",
  "Human Resources",
]

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  const strength = checks.filter((c) => c.met).length

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength
                ? strength <= 1
                  ? "bg-destructive"
                  : strength <= 2
                    ? "bg-warning"
                    : strength <= 3
                      ? "bg-info"
                      : "bg-success"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            <div
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                check.met ? "bg-success" : "bg-muted"
              }`}
            >
              {check.met && <Check className="h-2 w-2 text-success-foreground" />}
            </div>
            <span
              className={`text-[11px] ${
                check.met ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailPrefix: "",
    department: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!formData.department) {
      setError("Please select a department")
      return
    }

    setIsLoading(true)

    const result = await signUp({
      email: `${formData.emailPrefix}${DOMAIN}`,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      department: formData.department,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    // Redirect to verify email page
    router.push(`/verify-email?email=${encodeURIComponent(`${formData.emailPrefix}${DOMAIN}`)}`)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <SkillArionLogo />
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join SkillArion Development team
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              First name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="First"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Last name
            </Label>
            <Input
              id="lastName"
              placeholder="Last"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="h-12"
              required
            />
          </div>
        </div>

        {/* Email */}
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
                value={formData.emailPrefix}
                onChange={(e) => updateField("emailPrefix", e.target.value)}
                className="rounded-r-none border-r-0 pl-10 h-12"
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

        {/* Department */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="department" className="text-sm font-medium text-foreground">
            Department
          </Label>
          <Select
            value={formData.department}
            onValueChange={(v) => updateField("department", v)}
          >
            <SelectTrigger className="h-12">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select department" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="pl-10 pr-10 h-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formData.password && <PasswordStrength password={formData.password} />}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="mt-1 h-12 w-full text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
