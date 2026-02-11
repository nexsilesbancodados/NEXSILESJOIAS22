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
      // Fetch all subscriptions
      const { data: assinaturas, error } = await adminClient
        .from('assinaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ALL profiles
      const { data: allProfiles } = await adminClient
        .from('profiles')
        .select('user_id, nome, email')
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

      // Build result: only owners (non-employee users)
      const result = (authUsers || [])
        .filter((authUser: any) => !employeeUserIds.has(authUser.id))
        .map((authUser: any) => {
          const sub = subMap.get(authUser.id);
          const prof = profileMap.get(authUser.id);
          const employees = employeesPerOwner.get(authUser.id) || [];
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
            profiles: prof || { nome: null, email: authUser.email },
            auth_created_at: authUser.created_at,
            funcionarios: employees,
          };
        });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const { id, user_id, updates } = await req.json();
      
      if (id) {
        // Update existing subscription
        const { error } = await adminClient
          .from('assinaturas')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } else if (user_id) {
        // Create subscription for user without one
        const { error } = await adminClient
          .from('assinaturas')
          .insert({
            user_id,
            plano: updates.plano || 'nexsiles',
            status: updates.status || 'ativo',
            data_vencimento: updates.data_vencimento,
            valor_mensal: updates.valor_mensal || 0,
            data_inicio: new Date().toISOString(),
          });
        if (error) throw error;
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
