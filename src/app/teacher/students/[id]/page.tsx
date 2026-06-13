'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import LessonCalendar from '@/components/lessons/LessonCalendar'

export default function TeacherStudentProfilePage() {
  const params = useParams()
  const studentId = params.id as string
  const [student, setStudent] = useState<any>(null)
  const [groupIds, setGroupIds] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadStudent()
    loadGroupIds()
  }, [studentId])

  async function loadStudent() {
    const { data, error } = await supabase
      .from('students')
      .select('*, teacher:profiles!teacher_id(full_name)')
      .eq('id', studentId)
      .single()
    if (!error) setStudent(data)
  }

  async function loadGroupIds() {
    const { data } = await supabase
      .from('group_students')
      .select('group_id')
      .eq('student_id', studentId)
    if (data) setGroupIds(data.map((g: any) => g.group_id))
  }

  if (!student) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      {/* Информация об ученике (только чтение) */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-gray-600 mt-1">
          {student.subject} · {student.type === 'individual' ? 'Индивидуально' : 'Группа'}
        </p>
        {student.teacher && (
          <p className="text-gray-600">Преподаватель: {student.teacher.full_name}</p>
        )}
        <p className="text-sm mt-2">
          Статус: <span className={`font-semibold ${student.status === 'active' ? 'text-green-600' : student.status === 'paused' ? 'text-yellow-600' : student.status === 'stopped' ? 'text-red-600' : 'text-gray-600'}`}>
            {student.status === 'active' ? 'Активный' : student.status === 'paused' ? 'Приостановлен' : student.status === 'stopped' ? 'Бросил' : 'Архивный'}
          </span>
        </p>
        {student.notes && <p className="text-sm text-gray-500 mt-2">{student.notes}</p>}
      </div>

      {/* Расписание ученика (преподаватель видит, может открывать уроки) */}
      <div className="bg-white rounded shadow p-6">
        <LessonCalendar
          role="teacher"
          studentId={studentId}
          groupIds={groupIds}
        />
      </div>
    </div>
  )
}