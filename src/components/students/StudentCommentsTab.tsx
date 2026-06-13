'use client'

import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'

export default function StudentCommentsTab({ studentId }: { studentId: string }) {
  const { data: comments, loading } = useSupabaseQuery(`student-comments-${studentId}`, async (supabase) => {
    // Получаем group_id ученика
    const { data: groups } = await supabase
      .from('group_students')
      .select('group_id')
      .eq('student_id', studentId)
    const groupIds = groups?.map((g: any) => g.group_id) || []

    let query = supabase
      .from('lessons')
      .select('lesson_date, comment, teacher:profiles!teacher_id(full_name), type')
      .eq('status', 'completed')
      .not('comment', 'is', null)
      .order('lesson_date', { ascending: false })
      .limit(50)

    if (groupIds.length > 0) {
      // фильтруем: student_id = ... OR group_id in (...)
      query = query.or(`student_id.eq.${studentId},group_id.in.(${groupIds.join(',')})`)
    } else {
      query = query.eq('student_id', studentId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  })

  if (loading) return <p>Загрузка...</p>

  if (!comments || comments.length === 0) return <p>Нет комментариев</p>

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {comments.map((c: any, idx: number) => (
        <div key={idx} className="border-b pb-2">
          <div className="text-sm text-gray-500">
            {c.lesson_date} · {c.teacher?.full_name || 'Неизвестный преподаватель'}
          </div>
          <p className="mt-1 whitespace-pre-wrap">{c.comment}</p>
        </div>
      ))}
    </div>
  )
}