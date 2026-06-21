# Real-Time Notifications System

## Overview

Real-time in-app notification system via Supabase Realtime. Notifications are triggered by database events (tasks, lessons) and a daily birthday check, delivered to the relevant user via toast + bell icon with unread counter.

## Events & Recipients

| Event | Trigger | Recipient |
|---|---|---|
| Новая задача | `INSERT ON tasks` | Teacher (`assigned_to`) |
| Задача выполнена | `UPDATE tasks SET completed = true` | Admin (`created_by`) |
| Новый урок | `INSERT ON lessons` | Teacher (`teacher_id`) |
| Урок изменён | `UPDATE lessons` (date/time/status) | Teacher (`teacher_id`) |
| Урок отменён | `UPDATE lessons SET status = 'cancelled'` | Teacher (`teacher_id`) |
| День рождения | Daily cron check | All admins |

## 1. Database: `notifications` table

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_read on notifications(user_id, is_read);
create index idx_notifications_created_at on notifications(user_id, created_at desc);
```

Enable Realtime for `notifications` table.

### Type values

- `task_new`
- `task_completed`
- `lesson_new`
- `lesson_updated`
- `lesson_cancelled`
- `birthday`

## 2. Database Triggers

### `notify_task_new` — AFTER INSERT ON tasks

Inserts notification for `NEW.assigned_to` (teacher).

| Field | Value |
|---|---|
| user_id | `NEW.assigned_to` |
| title | `'Новая задача'` |
| body | `NEW.title` |
| type | `'task_new'` |
| link | `'/teacher/tasks'` |

### `notify_task_completed` — AFTER UPDATE ON tasks (when completed changes to true)

Inserts notification for `NEW.created_by` (admin).

| Field | Value |
|---|---|
| user_id | `NEW.created_by` |
| title | `'Задача выполнена'` |
| body | `NEW.title` |
| type | `'task_completed'` |
| link | `'/admin/tasks'` |

### `notify_lesson_new` — AFTER INSERT ON lessons

Inserts notification for `NEW.teacher_id`.

| Field | Value |
|---|---|
| user_id | `NEW.teacher_id` |
| title | `'Новый урок'` |
| body | `NEW.lesson_date || ' ' || NEW.start_time` |
| type | `'lesson_new'` |
| link | `'/teacher/lessons'` |

### `notify_lesson_changed` — AFTER UPDATE ON lessons

Inserts notification for `NEW.teacher_id` (only if `NEW.teacher_id IS NOT NULL`).

Triggering field changes (only these fields trigger a notification):
- `lesson_date`, `start_time`, `end_time`, `status`

Logic:
- `OLD.status != 'cancelled' AND NEW.status = 'cancelled'` → type `lesson_cancelled`, title `'Урок отменён'`
- Any other triggering field changed → type `lesson_updated`, title `'Урок изменён'`
- If only `comment`, `online_link`, `room_id`, `subject_id` changed — no notification

Link: `'/teacher/lessons'`

### Guard

All triggers check `TG_OP` and skip if the notification is for a no-op (e.g., UPDATE that didn't change relevant fields). No self-notification (e.g., if teacher updates own lesson, still notifies — teacher needs to know).

## 3. Birthday column addition

Add `birth_date date` to `students` table and `profiles` table.

- Add form field to `StudentForm.tsx` (date input)
- Add form field to `TeacherForm.tsx` (date input)
- No trigger — checked daily by API cron

## 4. Birthday cron (API route)

`src/app/api/cron/birthdays/route.ts` — GET endpoint.

- Protected by static token in `CRON_SECRET` env var (passed as `Authorization: Bearer <token>`)
- Queries birthdays for today and next 3 days from `students` and `profiles`:
  ```sql
  SELECT id, full_name, 'student' as entity_type FROM students WHERE to_char(birth_date, 'MM-DD') BETWEEN to_char(now(), 'MM-DD') AND to_char(now() + interval '3 days', 'MM-DD')
  UNION ALL
  SELECT id, full_name, 'teacher' as entity_type FROM profiles WHERE role = 'teacher' AND to_char(birth_date, 'MM-DD') BETWEEN to_char(now(), 'MM-DD') AND to_char(now() + interval '3 days', 'MM-DD')
  ```
- For each match, inserts a notification for all admin users (`profiles WHERE role = 'admin'`)
- Avoids duplicates: checks if a `birthday` notification for this person already exists today
- Returns `{ inserted: number }`

## 5. React Context

`src/contexts/NotificationContext.tsx` — client component provider.

### State

- `notifications: Notification[]` — sorted by `created_at DESC`
- `unreadCount: number` — derived from `!is_read`
- `toasts: Toast[]` — active toast popups

### On mount

1. Get current user via `supabase.auth.getUser()`
2. Fetch unread notifications: `SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 50`
3. Subscribe to Realtime channel: `supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.'+userId }, handler)`

### Methods

- `markAsRead(id)` — `PATCH is_read=true` on notification + update local state
- `markAllAsRead()` — batch update all unread + update local state
- `dismissToast(id)` — remove from toasts array

### Realtime handler

On new notification:
1. Prepend to notifications list
2. Increment unread count
3. Add to toasts (max 3 visible)

### Integration

Wrap both layouts in `NotificationProvider`:
- `src/app/admin/layout.tsx`
- `src/app/teacher/layout.tsx`

## 6. UI Components

### `NotificationBell`

Client component, placed in `AdminNavbar` and `TeacherNavbar`.

- 🔔 icon (text-2xl, matching existing nav icons)
- Red badge with `unreadCount` (same style as task badge in TeacherNavbar)
- Click toggles dropdown

**Dropdown:**
- Up to 10 most recent notifications
- Each item: type icon (📋/📅/🎂), title (bold if unread), body truncated, relative time
- Click → `markAsRead(id)` + `router.push(link)`
- Bottom: "Отметить все" button (visible if `unreadCount > 0`)
- Empty state: "Нет уведомлений"
- Closes on: click outside, Escape

### `NotificationToast`

Client component rendered inside `NotificationProvider`.

- Fixed position: `fixed top-4 right-4 z-50`
- Renders up to 3 simultaneous toasts
- Each toast:
  - Background: `bg-white shadow-lg border rounded-lg p-3`
  - Slide-in animation (fadeIn from CSS)
  - Icon + title + body (truncated 2 lines)
  - Close button (×)
  - Click on toast body → `markAsRead` + navigate via `link`
- Auto-dismiss after 5 seconds (per-toast timer)
- If a new toast arrives while 3 are visible, oldest is replaced

## 7. Navbar Integration

### TeacherNavbar

Add `<NotificationBell />` at the start of the nav icons section (before 📅).

Existing task badge on 📋 icon remains unchanged (tasks page).

### AdminNavbar

Add `<NotificationBell />` at the start of the nav icons section (before 📅).

## Files Changed

| File | Action |
|---|---|
| `supabase/migrations/..._add_notifications.sql` | New — notifications table, triggers, indexes |
| `src/contexts/NotificationContext.tsx` | New — React context + provider |
| `src/components/NotificationBell.tsx` | New — bell icon + dropdown |
| `src/components/NotificationToast.tsx` | New — toast component |
| `src/app/api/cron/birthdays/route.ts` | New — daily birthday check |
| `src/components/AdminNavbar.tsx` | Edit — add NotificationBell |
| `src/components/TeacherNavbar.tsx` | Edit — add NotificationBell |
| `src/app/admin/layout.tsx` | Edit — wrap with NotificationProvider |
| `src/app/teacher/layout.tsx` | Edit — wrap with NotificationProvider |
| `src/components/students/StudentForm.tsx` | Edit — add birth_date field |
| `src/components/teachers/TeacherForm.tsx` | Edit — add birth_date field |
| `src/app/globals.css` | Edit — add toast slide-in animation |
| `.env.local` | Edit — add CRON_SECRET |
