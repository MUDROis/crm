### Task 4: NotificationContext — React context with Realtime

**Files:**
- Create: `src/contexts/NotificationContext.tsx`

**Interfaces:**
- Produces: `NotificationProvider`, `useNotifications()` hook
  - `useNotifications()` returns: `{ notifications, unreadCount, toasts, markAsRead, markAllAsRead, dismissToast }`

- [ ] **Create NotificationContext**

```typescript
'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type NotificationType = 'task_new' | 'task_completed' | 'lesson_new' | 'lesson_updated' | 'lesson_cancelled' | 'birthday'

interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: NotificationType
  link: string | null
  is_read: boolean
  created_at: string
}

interface Toast {
  id: string
  title: string
  body: string | null
  type: NotificationType
  link: string | null
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const toastsRef = useRef<Toast[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // Load initial unread notifications
  useEffect(() => {
    if (!userId) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data)
      })
  }, [userId])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])

          const newToast: Toast = {
            id: newNotification.id,
            title: newNotification.title,
            body: newNotification.body,
            type: newNotification.type,
            link: newNotification.link,
          }
          setToasts((prev) => {
            const next = [newToast, ...prev].slice(0, 3)
            toastsRef.current = next
            return next
          })

          // Auto-dismiss toast after 5s
          setTimeout(() => {
            dismissToast(newNotification.id)
          }, 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }, [userId])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, toasts, markAsRead, markAllAsRead, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
```

- [ ] **Verify exports are correct**

- [ ] **Commit**

```bash
git add src/contexts/NotificationContext.tsx
git commit -m "feat: add NotificationContext with realtime subscription"
```
