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
