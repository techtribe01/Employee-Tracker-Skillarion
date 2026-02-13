"use client"

import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Phone,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const MENU_ITEMS = [
  { label: "Edit Profile", icon: User, href: "#" },
  { label: "Security & 2FA", icon: Shield, href: "#" },
  { label: "Notifications", icon: Bell, href: "#" },
  { label: "Help & Support", icon: HelpCircle, href: "#" },
]

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      {/* Profile card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl font-bold text-primary">RK</span>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground">Rahul Kumar</h1>
          <p className="text-sm text-muted-foreground">Full Stack Developer</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            Active
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Engineering
          </span>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Contact Information</h2>
        <div className="flex flex-col gap-4">
          {[
            { icon: Mail, label: "Email", value: "rahul@skillariondevelopment.in" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210" },
            { icon: Briefcase, label: "Department", value: "Engineering" },
            { icon: MapPin, label: "Location", value: "Bangalore, India" },
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
      <Button variant="outline" className="h-12 w-full gap-2 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
