'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationBell from '@/components/NotificationBell'
import { createClient } from '@/utils/supabase/client'

interface TeacherNavbarProps {
  pendingCount?: number;
}

export default function TeacherNavbar({ pendingCount = 0 }: TeacherNavbarProps) {
  const [count, setCount] = useState<number>(pendingCount)

  useEffect(() => {
    // Если количество задач не передано, загружаем его из Supabase
    if (pendingCount === 0) {
      const supabase = createClient()
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userId = session.user.id
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', userId)
            .eq('completed', false)
            .then(({ count }: { count: number | null }) => {
              if (count !== null) setCount(count)
            })
            .catch(() => {})
        }
      }).catch(() => {})
    }
  }, [pendingCount])

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center gap-4">
      <Link href="/teacher" className="text-xl font-bold text-gray-800 hover:text-brand-600 shrink-0">
        ИНТЕРАКТИВНАЯ ШКОЛА МУДРО
      </Link>
      <GlobalSearch />
      <div className="flex items-center gap-6 shrink-0">
        <NotificationBell />
        <Link href="/teacher/lessons" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          📅
        </Link>
        <Link href="/teacher/tasks" className="relative text-2xl text-gray-600 hover:text-brand-600 transition">
          📋
          {count > 0 && (
            <span className="absolute -top-2 -right-5 bg-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </Link>
        <Link href="/teacher/students" className="text-2xl text-gray-600 hover:text-brand-600 transition">
          👩‍🎓
        </Link>
      </div>
    </nav>
  )
}
