-- Insert default email templates for organizations that don't have any
-- These will be inserted when the organization is created or can be seeded manually

-- Create a function to seed default email templates
CREATE OR REPLACE FUNCTION public.seed_default_email_templates(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Template: Confirmação de Pedido
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Confirmação de Pedido',
    '✅ Pedido #{pedido_numero} confirmado!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #9b87f5; padding-bottom: 10px;">Pedido Confirmado!</h1>
      <p style="font-size: 16px; color: #555;">Olá, <strong>{cliente_nome}</strong>!</p>
      <p style="font-size: 16px; color: #555;">Seu pedido <strong>#{pedido_numero}</strong> foi confirmado com sucesso.</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Detalhes do Pedido:</h3>
        <p style="margin: 5px 0;"><strong>Valor Total:</strong> R$ {pedido_valor}</p>
        <div style="margin-top: 10px;">{pedido_itens}</div>
      </div>
      <p style="font-size: 14px; color: #777;">Entraremos em contato em breve com mais informações sobre a entrega.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome} - {data_hoje}</p>
    </div>',
    'Olá, {cliente_nome}!

Seu pedido #{pedido_numero} foi confirmado com sucesso.

Valor Total: R$ {pedido_valor}

{pedido_itens}

Entraremos em contato em breve com mais informações sobre a entrega.

{empresa_nome}',
    'confirmacao_pedido',
    true,
    ARRAY['{cliente_nome}', '{pedido_numero}', '{pedido_valor}', '{pedido_itens}', '{empresa_nome}', '{data_hoje}']
  )
  ON CONFLICT DO NOTHING;

  -- Template: Follow-up Pós-Atendimento
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Follow-up Pós-Atendimento',
    '💬 Como foi seu atendimento? Queremos ouvir você!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">Olá, {cliente_nome}! 👋</h1>
      <p style="font-size: 16px; color: #555;">Esperamos que sua experiência com nosso atendimento tenha sido excelente!</p>
      <p style="font-size: 16px; color: #555;">Gostaríamos de saber como foi para você. Sua opinião é muito importante para continuarmos melhorando.</p>
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 14px; color: #777; margin-bottom: 15px;">Como você avalia nosso atendimento?</p>
        <div style="display: inline-block;">
          <span style="font-size: 30px; margin: 0 5px; cursor: pointer;">😞</span>
          <span style="font-size: 30px; margin: 0 5px; cursor: pointer;">😐</span>
          <span style="font-size: 30px; margin: 0 5px; cursor: pointer;">😊</span>
          <span style="font-size: 30px; margin: 0 5px; cursor: pointer;">😄</span>
          <span style="font-size: 30px; margin: 0 5px; cursor: pointer;">🤩</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #777;">Se precisar de qualquer ajuda adicional, estamos à disposição!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome}</p>
    </div>',
    'Olá, {cliente_nome}!

Esperamos que sua experiência com nosso atendimento tenha sido excelente!

Gostaríamos de saber como foi para você. Sua opinião é muito importante para continuarmos melhorando.

Se precisar de qualquer ajuda adicional, estamos à disposição!

{empresa_nome}',
    'follow_up',
    true,
    ARRAY['{cliente_nome}', '{empresa_nome}']
  )
  ON CONFLICT DO NOTHING;

  -- Template: Resumo de Conversa
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Resumo da Conversa',
    '📋 Resumo do seu atendimento - {data_hoje}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #9b87f5; padding-bottom: 10px;">Resumo do Atendimento</h1>
      <p style="font-size: 16px; color: #555;">Olá, <strong>{cliente_nome}</strong>!</p>
      <p style="font-size: 16px; color: #555;">Segue o resumo da sua conversa com nosso atendimento.</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9b87f5;">
        <p style="font-style: italic; color: #555; margin: 0;">Este resumo foi gerado automaticamente para sua referência.</p>
      </div>
      <p style="font-size: 14px; color: #777;">Caso tenha dúvidas adicionais, responda este e-mail ou entre em contato conosco.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome} - {data_hoje}</p>
    </div>',
    'Olá, {cliente_nome}!

Segue o resumo da sua conversa com nosso atendimento.

Caso tenha dúvidas adicionais, responda este e-mail ou entre em contato conosco.

{empresa_nome}',
    'resumo_conversa',
    true,
    ARRAY['{cliente_nome}', '{empresa_nome}', '{data_hoje}']
  )
  ON CONFLICT DO NOTHING;

  -- Template: Boas-vindas
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Boas-vindas',
    '🎉 Bem-vindo(a) à {empresa_nome}!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; text-align: center;">Bem-vindo(a)! 🎉</h1>
      <p style="font-size: 18px; color: #555; text-align: center;">Olá, <strong>{cliente_nome}</strong>!</p>
      <p style="font-size: 16px; color: #555; text-align: center;">É um prazer ter você conosco. Estamos muito felizes em tê-lo(a) como cliente!</p>
      <div style="background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
        <p style="color: white; font-size: 18px; margin: 0;">Explore nosso catálogo</p>
        <a href="{link_catalogo}" style="display: inline-block; background: white; color: #7c3aed; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin-top: 15px;">Ver Catálogo</a>
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">Qualquer dúvida, estamos à disposição!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome}</p>
    </div>',
    'Olá, {cliente_nome}!

Bem-vindo(a) à {empresa_nome}!

É um prazer ter você conosco. Estamos muito felizes em tê-lo(a) como cliente!

Explore nosso catálogo: {link_catalogo}

Qualquer dúvida, estamos à disposição!

{empresa_nome}',
    'geral',
    true,
    ARRAY['{cliente_nome}', '{empresa_nome}', '{link_catalogo}']
  )
  ON CONFLICT DO NOTHING;

  -- Template: Promoção
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Promoção Especial',
    '🔥 Oferta Especial para você, {cliente_nome}!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🔥 PROMOÇÃO ESPECIAL 🔥</h1>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 18px; color: #555;">Olá, <strong>{cliente_nome}</strong>!</p>
        <p style="font-size: 16px; color: #555;">Preparamos uma oferta exclusiva especialmente para você!</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #856404; margin: 0;">DESCONTO ESPECIAL</p>
          <p style="font-size: 14px; color: #856404; margin: 10px 0 0 0;">Por tempo limitado!</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{link_catalogo}" style="display: inline-block; background: #ee5a24; color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">APROVEITAR AGORA</a>
        </div>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome} - {data_hoje}</p>
    </div>',
    'Olá, {cliente_nome}!

🔥 PROMOÇÃO ESPECIAL 🔥

Preparamos uma oferta exclusiva especialmente para você!

DESCONTO ESPECIAL - Por tempo limitado!

Acesse agora: {link_catalogo}

{empresa_nome}',
    'marketing',
    true,
    ARRAY['{cliente_nome}', '{empresa_nome}', '{link_catalogo}', '{data_hoje}']
  )
  ON CONFLICT DO NOTHING;

  -- Template: Lembrete de Carrinho
  INSERT INTO email_templates (organization_id, nome, assunto, corpo_html, corpo_texto, tipo, ativo, variaveis)
  VALUES (
    p_organization_id,
    'Lembrete de Interesse',
    '🛒 Você deixou itens esperando por você!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">Ei, {cliente_nome}! 👋</h1>
      <p style="font-size: 16px; color: #555;">Notamos que você demonstrou interesse em alguns produtos incríveis, mas ainda não finalizou seu pedido.</p>
      <p style="font-size: 16px; color: #555;">Eles ainda estão esperando por você! ✨</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-weight: bold; color: #333; margin: 0 0 10px 0;">Seus itens:</p>
        <div>{pedido_itens}</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{link_catalogo}" style="display: inline-block; background: #9b87f5; color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">Finalizar Pedido</a>
      </div>
      <p style="font-size: 14px; color: #777;">Precisa de ajuda? Estamos aqui para você!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">{empresa_nome}</p>
    </div>',
    'Ei, {cliente_nome}!

Notamos que você demonstrou interesse em alguns produtos, mas ainda não finalizou seu pedido.

Eles ainda estão esperando por você!

Acesse: {link_catalogo}

Precisa de ajuda? Estamos aqui para você!

{empresa_nome}',
    'marketing',
    true,
    ARRAY['{cliente_nome}', '{empresa_nome}', '{link_catalogo}', '{pedido_itens}']
  )
  ON CONFLICT DO NOTHING;

END;
$$;