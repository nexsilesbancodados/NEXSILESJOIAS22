-- Add RLS policies to the purchases table
CREATE POLICY "Service role can manage purchases"
ON public.purchases
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow public read for checking purchase status by access_code
CREATE POLICY "Anyone can read purchases by access_code"
ON public.purchases
FOR SELECT
USING (true);
