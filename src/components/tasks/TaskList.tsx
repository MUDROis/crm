'use client'

import { useState, useEffect } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function TaskList({
  role,
  onEdit,
}: {
  role: 'admin' | 'teacher'
  onEdit?: (task: any) => void
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Получаем userId для преподавателя
  useEffect(() => {
    if (role === 'teacher') {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setUserId(data.user.id)
      })
    } else {
      setUserId('admin') // фиктивный ключ
    }
    }, [role])

  const queryKey = role === 'admin' ? 'tasks-admin' : `tasks-${userId}`

  const { data: tasks, loading, refetch } = useSupabaseQuery(queryKey, async (supabase) => {
    let query = supabase
      .from('tasks')
      .select('*, assigned:profiles!assigned_to(full_name), creator:profiles!created_by(full_name)')
      .order('created_at', { ascending: false })

    if (role === 'teacher' && userId) {
      query = query.eq('assigned_to', userId)
    }
    const { data, error } = await query
    if (error) throw error
    return data || []
  })

  const toggleComplete = async (taskId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('tasks').update({ completed: !current }).eq('id', taskId)
    refetch()
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Удалить задачу?')) return
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', taskId)
    refetch()
  }

  if (loading || (role === 'teacher' && !userId)) return <p>Загрузка...</p>

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Статус</th>
          <th className="border p-2 text-left">Заголовок</th>
          {role === 'admin' && <th className="border p-2 text-left">Кому</th>}
          <th className="border p-2 text-left">Срок</th>
          <th className="border p-2 text-left">Действия</th>
        </tr>
      </thead>
      <tbody>
        {tasks?.map((task: any) => (
          <tr key={task.id} className={task.completed ? 'bg-green-50' : ''}>
            <td className="border p-2">{task.completed ? '✅ Выполнено' : '⏳ Ожидает'}</td>
            <td className="border p-2">
              <div className="font-medium">{task.title}</div>
              {task.description && <div className="text-xs text-gray-600">{task.description}</div>}
            </td>
            {role === 'admin' && <td className="border p-2">{task.assigned?.full_name || '-'}</td>}
            <td className="border p-2">{task.due_date || '-'}</td>
            <td className="border p-2 space-x-2">
              {role === 'teacher' && !task.completed && (
                <button onClick={() => toggleComplete(task.id, task.completed)} className="text-green-600 hover:underline">Выполнено</button>
              )}
              {role === 'teacher' && task.completed && (
                <button onClick={() => toggleComplete(task.id, task.completed)} className="text-blue-600 hover:underline">Вернуть в работу</button>
              )}
              {role === 'admin' && onEdit && (
                <button onClick={() => onEdit(task)} className="text-blue-600 hover:underline">Ред.</button>
              )}
              {role === 'admin' && (
                <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:underline">Удал.</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}