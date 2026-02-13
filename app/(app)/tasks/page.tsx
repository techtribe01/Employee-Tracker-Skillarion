"use client"

import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TASKS = [
  { title: "Update landing page design", status: "In Progress", priority: "High", due: "Today", category: "task", assignee: "RK" },
  { title: "Team standup meeting", status: "Scheduled", priority: "Medium", due: "Today 3 PM", category: "meeting", assignee: "RK" },
  { title: "Review API documentation", status: "To Do", priority: "Medium", due: "Tomorrow", category: "task", assignee: "RK" },
  { title: "Fix authentication bug", status: "In Progress", priority: "High", due: "Today", category: "task", assignee: "RK" },
  { title: "Sprint planning", status: "Scheduled", priority: "Low", due: "Friday", category: "meeting", assignee: "RK" },
  { title: "Submit weekly report", status: "To Do", priority: "High", due: "Friday", category: "task", assignee: "RK" },
]

const STATUS_COLORS: Record<string, string> = {
  "In Progress": "bg-warning/10 text-warning",
  "To Do": "bg-info/10 text-info",
  Scheduled: "bg-success/10 text-success",
  Done: "bg-muted text-muted-foreground",
}

const CATEGORY_COLORS: Record<string, string> = {
  task: "bg-info",
  meeting: "bg-success",
  deadline: "bg-destructive",
}

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tasks</h1>
        <Button size="sm" className="h-9 gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks..." className="pl-10 h-11 rounded-xl" />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["All", "In Progress", "To Do", "Scheduled", "Done"].map((filter, i) => (
          <button
            key={filter}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2.5">
        {TASKS.map((task) => (
          <div
            key={task.title}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLORS[task.category] || "bg-muted"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[task.status] || ""}`}>
                  {task.status}
                </span>
                <span className="text-[10px] text-muted-foreground">{task.due}</span>
              </div>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {task.assignee}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
