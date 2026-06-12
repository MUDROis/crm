'use client'

import { useState, useCallback } from 'react'
import StudentList from '@/components/students/StudentList'
import StudentForm from '@/components/students/StudentForm'

export default function AdminStudentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (student: any) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingStudent(null)
    setShowForm(true)
  }

  const handleSaved = useCallback(() => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1) // увеличиваем ключ → список пересоздаётся
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ученики</h1>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Добавить ученика
        </button>
      </div>
      <StudentList refreshKey={refreshKey} onEdit={handleEdit} />
      {showForm && (
        <StudentForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          student={editingStudent}
        />
      )}
    </div>
  )
}
