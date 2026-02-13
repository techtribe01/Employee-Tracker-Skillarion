"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Mail,
  Briefcase,
  Palmtree,
  Stethoscope,
  Ban,
  MessageSquare,
  Users,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getAdminLeaveRequests,
  reviewLeaveRequest,
  getTeamAvailability,
  type LeaveRequestRow,
} from "@/lib/leave-actions"
import { createCompanyEvent, type EventType } from "@/lib/calendar-actions"

const LEAVE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Palmtree; color: string }> = {
  casual: { label: "Casual", icon: Palmtree, color: "text-success" },
  sick: { label: "Sick", icon: Stethoscope, color: "text-warning" },
  earned: { label: "Earned", icon: Briefcase, color: "text-info" },
  unpaid: { label: "Unpaid", icon: Ban, color: "text-muted-foreground" },
  maternity: { label: "Maternity", icon: CalendarDays, color: "text-primary" },
  paternity: { label: "Paternity", icon: CalendarDays, color: "text-primary" },
  compensatory: { label: "Comp Off", icon: Clock, color: "text-info" },
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-warning/20 bg-warning/10 text-warning",
  approved: "border-success/20 bg-success/10 text-success",
  rejected: "border-destructive/20 bg-destructive/10 text-destructive",
  cancelled: "border-muted bg-muted text-muted-foreground",
}

export default function AdminLeavesPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [todayAbsent, setTodayAbsent] = useState<{ first_name: string | null; last_name: string | null; department: string | null }[]>([])
  const [showEventDialog, setShowEventDialog] = useState(false)

  // Company event form
  const [eventTitle, setEventTitle] = useState("")
  const [eventType, setEventType] = useState<EventType>("holiday")
  const [eventDate, setEventDate] = useState("")
  const [eventDesc, setEventDesc] = useState("")
  const [creatingEvent, setCreatingEvent] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [reqResult, availResult] = await Promise.all([
      getAdminLeaveRequests(),
      getTeamAvailability(new Date().toISOString().split("T")[0]),
    ])
    if (reqResult.data) setRequests(reqResult.data)
    if (availResult.data) {
      setTodayAbsent(
        (availResult.data as Array<{ profiles?: { first_name: string | null; last_name: string | null; department: string | null } | null }>)
          .map((l) => ({
            first_name: l.profiles?.first_name || null,
            last_name: l.profiles?.last_name || null,
            department: l.profiles?.department || null,
          }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleReview(requestId: string, status: "approved" | "rejected") {
    setActionLoading(true)
    await reviewLeaveRequest({
      requestId,
      status,
      reviewNotes: reviewNotes.trim() || undefined,
    })
    setReviewingId(null)
    setReviewNotes("")
    setActionLoading(false)
    await loadData()
  }

  async function handleCreateCompanyEvent() {
    if (!eventTitle.trim() || !eventDate) return
    setCreatingEvent(true)
    await createCompanyEvent({
      title: eventTitle.trim(),
      description: eventDesc.trim() || undefined,
      event_type: eventType,
      start_time: new Date(`${eventDate}T00:00:00`).toISOString(),
      all_day: true,
    })
    setEventTitle("")
    setEventType("holiday")
    setEventDate("")
    setEventDesc("")
    setShowEventDialog(false)
    setCreatingEvent(false)
  }

  const pending = requests.filter((r) => r.status === "pending")
  const approved = requests.filter((r) => r.status === "approved")
  const rejected = requests.filter((r) => r.status === "rejected")

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Leave Management</h1>
          <p className="text-xs text-muted-foreground">Review requests & team availability</p>
        </div>
        <div className="flex gap-1.5">
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Company event</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
              <DialogHeader>
                <DialogTitle>Company-Wide Event</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g., Company Holiday" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="meeting">All Hands</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description (optional)</Label>
                  <Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} rows={2} className="mt-1" />
                </div>
                <Button onClick={handleCreateCompanyEvent} disabled={creatingEvent || !eventTitle.trim() || !eventDate}>
                  {creatingEvent ? "Creating..." : "Create Company Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col items-center rounded-xl border border-warning/20 bg-warning/5 px-3 py-3">
          <span className="text-lg font-bold text-warning">{pending.length}</span>
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-success/20 bg-success/5 px-3 py-3">
          <span className="text-lg font-bold text-success">{approved.length}</span>
          <span className="text-[10px] text-muted-foreground">Approved</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-3">
          <span className="text-lg font-bold text-destructive">{rejected.length}</span>
          <span className="text-[10px] text-muted-foreground">Rejected</span>
        </div>
      </div>

      {/* Today's Absences */}
      {todayAbsent.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-warning" />
            <h3 className="text-xs font-semibold text-foreground">On Leave Today ({todayAbsent.length})</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayAbsent.map((person, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-card">
                {[person.first_name, person.last_name].filter(Boolean).join(" ") || "Unknown"}
                {person.department && <span className="ml-1 opacity-60">({person.department})</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-1 text-[11px]">
            <Clock className="h-3.5 w-3.5" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1 text-[11px]">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </TabsTrigger>
        </TabsList>

        {/* Pending */}
        <TabsContent value="pending" className="mt-3">
          {loading ? (
            <LoadingState />
          ) : pending.length === 0 ? (
            <EmptyState icon={Clock} message="No pending leave requests" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {pending.map((req) => (
                <AdminLeaveCard
                  key={req.id}
                  request={req}
                  isReviewing={reviewingId === req.id}
                  reviewNotes={reviewNotes}
                  onStartReview={() => { setReviewingId(req.id); setReviewNotes("") }}
                  onCancelReview={() => setReviewingId(null)}
                  onNotesChange={setReviewNotes}
                  onApprove={() => handleReview(req.id, "approved")}
                  onReject={() => handleReview(req.id, "rejected")}
                  actionLoading={actionLoading}
                  showActions
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved */}
        <TabsContent value="approved" className="mt-3">
          {approved.length === 0 ? (
            <EmptyState icon={CheckCircle2} message="No approved requests" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {approved.map((req) => (
                <AdminLeaveCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected */}
        <TabsContent value="rejected" className="mt-3">
          {rejected.length === 0 ? (
            <EmptyState icon={XCircle} message="No rejected requests" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {rejected.map((req) => (
                <AdminLeaveCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== ADMIN LEAVE CARD ====================
function AdminLeaveCard({
  request,
  isReviewing = false,
  reviewNotes = "",
  onStartReview,
  onCancelReview,
  onNotesChange,
  onApprove,
  onReject,
  actionLoading = false,
  showActions = false,
}: {
  request: LeaveRequestRow
  isReviewing?: boolean
  reviewNotes?: string
  onStartReview?: () => void
  onCancelReview?: () => void
  onNotesChange?: (notes: string) => void
  onApprove?: () => void
  onReject?: () => void
  actionLoading?: boolean
  showActions?: boolean
}) {
  const config = LEAVE_TYPE_CONFIG[request.leave_type]
  const Icon = config?.icon || CalendarDays
  const name = request.profiles
    ? [request.profiles.first_name, request.profiles.last_name].filter(Boolean).join(" ") || "Unknown"
    : "Unknown"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${config?.color || ""}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground">
              {config?.label || request.leave_type} - {request.days_count} day{request.days_count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLES[request.status] || ""}`}>
          {request.status}
        </Badge>
      </div>

      {/* Details */}
      <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-muted-foreground">
        {request.profiles?.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{request.profiles.email}</span>
          </div>
        )}
        {request.profiles?.department && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span>{request.profiles.department}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>
            {new Date(request.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {request.start_date !== request.end_date &&
              ` - ${new Date(request.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
          </span>
        </div>
      </div>

      {/* Reason */}
      <p className="mt-2.5 rounded-md bg-muted/30 px-3 py-2 text-xs text-foreground">{request.reason}</p>

      {/* Review notes if already reviewed */}
      {request.review_notes && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-info/5 px-3 py-2">
          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-info" />
          <p className="text-xs text-info">{request.review_notes}</p>
        </div>
      )}

      {request.reviewer && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Reviewed by {[request.reviewer.first_name, request.reviewer.last_name].filter(Boolean).join(" ")}
          {request.reviewed_at && ` on ${new Date(request.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
        </p>
      )}

      {/* Actions */}
      {showActions && !isReviewing && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={onApprove} disabled={actionLoading}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs text-destructive border-destructive/20"
            onClick={onReject}
            disabled={actionLoading}
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs"
            onClick={onStartReview}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Review notes panel */}
      {showActions && isReviewing && (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            placeholder="Add review notes..."
            value={reviewNotes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            rows={2}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={onApprove} disabled={actionLoading}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs text-destructive border-destructive/20"
              onClick={onReject}
              disabled={actionLoading}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={onCancelReview}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== SHARED COMPONENTS ====================
function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof Clock; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
