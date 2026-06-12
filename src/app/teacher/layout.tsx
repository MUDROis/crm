import AuthGuard from '@/components/AuthGuard'
import TeacherNavbar from '@/components/TeacherNavbar'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="teacher">
      <TeacherNavbar />
      <div>{children}</div>
    </AuthGuard>
  )
}