# Task 3 Report: Migration — notification triggers

**Status:** DONE

## What was implemented

Created `migrations/add_notification_triggers.sql` with:
- **Helper function** `insert_notification()` — inserts into `notifications` table, skipping null user_ids
- **Trigger `trg_notify_task_new`** — fires on `AFTER INSERT ON tasks`, notifies `assigned_to` of new task
- **Trigger `trg_notify_task_completed`** — fires on `AFTER UPDATE ON tasks` when `completed` flips to true, notifies `created_by`
- **Trigger `trg_notify_lesson_new`** — fires on `AFTER INSERT ON lessons`, notifies `teacher_id` of new lesson
- **Trigger `trg_notify_lesson_changed`** — fires on `AFTER UPDATE ON lessons` when relevant fields (`lesson_date`, `start_time`, `end_time`, `status`) change; distinguishes cancellation vs update

## Files changed

- Added: `migrations/add_notification_triggers.sql` (119 insertions)

## Commits

- `1749291` feat: add notification triggers on tasks and lessons
