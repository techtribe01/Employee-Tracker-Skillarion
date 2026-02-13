"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ArrowLeft,
  RefreshCw,
  Mail,
  Briefcase,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingUsers, approveUser, rejectUser } from "@/lib/auth-actions"
import { getAdminManualRequests, reviewManualRequest } from "@/lib/attendance-actions"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  department: string | null
  role: string
  status: string
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
  }
}

function UserCard({
  profile,
  onApprove,
  onReject,
  isActioning,
}: {
  profile: Profile
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isActioning: boolean
}) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown"
  const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-sm font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{fullName}</h3>
            <StatusBadge status={profile.status} />
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            {profile.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
              </div>
            )}
            {profile.department && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{profile.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {profile.status === "pending_approval" && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 flex-1 gap-1.5 text-xs"
                onClick={() => onApprove(profile.id)}
                disabled={isActioning}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 gap-1.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/5"
                onClick={() => onReject(profile.id)}
                disabled={isActioning}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "approve" | "reject"
    userId: string
    userName: string
  }>({ open: false, type: "approve", userId: "", userName: "" })

  const loadProfiles = useCallback(async () => {
    setIsLoading(true)
    const result = await getPendingUsers()

    if (result.error) {
      if (result.error === "Unauthorized") {
        router.push("/dashboard")
        return
      }
      setError(result.error)
    } else if (result.profiles) {
      setProfiles(result.profiles)
    }
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function handleAction(type: "approve" | "reject", userId: string) {
    setActioningId(userId)
    const result = type === "approve" ? await approveUser(userId) : await rejectUser(userId)

    if (result.error) {
      setError(result.error)
    } else {
      // Reload profiles
      await loadProfiles()
    }
    setActioningId(null)
    setConfirmDialog({ open: false, type: "approve", userId: "", userName: "" })
  }

  function openConfirmDialog(type: "approve" | "reject", profile: Profile) {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "this user"
    setConfirmDialog({ open: true, type, userId: profile.id, userName: name })
  }

  const pending = profiles.filter((p) => p.status === "pending_approval")
  const approved = profiles.filter((p) => p.status === "approved")
  const rejected = profiles.filter((p) => p.status === "rejected")

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to dashboard</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Users & attendance</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={loadProfiles}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <span className="text-lg font-bold text-foreground">{pending.length}</span>
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <span className="text-lg font-bold text-foreground">{approved.length}</span>
          <span className="text-[10px] text-muted-foreground">Approved</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <span className="text-lg font-bold text-foreground">{rejected.length}</span>
          <span className="text-[10px] text-muted-foreground">Rejected</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="gap-1 text-[11px]">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1 text-[11px]">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-1 text-[11px]">
            <FileText className="h-3.5 w-3.5" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((profile) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  onApprove={(id) => openConfirmDialog("approve", profile)}
                  onReject={(id) => openConfirmDialog("reject", profile)}
                  isActioning={actioningId === profile.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approved.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Shield className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No approved users yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {approved.map((profile) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  onApprove={() => {}}
                  onReject={() => {}}
                  isActioning={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejected.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <XCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No rejected users</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rejected.map((profile) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  onApprove={() => {}}
                  onReject={() => {}}
                  isActioning={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <ManualRequestsTab />
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "approve" ? "Approve User" : "Reject User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "approve"
                ? `Are you sure you want to approve ${confirmDialog.userName}? They will gain access to the application.`
                : `Are you sure you want to reject ${confirmDialog.userName}? They will not be able to access the application.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmDialog.type, confirmDialog.userId)}
              className={confirmDialog.type === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmDialog.type === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ==================== MANUAL REQUESTS TAB ====================
type ManualRequest = {
  id: string
  user_id: string
  requested_date: string
  clock_in_time: string
  clock_out_time: string
  reason: string
  status: string
  review_notes: string | null
  created_at: string
  profiles?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    department: string | null
  }
}

function ManualRequestsTab() {
  const [requests, setRequests] = useState<ManualRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const result = await getAdminManualRequests("pending")
    if (result.data) {
      setRequests(result.data as ManualRequest[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function handleReview(requestId: string, status: "approved" | "rejected") {
    setActionLoading(true)
    const result = await reviewManualRequest({
      requestId,
      status,
      reviewNotes: reviewNotes.trim() || undefined,
    })
    if (!result.error) {
      setReviewingId(null)
      setReviewNotes("")
      await loadRequests()
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No pending manual entries</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((req) => {
        const name = req.profiles
          ? [req.profiles.first_name, req.profiles.last_name].filter(Boolean).join(" ") || "Unknown"
          : "Unknown"
        const isReviewing = reviewingId === req.id

        return (
          <div key={req.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {req.profiles?.email} {req.profiles?.department ? `- ${req.profiles.department}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning text-[10px]">
                Pending
              </Badge>
            </div>

            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(req.requested_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {new Date(req.clock_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(req.clock_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <p className="mt-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-foreground">
              {req.reason}
            </p>

            {isReviewing ? (
              <div className="mt-3 flex flex-col gap-2">
                <Textarea
                  placeholder="Add review notes (optional)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => handleReview(req.id, "approved")}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs text-destructive border-destructive/20"
                    onClick={() => handleReview(req.id, "rejected")}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => { setReviewingId(null); setReviewNotes("") }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setReviewingId(req.id)}
                >
                  Review
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
