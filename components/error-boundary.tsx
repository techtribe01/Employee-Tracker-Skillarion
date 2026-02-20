'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="max-w-md w-full p-6 rounded-lg border border-border bg-card text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button
                onClick={this.handleReset}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Error toast component
interface ErrorToastProps {
  error: Error | null
  onClose: () => void
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, onClose])

  if (!error) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{error.name}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-destructive hover:text-destructive/80 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  )
}
