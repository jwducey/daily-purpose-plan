
-- Add new life_areas array column
ALTER TABLE public.tasks ADD COLUMN life_areas text[] DEFAULT '{}';

-- Migrate existing data from life_area to life_areas
UPDATE public.tasks SET life_areas = ARRAY[life_area] WHERE life_area IS NOT NULL AND life_area != '';

-- Drop old life_area column
ALTER TABLE public.tasks DROP COLUMN life_area;
