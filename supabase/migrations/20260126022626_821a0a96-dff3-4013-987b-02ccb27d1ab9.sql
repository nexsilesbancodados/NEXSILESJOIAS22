-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Get organization_id from the record if it exists
  IF TG_OP = 'DELETE' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (OLD).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_anteriores, organization_id)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, auth.uid(), to_jsonb(OLD), v_organization_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (NEW).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_anteriores, dados_novos, organization_id)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), v_organization_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_organization_id := CASE 
      WHEN TG_TABLE_NAME IN ('pecas', 'clientes', 'vendas', 'maletas', 'catalogos', 'romaneios', 'revendedoras', 'campanhas', 'fornecedores', 'banhos', 'metas') 
      THEN (NEW).organization_id
      ELSE NULL
    END;
    
    INSERT INTO public.historico_atividades (tabela, acao, registro_id, user_id, dados_novos, organization_id)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, auth.uid(), to_jsonb(NEW), v_organization_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for main tables
DROP TRIGGER IF EXISTS log_pecas_activity ON public.pecas;
CREATE TRIGGER log_pecas_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.pecas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_vendas_activity ON public.vendas;
CREATE TRIGGER log_vendas_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_clientes_activity ON public.clientes;
CREATE TRIGGER log_clientes_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_maletas_activity ON public.maletas;
CREATE TRIGGER log_maletas_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.maletas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_catalogos_activity ON public.catalogos;
CREATE TRIGGER log_catalogos_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.catalogos
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_romaneios_activity ON public.romaneios;
CREATE TRIGGER log_romaneios_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.romaneios
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_revendedoras_activity ON public.revendedoras;
CREATE TRIGGER log_revendedoras_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.revendedoras
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_campanhas_activity ON public.campanhas;
CREATE TRIGGER log_campanhas_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.campanhas
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();