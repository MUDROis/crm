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

  if (!group) return <div className="p-6">Р—Р°РіСЂСѓР·РєР°...</div>

  return (
    <div className="p-6">
      <button onClick={() => router.push('/admin/groups')} className="text-brand-600 mb-4 inline-block">в†ђ РќР°Р·Р°Рґ Рє РіСЂСѓРїРїР°Рј</button>

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              <button onClick={() => setShowEditForm(true)} className="text-left hover:text-brand-600">
                {group.name}
              </button>
            </h1>
            <p className="text-gray-600 mt-1">{group.subject || 'Р‘РµР· РїСЂРµРґРјРµС‚Р°'}</p>
            {group.teacher && (
              <p className="text-gray-600">РџСЂРµРїРѕРґР°РІР°С‚РµР»СЊ: {group.teacher.full_name}</p>
            )}
            {group.online_link && (
              <p className="text-sm mt-1">
                <a href={group.online_link} target="_blank" className="text-brand-600 underline">РЎСЃС‹Р»РєР° РЅР° РѕРЅР»Р°Р№РЅ-СѓСЂРѕРє</a>
              </p>
            )}
            <p className="text-sm mt-2">
              РЎС‚Р°С‚СѓСЃ:{' '}
              <span className={`font-semibold ${group.status === 'active' ? 'text-success' : 'text-gray-600'}`}>
                {group.status === 'active' ? 'РђРєС‚РёРІРЅР°СЏ' : 'РђСЂС…РёРІРЅР°СЏ'}
              </span>
            </p>
          </div>
          <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowNewLessonForm(true) }}
            className="bg-success text-white px-4 py-2 rounded hover:bg-success">
            + РќРѕРІС‹Р№ СѓСЂРѕРє
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <LessonCalendar role="admin" groupId={groupId} />
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('students')} className={`px-4 py-2 rounded ${tab === 'students' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>РЈС‡РµРЅРёРєРё</button>
        <button onClick={() => setTab('comments')} className={`px-4 py-2 rounded ${tab === 'comments' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>РљРѕРјРјРµРЅС‚Р°СЂРёРё</button>
      </div>

      <div className="bg-white rounded shadow p-6">
        {tab === 'students' && (
          groupStudents.length === 0
            ? <p className="text-gray-500">РќРµС‚ СѓС‡РµРЅРёРєРѕРІ</p>
            : <div className="space-y-2">
                {groupStudents.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center border rounded px-4 py-2">
                    <div>
                      <span className="font-medium">{s.full_name}</span>
                      {s.subject && <span className="text-gray-500 text-sm ml-2">({s.subject})</span>}
                    </div>
                    <button onClick={() => router.push(`/admin/students/${s.id}`)} className="text-brand-600 hover:underline text-sm">РџСЂРѕС„РёР»СЊ</button>
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
