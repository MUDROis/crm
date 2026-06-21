'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import GroupForm from '@/components/groups/GroupForm'
import LessonCalendar from '@/components/lessons/LessonCalendar'
import LessonForm from '@/components/lessons/LessonForm'
import GroupCommentsTab from '@/components/groups/GroupCommentsTab'

export default function GroupProfilePage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const [group, setGroup] = useState<any>(null)
  const [groupStudents, setGroupStudents] = useState<any[]>([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [showNewLessonForm, setShowNewLessonForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tab, setTab] = useState('students')
  const supabase = createClient()

  useEffect(() => {
    loadGroup()
    loadStudents()
  }, [groupId])

  async function loadGroup() {
    const { data } = await supabase
      .from('groups')
      .select('*, teacher:profiles!teacher_id(full_name)')
      .eq('id', groupId)
      .single()
    if (data) setGroup(data)
  }

  async function loadStudents() {
    const { data } = await supabase
      .from('group_students')
      .select('student:students(id, full_name, subject)')
      .eq('group_id', groupId)
    setGroupStudents((data || []).map((item: any) => item.student).filter(Boolean))
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setShowNewLessonForm(true)
  }

  const handleLessonSaved = () => {
    setShowNewLessonForm(false)
    setSelectedDate(null)
  }

  const handleEditSaved = () => {
    setShowEditForm(false)
    loadGroup()
  }

  if (!group) return <div className="p-6">Загрузка...</div>

  return (
    <div className="p-6">
      <button onClick={() => router.push('/admin/groups')} className="text-blue-600 mb-4 inline-block">← Назад к группам</button>

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              <button onClick={() => setShowEditForm(true)} className="text-left hover:text-blue-600">
                {group.name}
              </button>
            </h1>
            <p className="text-gray-600 mt-1">{group.subject || 'Без предмета'}</p>
            {group.teacher && (
              <p className="text-gray-600">Преподаватель: {group.teacher.full_name}</p>
            )}
            {group.online_link && (
              <p className="text-sm mt-1">
                <a href={group.online_link} target="_blank" className="text-blue-600 underline">Ссылка на онлайн-урок</a>
              </p>
            )}
            <p className="text-sm mt-2">
              Статус:{' '}
              <span className={`font-semibold ${group.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                {group.status === 'active' ? 'Активная' : 'Архивная'}
              </span>
            </p>
          </div>
          <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowNewLessonForm(true) }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + Новый урок
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <LessonCalendar role="admin" groupId={groupId} />
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('students')} className={`px-4 py-2 rounded ${tab === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Ученики</button>
        <button onClick={() => setTab('comments')} className={`px-4 py-2 rounded ${tab === 'comments' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Комментарии</button>
      </div>

      <div className="bg-white rounded shadow p-6">
        {tab === 'students' && (
          groupStudents.length === 0
            ? <p className="text-gray-500">Нет учеников</p>
            : <div className="space-y-2">
                {groupStudents.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center border rounded px-4 py-2">
                    <div>
                      <span className="font-medium">{s.full_name}</span>
                      {s.subject && <span className="text-gray-500 text-sm ml-2">({s.subject})</span>}
                    </div>
                    <button onClick={() => router.push(`/admin/students/${s.id}`)} className="text-blue-600 hover:underline text-sm">Профиль</button>
                  </div>
                ))}
              </div>
        )}
        {tab === 'comments' && <GroupCommentsTab groupId={groupId} />}
      </div>

      {showEditForm && group && (
        <GroupForm
          group={group}
          onClose={() => setShowEditForm(false)}
          onSaved={handleEditSaved}
        />
      )}

      {showNewLessonForm && selectedDate && (
        <LessonForm
          onClose={() => setShowNewLessonForm(false)}
          onSaved={handleLessonSaved}
          lesson={null}
          role="admin"
          prefillData={{
            lesson_date: selectedDate,
            start_time: '',
            end_time: '',
            type: 'group',
            student_id: null,
            group_id: groupId,
            teacher_id: group.teacher_id || '',
            online_link: group.online_link || '',
            comment: '',
            status: 'planned',
            subject_id: null,
            room_id: null,
          }}
        />
      )}
    </div>
  )
}
