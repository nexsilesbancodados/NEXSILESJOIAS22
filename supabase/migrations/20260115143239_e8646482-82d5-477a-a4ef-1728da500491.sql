-- Remove foreign key constraint that requires profiles to have auth.users entry
-- This allows creating resellers (revendedoras) without requiring them to have an auth account
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;