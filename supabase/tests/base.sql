-- =============================================================================
-- Ambiente base para validar a migration num Postgres real (PGlite).
-- Reproduz o que o Supabase fornece: roles, schema auth, pgcrypto, e as funções
-- e policies que já existem no banco de produção e que a migration referencia
-- ou derruba.
-- =============================================================================

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- --- schema auth (stub) ------------------------------------------------------
CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- auth.uid() / auth.jwt() derivam de GUCs, para simular chamadores diferentes
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('test.uid', true), '')::uuid
$$;

CREATE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('email', coalesce(current_setting('test.email', true), ''))
$$;

CREATE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('test.role', true), '')
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- --- stubs de pgcrypto ------------------------------------------------------
-- pgcrypto não está disponível no PGlite. Os stubs imitam o CONTRATO usado pelo
-- código: crypt(senha, hash_ou_salt) precisa reproduzir o hash quando recebe o
-- hash armazenado (é assim que a verificação de senha funciona).
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

CREATE FUNCTION public.gen_salt(t text, i int DEFAULT 8) RETURNS text
LANGUAGE sql IMMUTABLE AS $$ SELECT 'salt' || t $$;

CREATE FUNCTION public.crypt(pw text, salt_or_hash text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT 'bc$' || sl || '$' || md5(sl || pw)
    FROM (SELECT CASE WHEN salt_or_hash LIKE 'bc$%$%'
                      THEN split_part(salt_or_hash, '$', 2)
                      ELSE salt_or_hash END AS sl) s
$$;

CREATE FUNCTION public.digest(data text, algo text) RETURNS bytea
LANGUAGE sql IMMUTABLE AS $$ SELECT decode(md5(algo || data), 'hex') $$;

CREATE FUNCTION public.gen_random_bytes(n int) RETURNS bytea
LANGUAGE sql VOLATILE AS $$
  SELECT decode(md5(random()::text || clock_timestamp()::text), 'hex')
$$;

-- --- enum de roles ----------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor', 'revendedora');
