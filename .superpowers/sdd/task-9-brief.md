### Task 9: Add birth_date to forms

**Files:**
- Modify: `src/components/students/StudentForm.tsx`
- Modify: `src/components/teachers/TeacherForm.tsx`
- Modify: `src/app/admin/teachers/page.tsx`
- Modify: `src/app/api/teachers/route.ts`
- Modify: `src/app/api/teachers/[id]/route.ts`

**Depends on:** Task 2 (`birth_date` column exists)

- [ ] **Update `src/app/admin/teachers/page.tsx`** — add `birth_date` to the type and query

Add `birth_date` to the local `Teacher` interface:
```typescript
interface Teacher {
  id: string
  email: string
  full_name: string
  status: string
  birth_date?: string | null
}
```

Update `loadTeachers` query to also select `birth_date`:
```typescript
let query = supabase.from('profiles').select('id, email, full_name, status, birth_date').eq('role', 'teacher')
```

- [ ] **Update `src/app/api/teachers/route.ts`** — add `birth_date` to POST

Destructure `birth_date` from body:
```typescript
const { email, password, full_name, phone, color, birth_date } = body
```

Add `birth_date` to profile update:
```typescript
const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .update({
    role: 'teacher',
    full_name: full_name || null,
    phone: phone || null,
    color: color || null,
    birth_date: birth_date || null,
  })
  .eq('id', userId)
```

- [ ] **Update `src/app/api/teachers/[id]/route.ts`** — add `birth_date` to PATCH

Add to the `updates` object:
```typescript
if (body.birth_date !== undefined) updates.birth_date = body.birth_date
```

- [ ] **Update `StudentForm.tsx`** — add `birth_date` field

Add `birth_date: string` to the `Student` interface:
```typescript
interface Student {
  id?: string
  full_name: string
  phone: string
  email: string
  subject: string
  teacher_id: string | null
  type: 'individual' | 'group'
  customer_name: string
  customer_contact: string
  notes: string
  online_link: string
  status: string
  birth_date: string
}
```

Add initial value in the `useState`:
```typescript
const [form, setForm] = useState<Student>(
  student || {
    full_name: '',
    phone: '',
    email: '',
    subject: '',
    teacher_id: null,
    type: 'individual',
    customer_name: '',
    customer_contact: '',
    notes: '',
    online_link: '',
    status: 'active',
    birth_date: '',
  }
)
```

Add the date input in the form JSX (after the ФИО field in the grid):
```typescript
<div>
  <label className="block text-sm">Дата рождения</label>
  <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className="w-full border p-2 rounded" />
</div>
```

- [ ] **Update `TeacherForm.tsx`** — add `birth_date` field

Update the `Teacher` interface to include `birth_date`:
```typescript
interface Teacher {
  id: string
  email: string
  full_name: string
  phone?: string | null
  color?: string | null
  status?: string
  birth_date?: string | null
}
```

Add `birth_date` to the initial state:
```typescript
const [form, setForm] = useState({
  email: teacher?.email || '',
  full_name: teacher?.full_name || '',
  phone: teacher?.phone || '',
  password: '',
  color: teacher?.color || '#3B82F6',
  status: teacher?.status || 'active',
  birth_date: teacher?.birth_date || '',
})
```

Add the date input in the form JSX (after the ФИО/phone fields):
```typescript
<div>
  <label className="block text-sm">Дата рождения</label>
  <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className="w-full border p-2 rounded" />
</div>
```

Update the PATCH body and POST body in the fetch calls to include `birth_date`:
```typescript
body: JSON.stringify({
  full_name: form.full_name,
  phone: form.phone || null,
  color: form.color,
  birth_date: form.birth_date || null,
  ...(form.password && { password: form.password }),
})
```

- [ ] **Verify TypeScript compiles** — run `npx tsc --noEmit`

- [ ] **Commit**

```bash
git add src/components/students/StudentForm.tsx src/components/teachers/TeacherForm.tsx src/app/admin/teachers/page.tsx src/app/api/teachers/route.ts src/app/api/teachers/[id]/route.ts
git commit -m "feat: add birth_date field to student and teacher forms"
```
