'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import StudentTabs from '@/components/students/StudentTabs'

export default function StudentProfilePage() {
  const params = useParams()
  const studentId = params.id as string
  const [student, setStudent] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadStudent()
  }, [studentId])

  async function loadStudent() {
    const { data, error } = await supabase
      .from('students')
      .select('*, teacher:profiles!teacher_id(full_name)')
      .eq('id', studentId)
      .single()
    if (!error) setStudent(data)
  }

  if (!student) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-gray-600 mt-1">
          {student.subject} · {student.type === 'individual' ? 'Индивидуально' : 'Группа'}
          {student.teacher && ` · Преподаватель: ${student.teacher.full_name}`}
        </p>
        {student.notes && <p className="text-sm text-gray-500 mt-2">{student.notes}</p>}
      </div>

      <StudentTabs studentId={studentId} />
    </div>
  )
}