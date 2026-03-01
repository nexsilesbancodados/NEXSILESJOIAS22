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
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    console.log('Iniciando verificação de alertas com automações...');

    // Pre-load configs and owners in parallel
    const [configsRes, membershipsRes, existingNotifsRes] = await Promise.all([
      supabase.from('agente_ia_config').select('organization_id, whatsapp_instancia, dono_email, dono_nome, dono_whatsapp'),
      supabase.from('memberships').select('organization_id, user_id, role').eq('role', 'owner'),
      supabase.from('notificacoes').select('tipo, mensagem').gte('created_at', todayISO),
    ]);
    
    const configMap = new Map<string, any>();
    for (const c of configsRes.data || []) {
      if (c.organization_id) configMap.set(c.organization_id, c);
    }

    const ownerMap = new Map<string, string>();
    for (const m of membershipsRes.data || []) {
      ownerMap.set(m.organization_id, m.user_id);
    }

    // Build a set of existing notifications for today to avoid N+1 queries
    const existingNotifSet = new Set<string>();
    for (const n of existingNotifsRes.data || []) {
      existingNotifSet.add(`${n.tipo}::${n.mensagem}`);
    }

    function hasNotifToday(tipo: string, keyword: string): boolean {
      for (const key of existingNotifSet) {
        if (key.startsWith(`${tipo}::`) && key.toLowerCase().includes(keyword.toLowerCase())) return true;
      }
      return false;
    }

    // ═══ 1. ESTOQUE BAIXO ═══
    const { data: lowStockPieces } = await supabase
      .from('pecas')
      .select('id, nome, codigo, estoque, estoque_minimo, organization_id')
      .eq('ativo', true);

    const orgStockAlerts = new Map<string, Array<{ nome: string; codigo: string; estoque: number }>>();
    const notifInserts: any[] = [];

    for (const peca of lowStockPieces || []) {
      const minimo = peca.estoque_minimo || defaultConfig.estoque_minimo;
      const estoqueAtual = peca.estoque || 0;
      
      if (estoqueAtual <= minimo && peca.organization_id) {
        if (hasNotifToday('estoque_baixo', peca.nome)) continue;

        const ownerId = ownerMap.get(peca.organization_id);
        if (ownerId) {
          const msg = `A peça "${peca.nome}" (${peca.codigo || 'S/C'}) está com apenas ${estoqueAtual} unidades.`;
          notifInserts.push({
            user_id: ownerId,
            titulo: '⚠️ Estoque Baixo',
            mensagem: msg,
            tipo: 'estoque_baixo',
            link: '/pecas',
          });
          existingNotifSet.add(`estoque_baixo::${msg}`);
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

    // Batch insert notifications
    if (notifInserts.length > 0) {
      await supabase.from('notificacoes').insert(notifInserts);
    }

    // Send grouped stock alert emails per org
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
          </div>`
        );
        if (sent) emailsSent.push(`Estoque baixo → ${profile.email}`);

        const config = configMap.get(orgId);
        if (config?.whatsapp_instancia && config?.dono_whatsapp) {
          const msg = `⚠️ *ALERTA DE ESTOQUE BAIXO*\n\n${pecas.map(p => `• ${p.nome} (${p.codigo}): *${p.estoque} un.*`).join('\n')}\n\nAcesse o sistema para repor o estoque! 📦`;
          const wSent = await sendWhatsApp(config.dono_whatsapp, msg, config.whatsapp_instancia);
          if (wSent) whatsappSent.push(`Estoque baixo → dono`);
        }
      }
    }

    // ═══ 2. ANIVERSÁRIOS ═══
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const birthdayNotifs: any[] = [];

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
      if (hasNotifToday('aniversario', cliente.nome)) continue;

      const ownerId = ownerMap.get(cliente.organization_id);
      if (ownerId) {
        const msg = `Hoje é aniversário de ${cliente.nome}! Mensagem de parabéns enviada automaticamente.`;
        birthdayNotifs.push({
          user_id: ownerId,
          titulo: '🎂 Aniversário de Cliente',
          mensagem: msg,
          tipo: 'aniversario',
          link: '/clientes',
        });
        existingNotifSet.add(`aniversario::${msg}`);
      }

      const tel = cliente.whatsapp || cliente.telefone;
      const config = configMap.get(cliente.organization_id);
      if (tel && config?.whatsapp_instancia) {
        const msgW = `🎂 *Feliz Aniversário, ${cliente.nome}!* 🎉\n\nDesejamos um dia repleto de alegrias! ✨\n\nComo presente, você ganha *10% de desconto* na próxima compra! 🎁\n\nVálido por 7 dias. 💎`;
        const sent = await sendWhatsApp(tel, msgW, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Aniversário → ${cliente.nome}`);
      }

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
      if (hasNotifToday('aniversario', rev.nome)) continue;

      const ownerId = ownerMap.get(rev.organization_id);
      if (ownerId) {
        const msg = `Hoje é aniversário de ${rev.nome}! Parabéns enviados automaticamente.`;
        birthdayNotifs.push({
          user_id: ownerId,
          titulo: '🎉 Aniversário de Revendedora',
          mensagem: msg,
          tipo: 'aniversario',
          link: '/revendedoras',
        });
        existingNotifSet.add(`aniversario::${msg}`);
      }

      const tel = rev.whatsapp || rev.telefone;
      const config = configMap.get(rev.organization_id);
      if (tel && config?.whatsapp_instancia) {
        const msgW = `🎉 *Feliz Aniversário, ${rev.nome}!* 🎂\n\nParabéns pelo seu dia! Você é essencial! 💖✨`;
        const sent = await sendWhatsApp(tel, msgW, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Aniversário Rev → ${rev.nome}`);
      }
      alertsCreated.push(`Aniversário Rev: ${rev.nome}`);
    }

    if (birthdayNotifs.length > 0) {
      await supabase.from('notificacoes').insert(birthdayNotifs);
    }

    // ═══ 3. MALETAS VENCENDO ═══
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + defaultConfig.dias_maleta_vencendo);
    
    const { data: maletas } = await supabase
      .from('maletas')
      .select('id, codigo, nome, data_devolucao, revendedora_id, organization_id, revendedoras(nome, telefone, whatsapp, email)')
      .eq('status', 'emprestada')
      .not('data_devolucao', 'is', null)
      .lte('data_devolucao', futureDate.toISOString().split('T')[0])
      .gte('data_devolucao', today.toISOString().split('T')[0]);

    const maletaNotifs: any[] = [];
    for (const maleta of maletas || []) {
      const keyword = maleta.codigo || maleta.nome;
      if (hasNotifToday('maleta_vencendo', keyword)) continue;

      const revData = maleta.revendedoras as any;
      const revNome = revData?.nome || 'Revendedora';
      const diasRestantes = Math.ceil(
        (new Date(maleta.data_devolucao!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const ownerId = maleta.organization_id ? ownerMap.get(maleta.organization_id) : null;
      if (ownerId) {
        const msg = `A maleta ${keyword} com ${revNome} vence em ${diasRestantes} dia(s).`;
        maletaNotifs.push({
          user_id: ownerId,
          titulo: '📦 Maleta Vencendo',
          mensagem: msg,
          tipo: 'maleta_vencendo',
          link: '/revendedoras',
        });
        existingNotifSet.add(`maleta_vencendo::${msg}`);
      }

      const revTel = revData?.whatsapp || revData?.telefone;
      const config = maleta.organization_id ? configMap.get(maleta.organization_id) : null;
      if (revTel && config?.whatsapp_instancia) {
        const dataFormatada = new Date(maleta.data_devolucao!).toLocaleDateString('pt-BR');
        const msgW = `📦 *Lembrete de Devolução*\n\nOlá, ${revNome}!\n\nA maleta *"${keyword}"* vence em *${dataFormatada}* (${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}).\n\nOrganize os itens para devolução. 😊💎`;
        const sent = await sendWhatsApp(revTel, msgW, config.whatsapp_instancia);
        if (sent) whatsappSent.push(`Maleta → ${revNome}`);
      }

      if (brevoKey && revData?.email) {
        const dataFormatada = new Date(maleta.data_devolucao!).toLocaleDateString('pt-BR');
        const sent = await sendEmailBrevo(brevoKey, revData.email, revNome,
          `📦 Maleta "${keyword}" vence em ${diasRestantes} dia(s)`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#d69e2e;">📦 Lembrete de Devolução</h2>
            <p>Olá, <strong>${revNome}</strong>!</p>
            <div style="background:#fffff0;padding:20px;border-radius:8px;border-left:4px solid #d69e2e;margin:20px 0;">
              <p><strong>Maleta:</strong> ${keyword}</p>
              <p><strong>Devolução:</strong> ${dataFormatada}</p>
              <p><strong>Dias restantes:</strong> ${diasRestantes}</p>
            </div>
            <p>Obrigado pela parceria! 💎</p>
          </div>`
        );
        if (sent) emailsSent.push(`Maleta → ${revNome}`);
      }
      alertsCreated.push(`Maleta vencendo: ${keyword}`);
    }

    if (maletaNotifs.length > 0) {
      await supabase.from('notificacoes').insert(maletaNotifs);
    }

    // ═══ 4. ROMANEIOS PENDENTES ═══
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - defaultConfig.dias_romaneio_pendente);
    
    const { data: romaneios } = await supabase
      .from('romaneios')
      .select('id, numero, revendedora_id, organization_id, revendedoras(nome)')
      .eq('status', 'pendente')
      .lte('created_at', oldDate.toISOString());

    const romaneioNotifs: any[] = [];
    for (const romaneio of romaneios || []) {
      if (hasNotifToday('romaneio_pendente', String(romaneio.numero))) continue;

      const revNome = (romaneio.revendedoras as any)?.nome || 'revendedora';
      const ownerId = romaneio.organization_id ? ownerMap.get(romaneio.organization_id) : null;
      if (ownerId) {
        const msg = `O romaneio ${romaneio.numero} de ${revNome} está pendente há mais de ${defaultConfig.dias_romaneio_pendente} dias.`;
        romaneioNotifs.push({
          user_id: ownerId,
          titulo: '📋 Romaneio Pendente',
          mensagem: msg,
          tipo: 'romaneio_pendente',
          link: '/romaneios',
        });
      }
      alertsCreated.push(`Romaneio pendente: ${romaneio.numero}`);
    }

    if (romaneioNotifs.length > 0) {
      await supabase.from('notificacoes').insert(romaneioNotifs);
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
