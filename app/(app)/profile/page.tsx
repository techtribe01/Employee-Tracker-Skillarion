"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Briefcase,
  Phone,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getProfile, signOut } from "@/lib/auth-actions"

const MENU_ITEMS = [
  { label: "Edit Profile", icon: User, href: "#" },
  { label: "Security & 2FA", icon: Shield, href: "#" },
  { label: "Notifications", icon: Bell, href: "#" },
  { label: "Help & Support", icon: HelpCircle, href: "#" },
]

type ProfileData = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  department: string | null
  role: string
  status: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getProfile()
      if (result.profile) {
        setProfile(result.profile)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 pt-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown User"
    : "Unknown User"
  const initials = profile
    ? [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"
    : "?"

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      {/* Profile card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground">{fullName}</h1>
          <p className="text-sm text-muted-foreground capitalize">{profile?.role || "Employee"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            profile?.status === "approved"
              ? "bg-success/10 text-success"
              : profile?.status === "pending_approval"
                ? "bg-warning/10 text-warning"
                : "bg-destructive/10 text-destructive"
          }`}>
            {profile?.status === "approved" ? "Active" : profile?.status === "pending_approval" ? "Pending" : "Rejected"}
          </span>
          {profile?.department && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {profile.department}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Contact Information</h2>
        <div className="flex flex-col gap-4">
          {[
            { icon: Mail, label: "Email", value: profile?.email || "Not set" },
            { icon: Phone, label: "Phone", value: profile?.phone || "Not set" },
            { icon: Briefcase, label: "Department", value: profile?.department || "Not set" },
            { icon: Shield, label: "Role", value: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Employee" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-2xl border border-border bg-card">
        {MENU_ITEMS.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={item.label}>
              <button className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {i < MENU_ITEMS.length - 1 && <Separator />}
            </div>
          )
        })}
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="h-12 w-full gap-2 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
