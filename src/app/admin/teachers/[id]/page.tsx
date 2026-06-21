'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import TeacherForm from '@/components/teachers/TeacherForm'
import LessonCalendar from '@/components/lessons/LessonCalendar'

export default function TeacherProfilePage() {
  const params = useParams()
  const teacherId = params.id as string
  const [teacher, setTeacher] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadTeacher()
  }, [teacherId])

  async function loadTeacher() {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, status, color')
      .eq('id', teacherId)
      .single()
    if (data) setTeacher(data)
  }

  const handleEditSaved = () => {
    setShowEditForm(false)
    loadTeacher()
  }

  if (!teacher) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              <button onClick={() => setShowEditForm(true)} className="text-left hover:text-blue-600">
                {teacher.full_name}
              </button>
            </h1>
            <p className="text-gray-600 mt-1">{teacher.email}</p>
            {teacher.phone && <p className="text-gray-600">{teacher.phone}</p>}
            <p className="text-sm mt-2">
              Статус:{' '}
              <span className={`font-semibold ${teacher.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                {teacher.status === 'active' ? 'Активный' : 'Архивный'}
              </span>
            </p>
            {teacher.color && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Цвет:</span>
                <span className="h-4 w-8 rounded border" style={{ backgroundColor: teacher.color }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <LessonCalendar role="admin" teacherId={teacherId} />
      </div>

      {showEditForm && teacher && (
        <TeacherForm
          teacher={teacher}
          onClose={() => setShowEditForm(false)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}
