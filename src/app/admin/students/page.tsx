'use client'

import { useState } from 'react'
import StudentList from '@/components/students/StudentList'
import StudentForm from '@/components/students/StudentForm'

export default function AdminStudentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = () => setShowForm(true)

  const handleSaved = () => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ученики</h1>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">
          + Добавить ученика
        </button>
      </div>
      <StudentList key={refreshKey} />
      {showForm && (
        <StudentForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          student={null}
        />
      )}
    </div>
  )
}