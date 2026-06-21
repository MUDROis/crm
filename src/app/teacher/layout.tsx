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
