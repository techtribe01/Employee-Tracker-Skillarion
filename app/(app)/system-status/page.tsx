'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Server, Database, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: 'up' | 'down'
    auth: 'up' | 'down'
    api: 'up' | 'down'
  }
  metrics: {
    activeUsers: number
    averageResponseTime: number
    errorRate: number
  }
  version: string
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    if (status === 'healthy') return 'text-success'
    if (status === 'degraded') return 'text-warning'
    return 'text-destructive'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'up') return <CheckCircle2 className="h-5 w-5" />
    if (status === 'degraded') return <AlertCircle className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">System Status</h1>
          <p className="text-muted-foreground">Real-time monitoring of SkillArion Employee Tracker</p>
        </div>

        {/* Overall Status Card */}
        {status && (
          <div className="grid gap-6 mb-8">
            {/* Main Status */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Overall Status</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStatus}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-2xl font-bold capitalize ${getStatusColor(status.status)}`}>
                    {status.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Uptime</p>
                  <p className="font-semibold text-foreground">{formatUptime(status.uptime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Last Updated</p>
                  <p className="font-semibold text-foreground">
                    {new Date(status.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Version</p>
                  <p className="font-semibold text-foreground">{status.version}</p>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Database */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className={`${getStatusColor(status.services.database)} mt-1`}>
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Database</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {status.services.database === 'up' ? 'Operational' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Authentication */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className={`${getStatusColor(status.services.auth)} mt-1`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Authentication</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {status.services.auth === 'up' ? 'Operational' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* API */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className={`${getStatusColor(status.services.api)} mt-1`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">API Server</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {status.services.api === 'up' ? 'Operational' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{status.metrics.activeUsers}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
                  <p className="text-2xl font-bold text-foreground">{status.metrics.averageResponseTime}ms</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
                  <p className="text-2xl font-bold text-foreground">{status.metrics.errorRate}%</p>
                </div>
              </div>
            </div>

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm text-muted-foreground">
                Auto-refresh every 10 seconds
              </label>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin mb-4">
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Loading system status...</p>
          </div>
        )}

        {/* Support Info */}
        <div className="mt-12 p-6 rounded-xl border border-border bg-muted/30">
          <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            If you're experiencing issues with the system, please contact our support team.
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:support@skillariondevelopement.in"
              className="text-primary text-sm font-medium hover:underline"
            >
              Email Support
            </a>
            <a
              href="/docs"
              className="text-primary text-sm font-medium hover:underline"
            >
              View Docs
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
