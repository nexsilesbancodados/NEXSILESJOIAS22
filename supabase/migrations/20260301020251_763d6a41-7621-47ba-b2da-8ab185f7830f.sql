-- Allow users to insert their own subscription (for trial activation)
CREATE POLICY "Users can insert own subscription"
ON public.assinaturas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own subscription (for trial activation / renewal)
CREATE POLICY "Users can update own subscription"
ON public.assinaturas
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);