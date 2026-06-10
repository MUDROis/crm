'use client'

import { useState } from 'react'
import LessonCalendar from '@/components/lessons/LessonCalendar'
import LessonForm from '@/components/lessons/LessonForm'

export default function TeacherLessonsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<any>(null)

  const handleSaved = () => {
    setShowForm(false)
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои уроки</h1>
        <button onClick={() => { setEditingLesson(null); setShowForm(true) }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Новый урок
        </button>
      </div>
      <LessonCalendar role="teacher" />
      {showForm && (
        <LessonForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          lesson={editingLesson}
          role="teacher"
        />
      )}
    </div>
  )
}