import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    // Admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get caller's organization
    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("organization_id, role")
      .eq("user_id", callerUserId)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Organização não encontrada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only owners/admins can create employees
    if (membership.role !== "owner" && membership.role !== "admin") {
      return new Response(JSON.stringify({ error: "Sem permissão para criar funcionários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { nome, email, senha, telefone, cargo } = await req.json();

    if (!nome || !email || !senha) {
      return new Response(JSON.stringify({ error: "Nome, email e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senha.length < 6) {
      return new Response(JSON.stringify({ error: "Senha deve ter pelo menos 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription plan limits
    const PLAN_LIMITS: Record<string, number> = {
      nexsiles: 5,
      nexsiles_max: 25,
    };

    // Get owner's subscription (the organization owner)
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("owner_id")
      .eq("id", membership.organization_id)
      .single();

    let maxFuncionarios = 0;
    if (org) {
      const { data: assinatura } = await supabaseAdmin
        .from("assinaturas")
        .select("plano, status")
        .eq("user_id", org.owner_id)
        .eq("status", "ativo")
        .maybeSingle();

      if (assinatura) {
        maxFuncionarios = PLAN_LIMITS[assinatura.plano] || 0;
      }
    }

    if (maxFuncionarios === 0) {
      return new Response(JSON.stringify({ error: "Assinatura ativa não encontrada. Renove seu plano para adicionar funcionários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count current active employees
    const { count: currentCount } = await supabaseAdmin
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .eq("ativo", true);

    if ((currentCount || 0) >= maxFuncionarios) {
      return new Response(JSON.stringify({ 
        error: `Limite de funcionários atingido (${maxFuncionarios}). Faça upgrade do seu plano para adicionar mais.`,
        limit: maxFuncionarios,
        current: currentCount,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the role based on cargo
    const isAdminCargo = cargo === "admin";
    const userRole = isAdminCargo ? "admin" : "user";

    // 1. Create auth user (admin API - won't affect caller's session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: {
        nome,
        role: userRole,
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Este email já está cadastrado" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createError;
    }

    const newUserId = newUser.user.id;

    // 2. Add user to the same organization
    const membershipRole = isAdminCargo ? "admin" : "member";
    await supabaseAdmin
      .from("memberships")
      .insert({
        user_id: newUserId,
        organization_id: membership.organization_id,
        role: membershipRole,
      });

    // 3. Add role in user_roles table
    await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role: userRole,
      }, { onConflict: "user_id,role" });

    // 4. Update/create the funcionario record with user_id
    const { data: existingFunc } = await supabaseAdmin
      .from("funcionarios")
      .select("id")
      .eq("email", email)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (existingFunc) {
      await supabaseAdmin
        .from("funcionarios")
        .update({ user_id: newUserId, cargo: cargo || "vendedor" })
        .eq("id", existingFunc.id);
    } else {
      await supabaseAdmin
        .from("funcionarios")
        .insert({
          nome,
          email,
          telefone: telefone || null,
          cargo: cargo || "vendedor",
          user_id: newUserId,
          organization_id: membership.organization_id,
          ativo: true,
        });
    }

    // 5. If admin cargo, set all permissions to true automatically
    if (isAdminCargo) {
      const { data: funcRecord } = await supabaseAdmin
        .from("funcionarios")
        .select("id")
        .eq("user_id", newUserId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

      if (funcRecord) {
        const allModules = [
          'dashboard', 'pecas', 'clientes', 'vendas', 'revendedoras',
          'romaneios', 'catalogos', 'fornecedores', 'banhos', 'relatorios',
          'configuracoes', 'campanhas', 'atendimento', 'etiquetas', 'historico'
        ];

        const permissionsToInsert = allModules.map(modulo => ({
          funcionario_id: funcRecord.id,
          modulo,
          pode_ver: true,
          pode_criar: true,
          pode_editar: true,
          pode_excluir: true,
        }));

        // Delete existing permissions first, then insert all
        await supabaseAdmin
          .from("funcionario_permissoes")
          .delete()
          .eq("funcionario_id", funcRecord.id);

        await supabaseAdmin
          .from("funcionario_permissoes")
          .insert(permissionsToInsert);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Funcionário criado com sucesso",
        user_id: newUserId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
