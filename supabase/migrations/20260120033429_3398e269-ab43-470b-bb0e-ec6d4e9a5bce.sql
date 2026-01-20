-- Add scheduled_at to track when a task was scheduled to the calendar
ALTER TABLE public.tasks ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add is_recurring to track if a task should repopulate after completion
ALTER TABLE public.tasks ADD COLUMN is_recurring boolean DEFAULT false;

-- Add google_event_id to link task to the Google Calendar event
ALTER TABLE public.tasks ADD COLUMN google_event_id text DEFAULT NULL;

-- Create index for faster filtering of unscheduled tasks
CREATE INDEX idx_tasks_scheduled_at ON public.tasks(scheduled_at) WHERE scheduled_at IS NULL;