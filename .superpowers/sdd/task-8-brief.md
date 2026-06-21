### Task 8: Birthday cron API route

**Files:**
- Create: `src/app/api/cron/birthdays/route.ts`

**Depends on:** Task 2 (`birth_date` column exists)

- [ ] **Create birthday cron API route**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get admin users
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  if (!admins || admins.length === 0) {
    return NextResponse.json({ inserted: 0 })
  }
  const adminIds = admins.map(a => a.id)

  // Get today's date in MM-DD format, and the next 3 days
  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i <= 3; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${mm}-${dd}`)
  }

  // Find students with birthdays
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, full_name, birth_date')
    .not('birth_date', 'is', null)
  const { data: teachers } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, birth_date')
    .eq('role', 'teacher')
    .not('birth_date', 'is', null)

  const birthdayPeople: { name: string; type: string; link: string }[] = []

  const isInRange = (dateStr: string) => {
    const mmdd = dateStr.slice(5)
    return dates.includes(mmdd)
  }

  for (const s of students || []) {
    if (isInRange(s.birth_date)) {
      birthdayPeople.push({ name: s.full_name, type: 'student', link: '/admin/students' })
    }
  }
  for (const t of teachers || []) {
    if (isInRange(t.birth_date)) {
      birthdayPeople.push({ name: t.full_name, type: 'teacher', link: '/admin/teachers' })
    }
  }

  if (birthdayPeople.length === 0) {
    return NextResponse.json({ inserted: 0 })
  }

  // Check for existing birthday notifications today to avoid duplicates
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: existingNotifs } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('type', 'birthday')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  // If any birthday notifications were created today, skip (prevents duplicates)
  if (existingNotifs && existingNotifs.length > 0) {
    return NextResponse.json({ inserted: 0, skipped: 'already sent today' })
  }

  let inserted = 0
  for (const person of birthdayPeople) {
    for (const adminId of adminIds) {
      const { error } = await supabaseAdmin.from('notifications').insert({
        user_id: adminId,
        title: `🎂 День рождения: ${person.name}`,
        body: person.type === 'student' ? 'У ученика сегодня день рождения' : 'У преподавателя сегодня день рождения',
        type: 'birthday',
        link: person.link,
      })
      if (!error) inserted++
    }
  }

  return NextResponse.json({ inserted })
}

export const dynamic = 'force-dynamic'
```

- [ ] **Verify route logic**

- [ ] **Add CRON_SECRET to .env.local**

```
CRON_SECRET=<generate-a-random-token>
```

Make sure to generate a real random token, not the literal `<generate-a-random-token>`.

- [ ] **Commit**

```bash
git add src/app/api/cron/birthdays/route.ts
git commit -m "feat: add birthday cron API route"
```
