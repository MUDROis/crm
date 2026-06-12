'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function TeacherNavbar() {
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPendingTasks() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('completed', false)

      if (!error && count !== null) {
        setPendingCount(count)
      }
    }

    fetchPendingTasks()

    // Подписка на изменения задач в реальном времени
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchPendingTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link href="/teacher" className="text-xl font-bold text-gray-800 hover:text-blue-600">
        ИНТЕРАКТИВНАЯ ШКОЛА МУДРО
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/teacher/lessons" className="text-gray-600 hover:text-blue-600">
          Расписание
        </Link>
        <Link href="/teacher/tasks" className="relative text-gray-600 hover:text-blue-600">
          Задачи
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  )
}