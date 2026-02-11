import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionWebhookMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EvolutionWebhookMessage = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Only process incoming text messages
    if (payload.event !== 'messages.upsert') {
      console.log('Ignoring non-message event:', payload.event);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not a message event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignore messages sent by the bot itself
    if (payload.data?.key?.fromMe) {
      console.log('Ignoring own message');
      return new Response(JSON.stringify({ status: 'ignored', reason: 'own message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract message text
    const messageText = payload.data?.message?.conversation || 
                       payload.data?.message?.extendedTextMessage?.text;

    if (!messageText) {
      console.log('No text message found');
      return new Response(JSON.stringify({ status: 'ignored', reason: 'no text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract phone number (remove @s.whatsapp.net suffix)
    const remoteJid = payload.data.key.remoteJid;
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const senderName = payload.data.pushName || 'Cliente';
    const instanceName = payload.instance;

    console.log(`Message from ${senderName} (${phoneNumber}): ${messageText}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the organization that has this WhatsApp instance configured
    const { data: agentConfig, error: configError } = await supabase
      .from('agente_ia_config')
      .select('*')
      .eq('whatsapp_instancia', instanceName)
      .eq('ativo', true)
      .single();

    if (configError || !agentConfig) {
      console.error('No active agent config found for instance:', instanceName);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'no agent config for this instance' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const organizationId = agentConfig.organization_id;
    console.log('Found organization:', organizationId);

    // Generate or retrieve session ID for this phone number
    const sessionId = `whatsapp_${phoneNumber}`;

    // Check for existing conversation or create new one
    let { data: conversa } = await supabase
      .from('agente_conversas')
      .select('id')
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId)
      .eq('status', 'ativa')
      .single();

    if (!conversa) {
      const { data: newConversa, error: convError } = await supabase
        .from('agente_conversas')
        .insert({
          session_id: sessionId,
          organization_id: organizationId,
          cliente_nome: senderName,
          cliente_telefone: phoneNumber,
          status: 'ativa'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }
      conversa = newConversa;
    }

    // Save user message
    await supabase
      .from('agente_mensagens')
      .insert({
        conversa_id: conversa.id,
        role: 'user',
        content: messageText,
        metadata: { source: 'whatsapp', phoneNumber, senderName }
      });

    // Get conversation history
    const { data: mensagens } = await supabase
      .from('agente_mensagens')
      .select('role, content')
      .eq('conversa_id', conversa.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = mensagens?.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [{ role: 'user' as const, content: messageText }];

    // Call the AI agent function
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/agente-ia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages,
        organizationId,
        sessionId,
        clienteTelefone: phoneNumber,
        source: 'whatsapp',
        autoSendWhatsApp: true,
        whatsappPhone: phoneNumber
      })
    });

    const agentResult = await agentResponse.json();
    console.log('Agent response:', agentResult);

    if (agentResult.error) {
      console.error('Agent error:', agentResult.error);
      await sendWhatsAppMessage(phoneNumber, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', instanceName);
    } else if (agentResult.content) {
      // Save assistant message
      await supabase
        .from('agente_mensagens')
        .insert({
          conversa_id: conversa.id,
          role: 'assistant',
          content: agentResult.content,
          metadata: { source: 'whatsapp' }
        });

      // Extract image URLs from content and send as media separately
      const content = agentResult.content as string;
      const imageUrlRegex = /(?:IMAGEM_URL:\s*|!\[.*?\]\()(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif)[^\s\)]*)/gi;
      const imageMatches = [...content.matchAll(imageUrlRegex)];
      
      // Also check for Supabase storage URLs
      const storageUrlRegex = /(https?:\/\/[^\s]+\/storage\/v1\/object\/public\/[^\s]+)/gi;
      const storageMatches = [...content.matchAll(storageUrlRegex)];
      
      const allImageUrls = new Set<string>();
      for (const match of imageMatches) allImageUrls.add(match[1]);
      for (const match of storageMatches) allImageUrls.add(match[1]);
      
      // Clean the text content (remove image URLs and IMAGEM_URL markers for text message)
      let textContent = content
        .replace(/IMAGEM_URL:\s*https?:\/\/[^\s]+/gi, '')
        .replace(/!\[.*?\]\(https?:\/\/[^\s\)]+\)/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Send images first with product details as captions
      for (const imageUrl of allImageUrls) {
        // Try to extract a caption from nearby text (product name + price)
        const captionMatch = content.match(/(?:\*\*|✨)\s*([^\n*]+)[\s\S]*?(?:R\$\s*[\d.,]+)/);
        const caption = captionMatch ? captionMatch[0].replace(/IMAGEM_URL:[^\n]*/g, '').trim() : '';
        
        await sendWhatsAppMedia(phoneNumber, imageUrl, caption, instanceName);
        // Small delay between media messages
        await new Promise(r => setTimeout(r, 500));
      }

      // Send text message (without image URLs)
      if (textContent) {
        await sendWhatsAppMessage(phoneNumber, textContent, instanceName);
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendWhatsAppMessage(phone: string, message: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    console.error('Evolution API not configured');
    return false;
}

async function sendWhatsAppMedia(phone: string, mediaUrl: string, caption: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    console.error('Evolution API not configured for media');
    return false;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Normalize Supabase storage URLs
    let normalizedUrl = mediaUrl;
    if (normalizedUrl.includes('/storage/v1/object/public/')) {
      // Ensure it's a full public URL
      if (!normalizedUrl.startsWith('http')) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        normalizedUrl = `${supabaseUrl}${normalizedUrl}`;
      }
    }

    console.log(`Sending media to ${fullPhone}: ${normalizedUrl}`);

    const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: fullPhone,
        mediatype: 'image',
        media: normalizedUrl,
        caption: caption || ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API media error:', errorText);
      return false;
    }

    console.log('Media sent successfully to:', fullPhone);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp media:', error);
    return false;
  }
}

  try {
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', errorText);
      return false;
    }

    console.log('Message sent successfully to:', fullPhone);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}
