import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  estoque_minimo: number;
  dias_maleta_vencendo: number;
  dias_romaneio_pendente: number;
}

const defaultConfig: AlertConfig = {
  estoque_minimo: 5,
  dias_maleta_vencendo: 3,
  dias_romaneio_pendente: 7,
};

// Helper to send WhatsApp via Evolution API
async function sendWhatsApp(phone: string, message: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  if (!evolutionUrl || !evolutionKey) return false;

  try {
    let tel = phone.replace(/\D/g, '');
    if (!tel.startsWith('55')) tel = '55' + tel;

    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({ number: tel, text: message }),
    });
    return response.ok;
  } catch (e) {
    console.error('WhatsApp send error:', e);
    return false;
  }
}

// Helper to send email via Brevo
async function sendEmailBrevo(apiKey: string, to: string, toName: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NexSiles", email: "contato@nexsiles.com.br" },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Brevo error [${res.status}]: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Brevo send error:', e);
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
    const brevoKey = Deno.env.get('BREVO_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alertsCreated: string[] = [];
    const whatsappSent: string[] = [];
    const emailsSent: string[] = [];
    const today = new Date();

    console.log('Iniciando verificação de alertas com automações...');

    // Pre-load all org configs for WhatsApp instances
    const { data: allConfigs } = await supabase
      .from('agente_ia_config')
      .select('organization_id, whatsapp_instancia, dono_email, dono_nome, dono_whatsapp');
    
    const configMap = new Map<string, any>();
    for (const c of allConfigs || []) {
      if (c.organization_id) configMap.set(c.organization_id, c);
    }

    // Get owner emails per org
    const { data: allMemberships } = await supabase
      .from('memberships')
      .select('organization_id, user_id, role')
      .eq('role', 'owner');

    const ownerMap = new Map<string, string>();
    for (const m of allMemberships || []) {
      ownerMap.set(m.organization_id, m.user_id);
    }

    // ═══════════════════════════════════════════
    // 1. ESTOQUE BAIXO - Notificação + Email ao dono
    // ═══════════════════════════════════════════
    const { data: lowStockPieces } = await supabase
      .from('pecas')
      .select('id, nome, codigo, estoque, estoque_minimo, organization_id')
      .eq('ativo', true);

    const orgStockAlerts = new Map<string, Array<{ nome: string; codigo: string; estoque: number }>>();

    for (const peca of lowStockPieces || []) {
      const minimo = peca.estoque_minimo || defaultConfig.estoque_minimo;
      const estoqueAtual = peca.estoque || 0;
      
      if (estoqueAtual <= minimo && peca.organization_id) {
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('tipo', 'estoque_baixo')
          .ilike('mensagem', `%${peca.nome}%`)
          .gte('created_at', todayStart.toISOString())
          .limit(1);

        if (!existingNotif?.length) {
          const ownerId = ownerMap.get(peca.organization_id);
          if (ownerId) {
            await supabase.from('notificacoes').insert({
              user_id: ownerId,
              titulo: '⚠️ Estoque Baixo',
              mensagem: `A peça "${peca.nome}" (${peca.codigo || 'S/C'}) está com apenas ${estoqueAtual} unidades.`,
              tipo: 'estoque_baixo',
              link: '/pecas',
            });
          }

          if (!orgStockAlerts.has(peca.organization_id)) {
            orgStockAlerts.set(peca.organization_id, []);
          }
          orgStockAlerts.get(peca.organization_id)!.push({
            nome: peca.nome,
            codigo: peca.codigo || 'S/C',
            estoque: estoqueAtual,
          });

          alertsCreated.push(`Estoque baixo: ${peca.nome}`);
        }
      }
    }

    // Send grouped stock alert emails per org via Brevo
    if (brevoKey) {
      for (const [orgId, pecas] of orgStockAlerts) {
        const ownerId = ownerMap.get(orgId);
        if (!ownerId) continue;

        const { data: profile } = await supabase.from('profiles').select('email, nome').eq('user_id', ownerId).single();
        if (!profile?.email) continue;

        const pecasHtml = pecas.map(p => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;">${p.nome}</td>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:center;">${p.codigo}</td>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:center;color:#dc2626;font-weight:bold;">${p.estoque}</td>
          </tr>`).join('');

        const sent = await sendEmailBrevo(brevoKey, profile.email, profile.nome || 'Admin',
          `⚠️ ${pecas.length} peça(s) com estoque baixo`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#dc2626;">⚠️ Alerta de Estoque Baixo</h2>
            <p>Olá, ${profile.nome || 'Admin'}! As seguintes peças precisam de reposição:</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <thead><tr style="background:#fef2f2;">
                <th style="padding:10px;text-align:left;">Peça</th>
                <th style="padding:10px;text-align:center;">Código</th>
                <th style="padding:10px;text-align:center;">Estoque</th>
              </tr></thead>
              <tbody>${pecasHtml}</tbody>
            </table>
            <div style="text-align:center;margin-top:20px;">
              <a href="https://nexsiles2567.lovable.app/pecas" style="display:inline-block;background:#8B5CF6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ver Peças</a>
            </div>
          </div>`
        );
        if (sent) emailsSent.push(`Estoque baixo → ${profile.email}`);

        // Also send WhatsApp to owner if configured
        const config = configMap.get(orgId);
        if (config?.whatsapp_instancia && config?.dono_whatsapp) {
          const msg = `⚠️ *ALERTA DE ESTOQUE BAIXO*\n\n${pecas.map(p => `• ${p.nome} (${p.codigo}): *${p.estoque} un.*`).join('\n')}\n\nAcesse o sistema para repor o estoque! 📦`;
          const wSent = await sendWhatsApp(config.dono_whatsapp, msg, config.whatsapp_instancia);
          if (wSent) whatsappSent.push(`Estoque baixo → dono`);
        }
      }
    }

    // ═══════════════════════════════════════════
    // 2. ANIVERSÁRIOS - Notificação + WhatsApp automático ao aniversariante
    // ═══════════════════════════════════════════
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 2a. Clientes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome, data_nascimento, telefone, whatsapp, email, organization_id')
      .eq('ativo', true)
      .not('data_nascimento', 'is', null);

    for (const cliente of clientes || []) {
      if (!cliente.data_nascimento || !cliente.organization_id) continue;
      const birthDate = new Date(cliente.data_nascimento);
      const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
      
      if (birthMonthDay !== todayMonthDay) continue;

      const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
      const { data: existingNotif } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('tipo', 'aniversario')
        .ilike('mensagem', `%${cliente.nome}%`)
        .gte('created_at', todayStart.toISOString())
        .limit(1);

      if (existingNotif?.length) continue;

      const ownerId = ownerMap.get(cliente.organization_id);
      if (ownerId) {
        await supabase.from('notificacoes').insert({
          user_id: ownerId,
          titulo: '🎂 Aniversário de Cliente',
          mensagem: `Hoje é aniversário de ${cliente.nome}! Mensagem de parabéns enviada automaticamente.`,
          tipo: 'aniversario',
          link: '/clientes',
        });
      }

      // AUTO WhatsApp birthday message to the client
      const tel = cliente.whatsapp || cliente.telefone;
      const config = configMap.get(cliente.organization_id);
      if (tel && config?.whatsapp_instancia) {
        const msg = `🎂 *Feliz Aniversário, ${cliente.nome}!* 🎉\n\nDesejamos um dia repleto de alegrias e realizações! ✨\n\nComo presente especial, você ganha *10% de desconto* na sua próxima compra! 🎁\n\nVálido por 7 dias. Aproveite! 💎`;
        const sent = await sendWhatsApp(tel, msg, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Aniversário → ${cliente.nome}`);
        await new Promise(r => setTimeout(r, 500));
      }

      // AUTO Email birthday message via Brevo
      if (brevoKey && cliente.email) {
        const sent = await sendEmailBrevo(brevoKey, cliente.email, cliente.nome,
          `🎂 Feliz Aniversário, ${cliente.nome}! 🎉`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#8B5CF6,#EC4899);padding:40px;border-radius:16px;text-align:center;color:white;">
              <h1 style="font-size:36px;margin:0;">🎂 Feliz Aniversário!</h1>
              <p style="font-size:20px;margin:10px 0 0;">${cliente.nome}</p>
            </div>
            <div style="padding:30px;text-align:center;">
              <p style="font-size:16px;color:#555;">Desejamos um dia repleto de alegrias e realizações! ✨</p>
              <div style="background:#fef3c7;padding:20px;border-radius:12px;margin:20px 0;">
                <p style="font-size:20px;font-weight:bold;color:#92400e;margin:0;">🎁 10% DE DESCONTO</p>
                <p style="color:#92400e;margin:8px 0 0;">Na sua próxima compra • Válido por 7 dias</p>
              </div>
            </div>
          </div>`
        );
        if (sent) emailsSent.push(`Aniversário → ${cliente.nome}`);
      }

      alertsCreated.push(`Aniversário: ${cliente.nome}`);
    }

    // 2b. Revendedoras
    const { data: revendedoras } = await supabase
      .from('revendedoras')
      .select('id, nome, data_nascimento, telefone, whatsapp, email, organization_id')
      .eq('ativo', true)
      .not('data_nascimento', 'is', null);

    for (const rev of revendedoras || []) {
      if (!rev.data_nascimento || !rev.organization_id) continue;
      const birthDate = new Date(rev.data_nascimento);
      const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
      
      if (birthMonthDay !== todayMonthDay) continue;

      const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
      const { data: existingNotif } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('tipo', 'aniversario')
        .ilike('mensagem', `%${rev.nome}%`)
        .gte('created_at', todayStart.toISOString())
        .limit(1);

      if (existingNotif?.length) continue;

      const ownerId = ownerMap.get(rev.organization_id);
      if (ownerId) {
        await supabase.from('notificacoes').insert({
          user_id: ownerId,
          titulo: '🎉 Aniversário de Revendedora',
          mensagem: `Hoje é aniversário de ${rev.nome}! Parabéns enviados automaticamente.`,
          tipo: 'aniversario',
          link: '/revendedoras',
        });
      }

      const tel = rev.whatsapp || rev.telefone;
      const config = configMap.get(rev.organization_id);
      if (tel && config?.whatsapp_instancia) {
        const msg = `🎉 *Feliz Aniversário, ${rev.nome}!* 🎂\n\nParabéns pelo seu dia! Agradecemos por fazer parte da nossa equipe. Você é essencial! 💖\n\nQue venham muitas realizações! ✨`;
        const sent = await sendWhatsApp(tel, msg, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Aniversário Rev → ${rev.nome}`);
        await new Promise(r => setTimeout(r, 500));
      }

      alertsCreated.push(`Aniversário Rev: ${rev.nome}`);
    }

    // ═══════════════════════════════════════════
    // 3. MALETAS VENCENDO - Notificação + WhatsApp à revendedora
    // ═══════════════════════════════════════════
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + defaultConfig.dias_maleta_vencendo);
    
    const { data: maletas } = await supabase
      .from('maletas')
      .select('id, codigo, nome, data_devolucao, revendedora_id, organization_id, revendedoras(nome, telefone, whatsapp, email)')
      .eq('status', 'emprestada')
      .not('data_devolucao', 'is', null)
      .lte('data_devolucao', futureDate.toISOString().split('T')[0])
      .gte('data_devolucao', today.toISOString().split('T')[0]);

    for (const maleta of maletas || []) {
      const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
      const { data: existingNotif } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('tipo', 'maleta_vencendo')
        .ilike('mensagem', `%${maleta.codigo || maleta.nome}%`)
        .gte('created_at', todayStart.toISOString())
        .limit(1);

      if (existingNotif?.length) continue;

      const revData = maleta.revendedoras as any;
      const revNome = revData?.nome || 'Revendedora';
      const diasRestantes = Math.ceil(
        (new Date(maleta.data_devolucao!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const ownerId = maleta.organization_id ? ownerMap.get(maleta.organization_id) : null;
      if (ownerId) {
        await supabase.from('notificacoes').insert({
          user_id: ownerId,
          titulo: '📦 Maleta Vencendo',
          mensagem: `A maleta ${maleta.codigo || maleta.nome} com ${revNome} vence em ${diasRestantes} dia(s).`,
          tipo: 'maleta_vencendo',
          link: '/revendedoras',
        });
      }

      // Auto WhatsApp to revendedora
      const revTel = revData?.whatsapp || revData?.telefone;
      const config = maleta.organization_id ? configMap.get(maleta.organization_id) : null;
      if (revTel && config?.whatsapp_instancia) {
        const dataFormatada = new Date(maleta.data_devolucao!).toLocaleDateString('pt-BR');
        const msg = `📦 *Lembrete de Devolução de Maleta*\n\nOlá, ${revNome}!\n\nA maleta *"${maleta.codigo || maleta.nome}"* tem devolução prevista para *${dataFormatada}* (${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}).\n\nPor favor, organize os itens e entre em contato para agendar a devolução. 😊\n\nObrigado pela parceria! 💎`;
        const sent = await sendWhatsApp(revTel, msg, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Maleta vencendo → ${revNome}`);
        await new Promise(r => setTimeout(r, 500));
      }

      // Auto Email to revendedora via Brevo
      if (brevoKey && revData?.email) {
        const dataFormatada = new Date(maleta.data_devolucao!).toLocaleDateString('pt-BR');
        const sent = await sendEmailBrevo(brevoKey, revData.email, revNome,
          `📦 Maleta "${maleta.codigo || maleta.nome}" vence em ${diasRestantes} dia(s)`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#d69e2e;">📦 Lembrete de Devolução</h2>
            <p>Olá, <strong>${revNome}</strong>!</p>
            <div style="background:#fffff0;padding:20px;border-radius:8px;border-left:4px solid #d69e2e;margin:20px 0;">
              <p><strong>Maleta:</strong> ${maleta.codigo || maleta.nome}</p>
              <p><strong>Data de devolução:</strong> ${dataFormatada}</p>
              <p><strong>Dias restantes:</strong> ${diasRestantes}</p>
            </div>
            <p>Por favor, organize os itens e entre em contato para agendar a devolução.</p>
            <p>Obrigado pela parceria! 💎</p>
          </div>`
        );
        if (sent) emailsSent.push(`Maleta → ${revNome}`);
      }

      alertsCreated.push(`Maleta vencendo: ${maleta.codigo || maleta.nome}`);
    }

    // ═══════════════════════════════════════════
    // 4. ROMANEIOS PENDENTES - Notificação
    // ═══════════════════════════════════════════
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - defaultConfig.dias_romaneio_pendente);
    
    const { data: romaneios } = await supabase
      .from('romaneios')
      .select('id, numero, revendedora_id, organization_id, revendedoras(nome)')
      .eq('status', 'pendente')
      .lte('created_at', oldDate.toISOString());

    for (const romaneio of romaneios || []) {
      const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
      const { data: existingNotif } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('tipo', 'romaneio_pendente')
        .ilike('mensagem', `%${romaneio.numero}%`)
        .gte('created_at', todayStart.toISOString())
        .limit(1);

      if (!existingNotif?.length) {
        const revNome = (romaneio.revendedoras as any)?.nome || 'revendedora';
        const ownerId = romaneio.organization_id ? ownerMap.get(romaneio.organization_id) : null;
        if (ownerId) {
          await supabase.from('notificacoes').insert({
            user_id: ownerId,
            titulo: '📋 Romaneio Pendente',
            mensagem: `O romaneio ${romaneio.numero} de ${revNome} está pendente há mais de ${defaultConfig.dias_romaneio_pendente} dias.`,
            tipo: 'romaneio_pendente',
            link: '/romaneios',
          });
        }
        alertsCreated.push(`Romaneio pendente: ${romaneio.numero}`);
      }
    }

    console.log(`Verificação concluída. ${alertsCreated.length} alertas, ${whatsappSent.length} WhatsApp, ${emailsSent.length} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        whatsappSent: whatsappSent.length,
        emailsSent: emailsSent.length,
        details: { alertas: alertsCreated, whatsapp: whatsappSent, emails: emailsSent },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking alerts:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
