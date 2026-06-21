# Task 7 Report: Integrate notifications into layouts and navbars

## What was changed

- **`src/app/admin/layout.tsx`** — wrapped content with `<NotificationProvider>` and added `<NotificationToast />` at the end
- **`src/app/teacher/layout.tsx`** — wrapped content with `<NotificationProvider>` and added `<NotificationToast />` at the end
- **`src/components/AdminNavbar.tsx`** — added `import NotificationBell` and inserted `<NotificationBell />` as the first child of the nav icons flex container
- **`src/components/TeacherNavbar.tsx`** — added `import NotificationBell` and inserted `<NotificationBell />` as the first child of the nav icons flex container

## Files changed

- `src/app/admin/layout.tsx`
- `src/app/teacher/layout.tsx`
- `src/components/AdminNavbar.tsx`
- `src/components/TeacherNavbar.tsx`

## Commits

- `ecb024c` feat: integrate notifications into layouts and navbars

## TypeScript check

`npx tsc --noEmit` passed with no errors.
