'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/components/ui/Modal'

interface Lesson {
  id: string
  lesson_date: string
  start_time: string | null
  end_time: string | null
  type: string
  status: string
  comment: string | null
  group: { name: string } | null
  teacher: { full_name: string } | null
}

interface Subscription {
  id: string
  total_lessons: number
  remaining_lessons: number
  cost: number
  valid_until: string | null
}

interface Payment {
  id: string
  amount: number
  subscription_id: string | null
  type: string
}

export default function StudentInfoModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [student, setStudent] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'subscriptions' | 'schedule'>('subscriptions')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Отменяем предыдущий запрос при изменении studentId
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    loadData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [studentId])

  async function loadData() {
    setLoading(true)
    setError(null)
    
    const supabase = createClient()

    try {
      // Параллельная загрузка независимых данных
      const [studentResult, subsResult, paymentsResult, individualLessonsResult, groupsResult] = await Promise.all([
        supabase
          .from('students')
          .select('*, teacher:profiles!teacher_id(full_name)')
          .eq('id', studentId)
          .single(),

        supabase
          .from('subscriptions')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false }),

        supabase
          .from('payments')
          .select('*')
          .eq('student_id', studentId)
          .eq('type', 'subscription'),

        supabase
          .from('lessons')
          .select('id, lesson_date, start_time, end_time, type, status, comment, group:groups!group_id(name), teacher:profiles!teacher_id(full_name)')
          .eq('student_id', studentId)
          .order('lesson_date', { ascending: false })
          .limit(50),

        supabase
          .from('group_students')
          .select('group_id')
          .eq('student_id', studentId),
      ])

      setStudent(studentResult.data)
      setSubscriptions(subsResult.data || [])
      setPayments(paymentsResult.data || [])

      // Загрузка групповых уроков только если есть группы
      let groupLessonData: any[] = []
      if (groupsResult.data && groupsResult.data.length > 0) {
        const groupIds = groupsResult.data.map((g: any) => g.group_id)
        
        const { data: groupLessons } = await supabase
          .from('lessons')
          .select('id, lesson_date, start_time, end_time, type, status, comment, group:groups!group_id(name), teacher:profiles!teacher_id(full_name)')
          .in('group_id', groupIds)
          .order('lesson_date', { ascending: false })
          .limit(50)
        
        groupLessonData = groupLessons || []
      }

      // Объединение и дедупликация уроков
      const allLessons = [...(individualLessonsResult.data || []), ...groupLessonData]
      const uniqueLessons = Array.from(new Map(allLessons.map((l: any) => [l.id, l])).values())
      uniqueLessons.sort((a: any, b: any) => 
        (b.lesson_date || '').localeCompare(a.lesson_date || '') || 
        (b.start_time || '').localeCompare(a.start_time || '')
      )
      setLessons(uniqueLessons)

    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err)
      setError('Ошибка при загрузке данных ученика. Пожалуйста, попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !error) {
    return (
      <Modal isOpen onClose={onClose} title="Загрузка...">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>
        </div>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal isOpen onClose={onClose} title="Ошибка">
        <p className="text-danger">{error}</p>
      </Modal>
    )
  }

  if (!student) return (
    <Modal isOpen onClose={onClose} title="Ученик">
      <p>Ученик не найден</p>
    </Modal>
  )

  return (
    <Modal isOpen onClose={onClose} title={student.full_name} maxWidth="4xl">
        <p className="text-gray-600">{student.subject} • {student.type === 'individual' ? 'Индивидуально' : 'Группа'}</p>
        {student.teacher && <p className="text-gray-600 mb-4">Преподаватель: {student.teacher.full_name}</p>}

        {/* Вкладки */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('subscriptions')}
            className={`px-4 py-2 rounded ${tab === 'subscriptions' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}
          >
            Абонементы
          </button>
          <button
            onClick={() => setTab('schedule')}
            className={`px-4 py-2 rounded ${tab === 'schedule' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}
          >
            Расписание
          </button>
        </div>

        {/* Содержимое вкладок */}
        {tab === 'subscriptions' && (
          <div>
            {subscriptions.length === 0 ? (
              <p>Нет активных абонементов</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Всего занятий</th>
                    <th className="border p-2 text-left">Осталось</th>
                    <th className="border p-2 text-left">Стоимость</th>
                    <th className="border p-2 text-left">Остаток ₽</th>
                    <th className="border p-2 text-left">Действует до</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => {
                    const subPayments = payments.filter(p => p.subscription_id === sub.id)
                    const paid = subPayments.length > 0
                      ? subPayments.reduce((sum, p) => sum + p.amount, 0)
                      : (sub.cost || 0)
                    const costPerLesson = sub.total_lessons > 0 ? paid / sub.total_lessons : 0
                    const remainingRubles = sub.remaining_lessons * costPerLesson
                    return (
                      <tr key={sub.id}>
                        <td className="border p-2">{sub.total_lessons}</td>
                        <td className="border p-2">{sub.remaining_lessons}</td>
                        <td className="border p-2">{(sub.cost || 0).toLocaleString()} ₽</td>
                        <td className="border p-2">{Math.round(remainingRubles).toLocaleString()} ₽</td>
                        <td className="border p-2">{sub.valid_until || 'Без срока'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'schedule' && (
          <div>
            {lessons.length === 0 ? (
              <p>Уроков нет</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Дата</th>
                    <th className="border p-2 text-left">Время</th>
                    <th className="border p-2 text-left">Тип</th>
                    <th className="border p-2 text-left">Группа</th>
                    <th className="border p-2 text-left">Преподаватель</th>
                    <th className="border p-2 text-left">Статус</th>
                    <th className="border p-2 text-left">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map(lesson => (
                    <tr key={lesson.id} className={lesson.status === 'completed' ? 'bg-green-50' : lesson.status === 'cancelled' || lesson.status === 'postponed' ? 'bg-red-50' : 'bg-white'}>
                      <td className="border p-2">{lesson.lesson_date}</td>
                      <td className="border p-2">{lesson.start_time?.slice(0,5)}-{lesson.end_time?.slice(0,5)}</td>
                      <td className="border p-2">{lesson.type === 'individual' ? 'Инд.' : 'Групп.'}</td>
                      <td className="border p-2">{lesson.group?.name || '-'}</td>
                      <td className="border p-2">{lesson.teacher?.full_name || '-'}</td>
                      <td className="border p-2">{lesson.status === 'planned' ? 'Запланирован' : lesson.status === 'completed' ? 'Проведён' : lesson.status === 'cancelled' ? 'Отменён' : 'Перенесён'}</td>
                      <td className="border p-2">{lesson.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
    </Modal>
  )
}
