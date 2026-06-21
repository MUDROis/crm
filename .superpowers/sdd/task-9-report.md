# Task 9: Add birth_date to forms - Report

## Changes per file

### `src/components/students/StudentForm.tsx`
- Added `birth_date: string` to `Student` interface
- Added `birth_date: ''` to initial form state
- Added date input (`<input type="date">`) with label "Дата рождения" after the ФИО field in the grid

### `src/components/teachers/TeacherForm.tsx`
- Added `birth_date?: string | null` to `Teacher` interface
- Added `birth_date: teacher?.birth_date || ''` to initial form state
- Added date input (`<input type="date">`) with label "Дата рождения" before the phone field
- Added `birth_date: form.birth_date || null` to both PATCH and POST request bodies

### `src/app/admin/teachers/page.tsx`
- Added `birth_date?: string | null` to local `Teacher` interface
- Updated Supabase query to also select `birth_date`

### `src/app/api/teachers/route.ts`
- Added `birth_date` to destructured body variables
- Added `birth_date: birth_date || null` to profile update

### `src/app/api/teachers/[id]/route.ts`
- Added `if (body.birth_date !== undefined) updates.birth_date = body.birth_date` to PATCH handler

## Files changed
5 files modified

## Commits
- `0bca8e5` feat: add birth_date field to student and teacher forms

## TypeScript compilation
- PASS (no errors)
