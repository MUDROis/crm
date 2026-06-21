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
