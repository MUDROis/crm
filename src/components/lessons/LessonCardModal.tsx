'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LessonForm from '@/components/lessons/LessonForm'

interface LessonData {
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
  student_id?: string | null
  group_id?: string | null
  teacher_id?: string | null
  subject_id?: string | null
  room_id?: string | null
}

interface Props {
  lesson: LessonData
  role: string
  onClose: () => void
  onUpdate: () => void
}

export default function LessonCardModal({ lesson, role, onClose, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const statusLabel =
    lesson.status === 'planned'
      ? 'Запланирован'
      : lesson.status === 'completed'
      ? 'Проведён'
      : lesson.status === 'cancelled'
      ? 'Отменён'
      : 'Перенесён'

  const duration = lesson.end_time
    ? (() => {
        const [sh, sm] = lesson.start_time.split(':').map(Number)
        const [eh, em] = lesson.end_time.split(':').map(Number)
        const mins = (eh * 60 + em) - (sh * 60 + sm)
        return `${mins} мин.`
      })()
    : ''

  const handleOverlayClick = () => {
    if (editing) setEditing(false)
    else onClose()
  }

  const handleCancelLesson = async () => {
    if (!confirm('Отменить урок?')) return
    const { error } = await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', lesson.id)
    if (error) alert(error.message)
    else onUpdate()
    onClose()
  }

  const handleConductFromView = async () => {
    const { error } = await supabase.from('lessons').update({ status: 'completed' }).eq('id', lesson.id)
    if (error) return alert(error.message)
    const { updateSubscriptionUsage } = await import('@/utils/subscriptions')
    await updateSubscriptionUsage(lesson.id, 'completed', lesson.status)
    onUpdate()
    onClose()
  }

  const handleConduct = async (formData: any) => {
    const { error } = await supabase.from('lessons').update({ ...formData, status: 'completed' }).eq('id', lesson.id)
    if (error) return alert(error.message)
    const { updateSubscriptionUsage } = await import('@/utils/subscriptions')
    await updateSubscriptionUsage(lesson.id, 'completed', lesson.status)
    onUpdate()
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm('Удалить урок навсегда?')) return
    await supabase.from('lessons').update({ original_lesson_id: null }).eq('original_lesson_id', lesson.id)
    await supabase.from('lessons').delete().eq('id', lesson.id)
    onUpdate()
    onClose()
  }

  const handlePostpone = () => {
    onClose()
    window.dispatchEvent(new CustomEvent('postponeLesson', { detail: lesson }))
  }

  // Переходы по ссылкам
  const goToStudent = () => {
    if (lesson.student_id) {
      const basePath = role === 'teacher' ? '/teacher/students' : '/admin/students'
      router.push(`${basePath}/${lesson.student_id}`)
    }
    onClose()
  }

  const goToGroup = () => {
    if (lesson.group_id) {
      const basePath = role === 'teacher' ? '/teacher/students' : '/admin/groups'
      router.push(`${basePath}/${lesson.group_id}/students`)
    } else {
      const basePath = role === 'teacher' ? '/teacher/students' : '/admin/groups'
      router.push(basePath)
    }
    onClose()
  }

  const goToTeacher = () => {
    if (lesson.teacher_id) {
      const basePath = '/admin/teachers'
      router.push(`${basePath}/${lesson.teacher_id}`)
    }
    onClose()
  }

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleOverlayClick}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <LessonForm
            lesson={{
              id: lesson.id,
              lesson_date: lesson.lesson_date,
              start_time: lesson.start_time,
              end_time: lesson.end_time,
              type: lesson.type as 'individual' | 'group',
              student_id: lesson.student_id,
              group_id: lesson.group_id,
              teacher_id: lesson.teacher_id || '',
              online_link: lesson.online_link,
              comment: lesson.comment,
              status: lesson.status,
              subject_id: lesson.subject_id,
              room_id: lesson.room_id,
            }}
            role={role}
            onClose={() => setEditing(false)}
            onSaved={() => { onUpdate(); onClose() }}
            onConduct={handleConduct}
            onDelete={handleDelete}
            onPostpone={handlePostpone}
            showDeleteButton={true}
            showPostponeButton={true}
            showConductButton={true}
            showSaveButton={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">
          {statusLabel} – {lesson.type === 'individual' ? 'Индивидуальный' : 'Групповой'}
        </h2>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Время:</span>{' '}
            {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}{' '}
            {duration && `(${duration})`}
          </div>
          {lesson.room && (
            <div>
              <span className="font-semibold">Кабинет:</span> {lesson.room.name}
            </div>
          )}
          {lesson.online_link && (
            <div>
              <span className="font-semibold">Ссылка:</span>{' '}
              <a href={lesson.online_link} target="_blank" className="text-blue-600 underline">
                Открыть
              </a>
            </div>
          )}
          <div>
            <span className="font-semibold">Педагог:</span>{' '}
            {lesson.teacher?.full_name ? (
              <span className="cursor-pointer text-blue-600 hover:underline" onClick={goToTeacher}>
                {lesson.teacher.full_name}
              </span>
            ) : 'Не назначен'}
          </div>
          {lesson.subject && (
            <div>
              <span className="font-semibold">Предмет:</span> {lesson.subject.name}
            </div>
          )}
          <div>
            <span className="font-semibold">Участники:</span>{' '}
            {lesson.type === 'individual' ? (
              lesson.student?.full_name ? (
                <span className="cursor-pointer text-blue-600 hover:underline" onClick={goToStudent}>
                  {lesson.student.full_name}
                </span>
              ) : '—'
            ) : (
              lesson.group?.name ? (
                <span className="cursor-pointer text-blue-600 hover:underline" onClick={goToGroup}>
                  {lesson.group.name}
                </span>
              ) : '—'
            )}
          </div>
          <div>
            <span className="font-semibold">Комментарий:</span>
            <p className="mt-1 text-gray-700 whitespace-pre-wrap">
              {lesson.comment || '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleCancelLesson} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            Отменить ✕
          </button>
          <button onClick={handleConductFromView} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Провести
          </button>
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Открыть ✓
          </button>
        </div>
      </div>
    </div>
  )
}
