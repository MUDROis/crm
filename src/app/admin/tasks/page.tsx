'use client'

import { useState, useCallback } from 'react'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'

export default function AdminTasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (task: any) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  const handleSaved = useCallback(() => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-end items-center mb-6">
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">
          + Поставить задачу
        </button>
      </div>
      <TaskList key={refreshKey} role="admin" onEdit={handleEdit} />
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