import { createClient } from '@/utils/supabase/client'

export async function updateSubscriptionUsage(
  lessonId: string,
  newStatus: string,
  oldStatus?: string | null
) {
  if (newStatus === oldStatus) return

  const supabase = createClient()

  // Получаем урок с нужными полями
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('type, student_id, group_id')
    .eq('id', lessonId)
    .single()

  if (error || !lesson) return

  let studentIds: string[] = []

  if (lesson.type === 'individual' && lesson.student_id) {
    studentIds = [lesson.student_id]
  } else if (lesson.type === 'group' && lesson.group_id) {
    const { data: members } = await supabase
      .from('group_students')
      .select('student_id')
      .eq('group_id', lesson.group_id)

    if (members) studentIds = members.map((m: any) => m.student_id)
  }

  if (studentIds.length === 0) return

  for (const studentId of studentIds) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentId)
      .gt('remaining_lessons', 0)
      .order('created_at', { ascending: false })

    const activeSub = subs?.[0]
    if (!activeSub) continue

    // Списать, если новый статус completed, а старый не completed
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      await supabase
        .from('subscriptions')
        .update({ remaining_lessons: activeSub.remaining_lessons - 1 })
        .eq('id', activeSub.id)
    }
    // Вернуть, если старый статус completed, а новый не completed
    else if (oldStatus === 'completed' && newStatus !== 'completed') {
      await supabase
        .from('subscriptions')
        .update({ remaining_lessons: activeSub.remaining_lessons + 1 })
        .eq('id', activeSub.id)
    }
  }
}