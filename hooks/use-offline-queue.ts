"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface QueuedAction {
  id: string
  type: "clock_in" | "clock_out" | "start_break" | "end_break"
  payload: Record<string, unknown>
  timestamp: string
  retries: number
}

const STORAGE_KEY = "skillarion_offline_queue"
const MAX_RETRIES = 5

function getQueue(): QueuedAction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedAction[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full or unavailable
  }
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const syncingRef = useRef(false)

  // Initialize
  useEffect(() => {
    setQueue(getQueue())
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Enqueue an action for offline processing
  const enqueue = useCallback(
    (
      type: QueuedAction["type"],
      payload: Record<string, unknown>
    ) => {
      const action: QueuedAction = {
        id: crypto.randomUUID(),
        type,
        payload,
        timestamp: new Date().toISOString(),
        retries: 0,
      }
      const newQueue = [...getQueue(), action]
      saveQueue(newQueue)
      setQueue(newQueue)
      return action.id
    },
    []
  )

  // Process a single queued action
  const processAction = useCallback(
    async (action: QueuedAction): Promise<boolean> => {
      try {
        const res = await fetch("/api/attendance/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: action.type,
            payload: action.payload,
            queuedAt: action.timestamp,
          }),
        })
        return res.ok
      } catch {
        return false
      }
    },
    []
  )

  // Sync all queued actions
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return
    const currentQueue = getQueue()
    if (currentQueue.length === 0) return

    syncingRef.current = true
    setSyncing(true)

    const remaining: QueuedAction[] = []

    for (const action of currentQueue) {
      const success = await processAction(action)
      if (!success) {
        if (action.retries < MAX_RETRIES) {
          remaining.push({ ...action, retries: action.retries + 1 })
        }
        // If max retries exceeded, drop the action
      }
    }

    saveQueue(remaining)
    setQueue(remaining)
    syncingRef.current = false
    setSyncing(false)
  }, [processAction])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue()
    }
  }, [isOnline, queue.length, syncQueue])

  // Periodic sync attempt
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && getQueue().length > 0 && !syncingRef.current) {
        syncQueue()
      }
    }, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [isOnline, syncQueue])

  const clearQueue = useCallback(() => {
    saveQueue([])
    setQueue([])
  }, [])

  return {
    queue,
    isOnline,
    syncing,
    queueLength: queue.length,
    enqueue,
    syncQueue,
    clearQueue,
  }
}
