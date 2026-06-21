import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ students: [], groups: [] })
  }

  const supabase = await createClient()

  const [studentsResult, groupsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, subject')
      .eq('status', 'active')
      .ilike('full_name', `%${q}%`)
      .order('full_name')
      .limit(5),
    supabase
      .from('groups')
      .select('id, name, subject')
      .eq('status', 'active')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(5),
  ])

  return NextResponse.json({
    students: studentsResult.data || [],
    groups: groupsResult.data || [],
  })
}
