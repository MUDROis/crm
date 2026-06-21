import AuthGuard from '@/components/AuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      <AdminNavbar />
      <Breadcrumbs />
      <div>{children}</div>
    </AuthGuard>
  )
}
