'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole: 'admin' | 'teacher'
}) {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          router.replace('/login')
          return
        }

        // 1. Пробуем получить роль из метаданных (мгновенно!)
        const roleFromToken = session.user?.app_metadata?.role as string | undefined
        if (roleFromToken === requiredRole) {
          setAllowed(true)
          setChecking(false)
          return
        }

        // 2. Если роли нет в метаданных (старый пользователь), загружаем из profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile?.role === requiredRole) {
          setAllowed(true)
        } else {
          // Неправильная роль – перенаправляем в нужный раздел
          router.replace(profile?.role === 'admin' ? '/admin' : '/teacher')
        }
      } catch (err) {
        console.error('AuthGuard error:', err)
        router.replace('/login')
      } finally {
        setChecking(false)
      }
    }

    check()
  }, [supabase, router, requiredRole])

  if (checking) {
    // Теперь этот спиннер будет видно очень редко (только если метаданных нет)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Проверка доступа...</span>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}