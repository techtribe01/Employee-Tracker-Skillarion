'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle2, AlertCircle, Loader } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleSetupAdmin() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to setup admin')
        return
      }

      setResult(data)
      toast({
        title: 'Success',
        description: 'Admin user created successfully',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md border-border/50">
        <div className="p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Admin Setup</h1>
            <p className="text-sm text-muted-foreground">Create the initial admin account for Skillarion Employee Tracker</p>
          </div>

          {/* Setup Card */}
          <div className="flex flex-col gap-4">
            {!result && !error && (
              <>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Account to create:</p>
                  <p className="font-mono text-sm text-foreground">manoj@skillariondevelopement.in</p>
                </div>

                <div className="bg-info/5 rounded-lg p-3 border border-info/20 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    This action creates the first admin account. It can only be run once.
                  </p>
                </div>

                <Button
                  onClick={handleSetupAdmin}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? 'Creating Admin...' : 'Create Admin Account'}
                </Button>
              </>
            )}

            {/* Success State */}
            {result && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="font-semibold text-foreground mb-1">Admin Created Successfully!</h2>
                  <p className="text-xs text-muted-foreground">Store the temporary password securely</p>
                </div>

                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <div className="flex items-center gap-2 bg-background rounded px-2 py-1.5">
                      <code className="text-xs font-mono text-foreground flex-1">{result.email}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.email)
                          toast({ title: 'Copied!' })
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
                    <div className="flex items-center gap-2 bg-background rounded px-2 py-1.5">
                      <code className="text-xs font-mono text-foreground flex-1 break-all">{result.tempPassword}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.tempPassword)
                          toast({ title: 'Copied!' })
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User ID</p>
                    <code className="text-xs font-mono text-muted-foreground break-all">{result.userId}</code>
                  </div>
                </div>

                <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Next Steps:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Log in with the temporary password</li>
                      <li>Change password immediately</li>
                      <li>Navigate to Admin panel to manage users</li>
                    </ul>
                  </div>
                </div>

                <Button variant="outline" onClick={() => window.location.href = '/login'} className="w-full">
                  Go to Login
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>

                <div>
                  <h2 className="font-semibold text-destructive text-center mb-2">Setup Failed</h2>
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded p-3 break-words">{error}</p>
                </div>

                <Button onClick={handleSetupAdmin} disabled={loading} className="w-full">
                  {loading ? 'Retrying...' : 'Try Again'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
