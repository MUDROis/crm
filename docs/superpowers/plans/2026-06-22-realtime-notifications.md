# Real-Time Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In-app real-time notifications via Supabase Realtime for task/lesson events and birthdays.

**Architecture:** Notifications are stored in a `notifications` table. DB triggers on `tasks` and `lessons` auto-insert notifications. A React Context subscribes to Realtime for instant delivery. Bell icon + dropdown in navbars, toasts for new arrivals.

**Tech Stack:** Supabase Realtime, Postgres triggers, React 19 Context, Tailwind CSS 4.

## Global Constraints

- All new files in `src/` unless specified
- SQL migrations in `migrations/` directory (standalone `.sql` files)
- Follow existing code conventions: emoji icons (text-2xl), client components, `createClient()` from `@/utils/supabase/client`
- Russian-language UI
- No new npm dependencies

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `migrations/add_notifications.sql` | `notifications` table + indexes + Realtime enable |
| `migrations/add_birth_date.sql` | `birth_date` column on `students` and `profiles` |
| `migrations/add_notification_triggers.sql` | Trigger functions on `tasks` and `lessons` |
| `src/contexts/NotificationContext.tsx` | React context: state, Realtime subscription, toast management |
| `src/components/NotificationBell.tsx` | Bell icon + badge + dropdown |
| `src/components/NotificationToast.tsx` | Toast popup container |
| `src/app/api/cron/birthdays/route.ts` | Daily birthday check API |

### Modified files
| File | Change |
|---|---|
| `src/components/AdminNavbar.tsx` | Add `<NotificationBell />` |
| `src/components/TeacherNavbar.tsx` | Add `<NotificationBell />` |
| `src/app/admin/layout.tsx` | Wrap with `<NotificationProvider>` |
| `src/app/teacher/layout.tsx` | Wrap with `<NotificationProvider>` |
| `src/components/students/StudentForm.tsx` | Add `birth_date` field |
| `src/components/teachers/TeacherForm.tsx` | Add `birth_date` field |
| `src/app/globals.css` | Add toast slide-in animation |

---

### Task 1: Migration — notifications table

**Files:**
- Create: `migrations/add_notifications.sql`

- [ ] **Write migration SQL**

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Verify migration**
  - Read the file to confirm syntax

- [ ] **Commit**

```bash
git add migrations/add_notifications.sql
git commit -m "feat: add notifications table with indexes and realtime"
```

---

### Task 2: Migration — add birth_date columns

**Files:**
- Create: `migrations/add_birth_date.sql`

- [ ] **Write migration SQL**

```sql
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
```

- [ ] **Verify migration**

- [ ] **Commit**

```bash
git add migrations/add_birth_date.sql
git commit -m "feat: add birth_date columns to students and profiles"
```

---

### Task 3: Migration — notification triggers

**Files:**
- Create: `migrations/add_notification_triggers.sql`

- [ ] **Write trigger functions and triggers SQL**

```sql
-- Helper: insert notification
CREATE OR REPLACE FUNCTION insert_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_link text
) RETURNS void AS $$
BEGIN
  IF p_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, link)
    VALUES (p_user_id, p_title, p_body, p_type, p_link);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: new task
CREATE OR REPLACE FUNCTION notify_task_new()
RETURNS trigger AS $$
BEGIN
  PERFORM insert_notification(
    NEW.assigned_to,
    'Новая задача',
    NEW.title,
    'task_new',
    '/teacher/tasks'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_task_new ON tasks;
CREATE TRIGGER trg_notify_task_new
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_new();

-- Trigger: task completed
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS trigger AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    PERFORM insert_notification(
      NEW.created_by,
      'Задача выполнена',
      NEW.title,
      'task_completed',
      '/admin/tasks'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_task_completed ON tasks;
CREATE TRIGGER trg_notify_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- Trigger: new lesson
CREATE OR REPLACE FUNCTION notify_lesson_new()
RETURNS trigger AS $$
BEGIN
  PERFORM insert_notification(
    NEW.teacher_id,
    'Новый урок',
    NEW.lesson_date::text || ' ' || NEW.start_time::text,
    'lesson_new',
    '/teacher/lessons'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_lesson_new ON lessons;
CREATE TRIGGER trg_notify_lesson_new
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_lesson_new();

-- Trigger: lesson changed/cancelled
CREATE OR REPLACE FUNCTION notify_lesson_changed()
RETURNS trigger AS $$
DECLARE
  v_title text;
  v_type text;
BEGIN
  -- Only notify if relevant fields changed
  IF OLD.lesson_date IS DISTINCT FROM NEW.lesson_date
     OR OLD.start_time IS DISTINCT FROM NEW.start_time
     OR OLD.end_time IS DISTINCT FROM NEW.end_time
     OR OLD.status IS DISTINCT FROM NEW.status
  THEN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      v_title := 'Урок отменён';
      v_type := 'lesson_cancelled';
    ELSE
      v_title := 'Урок изменён';
      v_type := 'lesson_updated';
    END IF;

    PERFORM insert_notification(
      NEW.teacher_id,
      v_title,
      NEW.lesson_date::text || ' ' || NEW.start_time::text,
      v_type,
      '/teacher/lessons'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_lesson_changed ON lessons;
CREATE TRIGGER trg_notify_lesson_changed
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_lesson_changed();
```

- [ ] **Verify migration**

- [ ] **Commit**

```bash
git add migrations/add_notification_triggers.sql
git commit -m "feat: add notification triggers on tasks and lessons"
```

---

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

---

### Task 5: NotificationBell component

**Files:**
- Create: `src/components/NotificationBell.tsx`

**Depends on:** Task 4 (`useNotifications()`)

- [ ] **Create NotificationBell component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'

const TYPE_ICONS: Record<string, string> = {
  task_new: '📋',
  task_completed: '✅',
  lesson_new: '📅',
  lesson_updated: '📅',
  lesson_cancelled: '❌',
  birthday: '🎂',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes}м назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}ч назад`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}д назад`
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const handleClick = async (n: typeof notifications[0]) => {
    if (!n.is_read) await markAsRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-2xl text-gray-600 hover:text-brand-600 transition"
        title="Уведомления"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-5 bg-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-semibold">Уведомления</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:underline"
              >
                Отметить все
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Нет уведомлений</div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-3 border-b last:border-0 hover:bg-gray-50 flex gap-3 items-start ${
                  !n.is_read ? 'bg-brand-50' : ''
                }`}
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div className="text-xs text-gray-500 truncate">{n.body}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Verify component renders correctly**

- [ ] **Commit**

```bash
git add src/components/NotificationBell.tsx
git commit -m "feat: add NotificationBell component with dropdown"
```

---

### Task 6: NotificationToast component

**Files:**
- Create: `src/components/NotificationToast.tsx`

**Depends on:** Task 4 (`useNotifications()`)

- [ ] **Create NotificationToast component**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'

const TYPE_ICONS: Record<string, string> = {
  task_new: '📋',
  task_completed: '✅',
  lesson_new: '📅',
  lesson_updated: '📅',
  lesson_cancelled: '❌',
  birthday: '🎂',
}

export default function NotificationToast() {
  const { toasts, dismissToast, markAsRead } = useNotifications()
  const router = useRouter()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="fade-in bg-white shadow-lg border rounded-lg p-3 flex gap-3 items-start max-w-sm cursor-pointer hover:bg-gray-50 transition"
          onClick={async () => {
            dismissToast(toast.id)
            await markAsRead(toast.id)
            if (toast.link) router.push(toast.link)
          }}
        >
          <span className="text-lg shrink-0 mt-0.5">
            {TYPE_ICONS[toast.type] || '🔔'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.body && (
              <div className="text-xs text-gray-500 line-clamp-2">{toast.body}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              dismissToast(toast.id)
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Verify component renders correctly**

- [ ] **Commit**

```bash
git add src/components/NotificationToast.tsx
git commit -m "feat: add NotificationToast component"
```

---

### Task 7: Integrate into layouts and navbars

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/teacher/layout.tsx`
- Modify: `src/components/AdminNavbar.tsx`
- Modify: `src/components/TeacherNavbar.tsx`

**Depends on:** Task 4 (`NotificationProvider`), Task 5 (`NotificationBell`), Task 6 (`NotificationToast`)

- [ ] **Update `src/app/admin/layout.tsx`** — wrap with NotificationProvider, add NotificationToast

```typescript
import AuthGuard from '@/components/AuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import Breadcrumbs from '@/components/Breadcrumbs'
import { NotificationProvider } from '@/contexts/NotificationContext'
import NotificationToast from '@/components/NotificationToast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      <NotificationProvider>
        <AdminNavbar />
        <Breadcrumbs />
        <div>{children}</div>
        <NotificationToast />
      </NotificationProvider>
    </AuthGuard>
  )
}
```

- [ ] **Update `src/app/teacher/layout.tsx`** — wrap with NotificationProvider, add NotificationToast

```typescript
import AuthGuard from '@/components/AuthGuard'
import TeacherNavbar from '@/components/TeacherNavbar'
import Breadcrumbs from '@/components/Breadcrumbs'
import { createClient } from '@/utils/supabase/server'
import { NotificationProvider } from '@/contexts/NotificationContext'
import NotificationToast from '@/components/NotificationToast'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let pendingCount = 0
  if (user) {
    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('completed', false)
    if (count !== null) pendingCount = count
  }

  return (
    <AuthGuard requiredRole="teacher">
      <NotificationProvider>
        <TeacherNavbar pendingCount={pendingCount} />
        <Breadcrumbs />
        <div>{children}</div>
        <NotificationToast />
      </NotificationProvider>
    </AuthGuard>
  )
}
```

- [ ] **Update `src/components/AdminNavbar.tsx`** — import and add NotificationBell

Edit: add `import NotificationBell from '@/components/NotificationBell'` at top, and place `<NotificationBell />` at the start of the nav icons div (before 📅 link).

- [ ] **Update `src/components/TeacherNavbar.tsx`** — import and add NotificationBell

Edit: add `import NotificationBell from '@/components/NotificationBell'` at top, and place `<NotificationBell />` at the start of the nav icons div (before 📅 link).

- [ ] **Verify all imports resolve** — no TypeScript errors

- [ ] **Commit**

```bash
git add src/app/admin/layout.tsx src/app/teacher/layout.tsx src/components/AdminNavbar.tsx src/components/TeacherNavbar.tsx
git commit -m "feat: integrate notifications into layouts and navbars"
```

---

### Task 8: Birthday cron API route

**Files:**
- Create: `src/app/api/cron/birthdays/route.ts`

**Depends on:** Task 2 (`birth_date` column exists)

- [ ] **Create birthday cron API route**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get admin users
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  if (!admins || admins.length === 0) {
    return NextResponse.json({ inserted: 0 })
  }
  const adminIds = admins.map(a => a.id)

  // Get today's date in MM-DD format, and the next 3 days
  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${mm}-${dd}`)
  }

  // Find students with birthdays
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, full_name, birth_date')
    .not('birth_date', 'is', null)
  const { data: teachers } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, birth_date')
    .eq('role', 'teacher')
    .not('birth_date', 'is', null)

  const birthdayPeople: { name: string; type: string; link: string }[] = []

  const isInRange = (dateStr: string) => {
    const mmdd = dateStr.slice(5)
    return dates.includes(mmdd)
  }

  for (const s of students || []) {
    if (isInRange(s.birth_date)) {
      birthdayPeople.push({ name: s.full_name, type: 'student', link: '/admin/students' })
    }
  }
  for (const t of teachers || []) {
    if (isInRange(t.birth_date)) {
      birthdayPeople.push({ name: t.full_name, type: 'teacher', link: '/admin/teachers' })
    }
  }

  if (birthdayPeople.length === 0) {
    return NextResponse.json({ inserted: 0 })
  }

  // Check for existing birthday notifications today to avoid duplicates
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: existingNotifs } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('type', 'birthday')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  // If any birthday notifications were created today, skip (prevents duplicates)
  if (existingNotifs && existingNotifs.length > 0) {
    return NextResponse.json({ inserted: 0, skipped: 'already sent today' })
  }

  let inserted = 0
  for (const person of birthdayPeople) {
    for (const adminId of adminIds) {
      const { error } = await supabaseAdmin.from('notifications').insert({
        user_id: adminId,
        title: `🎂 День рождения: ${person.name}`,
        body: person.type === 'student' ? 'У ученика сегодня день рождения' : 'У преподавателя сегодня день рождения',
        type: 'birthday',
        link: person.link,
      })
      if (!error) inserted++
    }
  }

  return NextResponse.json({ inserted })
}

export const dynamic = 'force-dynamic'
```

- [ ] **Verify route logic**

- [ ] **Add CRON_SECRET to .env.local**

```
CRON_SECRET=<generate-a-random-token>
```

- [ ] **Commit**

```bash
git add src/app/api/cron/birthdays/route.ts
git commit -m "feat: add birthday cron API route"
```

---

### Task 9: Add birth_date to forms

**Files:**
- Modify: `src/components/students/StudentForm.tsx`
- Modify: `src/components/teachers/TeacherForm.tsx`
- Modify: `src/app/admin/teachers/page.tsx`
- Modify: `src/app/api/teachers/route.ts`
- Modify: `src/app/api/teachers/[id]/route.ts`

**Depends on:** Task 2 (`birth_date` column exists)

- [ ] **Update `src/app/admin/teachers/page.tsx`** — add `birth_date` to the type and query

Add `birth_date` to the local `Teacher` interface:
```typescript
interface Teacher {
  id: string
  email: string
  full_name: string
  status: string
  birth_date?: string | null
}
```

Update `loadTeachers` query to also select `birth_date`:
```typescript
let query = supabase.from('profiles').select('id, email, full_name, status, birth_date').eq('role', 'teacher')
```

- [ ] **Update `src/app/api/teachers/route.ts`** — add `birth_date` to POST

Destructure `birth_date` from body:
```typescript
const { email, password, full_name, phone, color, birth_date } = body
```

Add `birth_date` to profile update:
```typescript
const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .update({
    role: 'teacher',
    full_name: full_name || null,
    phone: phone || null,
    color: color || null,
    birth_date: birth_date || null,
  })
  .eq('id', userId)
```

- [ ] **Update `src/app/api/teachers/[id]/route.ts`** — add `birth_date` to PATCH

Add to the `updates` object:
```typescript
if (body.birth_date !== undefined) updates.birth_date = body.birth_date
```

- [ ] **Update `StudentForm.tsx` interface and form**

Add `birth_date: string` to the `Student` interface:

```typescript
interface Student {
  id?: string
  full_name: string
  phone: string
  email: string
  subject: string
  teacher_id: string | null
  type: 'individual' | 'group'
  customer_name: string
  customer_contact: string
  notes: string
  online_link: string
  status: string
  birth_date: string
}
```

Add initial value in the `useState`:

```typescript
const [form, setForm] = useState<Student>(
  student || {
    full_name: '',
    phone: '',
    email: '',
    subject: '',
    teacher_id: null,
    type: 'individual',
    customer_name: '',
    customer_contact: '',
    notes: '',
    online_link: '',
    status: 'active',
    birth_date: '',
  }
)
```

Add the date input in the form JSX (after the ФИО field):

```typescript
<div>
  <label className="block text-sm">Дата рождения</label>
  <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className="w-full border p-2 rounded" />
</div>
```

- [ ] **Update `TeacherForm.tsx` interface and form**

Update the `Teacher` interface to include `birth_date`:

```typescript
interface Teacher {
  id: string
  email: string
  full_name: string
  phone?: string | null
  color?: string | null
  status?: string
  birth_date?: string | null
}
```

Add `birth_date` to the initial state:

```typescript
const [form, setForm] = useState({
  email: teacher?.email || '',
  full_name: teacher?.full_name || '',
  phone: teacher?.phone || '',
  password: '',
  color: teacher?.color || '#3B82F6',
  status: teacher?.status || 'active',
  birth_date: teacher?.birth_date || '',
})
```

Add the date input in the form JSX (after the full_name field):

```typescript
<div>
  <label className="block text-sm">Дата рождения</label>
  <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className="w-full border p-2 rounded" />
</div>
```

Update the PATCH body and POST body in the fetch calls to include `birth_date`:

```typescript
body: JSON.stringify({
  full_name: form.full_name,
  phone: form.phone || null,
  color: form.color,
  birth_date: form.birth_date || null,
  ...(form.password && { password: form.password }),
})
```

- [ ] **Verify forms work correctly**

- [ ] **Commit**

```bash
git add src/components/students/StudentForm.tsx src/components/teachers/TeacherForm.tsx src/app/admin/teachers/page.tsx src/app/api/teachers/route.ts src/app/api/teachers/[id]/route.ts
git commit -m "feat: add birth_date field to student and teacher forms"
```

---

### Task 10: Add toast animation to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Add slide-in animation**

```css
.toast-enter {
  animation: slideInRight 0.3s ease-out;
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
```

(Note: the `.fade-in` class already exists, so toasts already have basic animation. This adds a nicer right-slide effect for toasts. Optional — the existing `fade-in` class is already applied in NotificationToast.)

- [ ] **Commit**

```bash
git add src/app/globals.css
git commit -m "style: add toast slide-in animation"
```
