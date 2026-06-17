import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_ADMIN_EMAILS = [
  'beneloahsemijoias@gmail.com',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const statsOnly = url.searchParams.get('stats');

      // WhatsApp config endpoint
      if (statsOnly === 'whatsapp_config') {
        const { data: configs } = await adminClient
          .from('configuracoes')
          .select('chave, valor')
          .is('organization_id', null)
          .in('chave', ['global_evolution_api_url', 'global_evolution_api_key', 'global_whatsapp_instancia']);
        
        const configMap: Record<string, string> = {};
        (configs || []).forEach((c: any) => { configMap[c.chave] = c.valor; });
        
        return new Response(JSON.stringify({
          evolution_api_url: configMap['global_evolution_api_url'] || '',
          evolution_api_key: configMap['global_evolution_api_key'] || '',
          instancia_global: configMap['global_whatsapp_instancia'] || '',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Platform stats endpoint
      if (statsOnly === 'platform') {
        const { count: totalOrgs } = await adminClient.from('organizations').select('*', { count: 'exact', head: true });
        const { count: totalLojasAtivas } = await adminClient.from('ecommerce_config').select('*', { count: 'exact', head: true }).eq('ativo', true);
        const { count: totalLojas } = await adminClient.from('ecommerce_config').select('*', { count: 'exact', head: true });
        const { count: totalPecas } = await adminClient.from('pecas').select('*', { count: 'exact', head: true });
        
        // Total sales all-time
        const { data: vendasTotal } = await adminClient.from('vendas').select('valor_total');
        const volumeTotal = (vendasTotal || []).reduce((s: number, v: any) => s + (v.valor_total || 0), 0);
        const totalVendas = (vendasTotal || []).length;
        
        // Sales this month
        const mesInicio = new Date();
        mesInicio.setDate(1);
        mesInicio.setHours(0, 0, 0, 0);
        const { data: vendasMes } = await adminClient.from('vendas').select('valor_total').gte('created_at', mesInicio.toISOString());
        const volumeMes = (vendasMes || []).reduce((s: number, v: any) => s + (v.valor_total || 0), 0);
        const vendasMesCount = (vendasMes || []).length;

        // Ecommerce orders
        const { count: totalPedidosEcom } = await adminClient.from('ecommerce_pedidos').select('*', { count: 'exact', head: true });
        const { data: pedidosEcomTotal } = await adminClient.from('ecommerce_pedidos').select('valor_total');
        const volumeEcom = (pedidosEcomTotal || []).reduce((s: number, v: any) => s + (v.valor_total || 0), 0);

        // Top orgs by sales
        const { data: orgVendas } = await adminClient.from('vendas').select('organization_id, valor_total');
        const orgMap = new Map<string, { count: number; total: number }>();
        (orgVendas || []).forEach((v: any) => {
          const entry = orgMap.get(v.organization_id) || { count: 0, total: 0 };
          entry.count++;
          entry.total += v.valor_total || 0;
          orgMap.set(v.organization_id, entry);
        });
        
        // Get org names
        const orgIds = [...orgMap.keys()];
        const { data: orgs } = await adminClient.from('organizations').select('id, name').in('id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']);
        const orgNameMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));
        
        const topOrgs = [...orgMap.entries()]
          .map(([id, data]) => ({ id, name: orgNameMap.get(id) || 'Desconhecida', ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        return new Response(JSON.stringify({
          totalOrgs: totalOrgs || 0,
          totalLojas: totalLojas || 0,
          totalLojasAtivas: totalLojasAtivas || 0,
          totalPecas: totalPecas || 0,
          totalVendas,
          volumeTotal,
          vendasMesCount,
          volumeMes,
          totalPedidosEcom: totalPedidosEcom || 0,
          volumeEcom,
          topOrgs,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch all subscriptions
      const { data: assinaturas, error } = await adminClient
        .from('assinaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ALL profiles
      const { data: allProfiles } = await adminClient
        .from('profiles')
        .select('user_id, nome, email, telefone')
        .order('created_at', { ascending: false });

      // Fetch memberships to identify employees vs owners
      const { data: allMemberships } = await adminClient
        .from('memberships')
        .select('user_id, organization_id, role');

      // Fetch funcionarios to get cargo
      const { data: allFuncionarios } = await adminClient
        .from('funcionarios')
        .select('user_id, nome, cargo, organization_id');

      // List all auth users
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

      const subMap = new Map((assinaturas || []).map((a: any) => [a.user_id, a]));
      const profileMap = new Map((allProfiles || []).map((p: any) => [p.user_id, p]));
      const membershipMap = new Map((allMemberships || []).map((m: any) => [m.user_id, m]));
      const funcionarioMap = new Map((allFuncionarios || []).map((f: any) => [f.user_id, f]));

      // Build org owner map: organization_id -> owner user_id
      const orgOwnerMap = new Map<string, string>();
      (allMemberships || []).forEach((m: any) => {
        if (m.role === 'owner') {
          orgOwnerMap.set(m.organization_id, m.user_id);
        }
      });

      // Build employees per owner: owner_user_id -> employee[]
      const employeesPerOwner = new Map<string, any[]>();
      
      // Identify employee user IDs
      const employeeUserIds = new Set<string>();

      (allMemberships || []).forEach((m: any) => {
        if (m.role !== 'owner') {
          const ownerUserId = orgOwnerMap.get(m.organization_id);
          if (ownerUserId) {
            employeeUserIds.add(m.user_id);
            const prof = profileMap.get(m.user_id);
            const func = funcionarioMap.get(m.user_id);
            const authUser = (authUsers || []).find((u: any) => u.id === m.user_id);
            const emp = {
              user_id: m.user_id,
              nome: func?.nome || prof?.nome || authUser?.email || '—',
              email: prof?.email || authUser?.email || '—',
              cargo: func?.cargo || 'Funcionário',
            };
            if (!employeesPerOwner.has(ownerUserId)) {
              employeesPerOwner.set(ownerUserId, []);
            }
            employeesPerOwner.get(ownerUserId)!.push(emp);
          }
        }
      });

      // Build result: include ALL auth users (owners + funcionarios)
      // Funcionarios are flagged so UI can render them distinctly
      const result = (authUsers || [])
        .map((authUser: any) => {
          const sub = subMap.get(authUser.id);
          const prof = profileMap.get(authUser.id);
          const employees = employeesPerOwner.get(authUser.id) || [];
          const isFuncionario = employeeUserIds.has(authUser.id);
          const func = funcionarioMap.get(authUser.id);
          return {
            id: sub?.id || null,
            user_id: authUser.id,
            plano: sub?.plano || null,
            status: sub?.status || 'sem_plano',
            data_inicio: sub?.data_inicio || null,
            data_vencimento: sub?.data_vencimento || null,
            valor_mensal: sub?.valor_mensal || 0,
            trial_ativo: sub?.trial_ativo || false,
            metodo_pagamento: sub?.metodo_pagamento || null,
            created_at: sub?.created_at || authUser.created_at,
            stripe_customer_id: sub?.stripe_customer_id || null,
            stripe_subscription_id: sub?.stripe_subscription_id || null,
            mercadopago_preference_id: sub?.mercadopago_preference_id || null,
            mercadopago_payment_id: sub?.mercadopago_payment_id || null,
            notificacao_3dias_enviada: sub?.notificacao_3dias_enviada || false,
            notificacao_vencimento_enviada: sub?.notificacao_vencimento_enviada || false,
            pagamento_recorrente: sub?.pagamento_recorrente || false,
            has_subscription: !!sub,
            profiles: prof || { nome: func?.nome || null, email: authUser.email },
            auth_created_at: authUser.created_at,
            funcionarios: employees,
            is_funcionario: isFuncionario,
            cargo: func?.cargo || null,
            tipo_usuario: isFuncionario ? 'funcionario' : 'titular',
          };
        })
        .sort((a: any, b: any) => {
          // Titulares primeiro, depois funcionários
          if (a.is_funcionario !== b.is_funcionario) return a.is_funcionario ? 1 : -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const body = await req.json();

      // Handle profile telefone update
      if (body.action === 'update_profile_telefone') {
        const { user_id: uid, telefone } = body;
        const { error } = await adminClient
          .from('profiles')
          .update({ telefone, updated_at: new Date().toISOString() })
          .eq('user_id', uid);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle WhatsApp config save
      if (body.action === 'update_whatsapp_config') {
        const { config } = body;
        // Store each config key in configuracoes table (global, no org)
        const keys = [
          { chave: 'global_evolution_api_url', valor: config.evolution_api_url },
          { chave: 'global_evolution_api_key', valor: config.evolution_api_key },
          { chave: 'global_whatsapp_instancia', valor: config.instancia_global },
        ];
        for (const k of keys) {
          const { data: existing } = await adminClient
            .from('configuracoes')
            .select('id')
            .eq('chave', k.chave)
            .is('organization_id', null)
            .maybeSingle();
          if (existing) {
            await adminClient.from('configuracoes').update({ valor: k.valor, updated_at: new Date().toISOString() }).eq('id', existing.id);
          } else {
            await adminClient.from('configuracoes').insert({ chave: k.chave, valor: k.valor, organization_id: null, tipo: 'global', descricao: 'Config global WhatsApp' });
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { id, user_id, updates } = body;
      console.log('PUT request:', JSON.stringify({ id, user_id, updates }));
      
      if (id) {
        const { error } = await adminClient
          .from('assinaturas')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else if (user_id) {
        const now = new Date();
        const defaultVencimento = new Date(now);
        defaultVencimento.setMonth(defaultVencimento.getMonth() + 1);
        
        const insertData = {
          user_id,
          plano: updates.plano || 'nexsiles',
          status: updates.status || 'ativo',
          data_vencimento: updates.data_vencimento || defaultVencimento.toISOString(),
          valor_mensal: updates.valor_mensal ?? 0,
          data_inicio: now.toISOString(),
        };
        console.log('Inserting new subscription:', JSON.stringify(insertData));
        
        const { error } = await adminClient
          .from('assinaturas')
          .insert(insertData);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      } else {
        return new Response(JSON.stringify({ error: 'ID ou user_id obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { error } = await adminClient.from('assinaturas').insert(body);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await adminClient
        .from('assinaturas')
        .delete()
        .eq('id', id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Método não suportado' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
