import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    // Log config for debugging (mask key)
    console.log('Evolution URL:', evolutionUrl);
    console.log('Evolution Key configured:', evolutionKey ? `${evolutionKey.substring(0, 8)}...` : 'NOT SET');

    if (!evolutionUrl || !evolutionKey) {
      console.error('Missing config - URL:', !!evolutionUrl, 'Key:', !!evolutionKey);
      return new Response(JSON.stringify({ 
        error: 'Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nos secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize URL (remove trailing slash)
    const baseUrl = evolutionUrl.replace(/\/+$/, '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Exige lojista autenticado (owner/admin); a organização vem do token, não do body.
    const auth = await requireAuth(req, { roles: ["owner", "admin"] });
    if (auth.error) return auth.error;
    const organizationId = auth.ctx.organizationId;

    const { action, instanceName } = await req.json();

    // Generate unique instance name if not provided
    const finalInstanceName = instanceName || `org_${organizationId.substring(0, 8)}`;

    switch (action) {
      case 'reconfigure-webhook': {
        // Force reconfigure webhook for existing instance
        const rwUrl = `${supabaseUrl}/functions/v1/webhook-whatsapp`;
        console.log('Reconfiguring webhook for:', finalInstanceName, 'URL:', rwUrl);

        const rwResponse = await fetch(`${baseUrl}/webhook/set/${finalInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: rwUrl,
              webhookByEvents: false,
              webhookBase64: false,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
            }
          })
        });

        const rwResult = await rwResponse.json();
        console.log('Webhook reconfigure result:', JSON.stringify(rwResult));

        return new Response(JSON.stringify({
          success: true,
          webhook: rwResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        console.log('Creating instance:', finalInstanceName);
        console.log('Request URL:', `${baseUrl}/instance/create`);
        
        // Create the instance
        const createResponse = await fetch(`${baseUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: finalInstanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS'
          })
        });

        const createResult = await createResponse.json();
        console.log('Create response status:', createResponse.status);
        console.log('Create result:', JSON.stringify(createResult));

        if (!createResponse.ok) {
          if (createResult.message?.includes('already') || createResult.error?.includes('already')) {
            console.log('Instance already exists, reconfiguring webhook anyway');
          } else {
            console.error('Evolution API error:', {
              status: createResponse.status,
              statusText: createResponse.statusText,
              body: createResult
            });
            throw new Error(createResult.message || createResult.response?.message || `Erro da Evolution API: ${createResponse.status}`);
          }
        }

        // Configure webhook for this instance
        const webhookUrl = `${supabaseUrl}/functions/v1/webhook-whatsapp`;
        console.log('Configuring webhook:', webhookUrl);

        const webhookResponse = await fetch(`${baseUrl}/webhook/set/${finalInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: false,
              webhookBase64: false,
              events: [
                'MESSAGES_UPSERT',
                'CONNECTION_UPDATE'
              ]
            }
          })
        });

        const webhookResult = await webhookResponse.json();
        console.log('Webhook config result:', webhookResult);

        // Update agent config with instance name
        const { error: updateError } = await supabase
          .from('agente_ia_config')
          .update({ whatsapp_instancia: finalInstanceName })
          .eq('organization_id', organizationId);

        if (updateError) {
          console.error('Error updating agent config:', updateError);
        }

        // Get QR code
        const qrResponse = await fetch(`${baseUrl}/instance/connect/${finalInstanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          }
        });

        const qrResult = await qrResponse.json();
        console.log('QR result received');

        return new Response(JSON.stringify({
          success: true,
          instanceName: finalInstanceName,
          qrcode: qrResult.base64 || qrResult.qrcode?.base64,
          pairingCode: qrResult.pairingCode,
          status: qrResult.instance?.state || 'connecting'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        console.log('Checking status for:', finalInstanceName);
        
        const statusResponse = await fetch(`${baseUrl}/instance/connectionState/${finalInstanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          }
        });

        const statusResult = await statusResponse.json();
        console.log('Status result:', statusResult);

        return new Response(JSON.stringify({
          success: true,
          instanceName: finalInstanceName,
          status: statusResult.instance?.state || statusResult.state || 'unknown',
          connected: statusResult.instance?.state === 'open' || statusResult.state === 'open'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'qrcode': {
        console.log('Getting QR code for:', finalInstanceName);
        
        const qrResponse = await fetch(`${baseUrl}/instance/connect/${finalInstanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          }
        });

        const qrResult = await qrResponse.json();

        return new Response(JSON.stringify({
          success: true,
          qrcode: qrResult.base64 || qrResult.qrcode?.base64,
          pairingCode: qrResult.pairingCode,
          status: qrResult.instance?.state || 'connecting'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        console.log('Disconnecting instance:', finalInstanceName);
        
        const logoutResponse = await fetch(`${baseUrl}/instance/logout/${finalInstanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionKey,
          }
        });

        const logoutResult = await logoutResponse.json();

        // Clear instance from config
        await supabase
          .from('agente_ia_config')
          .update({ whatsapp_instancia: null })
          .eq('organization_id', organizationId);

        return new Response(JSON.stringify({
          success: true,
          message: 'Instância desconectada'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Evolution instance error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
