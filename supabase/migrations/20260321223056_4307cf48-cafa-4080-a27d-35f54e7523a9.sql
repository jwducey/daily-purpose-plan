
CREATE TABLE public.core_values_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assessment_date date NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, assessment_date)
);

ALTER TABLE public.core_values_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments" ON public.core_values_assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments" ON public.core_values_assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.core_values_assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_core_values_assessments_updated_at
  BEFORE UPDATE ON public.core_values_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
