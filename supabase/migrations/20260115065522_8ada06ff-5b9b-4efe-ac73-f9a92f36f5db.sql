-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.google_oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.google_oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.google_oauth_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.google_oauth_tokens;

-- Create PERMISSIVE policies (default type) that properly restrict access
CREATE POLICY "Users can view their own tokens"
ON public.google_oauth_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON public.google_oauth_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.google_oauth_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.google_oauth_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);