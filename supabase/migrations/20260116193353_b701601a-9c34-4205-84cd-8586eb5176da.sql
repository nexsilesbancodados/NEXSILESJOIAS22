-- Permitir que admins deletem itens de seus próprios romaneios
DROP POLICY IF EXISTS "Admins can delete romaneio items" ON romaneio_itens;
CREATE POLICY "Admins can delete romaneio items" ON romaneio_itens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM romaneios 
    WHERE romaneios.id = romaneio_itens.romaneio_id 
    AND romaneios.admin_id = auth.uid()
  )
);