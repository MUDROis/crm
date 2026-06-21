'use client'

import { useState, useCallback } from 'react'
import LessonCalendar from '@/components/lessons/LessonCalendar'
import LessonForm from '@/components/lessons/LessonForm'

export default function AdminLessonsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = () => {
    setEditingLesson(null)
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
          + Новый урок
        </button>
      </div>
      <LessonCalendar key={refreshKey} role="admin" />
      {showForm && (
        <LessonForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          lesson={editingLesson}
          role="admin"
        />
      )}
    </div>
  )
}