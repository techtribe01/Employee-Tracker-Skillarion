"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCcw,
  Eye,
  Users,
  Send,
  Paperclip,
  Trash2,
  Shield,
  FileText,
  MessageSquare,
  ArrowRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getTaskById,
  getTaskComments,
  getTaskAttachments,
  addTaskComment,
  deleteTaskComment,
  addTaskAttachment,
  deleteTaskAttachment,
  updateTaskStatus,
  verifyTask,
  type TaskRow,
  type TaskStatus,
  type CommentRow,
  type AttachmentRow,
} from "@/lib/task-actions"
import { createClient } from "@/lib/supabase/client"

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  not_started: { label: "Not Started", color: "text-muted-foreground", bgColor: "bg-muted/60", icon: Circle },
  in_progress: { label: "In Progress", color: "text-warning", bgColor: "bg-warning/10", icon: RotateCcw },
  under_review: { label: "Under Review", color: "text-info", bgColor: "bg-info/10", icon: Eye },
  completed: { label: "Completed", color: "text-success", bgColor: "bg-success/10", icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-info" },
  high: { label: "High", color: "text-warning" },
  urgent: { label: "Urgent", color: "text-destructive" },
}

const STATUS_FLOW: Record<string, { next: TaskStatus; label: string }[]> = {
  not_started: [{ next: "in_progress", label: "Start Working" }],
  in_progress: [{ next: "under_review", label: "Submit for Review" }],
  under_review: [{ next: "in_progress", label: "Back to Work" }, { next: "completed", label: "Mark Complete" }],
  completed: [],
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const taskId = params.id as string
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const [task, setTask] = useState<TaskRow | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [sendingComment, setSendingComment] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ status: TaskStatus; label: string } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Verification state
  const [verifyNotes, setVerifyNotes] = useState("")
  const [showVerify, setShowVerify] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
      getTaskById(taskId),
      getTaskComments(taskId),
      getTaskAttachments(taskId),
    ])
    if (taskRes.data) setTask(taskRes.data)
    if (commentsRes.data) setComments(commentsRes.data)
    if (attachmentsRes.data) setAttachments(attachmentsRes.data)

    // Get current user info
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role === "admin") setIsAdmin(true)
    }

    setLoading(false)
  }, [taskId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [comments])

  async function handleStatusChange(newStatus: TaskStatus) {
    setChangingStatus(true)
    const result = await updateTaskStatus(taskId, newStatus)
    setChangingStatus(false)
    setConfirmAction(null)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      if (result.data) setTask(result.data)
      // Reload comments for system comment
      const commentsRes = await getTaskComments(taskId)
      if (commentsRes.data) setComments(commentsRes.data)
      toast({ title: "Status Updated", description: `Task is now "${STATUS_CONFIG[newStatus]?.label || newStatus}".` })
    }
  }

  async function handleSendComment() {
    if (!newComment.trim()) return
    setSendingComment(true)
    const result = await addTaskComment(taskId, newComment.trim())
    setSendingComment(false)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setNewComment("")
      if (result.data) setComments((prev) => [...prev, result.data!])
    }
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteTaskComment(commentId)
    if (!result.error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed.", variant: "destructive" })
      return
    }

    setUploadingFile(true)
    // Convert file to base64 data URL for storage
    const reader = new FileReader()
    reader.onload = async () => {
      const result = await addTaskAttachment(taskId, {
        file_name: file.name,
        file_url: reader.result as string,
        file_size: file.size,
        file_type: file.type,
      })
      setUploadingFile(false)
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      } else {
        if (result.data) setAttachments((prev) => [result.data!, ...prev])
        // Reload comments for system comment
        const commentsRes = await getTaskComments(taskId)
        if (commentsRes.data) setComments(commentsRes.data)
        toast({ title: "File Attached", description: file.name })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  async function handleDeleteAttachment(attachmentId: string) {
    const result = await deleteTaskAttachment(attachmentId)
    if (!result.error) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    }
  }

  async function handleVerify(status: "verified" | "rejected") {
    setVerifying(true)
    const result = await verifyTask(taskId, status, verifyNotes.trim() || undefined)
    setVerifying(false)
    setShowVerify(false)
    setVerifyNotes("")
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      if (result.data) setTask(result.data)
      const commentsRes = await getTaskComments(taskId)
      if (commentsRes.data) setComments(commentsRes.data)
      toast({ title: status === "verified" ? "Task Verified" : "Task Rejected", description: status === "verified" ? "Work has been approved." : "Task sent back for revision." })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading task...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 pt-20">
        <p className="text-sm text-muted-foreground">Task not found</p>
        <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started
  const StatusIcon = statusCfg.icon
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const actions = STATUS_FLOW[task.status] || []
  const isAssignee = currentUserId === task.assigned_to
  const canChangeStatus = isAssignee || isAdmin
  const needsVerification = task.status === "completed" && task.verification_status === "unverified" && isAdmin
  const assigneeName = task.assignee ? [task.assignee.first_name, task.assignee.last_name].filter(Boolean).join(" ") || task.assignee.email : "Unassigned"
  const creatorName = task.creator ? [task.creator.first_name, task.creator.last_name].filter(Boolean).join(" ") || task.creator.email : "Unknown"

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Task Detail</p>
        </div>
      </div>

      {/* Task info */}
      <div className="flex flex-col gap-4 px-5">
        {/* Title + status */}
        <div>
          <h1 className="text-lg font-bold text-foreground text-balance">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`gap-1 ${statusCfg.bgColor} ${statusCfg.color} border-transparent`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={`gap-1 border-transparent ${priorityCfg.color === "text-destructive" ? "bg-destructive/10" : priorityCfg.color === "text-warning" ? "bg-warning/10" : "bg-muted/60"} ${priorityCfg.color}`}>
              {(task.priority === "high" || task.priority === "urgent") && <AlertTriangle className="h-3 w-3" />}
              {priorityCfg.label}
            </Badge>
            {task.verification_status === "verified" && (
              <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {task.verification_status === "rejected" && (
              <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
                <X className="h-3 w-3" />
                Sent Back
              </Badge>
            )}
            {task.category && (
              <Badge variant="outline" className="text-xs">{task.category}</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm leading-relaxed text-foreground">{task.description}</p>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground">Assigned To</p>
              <p className="text-xs font-medium text-foreground truncate">{assigneeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground">Created By</p>
              <p className="text-xs font-medium text-foreground truncate">{creatorName}</p>
            </div>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Due Date</p>
                <p className="text-xs font-medium text-foreground">{new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Est. Hours</p>
                <p className="text-xs font-medium text-foreground">{task.estimated_hours}h</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Actions */}
        {canChangeStatus && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => (
              <Button
                key={action.next}
                className="flex-1 gap-2 rounded-xl"
                variant={action.next === "under_review" || action.next === "completed" ? "default" : "outline"}
                disabled={changingStatus}
                onClick={() => setConfirmAction(action)}
              >
                <ArrowRight className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Admin Verification */}
        {needsVerification && (
          <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold text-foreground">Verify This Task</p>
            </div>
            {showVerify ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Verification notes (optional)..."
                  className="rounded-xl text-xs"
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1.5 rounded-xl text-xs" disabled={verifying} onClick={() => handleVerify("verified")}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl border-destructive/20 text-xs text-destructive" disabled={verifying} onClick={() => handleVerify("rejected")}>
                    <X className="h-3.5 w-3.5" />
                    Send Back
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowVerify(false); setVerifyNotes("") }}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" className="w-full gap-2 rounded-xl" onClick={() => setShowVerify(true)}>
                <Eye className="h-4 w-4" />
                Review Work
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Comments & Attachments */}
      <div className="mt-5 px-5">
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              Files ({attachments.length})
            </TabsTrigger>
          </TabsList>

          {/* Comments */}
          <TabsContent value="comments" className="mt-4">
            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => {
                  const authorName = c.profiles ? [c.profiles.first_name, c.profiles.last_name].filter(Boolean).join(" ") || c.profiles.email : "Unknown"
                  const isOwn = c.user_id === currentUserId

                  return (
                    <div key={c.id} className={`flex flex-col gap-1 ${c.is_system ? "items-center" : ""}`}>
                      {c.is_system ? (
                        <p className="text-[10px] text-muted-foreground italic">
                          {authorName} -- {c.content} --{" "}
                          {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      ) : (
                        <div className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                {(c.profiles?.first_name?.[0] || "?").toUpperCase()}
                              </div>
                              <p className="text-[11px] font-medium text-foreground">{authorName}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isOwn && (
                                <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-foreground">{c.content}</p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div className="mt-3 flex items-end gap-2">
              <Textarea
                placeholder="Write a comment..."
                className="min-h-[42px] flex-1 rounded-xl text-xs"
                rows={1}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendComment()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[42px] w-[42px] shrink-0 rounded-xl"
                disabled={!newComment.trim() || sendingComment}
                onClick={handleSendComment}
              >
                {sendingComment ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Attachments */}
          <TabsContent value="attachments" className="mt-4">
            <div className="flex flex-col gap-3">
              {/* Upload button */}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 active:bg-muted/60">
                {uploadingFile ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4" />
                    Attach a file (max 10MB)
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </label>

              {attachments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No attachments yet</p>
              ) : (
                attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{a.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : ""} --{" "}
                        {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {a.user_id === currentUserId && (
                      <button onClick={() => handleDeleteAttachment(a.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm status change dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the task status to &quot;{STATUS_CONFIG[confirmAction?.status || ""]?.label || ""}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={changingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              disabled={changingStatus}
              onClick={() => confirmAction && handleStatusChange(confirmAction.status)}
            >
              {changingStatus ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
