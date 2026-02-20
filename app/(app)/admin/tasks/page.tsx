"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCcw,
  Eye,
  Inbox,
  Send,
  ClipboardList,
  Users,
  Shield,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  createTask,
  getAllTasks,
  verifyTask,
  deleteTask,
  getApprovedEmployees,
  type TaskRow,
  type TaskPriority,
} from "@/lib/task-actions"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: "Not Started", color: "bg-muted/60 text-muted-foreground", icon: Circle },
  in_progress: { label: "In Progress", color: "bg-warning/10 text-warning", icon: RotateCcw },
  under_review: { label: "Under Review", color: "bg-info/10 text-info", icon: Eye },
  completed: { label: "Completed", color: "bg-success/10 text-success", icon: CheckCircle2 },
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-info",
  high: "text-warning",
  urgent: "text-destructive",
}

type Employee = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  department: string | null
  role: string
}

export default function AdminTasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as TaskPriority,
    category: "",
    due_date: "",
    estimated_hours: "",
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [tasksRes, employeesRes] = await Promise.all([
      getAllTasks({ status: statusFilter !== "all" ? statusFilter : undefined, assigned_to: assigneeFilter !== "all" ? assigneeFilter : undefined }),
      getApprovedEmployees(),
    ])
    if (tasksRes.data) setTasks(tasksRes.data)
    if (employeesRes.data) setEmployees(employeesRes.data as Employee[])
    setLoading(false)
  }, [statusFilter, assigneeFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate() {
    if (!form.title.trim()) return
    setCreating(true)
    const result = await createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigned_to: form.assigned_to || undefined,
      priority: form.priority,
      category: form.category.trim() || undefined,
      due_date: form.due_date || undefined,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
    })
    setCreating(false)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Task Created", description: `"${form.title}" has been assigned.` })
      setForm({ title: "", description: "", assigned_to: "", priority: "medium", category: "", due_date: "", estimated_hours: "" })
      setSheetOpen(false)
      loadData()
    }
  }

  const filtered = tasks.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assignee?.first_name?.toLowerCase().includes(q) ||
      t.assignee?.last_name?.toLowerCase().includes(q)
    )
  })

  const getAssigneeName = (t: TaskRow) => {
    if (!t.assignee) return "Unassigned"
    return [t.assignee.first_name, t.assignee.last_name].filter(Boolean).join(" ") || t.assignee.email || "Unknown"
  }

  const getInitials = (t: TaskRow) => {
    if (!t.assignee) return "?"
    const f = t.assignee.first_name?.[0] || ""
    const l = t.assignee.last_name?.[0] || ""
    return (f + l).toUpperCase() || "?"
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={() => router.push("/admin")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Manage Tasks</h1>
          </div>
          <p className="text-xs text-muted-foreground">{tasks.length} total tasks</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 rounded-xl">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Create New Task</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Title *</Label>
                <Input
                  placeholder="Task title..."
                  className="rounded-xl"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Describe the task..."
                  className="rounded-xl"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Assign To</Label>
                <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email}
                        {emp.department ? ` (${emp.department})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Category</Label>
                  <Input
                    placeholder="e.g. Design"
                    className="rounded-xl"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    className="rounded-xl"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Est. Hours</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="rounded-xl"
                    value={form.estimated_hours}
                    onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="h-11 rounded-xl gap-2"
                disabled={!form.title.trim() || creating}
                onClick={handleCreate}
              >
                {creating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="h-10 rounded-xl pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {[
          { key: "all", label: "All" },
          { key: "not_started", label: "Not Started" },
          { key: "in_progress", label: "Active" },
          { key: "under_review", label: "Review" },
          { key: "completed", label: "Done" },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setStatusFilter(chip.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === chip.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Assignee filter */}
      <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
        <SelectTrigger className="h-9 rounded-xl text-xs">
          <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder="All employees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Task list */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
          <p className="text-xs text-muted-foreground">Create a task to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((task) => {
            const stCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started
            const StIcon = stCfg.icon
            const needsVerification = task.status === "completed" && task.verification_status === "unverified"

            return (
              <div key={task.id} className="rounded-xl border border-border bg-card">
                <Link href={`/tasks/${task.id}`}>
                  <div className="flex items-center gap-3 p-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stCfg.color.split(" ")[0]}`}>
                      <StIcon className={`h-4 w-4 ${stCfg.color.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {getAssigneeName(task)}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        {(task.priority === "high" || task.priority === "urgent") && (
                          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {task.priority === "urgent" ? "Urgent" : "High"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {getInitials(task)}
                      </div>
                      {needsVerification && (
                        <Badge variant="outline" className="h-4 border-warning/30 bg-warning/10 px-1 text-[8px] text-warning">
                          Verify
                        </Badge>
                      )}
                      {task.verification_status === "verified" && (
                        <Badge variant="outline" className="h-4 border-success/30 bg-success/10 px-1 text-[8px] text-success">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Inline verify bar for completed tasks */}
                {needsVerification && (
                  <VerifyBar taskId={task.id} taskTitle={task.title} onDone={loadData} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Inline verification bar
function VerifyBar({ taskId, taskTitle, onDone }: { taskId: string; taskTitle: string; onDone: () => void }) {
  const { toast } = useToast()
  const [acting, setActing] = useState(false)
  const [notes, setNotes] = useState("")

  async function handle(status: "verified" | "rejected") {
    setActing(true)
    const result = await verifyTask(taskId, status, notes.trim() || undefined)
    setActing(false)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      toast({
        title: status === "verified" ? "Task Verified" : "Task Sent Back",
        description: status === "verified" ? `"${taskTitle}" has been verified.` : `"${taskTitle}" sent back for revision.`,
      })
      onDone()
    }
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Notes (optional)..."
          className="h-8 flex-1 rounded-lg text-xs"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={acting}
        />
        <Button
          size="sm"
          className="h-8 gap-1 rounded-lg px-3 text-xs"
          disabled={acting}
          onClick={() => handle("verified")}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verify
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-lg border-destructive/20 px-3 text-xs text-destructive"
          disabled={acting}
          onClick={() => handle("rejected")}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
    </div>
  )
}
