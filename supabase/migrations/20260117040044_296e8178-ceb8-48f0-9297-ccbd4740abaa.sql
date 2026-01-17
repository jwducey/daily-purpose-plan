-- Add time estimate (in minutes) and life area to tasks
ALTER TABLE public.tasks 
ADD COLUMN time_estimate_minutes integer DEFAULT NULL,
ADD COLUMN life_area text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.time_estimate_minutes IS 'Estimated time to complete task in minutes';
COMMENT ON COLUMN public.tasks.life_area IS 'Life area category: health, wealth, relationships, growth, career, leisure';