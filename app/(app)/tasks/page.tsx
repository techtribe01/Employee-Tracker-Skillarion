"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCcw,
  Eye,
  ListFilter,
  Inbox,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMyTasks, getTaskStats, type TaskRow } from "@/lib/task-actions"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: "Not Started", color: "bg-muted/60 text-muted-foreground border-border", icon: Circle },
  in_progress: { label: "In Progress", color: "bg-warning/10 text-warning border-warning/20", icon: RotateCcw },
  under_review: { label: "Under Review", color: "bg-info/10 text-info border-info/20", icon: Eye },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-info" },
  high: { label: "High", color: "text-warning" },
  urgent: { label: "Urgent", color: "text-destructive" },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [stats, setStats] = useState<{
    total: number
    not_started: number
    in_progress: number
    under_review: number
    completed: number
    verified: number
    high_priority: number
  } | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    const [tasksResult, statsResult] = await Promise.all([
      getMyTasks({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      }),
      getTaskStats(),
    ])
    if (tasksResult.data) setTasks(tasksResult.data)
    if (statsResult.data) setStats(statsResult.data)
    setLoading(false)
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    )
  })

  function getDueLabel(due: string | null) {
    if (!due) return null
    const d = new Date(due)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, overdue: true }
    if (diffDays === 0) return { text: "Due today", overdue: false }
    if (diffDays === 1) return { text: "Due tomorrow", overdue: false }
    return { text: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), overdue: false }
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
          <p className="text-xs text-muted-foreground">
            {stats ? `${stats.total} total, ${stats.in_progress} active` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "To Do", value: stats.not_started, color: "text-muted-foreground" },
            { label: "Active", value: stats.in_progress, color: "text-warning" },
            { label: "Review", value: stats.under_review, color: "text-info" },
            { label: "Done", value: stats.completed, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center rounded-xl border border-border bg-card px-2 py-2.5">
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="h-10 rounded-xl pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
            >
              <ListFilter className="h-4 w-4" />
              <span className="sr-only">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filter Tasks</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={() => { setStatusFilter("all"); setPriorityFilter("all") }}>
                Clear Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {[
          { key: "all", label: "All" },
          { key: "not_started", label: "Not Started" },
          { key: "in_progress", label: "In Progress" },
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
          <p className="text-xs text-muted-foreground">Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started
            const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            const StatusIcon = statusCfg.icon
            const dueInfo = getDueLabel(task.due_date)

            return (
              <Link href={`/tasks/${task.id}`} key={task.id}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors active:bg-accent/50">
                  {/* Status indicator */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusCfg.color.split(" ")[0]}`}>
                    <StatusIcon className={`h-4 w-4 ${statusCfg.color.split(" ")[1]}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {/* Priority */}
                      {(task.priority === "high" || task.priority === "urgent") && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-medium ${priorityCfg.color}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {priorityCfg.label}
                        </span>
                      )}

                      {/* Due date */}
                      {dueInfo && (
                        <span className={`flex items-center gap-0.5 text-[10px] ${dueInfo.overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          {dueInfo.text}
                        </span>
                      )}

                      {/* Category */}
                      {task.category && (
                        <span className="text-[10px] text-muted-foreground">{task.category}</span>
                      )}

                      {/* Verification badge */}
                      {task.verification_status === "verified" && (
                        <Badge variant="outline" className="h-4 border-success/30 bg-success/10 px-1.5 text-[9px] text-success">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
