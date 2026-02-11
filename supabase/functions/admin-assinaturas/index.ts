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

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to verify identity
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

    // Check if user is super admin
    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Fetch all subscriptions
      const { data: assinaturas, error } = await adminClient
        .from('assinaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ALL profiles (not just those with subscriptions)
      const { data: allProfiles } = await adminClient
        .from('profiles')
        .select('user_id, nome, email')
        .order('created_at', { ascending: false });

      // Also list all auth users to catch those without profiles
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

      // Build a map of subscriptions by user_id
      const subMap = new Map((assinaturas || []).map((a: any) => [a.user_id, a]));
      const profileMap = new Map((allProfiles || []).map((p: any) => [p.user_id, p]));

      // Merge: all auth users, with their subscription (if any) and profile
      const result = (authUsers || []).map((authUser: any) => {
        const sub = subMap.get(authUser.id);
        const prof = profileMap.get(authUser.id);
        return {
          // Subscription fields (or defaults for users without subscription)
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
        };
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const { id, updates } = await req.json();
      if (!id || !updates) {
        return new Response(JSON.stringify({ error: 'ID e updates obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await adminClient
        .from('assinaturas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

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
