import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TeacherNavbar from '@/components/TeacherNavbar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') redirect('/admin')

  return (
    <div>
      <TeacherNavbar />
      <div>{children}</div>
    </div>
  )
}