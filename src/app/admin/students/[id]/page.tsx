'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import StudentForm from '@/components/students/StudentForm'
import StudentTabs from '@/components/students/StudentTabs'
import LessonCalendar from '@/components/lessons/LessonCalendar'
import LessonForm from '@/components/lessons/LessonForm'

export default function StudentProfilePage() {
  const params = useParams()
  const studentId = params.id as string
  const [student, setStudent] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showNewLessonForm, setShowNewLessonForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
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
    loadStudent()
  }

  if (!student) return <div className="p-6">Р—Р°РіСЂСѓР·РєР°...</div>

  return (
    <div className="p-6">
      {/* РЁР°РїРєР° РїСЂРѕС„РёР»СЏ */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              <button onClick={() => setShowEditForm(true)} className="text-left hover:text-brand-600">
                {student.full_name}
              </button>
            </h1>
            <p className="text-gray-600 mt-1">
              {student.subject} В· {student.type === 'individual' ? 'РРЅРґРёРІРёРґСѓР°Р»СЊРЅРѕ' : 'Р“СЂСѓРїРїР°'}
            </p>
            {student.teacher && (
              <p className="text-gray-600">РџСЂРµРїРѕРґР°РІР°С‚РµР»СЊ: {student.teacher.full_name}</p>
            )}
            <p className="text-sm mt-2">
              РЎС‚Р°С‚СѓСЃ: <span className={`font-semibold ${student.status === 'active' ? 'text-success' : student.status === 'paused' ? 'text-warning' : student.status === 'stopped' ? 'text-danger' : 'text-gray-600'}`}>
                {student.status === 'active' ? 'РђРєС‚РёРІРЅС‹Р№' : student.status === 'paused' ? 'РџСЂРёРѕСЃС‚Р°РЅРѕРІР»РµРЅ' : student.status === 'stopped' ? 'Р‘СЂРѕСЃРёР»' : 'РђСЂС…РёРІРЅС‹Р№'}
              </span>
            </p>
            {student.notes && <p className="text-sm text-gray-500 mt-2">{student.notes}</p>}
          </div>
          <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowNewLessonForm(true) }}
            className="bg-success text-white px-4 py-2 rounded hover:bg-success">
            + РќРѕРІС‹Р№ СѓСЂРѕРє
          </button>
        </div>
      </div>

      {/* Р Р°СЃРїРёСЃР°РЅРёРµ РІСЃРµРіРґР° СЃРІРµСЂС…Сѓ */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <LessonCalendar
          role="admin"
          studentId={studentId}
          groupIds={groupIds}
          onDayClick={handleDayClick}
        />
      </div>

      {/* Р’РєР»Р°РґРєРё РїРѕРґ СЂР°СЃРїРёСЃР°РЅРёРµРј */}
      <StudentTabs studentId={studentId} />

      {/* Р¤РѕСЂРјР° СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ СѓС‡РµРЅРёРєР° */}
      {showEditForm && student && (
        <StudentForm
          student={student}
          onClose={() => setShowEditForm(false)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Р¤РѕСЂРјР° РЅРѕРІРѕРіРѕ СѓСЂРѕРєР° */}
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
            type: 'individual',
            student_id: studentId,
            group_id: null,
            teacher_id: student.teacher_id || '',
            online_link: student.online_link || '',
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