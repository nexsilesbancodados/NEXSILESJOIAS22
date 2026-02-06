import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!evolutionUrl || !evolutionKey) {
      return new Response(JSON.stringify({ 
        error: 'Evolution API não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organizationId, instanceName } = await req.json();

    // Generate unique instance name if not provided
    const finalInstanceName = instanceName || `org_${organizationId.substring(0, 8)}`;

    switch (action) {
      case 'create': {
        console.log('Creating instance:', finalInstanceName);
        
        // Create the instance
        const createResponse = await fetch(`${evolutionUrl}/instance/create`, {
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
        console.log('Create result:', createResult);

        if (!createResponse.ok) {
          // Instance might already exist, try to connect
          if (createResult.message?.includes('already') || createResult.error?.includes('already')) {
            console.log('Instance already exists, getting connection status');
          } else {
            throw new Error(createResult.message || 'Erro ao criar instância');
          }
        }

        // Configure webhook for this instance
        const webhookUrl = `${supabaseUrl}/functions/v1/webhook-whatsapp`;
        console.log('Configuring webhook:', webhookUrl);

        const webhookResponse = await fetch(`${evolutionUrl}/webhook/set/${finalInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE'
            ]
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
        const qrResponse = await fetch(`${evolutionUrl}/instance/connect/${finalInstanceName}`, {
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
        
        const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${finalInstanceName}`, {
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
        
        const qrResponse = await fetch(`${evolutionUrl}/instance/connect/${finalInstanceName}`, {
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
        
        const logoutResponse = await fetch(`${evolutionUrl}/instance/logout/${finalInstanceName}`, {
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
