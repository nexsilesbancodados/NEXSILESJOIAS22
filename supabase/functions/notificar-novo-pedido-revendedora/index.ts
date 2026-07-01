import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) {
      console.error("Brevo error:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Brevo send failed:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { interesse_id } = await req.json();

    if (!interesse_id) {
      return new Response(
        JSON.stringify({ error: 'interesse_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing notification for interesse: ${interesse_id}`);

    const { data: interesse, error: interesseError } = await supabase
      .from('maleta_interesses')
      .select(`id, cliente_nome, cliente_telefone, cliente_email, observacoes, created_at, maleta:maletas(id, nome, revendedora:revendedoras(id, nome, email, user_id))`)
      .eq('id', interesse_id)
      .single();

    if (interesseError || !interesse) {
      return new Response(
        JSON.stringify({ error: 'Interesse not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { count: itensCount } = await supabase
      .from('maleta_interesse_itens')
      .select('*', { count: 'exact', head: true })
      .eq('interesse_id', interesse_id);

    const { data: itens } = await supabase
      .from('maleta_interesse_itens')
      .select(`quantidade, peca:pecas(nome, codigo, preco_venda)`)
      .eq('interesse_id', interesse_id);

    const maletaData = interesse.maleta as any;
    const revendedoraData = maletaData?.revendedora;
    const revendedoraUserId = revendedoraData?.user_id as string | null;
    const revendedoraEmail = revendedoraData?.email as string | null;
    const revendedoraNome = revendedoraData?.nome as string | null;
    const maletaNome = maletaData?.nome as string | null;

    const valorTotal = (itens || []).reduce((acc: number, item: any) => {
      const peca = Array.isArray(item.peca) ? item.peca[0] : item.peca;
      return acc + ((peca?.preco_venda || 0) * (item.quantidade || 1));
    }, 0);

    const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    if (revendedoraUserId) {
      await supabase.from('notificacoes').insert({
        user_id: revendedoraUserId,
        tipo: 'novo_pedido_portal',
        titulo: '🛒 Novo Pedido Recebido!',
        mensagem: `${interesse.cliente_nome} fez um pedido de ${itensCount || 0} item(s) no valor de ${formatCurrency(valorTotal)} na maleta "${maletaNome}".`,
        link: `/portal/${revendedoraData?.id}`,
        lida: false,
      });
    }

    if (revendedoraEmail) {
      const itensHtml = (itens || []).map((item: any) => {
        const peca = Array.isArray(item.peca) ? item.peca[0] : item.peca;
        return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${peca?.nome || 'Peça'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantidade}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency((peca?.preco_venda || 0) * (item.quantidade || 1))}</td></tr>`;
      }).join('');

      await sendBrevoEmail(revendedoraEmail, `🛒 Novo Pedido de ${interesse.cliente_nome}!`, `
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#8B5CF6,#6366F1);padding:32px;text-align:center"><h1 style="color:white;margin:0;font-size:24px">🛒 Novo Pedido!</h1></div>
            <div style="padding:32px">
              <p>Olá, <strong>${revendedoraNome}</strong>!</p>
              <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px">
                <h2 style="margin:0 0 16px;font-size:18px">Detalhes do Pedido</h2>
                <p style="margin:8px 0"><strong>Cliente:</strong> ${interesse.cliente_nome}</p>
                ${interesse.cliente_telefone ? `<p style="margin:8px 0"><strong>Telefone:</strong> ${interesse.cliente_telefone}</p>` : ''}
                <p style="margin:8px 0"><strong>Maleta:</strong> ${maletaNome}</p>
              </div>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                <thead><tr style="background:#f8f9fa"><th style="padding:12px 8px;text-align:left;border-bottom:2px solid #eee">Produto</th><th style="padding:12px 8px;text-align:center;border-bottom:2px solid #eee">Qtd</th><th style="padding:12px 8px;text-align:right;border-bottom:2px solid #eee">Subtotal</th></tr></thead>
                <tbody>${itensHtml}</tbody>
                <tfoot><tr><td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #8B5CF6">Total:</td><td style="padding:12px 8px;text-align:right;font-weight:bold;color:#8B5CF6;border-top:2px solid #8B5CF6">${formatCurrency(valorTotal)}</td></tr></tfoot>
              </table>
              <div style="text-align:center;margin-top:32px"><a href="https://nexsiles.com.br/portal/login" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600">Acessar Portal</a></div>
            </div>
            <div style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #eee"><p style="margin:0;color:#888;font-size:12px">Email automático - Nexsiles</p></div>
          </div>
        </body></html>
      `);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
