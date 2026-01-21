-- Allow anonymous users to insert romaneios (sales from reseller portal)
CREATE POLICY "Anyone can create romaneios from portal" 
ON public.romaneios 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to insert romaneio_itens
CREATE POLICY "Anyone can create romaneio items from portal" 
ON public.romaneio_itens 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to update maleta_itens (to mark as sold)
CREATE POLICY "Anyone can update maleta items status" 
ON public.maleta_itens 
FOR UPDATE 
USING (true);

-- Allow anonymous users to view maleta_itens (needed for portal)
CREATE POLICY "Anyone can view maleta items for portal" 
ON public.maleta_itens 
FOR SELECT 
USING (true);

-- Allow anonymous users to view maletas (needed for portal)
CREATE POLICY "Anyone can view maletas for portal" 
ON public.maletas 
FOR SELECT 
USING (true);

-- Allow anonymous users to view profiles (needed for portal - reseller info)
CREATE POLICY "Anyone can view reseller profiles for portal" 
ON public.profiles 
FOR SELECT 
USING (role = 'reseller');

-- Allow anonymous users to view pecas (needed for portal)
CREATE POLICY "Anyone can view pecas for portal" 
ON public.pecas 
FOR SELECT 
USING (true);