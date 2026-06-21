-- Helper: insert notification
CREATE OR REPLACE FUNCTION insert_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_link text
) RETURNS void AS $$
BEGIN
  IF p_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, link)
    VALUES (p_user_id, p_title, p_body, p_type, p_link);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: new task
CREATE OR REPLACE FUNCTION notify_task_new()
RETURNS trigger AS $$
BEGIN
  PERFORM insert_notification(
    NEW.assigned_to,
    'Новая задача',
    NEW.title,
    'task_new',
    '/teacher/tasks'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_task_new ON tasks;
CREATE TRIGGER trg_notify_task_new
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_new();

-- Trigger: task completed
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS trigger AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    PERFORM insert_notification(
      NEW.created_by,
      'Задача выполнена',
      NEW.title,
      'task_completed',
      '/admin/tasks'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_task_completed ON tasks;
CREATE TRIGGER trg_notify_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- Trigger: new lesson
CREATE OR REPLACE FUNCTION notify_lesson_new()
RETURNS trigger AS $$
BEGIN
  PERFORM insert_notification(
    NEW.teacher_id,
    'Новый урок',
    NEW.lesson_date::text || ' ' || NEW.start_time::text,
    'lesson_new',
    '/teacher/lessons'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_lesson_new ON lessons;
CREATE TRIGGER trg_notify_lesson_new
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_lesson_new();

-- Trigger: lesson changed/cancelled
CREATE OR REPLACE FUNCTION notify_lesson_changed()
RETURNS trigger AS $$
DECLARE
  v_title text;
  v_type text;
BEGIN
  -- Only notify if relevant fields changed
  IF OLD.lesson_date IS DISTINCT FROM NEW.lesson_date
     OR OLD.start_time IS DISTINCT FROM NEW.start_time
     OR OLD.end_time IS DISTINCT FROM NEW.end_time
     OR OLD.status IS DISTINCT FROM NEW.status
  THEN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      v_title := 'Урок отменён';
      v_type := 'lesson_cancelled';
    ELSE
      v_title := 'Урок изменён';
      v_type := 'lesson_updated';
    END IF;

    PERFORM insert_notification(
      NEW.teacher_id,
      v_title,
      NEW.lesson_date::text || ' ' || NEW.start_time::text,
      v_type,
      '/teacher/lessons'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_lesson_changed ON lessons;
CREATE TRIGGER trg_notify_lesson_changed
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION notify_lesson_changed();
