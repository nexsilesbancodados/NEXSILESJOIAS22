
CREATE OR REPLACE FUNCTION public.gerar_slug_loja(p_nome TEXT, p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- normaliza sem depender de unaccent
  base_slug := translate(
    lower(coalesce(p_nome, 'loja')),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  );
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'loja-' || substring(p_org_id::text, 1, 8);
  END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.ecommerce_config WHERE slug = final_slug AND organization_id <> p_org_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.provisionar_ecommerce_config(p_org_id UUID, p_nome TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_slug TEXT;
BEGIN
  SELECT id INTO existing_id FROM public.ecommerce_config WHERE organization_id = p_org_id LIMIT 1;
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  new_slug := public.gerar_slug_loja(p_nome, p_org_id);

  INSERT INTO public.ecommerce_config (
    organization_id, slug, nome_loja, ativo,
    cor_primaria, cor_secundaria,
    metodos_pagamento, mostrar_busca, mostrar_categorias,
    mostrar_filtros, mostrar_ordenacao, mostrar_parcelamento,
    parcelamento_max, produtos_por_pagina,
    fonte_titulos, fonte_corpo, layout_produtos,
    colunas_desktop, colunas_mobile,
    mensagem_whatsapp
  ) VALUES (
    p_org_id, new_slug, COALESCE(p_nome, 'Minha Loja'), true,
    '#B76E79', '#8B4F57',
    ARRAY['pix','cartao','boleto']::text[], true, true,
    true, true, true,
    12, 12,
    'Cormorant Garamond', 'Inter', 'grid',
    4, 2,
    'Olá! Vi sua loja e gostaria de mais informações.'
  )
  RETURNING id INTO existing_id;

  RETURN existing_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_role TEXT;
  org_nome TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  IF user_role = 'user' THEN
    RETURN NEW;
  END IF;

  org_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email);

  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_nome, NEW.id)
  RETURNING id INTO new_org_id;

  INSERT INTO public.memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  BEGIN
    PERFORM public.provisionar_ecommerce_config(new_org_id, org_nome);
  EXCEPTION WHEN OTHERS THEN
    -- não bloqueia criação de conta se provisionamento falhar
    RAISE WARNING 'Falha ao provisionar ecommerce_config para org %: %', new_org_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT o.id, o.name
    FROM public.organizations o
    LEFT JOIN public.ecommerce_config e ON e.organization_id = o.id
    WHERE e.id IS NULL
  LOOP
    BEGIN
      PERFORM public.provisionar_ecommerce_config(r.id, r.name);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill falhou para org %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

UPDATE public.ecommerce_config SET ativo = true WHERE ativo IS DISTINCT FROM true;
