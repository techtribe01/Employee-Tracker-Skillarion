"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Palmtree,
  Stethoscope,
  Briefcase,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  getMyLeaveRequests,
  getMyLeaveBalances,
  createLeaveRequest,
  cancelLeaveRequest,
  type LeaveRequestRow,
  type LeaveBalanceRow,
  type LeaveType,
} from "@/lib/leave-actions"

const LEAVE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Palmtree; color: string }> = {
  casual: { label: "Casual", icon: Palmtree, color: "text-success" },
  sick: { label: "Sick", icon: Stethoscope, color: "text-warning" },
  earned: { label: "Earned", icon: Briefcase, color: "text-info" },
  unpaid: { label: "Unpaid", icon: Ban, color: "text-muted-foreground" },
  maternity: { label: "Maternity", icon: CalendarDays, color: "text-primary" },
  paternity: { label: "Paternity", icon: CalendarDays, color: "text-primary" },
  compensatory: { label: "Comp Off", icon: Clock, color: "text-info" },
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: typeof Clock }> = {
  pending: { label: "Pending", badge: "border-warning/20 bg-warning/10 text-warning", icon: Clock },
  approved: { label: "Approved", badge: "border-success/20 bg-success/10 text-success", icon: CheckCircle2 },
  rejected: { label: "Rejected", badge: "border-destructive/20 bg-destructive/10 text-destructive", icon: XCircle },
  cancelled: { label: "Cancelled", badge: "border-muted bg-muted text-muted-foreground", icon: Ban },
}

export default function LeavePage() {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([])
  const [requests, setRequests] = useState<LeaveRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  // Form
  const [leaveType, setLeaveType] = useState<LeaveType>("casual")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    const [balResult, reqResult] = await Promise.all([
      getMyLeaveBalances(),
      getMyLeaveRequests(),
    ])
    if (balResult.data) setBalances(balResult.data)
    if (reqResult.data) setRequests(reqResult.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate() {
    if (!startDate || !endDate || !reason.trim()) return
    setCreating(true)
    setError("")
    const result = await createLeaveRequest({
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    })
    if (result.error) {
      setError(result.error)
      setCreating(false)
      return
    }
    setLeaveType("casual")
    setStartDate("")
    setEndDate("")
    setReason("")
    setShowCreate(false)
    setCreating(false)
    await loadData()
  }

  async function handleCancel(id: string) {
    await cancelLeaveRequest(id)
    await loadData()
  }

  // Computed
  const totalAvailable = balances.reduce((acc, b) => acc + (b.total_days - b.used_days), 0)
  const totalUsed = balances.reduce((acc, b) => acc + b.used_days, 0)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const pastRequests = requests.filter((r) => r.status !== "pending")

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Leave</h1>
          <p className="text-xs text-muted-foreground">Manage your time off</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <Label className="text-xs">Leave Type</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {balances.map((b) => {
                      const config = LEAVE_TYPE_CONFIG[b.leave_type]
                      const remaining = b.total_days - b.used_days
                      return (
                        <SelectItem key={b.leave_type} value={b.leave_type}>
                          <span className="flex items-center gap-2">
                            {config?.label || b.leave_type} ({remaining} left)
                          </span>
                        </SelectItem>
                      )
                    })}
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why do you need leave?"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !startDate || !endDate || !reason.trim()}
                className="mt-1"
              >
                {creating ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col items-center rounded-xl border border-success/20 bg-success/5 px-3 py-3">
          <span className="text-lg font-bold text-success">{totalAvailable}</span>
          <span className="text-[10px] text-muted-foreground">Available</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-info/20 bg-info/5 px-3 py-3">
          <span className="text-lg font-bold text-info">{totalUsed}</span>
          <span className="text-[10px] text-muted-foreground">Used</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-warning/20 bg-warning/5 px-3 py-3">
          <span className="text-lg font-bold text-warning">{pendingCount}</span>
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </div>
      </div>

      {/* Leave Balances Detail */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Leave Balance</h2>
        <div className="flex flex-col gap-2.5">
          {balances.map((b) => {
            const config = LEAVE_TYPE_CONFIG[b.leave_type]
            const Icon = config?.icon || CalendarDays
            const remaining = b.total_days - b.used_days
            const usedPercent = b.total_days > 0 ? (b.used_days / b.total_days) * 100 : 0
            return (
              <div key={b.id} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${config?.color || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{config?.label || b.leave_type}</span>
                    <span className="text-[10px] text-muted-foreground">{remaining}/{b.total_days}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full transition-all ${usedPercent > 80 ? "bg-destructive" : usedPercent > 50 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave Requests */}
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-1 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            History ({pastRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-3">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Clock className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pendingRequests.map((req) => (
                <LeaveCard key={req.id} request={req} onCancel={handleCancel} showCancel />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {pastRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No past requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pastRequests.map((req) => (
                <LeaveCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== LEAVE CARD COMPONENT ====================
function LeaveCard({
  request,
  onCancel,
  showCancel,
}: {
  request: LeaveRequestRow
  onCancel?: (id: string) => void
  showCancel?: boolean
}) {
  const config = LEAVE_TYPE_CONFIG[request.leave_type]
  const statusConfig = STATUS_CONFIG[request.status]
  const Icon = config?.icon || CalendarDays
  const StatusIcon = statusConfig?.icon || Clock

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${config?.color || ""}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {config?.label || request.leave_type} Leave
            </p>
            <p className="text-[11px] text-muted-foreground">
              {request.days_count} day{request.days_count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] gap-1 ${statusConfig?.badge || ""}`}>
          <StatusIcon className="h-2.5 w-2.5" />
          {statusConfig?.label || request.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3 w-3" />
        <span>
          {new Date(request.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {request.start_date !== request.end_date &&
            ` - ${new Date(request.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        </span>
      </div>

      <p className="mt-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-foreground">{request.reason}</p>

      {request.review_notes && (
        <p className="mt-2 rounded-md bg-info/5 px-3 py-2 text-xs text-info">
          Admin: {request.review_notes}
        </p>
      )}

      {request.reviewer && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Reviewed by {[request.reviewer.first_name, request.reviewer.last_name].filter(Boolean).join(" ")}
          {request.reviewed_at && ` on ${new Date(request.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
        </p>
      )}

      {showCancel && onCancel && (
        <div className="mt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full text-xs text-destructive border-destructive/20">
                Cancel Request
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel your {config?.label?.toLowerCase() || request.leave_type} leave request for{" "}
                  {request.days_count} day{request.days_count > 1 ? "s" : ""}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onCancel(request.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
