'use client'

import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'

export default function GroupCommentsTab({ groupId }: { groupId: string }) {
  const { data: comments, loading } = useSupabaseQuery(`group-comments-${groupId}`, async (supabase) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('lesson_date, start_time, comment, profiles!teacher_id(full_name)')
      .eq('group_id', groupId)
      .eq('status', 'completed')
      .not('comment', 'is', null)
      .order('lesson_date', { ascending: false })
      .limit(50)
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
            {c.lesson_date} {c.start_time?.slice(0, 5)} · {c.profiles?.full_name || 'Неизвестный преподаватель'}
          </div>
          <p className="mt-1 whitespace-pre-wrap">{c.comment}</p>
        </div>
      ))}
    </div>
  )
}
