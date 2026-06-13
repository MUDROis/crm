'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import LessonCalendar from '@/components/lessons/LessonCalendar'
import LessonForm from '@/components/lessons/LessonForm'

export default function StudentScheduleTab({ studentId }: { studentId: string }) {
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadGroupIds()
  }, [studentId])

  async function loadGroupIds() {
    const { data } = await supabase
      .from('group_students')
      .select('group_id')
      .eq('student_id', studentId)
    if (data) setGroupIds(data.map((g: any) => g.group_id))
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setShowNewForm(true)
  }

  const handleCloseForm = () => {
    setShowNewForm(false)
    setSelectedDate(null)
  }

  const handleSaved = () => {
    setShowNewForm(false)
    setSelectedDate(null)
  }

  return (
    <div>
      <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowNewForm(true) }}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        + Новый урок
      </button>
      <LessonCalendar
        role="admin"
        studentId={studentId}
        groupIds={groupIds}
        onDayClick={handleDayClick}
      />
      {showNewForm && selectedDate && (
        <LessonForm
          onClose={handleCloseForm}
          onSaved={handleSaved}
          lesson={null}
          role="admin"
          prefillData={{
            lesson_date: selectedDate,
            start_time: '',
            end_time: '',
            type: 'individual',
            student_id: studentId,
            group_id: null,
            teacher_id: '',
            online_link: '',
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