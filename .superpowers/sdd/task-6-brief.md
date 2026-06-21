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
