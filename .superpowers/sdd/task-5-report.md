# Task 5: NotificationBell component

## What I implemented
Created `src/components/NotificationBell.tsx` per the task brief spec:

- **Bell icon button** (🔔) with unread count badge matching TeacherNavbar styling (text-2xl, hover:text-brand-600, bg-danger badge)
- **Dropdown panel** with header ("Уведомления"), "Отметить все" button, and scrolling notification list (max 10 items)
- **Type-based icons** via TYPE_ICONS map (📋 task_new, ✅ task_completed, 📅 lesson_*, ❌ lesson_cancelled, 🎂 birthday)
- **timeAgo helper** for Russian relative timestamps (только что, Xм назад, Xч назад, Xд назад, or date)
- **Click outside** (mousedown) and **Escape key** dismiss handlers
- **Click-to-mark-read** with navigation via `router.push(n.link)` on the notification's link
- **Empty state** ("Нет уведомлений") when notifications array is empty
- Uses `useNotifications()` hook from Task 4's NotificationContext

## Files changed
- Created: `src/components/NotificationBell.tsx` (119 lines)

## Commits created
- `3664747` feat: add NotificationBell component with dropdown

## Self-review findings
- Matches existing TeacherNavbar conventions (emoji icons, badge styling, color classes)
- TypeScript compiles cleanly with `tsc --noEmit -p tsconfig.json`
- Depends on `@/contexts/NotificationContext` (already implemented, verified in codebase)
- No integration changes needed — the component is ready to be placed in a layout
