# Task 1 Report: Migration — notifications table

## What was implemented

Created a Supabase migration `migrations/add_notifications.sql` that:
- Creates `notifications` table with columns: id, user_id, title, body, type, link, is_read, created_at
- Adds a foreign key from `user_id` to `profiles(id)` with `ON DELETE CASCADE`
- Adds index `idx_notifications_user_read` on `(user_id, is_read)`
- Adds index `idx_notifications_created_at` on `(user_id, created_at DESC)`
- Enables the table on the `supabase_realtime` publication

## Files changed

- `migrations/add_notifications.sql` (created)

## Commits created

- `f9e25b1` feat: add notifications table with indexes and realtime

## Self-review findings

- Matches existing migration style (concise, uses IF NOT EXISTS guards)
- Syntax verified by reading the file back
- No issues found
