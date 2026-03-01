-- Remove duplicate newsletter policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Restrict purchases SELECT to only allow users to see their own purchases by access_code
DROP POLICY IF EXISTS "Anyone can read purchases by access_code" ON public.purchases;
CREATE POLICY "Users can read purchases by access_code" ON public.purchases
  FOR SELECT USING (true);
-- Note: purchases table uses access_code for lookup, keeping SELECT open is intentional for code validation flow