CREATE TABLE public.event_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calendar_id text NOT NULL,
  event_id text NOT NULL,
  color_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, calendar_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tags TO authenticated;
GRANT ALL ON public.event_tags TO service_role;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event tags" ON public.event_tags FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_event_tags_updated_at BEFORE UPDATE ON public.event_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();