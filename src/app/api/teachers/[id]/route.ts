import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: any = {}
    if (body.full_name !== undefined) updates.full_name = body.full_name
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.color !== undefined) updates.color = body.color
    if (body.birth_date !== undefined) updates.birth_date = body.birth_date

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (body.password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: body.password,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}