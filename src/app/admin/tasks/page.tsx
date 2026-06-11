'use client'

import { useState } from 'react'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'

export default function AdminTasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const handleEdit = (task: any) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  const handleSaved = () => {
    setShowForm(false)
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Задачи</h1>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Поставить задачу
        </button>
      </div>
      <TaskList role="admin" onEdit={handleEdit} />
      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          task={editingTask}
        />
      )}
    </div>
  )
}