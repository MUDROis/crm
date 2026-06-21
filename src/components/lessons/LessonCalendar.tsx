'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import LessonCardModal from '@/components/lessons/LessonCardModal'
import LessonForm from '@/components/lessons/LessonForm'

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
  teacher: { full_name: string; color: string | null } | null
  subject: { name: string } | null
  room: { name: string } | null
  original_lesson_id?: string | null
  student_id?: string | null
  group_id?: string | null
  teacher_id?: string | null
  subject_id?: string | null
  room_id?: string | null
}

interface Props {
  role: string
  studentId?: string
  groupIds?: string[]
  teacherId?: string
  onDayClick?: (dateStr: string) => void
}

// Вспомогательная функция для добавления минут
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m + minutes, 0, 0)
  return date.toTimeString().slice(0, 5)
}

export default function LessonCalendar({ role, studentId, groupIds, teacherId, onDayClick }: Props) {
  const [lessons, setLessons] = useState<CalendarLesson[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<CalendarLesson | null>(null)
  const [newLessonPrefill, setNewLessonPrefill] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [filterTeacherId, setFilterTeacherId] = useState<string>('')
  const [filterRoomId, setFilterRoomId] = useState<string>('')
  const [filterStudentId, setFilterStudentId] = useState<string>('')
  const supabase = createClient()

  const weekStart = getMonday(new Date(selectedDate + 'T00:00:00'))

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
    loadFilters()
  }, [])

  async function loadFilters() {
    const [teachersRes, roomsRes, studentsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
      supabase.from('rooms').select('id, name'),
      supabase.from('students').select('id, full_name'),
    ])
    if (teachersRes.data) setTeachers(teachersRes.data)
    if (roomsRes.data) setRooms(roomsRes.data)
    if (studentsRes.data) setStudents(studentsRes.data)
  }

  useEffect(() => {
    loadLessons()
  }, [selectedDate, viewMode, filterTeacherId, filterRoomId, filterStudentId, studentId, groupIds])

  async function loadLessons() {
    setLoading(true)
    let startDate: string, endDate: string

    if (viewMode === 'day') {
      startDate = selectedDate
      endDate = selectedDate
    } else if (viewMode === 'week') {
      startDate = weekStart
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      endDate = end.toISOString().split('T')[0]
    } else {
      const d = new Date(selectedDate)
      d.setDate(1)
      startDate = d.toISOString().split('T')[0]
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      endDate = lastDay.toISOString().split('T')[0]
    }

    let query = supabase.from('lessons').select(`
      *,
      student:students!student_id(full_name),
      group:groups!group_id(name),
      teacher:profiles!teacher_id(full_name, color),
      subject:subjects!subject_id(name),
      room:rooms!room_id(name)
    `).gte('lesson_date', startDate).lte('lesson_date', endDate).order('lesson_date').order('start_time')

    if (teacherId) query = query.eq('teacher_id', teacherId)
    else if (filterTeacherId) query = query.eq('teacher_id', filterTeacherId)
    if (filterRoomId) query = query.eq('room_id', filterRoomId)
    if (filterStudentId) {
      const groupsOfStudent = await supabase.from('group_students').select('group_id').eq('student_id', filterStudentId)
      const groupIdList = groupsOfStudent.data?.map((g: any) => g.group_id) || []
      if (groupIdList.length > 0) {
        query = query.or(`student_id.eq.${filterStudentId},group_id.in.(${groupIdList.join(',')})`)
      } else {
        query = query.eq('student_id', filterStudentId)
      }
    } else if (studentId) {
      const filters = [`student_id.eq.${studentId}`]
      if (groupIds && groupIds.length > 0) filters.push(`group_id.in.(${groupIds.join(',')})`)
      if (filters.length > 0) query = query.or(filters.join(','))
    }

    const { data, error } = await query
    if (!error && data) setLessons(data)
    setLoading(false)
  }

  function navigate(offset: number) {
    const cur = new Date(selectedDate)
    if (viewMode === 'day') {
      cur.setDate(cur.getDate() + offset)
      setSelectedDate(cur.toISOString().split('T')[0])
    } else if (viewMode === 'week') {
      cur.setDate(cur.getDate() + offset * 7)
      setSelectedDate(getMonday(cur))
    } else {
      cur.setMonth(cur.getMonth() + offset)
      setSelectedDate(cur.toISOString().split('T')[0])
    }
  }

  const handleLessonClick = (lesson: CalendarLesson, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLesson(lesson)
  }

  const handleCloseModal = () => {
    setSelectedLesson(null)
  }

  const handleUpdate = () => {
    loadLessons()
  }

  const handleDayClick = (dateStr: string) => {
    if (viewMode === 'month') {
      setSelectedDate(dateStr)
      setViewMode('day')
    } else if (onDayClick) {
      onDayClick(dateStr)
    } else {
      setNewLessonPrefill({
        lesson_date: dateStr,
        start_time: '',
        end_time: '',
        type: 'individual',
        student_id: studentId || null,
        group_id: null,
        teacher_id: '',
        online_link: '',
        comment: '',
        status: 'planned',
        subject_id: null,
        room_id: null,
      })
    }
  }

  const handleTimeSlotClick = (hour: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = addMinutes(startTime, 50) // автоматическое окончание
    if (onDayClick) {
      onDayClick(selectedDate)
    } else {
      setNewLessonPrefill({
        lesson_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        type: 'individual',
        student_id: studentId || null,
        group_id: null,
        teacher_id: '',
        online_link: '',
        comment: '',
        status: 'planned',
        subject_id: null,
        room_id: null,
      })
    }
  }

  const handleCloseNewLesson = () => {
    setNewLessonPrefill(null)
  }

  const handleNewLessonSaved = () => {
    setNewLessonPrefill(null)
    loadLessons()
  }

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const lessonsByDay: { [key: string]: CalendarLesson[] } = {}
  for (const l of lessons) {
    if (!lessonsByDay[l.lesson_date]) lessonsByDay[l.lesson_date] = []
    lessonsByDay[l.lesson_date].push(l)
  }

  const renderLessonCard = (lesson: CalendarLesson) => {
    const teacherColor = lesson.teacher?.color || '#3B82F6'
    return (
      <div
        key={lesson.id}
        onClick={(e) => handleLessonClick(lesson, e)}
        className={`mt-1 p-1 rounded text-xs cursor-pointer border-l border-r border-t border-b-2 ${
          lesson.status === 'completed' ? 'bg-green-100' :
          lesson.status === 'cancelled' || lesson.status === 'postponed' ? 'bg-red-100' :
          'bg-blue-100'
        }`}
        style={{
          borderLeftColor: teacherColor,
          borderRightColor: teacherColor,
          borderTopColor: teacherColor,
          borderBottomColor: teacherColor,
        }}
      >
        <div className="font-medium">{lesson.start_time?.slice(0, 5)}-{lesson.end_time?.slice(0, 5)}</div>
        <div>{lesson.student?.full_name || lesson.group?.name || '—'}</div>
        {lesson.subject && <div className="text-gray-500">{lesson.subject.name}</div>}
        {lesson.room && <div className="text-gray-500">каб. {lesson.room.name}</div>}
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8)
    const dayLessons = lessonsByDay[selectedDate] || []

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>
        <div className="grid grid-cols-1 gap-1">
          {hours.map((hour) => {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`
            const slotLessons = dayLessons.filter(l => l.start_time >= timeSlot && l.start_time < `${(hour+1).toString().padStart(2, '0')}:00`)
            return (
              <div
                key={hour}
                className="border rounded p-2 min-h-[60px] flex cursor-pointer hover:bg-gray-50"
                onClick={() => handleTimeSlotClick(hour)}
              >
                <div className="w-12 text-sm text-gray-500">{timeSlot}</div>
                <div className="flex-1 space-y-1">
                  {slotLessons.map(renderLessonCard)}
                </div>
              </div>
            )
          })}
          {dayLessons.filter(l => l.start_time >= '20:00').map(renderLessonCard)}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day, idx) => {
          const date = new Date(weekStart)
          date.setDate(date.getDate() + idx)
          const dateStr = date.toISOString().split('T')[0]
          return (
            <div key={idx} className="border rounded p-2 min-h-[120px] cursor-pointer" onClick={() => handleDayClick(dateStr)}>
              <div className="font-semibold text-sm">{day} {date.getDate()}</div>
              {(lessonsByDay[dateStr] || []).map(renderLessonCard)}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const year = new Date(selectedDate).getFullYear()
    const month = new Date(selectedDate).getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const weeks: (number | null)[][] = []
    let week: (number | null)[] = []
    for (let i = 0; i < startDay; i++) week.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d)
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(d => <div key={d} className="text-center font-semibold text-sm">{d}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((dayNum, di) => {
              if (!dayNum) return <div key={di} className="border rounded min-h-[80px] p-1 bg-gray-50" />
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
              const dayLessons = lessonsByDay[dateStr] || []
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <div key={di} className={`border rounded min-h-[80px] p-1 cursor-pointer ${isToday ? 'bg-blue-50' : ''}`} onClick={() => handleDayClick(dateStr)}>
                  <div className="text-sm font-medium">{dayNum}</div>
                  <div className="space-y-0.5 mt-0.5">
                    {dayLessons.slice(0, 3).map(l => (
                      <div key={l.id} className="text-xs truncate" style={{ color: l.teacher?.color || '#3B82F6' }}>
                        {l.start_time?.slice(0,5)} {l.student?.full_name || l.group?.name}
                      </div>
                    ))}
                    {dayLessons.length > 3 && <div className="text-xs text-gray-500">+{dayLessons.length - 3}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
          <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded ${viewMode === 'day' ? 'bg-white shadow' : ''}`}>День</button>
          <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-white shadow' : ''}`}>Неделя</button>
          <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-white shadow' : ''}`}>Месяц</button>
        </div>

        <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">←</button>
        <button onClick={() => navigate(1)} className="px-3 py-1 border rounded">→</button>

        <span className="text-lg font-semibold">
          {viewMode === 'day' && new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {viewMode === 'week' && formatWeekRange(weekStart)}
          {viewMode === 'month' && new Date(selectedDate).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </span>

        <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setViewMode('week') }} className="px-3 py-1 border rounded">Сегодня</button>

        <div className="flex gap-2 ml-auto">
          <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)} className="border rounded p-1 text-sm">
            <option value="">Все преподаватели</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <select value={filterRoomId} onChange={e => setFilterRoomId(e.target.value)} className="border rounded p-1 text-sm">
            <option value="">Все кабинеты</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} className="border rounded p-1 text-sm">
            <option value="">Все ученики</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </>
      )}

      {selectedLesson && (
        <LessonCardModal
          lesson={selectedLesson}
          role={role}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
      )}

      {newLessonPrefill && (
        <LessonForm
          onClose={handleCloseNewLesson}
          onSaved={handleNewLessonSaved}
          lesson={null}
          role={role}
          prefillData={newLessonPrefill}
        />
      )}
    </div>
  )
}