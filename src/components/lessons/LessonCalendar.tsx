'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import LessonCardModal from '@/components/lessons/LessonCardModal'

interface CalendarLesson {
  id: string
  lesson_date: string
  start_time: string
  end_time: string
  type: string
  status: string
  online_link: string
  comment: string
  student: { full_name: string } | null
  group: { name: string } | null
  teacher: { full_name: string } | null
  subject: { name: string } | null
  room: { name: string } | null
  original_lesson_id?: string | null
  student_id?: string | null
  group_id?: string | null
  teacher_id?: string | null
  subject_id?: string | null
  room_id?: string | null
}

export default function LessonCalendar({ role }: { role: string }) {
  const [lessons, setLessons] = useState<CalendarLesson[]>([])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<CalendarLesson | null>(null)
  const supabase = createClient()

  function getMonday(date: Date): string {
    const d = new Date(date)
    d.setUTCHours(12, 0, 0, 0)
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    d.setUTCDate(diff)
    return d.toISOString().split('T')[0]
  }

  function formatWeekRange(start: string): string {
    const startDate = new Date(start)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    const startStr = startDate.toLocaleDateString('ru-RU', options)
    const endStr = endDate.toLocaleDateString('ru-RU', options)
    const year = endDate.getFullYear()
    return `${startStr} – ${endStr} ${year}`
  }

  useEffect(() => {
    loadLessons()
  }, [weekStart])

  async function loadLessons() {
    setLoading(true)
    const endDate = new Date(weekStart)
    endDate.setDate(endDate.getDate() + 6)
    const endStr = endDate.toISOString().split('T')[0]

    let query = supabase.from('lessons').select(`
      *,
      student:students!student_id(full_name),
      group:groups!group_id(name),
      teacher:profiles!teacher_id(full_name),
      subject:subjects!subject_id(name),
      room:rooms!room_id(name)
    `).gte('lesson_date', weekStart).lte('lesson_date', endStr).order('lesson_date').order('start_time')

    const { data, error } = await query
    if (!error && data) setLessons(data)
    setLoading(false)
  }

  function changeWeek(offset: number) {
    const currentStart = new Date(weekStart)
    currentStart.setDate(currentStart.getDate() + offset * 7)
    setWeekStart(getMonday(currentStart))
  }

  const handleLessonClick = (lesson: CalendarLesson) => {
    setSelectedLesson(lesson)
  }

  const handleCloseModal = () => {
    setSelectedLesson(null)
  }

  const handleUpdate = () => {
    loadLessons()
  }

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const lessonsByDay: { [key: string]: CalendarLesson[] } = {}
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    lessonsByDay[dateStr] = lessons.filter(l => l.lesson_date === dateStr)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeWeek(-1)} className="px-3 py-1 border rounded">← Пред.</button>
        <h2 className="text-xl font-semibold">{formatWeekRange(weekStart)}</h2>
        <button onClick={() => changeWeek(1)} className="px-3 py-1 border rounded">След. →</button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const date = new Date(weekStart)
            date.setDate(date.getDate() + idx)
            const dateStr = date.toISOString().split('T')[0]
            return (
              <div key={idx} className="border rounded p-2 min-h-[120px]">
                <div className="font-semibold text-sm">{day} {date.getDate()}</div>
                {lessonsByDay[dateStr]?.map(lesson => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`mt-1 p-1 rounded text-xs cursor-pointer ${
                      lesson.status === 'completed' ? 'bg-green-100' :
                      lesson.status === 'cancelled' || lesson.status === 'postponed' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}
                  >
                    <div className="font-medium">{lesson.start_time?.slice(0, 5)}-{lesson.end_time?.slice(0, 5)}</div>
                    <div>{lesson.student?.full_name || lesson.group?.name || '—'}</div>
                    {lesson.subject && <div className="text-gray-500">{lesson.subject.name}</div>}
                    {lesson.room && <div className="text-gray-500">каб. {lesson.room.name}</div>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {selectedLesson && (
        <LessonCardModal
          lesson={selectedLesson}
          role={role}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}