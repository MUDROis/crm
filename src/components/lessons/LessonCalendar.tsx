'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import LessonForm from '@/components/lessons/LessonForm'
import { updateSubscriptionUsage } from '@/utils/subscriptions'

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
  original_lesson_id?: string | null
  student_id?: string | null
  group_id?: string | null
  teacher_id?: string | null
}

export default function LessonCalendar({ role }: { role: string }) {
  const [lessons, setLessons] = useState<CalendarLesson[]>([])
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const [editingLesson, setEditingLesson] = useState<CalendarLesson | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [postponePrefill, setPostponePrefill] = useState<any>(null)
  const [showPostponeForm, setShowPostponeForm] = useState(false)
  const supabase = createClient()

  function getMonday(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
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
      teacher:profiles!teacher_id(full_name)
    `).gte('lesson_date', weekStart).lte('lesson_date', endStr).order('lesson_date').order('start_time')

    const { data, error } = await query
    if (!error && data) {
      setLessons(data)
    }
    setLoading(false)
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Удалить урок навсегда? Это действие нельзя отменить.')) return

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ original_lesson_id: null })
      .eq('original_lesson_id', lessonId)

    if (updateError) {
      alert('Ошибка при подготовке к удалению: ' + updateError.message)
      return
    }

    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) {
      alert('Ошибка при удалении: ' + error.message)
    } else {
      loadLessons()
    }
  }

  function openComment(lesson: CalendarLesson) {
    setEditingLesson(lesson)
    setCommentText(lesson.comment || '')
    setShowCommentModal(true)
  }

  async function saveComment() {
    if (editingLesson) {
      await supabase.from('lessons').update({ comment: commentText }).eq('id', editingLesson.id)
      setShowCommentModal(false)
      loadLessons()
    }
  }

  function openEditForm(lesson: CalendarLesson) {
    setEditingLesson(lesson)
    setShowEditForm(true)
  }

  function changeWeek(offset: number) {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + offset * 7)
    setWeekStart(getMonday(newStart))
  }

  async function changeStatus(lessonId: string, newStatus: string) {
    const lesson = lessons.find(l => l.id === lessonId)
    const oldStatus = lesson?.status

    const { error } = await supabase.from('lessons').update({ status: newStatus }).eq('id', lessonId)
    if (!error) {
      await updateSubscriptionUsage(lessonId, newStatus, oldStatus)
      loadLessons()
    } else {
      alert(error.message)
    }
  }

  const handlePostponeFromEdit = (lessonData: any) => {
    supabase.from('lessons').update({ status: 'postponed' }).eq('id', lessonData.id!).then(() => {
      const newDate = new Date(lessonData.lesson_date)
      newDate.setDate(newDate.getDate() + 7)
      const prefill = {
        ...lessonData,
        id: undefined,
        lesson_date: newDate.toISOString().split('T')[0],
        status: 'planned',
      }
      setPostponePrefill(prefill)
      setShowEditForm(false)
      setShowPostponeForm(true)
    })
  }

  const handleClosePostpone = () => {
    setShowPostponeForm(false)
    setPostponePrefill(null)
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
        <h2 className="text-xl font-semibold">{weekStart} — {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toISOString().split('T')[0]}</h2>
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
              <div key={idx} className="border rounded p-2 min-h-[150px]">
                <div className="font-semibold text-sm">{day} {date.getDate()}</div>
                {lessonsByDay[dateStr]?.map(lesson => (
                  <div key={lesson.id} className={`mt-1 p-1 rounded text-xs ${
                    lesson.status === 'completed' ? 'bg-green-100' :
                    lesson.status === 'cancelled' || lesson.status === 'postponed' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <div className="font-medium">{lesson.start_time?.slice(0, 5)}-{lesson.end_time?.slice(0, 5)}</div>
                    <div>{lesson.student?.full_name || lesson.group?.name || '—'}</div>
                    <div className="text-gray-600">{lesson.teacher?.full_name}</div>
                    {lesson.online_link && (
                      <a href={lesson.online_link} target="_blank" className="text-blue-500 underline block">Ссылка</a>
                    )}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <button onClick={() => openComment(lesson)} className="text-blue-600 hover:underline">Комм.</button>
                      <button onClick={() => openEditForm(lesson)} className="text-purple-600 hover:underline">Ред.</button>
                      {role === 'admin' && (
                        <>
                          {lesson.status === 'planned' && (
                            <button onClick={() => changeStatus(lesson.id, 'completed')} className="text-green-600 hover:underline">Пров.</button>
                          )}
                          {lesson.status === 'completed' && (
                            <button onClick={() => changeStatus(lesson.id, 'planned')} className="text-blue-600 hover:underline">Запл.</button>
                          )}
                          <button onClick={() => deleteLesson(lesson.id)} className="text-red-600 hover:underline">Удал.</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {showCommentModal && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Комментарий к уроку</h2>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full border p-2 rounded h-32"
              placeholder="Что прошли, прогресс, домашнее задание..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setShowCommentModal(false)} className="px-4 py-2 border rounded">Отмена</button>
              <button onClick={saveComment} className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editingLesson && (
        <LessonForm
          onClose={() => {
            setShowEditForm(false)
            setEditingLesson(null)
          }}
          onSaved={() => {
            setShowEditForm(false)
            setEditingLesson(null)
            loadLessons()
          }}
          lesson={{
            id: editingLesson.id,
            lesson_date: editingLesson.lesson_date,
            start_time: editingLesson.start_time,
            end_time: editingLesson.end_time,
            type: editingLesson.type as 'individual' | 'group',
            student_id: editingLesson.student_id,
            group_id: editingLesson.group_id,
            teacher_id: editingLesson.teacher_id || '',
            online_link: editingLesson.online_link,
            comment: editingLesson.comment,
            status: editingLesson.status,
          }}
          role={role}
          onPostpone={handlePostponeFromEdit}
        />
      )}

      {showPostponeForm && postponePrefill && (
        <LessonForm
          onClose={handleClosePostpone}
          onSaved={() => {
            setShowPostponeForm(false)
            setPostponePrefill(null)
            loadLessons()
          }}
          prefillData={postponePrefill}
          role={role}
          lesson={null}
        />
      )}
    </div>
  )
}