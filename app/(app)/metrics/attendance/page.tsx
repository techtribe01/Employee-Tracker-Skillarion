'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { getAttendanceMetrics } from '@/lib/analytics-actions'
import { Clock, Calendar, AlertCircle, TrendingUp, Users, Palmtree, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AttendanceMetricsPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const res = await getAttendanceMetrics(undefined, period)
        if (res.data) {
          setMetrics(res.data)
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load attendance metrics',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [period, toast])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading attendance metrics...</p>
        </div>
      </div>
    )
  }

  // Generate sample heat map data (in production, this would come from actual data)
  const heatMapData = Array.from({ length: 7 }, (_, weekIdx) =>
    Array.from({ length: 7 }, (_, dayIdx) => ({
      week: weekIdx + 1,
      day: DAYS[dayIdx],
      attendance: Math.floor(Math.random() * 100),
    }))
  ).flat()

  const weeklyData = [
    { week: 'Week 1', present: 24, absent: 1, late: 2 },
    { week: 'Week 2', present: 23, absent: 2, late: 2 },
    { week: 'Week 3', present: 25, absent: 0, late: 2 },
    { week: 'Week 4', present: 24, absent: 1, late: 2 },
  ]

  const monthlyTrend = [
    { month: 'Jan', rate: 94 },
    { month: 'Feb', rate: 92 },
    { month: 'Mar', rate: 96 },
    { month: 'Apr', rate: 95 },
    { month: 'May', rate: 97 },
    { month: 'Jun', rate: 93 },
  ]

  const punctualityByDepartment = [
    { department: 'Engineering', rate: 96 },
    { department: 'Sales', rate: 89 },
    { department: 'HR', rate: 98 },
    { department: 'Finance', rate: 94 },
    { department: 'Marketing', rate: 91 },
  ]

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance Metrics</h1>
            <p className="text-sm text-muted-foreground">Team attendance, punctuality & patterns</p>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-2">
              {period.charAt(0).toUpperCase() + period.slice(1)}
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div className="absolute right-0 top-10 hidden w-32 rounded-lg border border-border bg-card p-1 shadow-lg">
              {['week', 'month', 'quarter', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as typeof period)}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted rounded"
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Present Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{metrics?.presentDays || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Absent Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-danger">{metrics?.absentDays || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Punctuality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{metrics?.punctualityRate || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-info">{metrics?.attendanceRate || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Palmtree className="h-4 w-4" />
                Leaves Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{metrics?.leavesTaken || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Weekly Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weekly Attendance Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attendance Trend (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Punctuality by Department */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Punctuality by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={punctualityByDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" fill="#6366f1" name="Punctuality %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Heat Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance Heat Map (Last 7 Weeks)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Darker = Higher attendance</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, weekIdx) => (
                <div key={weekIdx} className="flex gap-1">
                  <span className="w-12 text-xs text-muted-foreground font-medium pt-1">Week {weekIdx + 1}</span>
                  <div className="flex gap-1 flex-1">
                    {DAYS.map((day, dayIdx) => {
                      const attendance = Math.floor(Math.random() * 100)
                      const intensity = Math.floor(attendance / 20)
                      const colors = ['bg-muted/20', 'bg-success/20', 'bg-success/40', 'bg-success/60', 'bg-success/80', 'bg-success']
                      return (
                        <div
                          key={`${weekIdx}-${dayIdx}`}
                          className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-medium ${colors[intensity]} hover:opacity-80 transition-opacity cursor-pointer`}
                          title={`${day}: ${attendance}%`}
                        >
                          {attendance}%
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Break Time Analysis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Break Time & Overtime Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg Break Time</p>
                <p className="text-xl font-bold text-foreground">{metrics?.avgBreakTime || 0} min</p>
                <p className="text-xs text-muted-foreground mt-1">per day</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Overtime Hours</p>
                <p className="text-xl font-bold text-foreground">{metrics?.overtimeHours || 0} hrs</p>
                <p className="text-xs text-muted-foreground mt-1">this period</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Late Days</p>
                <p className="text-xl font-bold text-foreground">{metrics?.lateDays || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">times</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">On Time Days</p>
                <p className="text-xl font-bold text-foreground">{metrics?.onTimeDays || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">times</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
