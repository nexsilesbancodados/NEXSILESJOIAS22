import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  interesse_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { interesse_id } = await req.json() as RequestBody;

    if (!interesse_id) {
      console.error('interesse_id is required');
      return new Response(
        JSON.stringify({ error: 'interesse_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing new order notification for interesse: ${interesse_id}`);

    // Get interesse with maleta and revendedora info
    const { data: interesse, error: interesseError } = await supabase
      .from('maleta_interesses')
      .select(`
        id,
        cliente_nome,
        cliente_telefone,
        cliente_email,
        observacoes,
        created_at,
        maleta:maletas(
          id,
          nome,
          revendedora:revendedoras(id, nome, email, user_id)
        )
      `)
      .eq('id', interesse_id)
      .single();

    if (interesseError || !interesse) {
      console.error('Interesse not found:', interesseError);
      return new Response(
        JSON.stringify({ error: 'Interesse not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get items count
    const { count: itensCount } = await supabase
      .from('maleta_interesse_itens')
      .select('*', { count: 'exact', head: true })
      .eq('interesse_id', interesse_id);

    // Get items details for email
    const { data: itens } = await supabase
      .from('maleta_interesse_itens')
      .select(`
        quantidade,
        peca:pecas(nome, codigo, preco_venda)
      `)
      .eq('interesse_id', interesse_id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maletaData = interesse.maleta as any;
    const revendedoraData = maletaData?.revendedora;
    const revendedoraUserId = revendedoraData?.user_id as string | null;
    const revendedoraEmail = revendedoraData?.email as string | null;
    const revendedoraNome = revendedoraData?.nome as string | null;
    const maletaNome = maletaData?.nome as string | null;
    const maletaId = maletaData?.id as string | null;

    console.log('Revendedora info:', { revendedoraUserId, revendedoraEmail, revendedoraNome });

    // Calculate total value
    const valorTotal = (itens || []).reduce((acc, item) => {
      const peca = Array.isArray(item.peca) ? item.peca[0] : item.peca;
      return acc + ((peca?.preco_venda || 0) * (item.quantidade || 1));
    }, 0);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    // Create in-app notification if revendedora has a user_id
    if (revendedoraUserId) {
      const { error: notifError } = await supabase
        .from('notificacoes')
        .insert({
          user_id: revendedoraUserId,
          tipo: 'novo_pedido_portal',
          titulo: '🛒 Novo Pedido Recebido!',
          mensagem: `${interesse.cliente_nome} fez um pedido de ${itensCount || 0} item(s) no valor de ${formatCurrency(valorTotal)} na maleta "${maletaNome}". Acesse o portal para aprovar!`,
          link: `/portal/${revendedoraData?.id}`,
          lida: false,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        console.log('In-app notification created for user:', revendedoraUserId);
      }
    }

    // Send email notification if revendedora has email and Resend is configured
    if (revendedoraEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Build items list for email
        const itensHtml = (itens || []).map(item => {
          const peca = Array.isArray(item.peca) ? item.peca[0] : item.peca;
          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${peca?.nome || 'Peça'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantidade}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency((peca?.preco_venda || 0) * (item.quantidade || 1))}</td>
            </tr>
          `;
        }).join('');

        const { error: emailError } = await resend.emails.send({
          from: 'Nexsiles <noreply@nexsiles.online>',
          to: [revendedoraEmail],
          subject: `🛒 Novo Pedido de ${interesse.cliente_nome}!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🛒 Novo Pedido Recebido!</h1>
                </div>
                
                <div style="padding: 32px;">
                  <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
                    Olá, <strong>${revendedoraNome}</strong>!
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">Detalhes do Pedido</h2>
                    
                    <p style="margin: 8px 0;"><strong>Cliente:</strong> ${interesse.cliente_nome}</p>
                    ${interesse.cliente_telefone ? `<p style="margin: 8px 0;"><strong>Telefone:</strong> ${interesse.cliente_telefone}</p>` : ''}
                    ${interesse.cliente_email ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${interesse.cliente_email}</p>` : ''}
                    <p style="margin: 8px 0;"><strong>Maleta:</strong> ${maletaNome}</p>
                    ${interesse.observacoes ? `<p style="margin: 8px 0;"><strong>Observações:</strong> ${interesse.observacoes}</p>` : ''}
                  </div>
                  
                  <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Itens Solicitados</h3>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                    <thead>
                      <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #eee;">Produto</th>
                        <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #eee;">Qtd</th>
                        <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #eee;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itensHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold; border-top: 2px solid #8B5CF6;">Total:</td>
                        <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #8B5CF6; border-top: 2px solid #8B5CF6;">${formatCurrency(valorTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="https://nexsiles2567.lovable.app/portal/login" 
                       style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                      Acessar Portal e Aprovar
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 32px; text-align: center;">
                    Acesse seu portal para revisar e aprovar o pedido.
                  </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #888; font-size: 12px;">
                    Este email foi enviado automaticamente pelo sistema Nexsiles.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('Error sending email:', emailError);
        } else {
          console.log('Email notification sent to:', revendedoraEmail);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else {
      console.log('Skipping email: no email or Resend API key configured');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
