### Task 1: Migration — notifications table

**Files:**
- Create: `migrations/add_notifications.sql`

- [ ] **Write migration SQL**

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Verify migration**
  - Read the file to confirm syntax

- [ ] **Commit**

```bash
git add migrations/add_notifications.sql
git commit -m "feat: add notifications table with indexes and realtime"
```
