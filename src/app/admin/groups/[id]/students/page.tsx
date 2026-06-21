'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Student {
  id: string
  full_name: string
  subject: string
}

export default function GroupStudentsPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [group, setGroup] = useState<any>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) return
    loadData()
  }, [groupId])

  async function loadData() {
    // Группа
    const { data: grp } = await supabase.from('groups').select('*').eq('id', groupId).single()
    setGroup(grp)

    // Все ученики
    const { data: all } = await supabase.from('students').select('id, full_name, subject').order('full_name')
    setAllStudents(all || [])

    // Ученики в группе
    const { data: inGroup } = await supabase
      .from('group_students')
      .select('student:students(id, full_name, subject)')
      .eq('group_id', groupId)
    const mapped = (inGroup || []).map((item: any) => item.student)
    setGroupStudents(mapped)

    setLoading(false)
  }

  async function addStudent(studentId: string) {
    await supabase.from('group_students').insert({ group_id: groupId, student_id: studentId })
    loadData()
  }

  async function removeStudent(studentId: string) {
    await supabase.from('group_students').delete().eq('group_id', groupId).eq('student_id', studentId)
    loadData()
  }

  if (loading) return <p className="p-6">Загрузка...</p>
  if (!group) return <p className="p-6">Группа не найдена</p>

  const studentsNotInGroup = allStudents.filter((s) => !groupStudents.find((gs) => gs.id === s.id))

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="text-brand-600 mb-4 inline-block">← Назад к группам</button>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">В группе ({groupStudents.length})</h2>
          {groupStudents.length === 0 ? (
            <p className="text-gray-500">Нет учеников</p>
          ) : (
            <ul className="space-y-2">
              {groupStudents.map((s) => (
                <li key={s.id} className="flex justify-between items-center border p-2 rounded">
                  <span>{s.full_name} ({s.subject})</span>
                  <button onClick={() => removeStudent(s.id)} className="text-danger text-sm hover:underline">Удалить</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Доступные ученики</h2>
          {studentsNotInGroup.length === 0 ? (
            <p className="text-gray-500">Все ученики уже в группе</p>
          ) : (
            <ul className="space-y-2">
              {studentsNotInGroup.map((s) => (
                <li key={s.id} className="flex justify-between items-center border p-2 rounded">
                  <span>{s.full_name} ({s.subject})</span>
                  <button onClick={() => addStudent(s.id)} className="text-success text-sm hover:underline">Добавить</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}