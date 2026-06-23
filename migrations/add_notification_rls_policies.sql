-- Fix RLS for notifications table
-- The trigger functions insert_notification needs SECURITY DEFINER to bypass RLS
-- since admins create lessons for teachers (teacher_id != auth.uid())

ALTER FUNCTION insert_notification SECURITY DEFINER;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
