
-- Fix existing gerente employees: update their user_roles to 'gerente' 
-- and their memberships to 'admin' role
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT f.user_id, f.cargo, m.id as membership_id
    FROM funcionarios f
    JOIN memberships m ON m.user_id = f.user_id
    WHERE f.user_id IS NOT NULL AND f.ativo = true
  LOOP
    -- Ensure correct role exists in user_roles based on cargo
    IF func_record.cargo = 'gerente' THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (func_record.user_id, 'gerente') 
      ON CONFLICT (user_id, role) DO NOTHING;
      -- Update membership to admin for gerentes
      UPDATE memberships SET role = 'admin' WHERE id = func_record.membership_id AND role = 'member';
    ELSIF func_record.cargo IN ('vendedor', 'caixa', 'estoquista', 'atendente', 'outro') THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (func_record.user_id, 'vendedor') 
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END LOOP;
END $$;
