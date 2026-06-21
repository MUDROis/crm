### Task 7: Integrate into layouts and navbars

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/teacher/layout.tsx`
- Modify: `src/components/AdminNavbar.tsx`
- Modify: `src/components/TeacherNavbar.tsx`

**Depends on:** Task 4 (`NotificationProvider`), Task 5 (`NotificationBell`), Task 6 (`NotificationToast`)

- [ ] **Update `src/app/admin/layout.tsx`** — wrap with NotificationProvider, add NotificationToast

Replace file content with:
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

Replace file content with:
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

Read the current file first. Add `import NotificationBell from '@/components/NotificationBell'` at the top. Add `<NotificationBell />` at the start of the nav icons div (before 📅 link, which is the first child of the `div className="flex items-center gap-6 shrink-0"`).

- [ ] **Update `src/components/TeacherNavbar.tsx`** — import and add NotificationBell

Read the current file first. Add `import NotificationBell from '@/components/NotificationBell'` at the top. Add `<NotificationBell />` at the start of the nav icons div (before 📅 link, which is the first child of the `div className="flex items-center gap-6 shrink-0"`).

- [ ] **Verify all imports resolve** — no TypeScript errors

Run: `tsc --noEmit` to verify.

- [ ] **Commit**

```bash
git add src/app/admin/layout.tsx src/app/teacher/layout.tsx src/components/AdminNavbar.tsx src/components/TeacherNavbar.tsx
git commit -m "feat: integrate notifications into layouts and navbars"
```
