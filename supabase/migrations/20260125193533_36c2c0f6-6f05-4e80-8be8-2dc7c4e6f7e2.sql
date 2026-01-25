INSERT INTO public.user_roles (user_id, role)
VALUES ('36e20f68-ef9e-45c2-a6ec-58589e155501', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;