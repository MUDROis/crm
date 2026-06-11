'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Task {
  id: string
  assigned_to: string
  created_by: string
  title: string
  description: string
  completed: boolean
  due_date: string
  created_at: string
  assigned: { full_name: string } | null
  creator: { full_name: string } | null
}

export default function TaskList({
  role,
  onEdit,
}: {
  role: 'admin' | 'teacher'
  onEdit?: (task: Task) => void
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [role])

  async function loadTasks() {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*, assigned:profiles!assigned_to(full_name), creator:profiles!created_by(full_name)')
      .order('created_at', { ascending: false })

    // Если преподаватель, показываем только его задачи
    if (role === 'teacher') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) query = query.eq('assigned_to', user.id)
    }

    const { data, error } = await query
    if (!error && data) setTasks(data)
    setLoading(false)
  }

  async function toggleComplete(taskId: string, current: boolean) {
    await supabase.from('tasks').update({ completed: !current }).eq('id', taskId)
    loadTasks()
  }

  async function handleDelete(taskId: string) {
    if (confirm('Удалить задачу?')) {
      await supabase.from('tasks').delete().eq('id', taskId)
      loadTasks()
    }
  }

  if (loading) return <p>Загрузка...</p>

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
        {tasks.map((task) => (
          <tr key={task.id} className={task.completed ? 'bg-green-50' : ''}>
            <td className="border p-2">
              {task.completed ? '✅ Выполнено' : '⏳ Ожидает'}
            </td>
            <td className="border p-2">
              <div className="font-medium">{task.title}</div>
              {task.description && <div className="text-xs text-gray-600">{task.description}</div>}
            </td>
            {role === 'admin' && <td className="border p-2">{task.assigned?.full_name || '-'}</td>}
            <td className="border p-2">{task.due_date || '-'}</td>
            <td className="border p-2 space-x-2">
              {role === 'teacher' && !task.completed && (
                <button onClick={() => toggleComplete(task.id, task.completed)} className="text-green-600 hover:underline">
                  Выполнено
                </button>
              )}
              {role === 'teacher' && task.completed && (
                <button onClick={() => toggleComplete(task.id, task.completed)} className="text-blue-600 hover:underline">
                  Вернуть в работу
                </button>
              )}
              {role === 'admin' && onEdit && (
                <button onClick={() => onEdit(task)} className="text-blue-600 hover:underline">
                  Ред.
                </button>
              )}
              {role === 'admin' && (
                <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:underline">
                  Удал.
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}