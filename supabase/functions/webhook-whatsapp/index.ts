import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

async function sendWhatsAppMessage(phone: string, message: string, instanceName: string): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionUrl || !evolutionKey) {
    console.error('Evolution API not configured');
    return false;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    console.log(`Sending text to ${fullPhone} via instance ${instanceName}`);

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
      console.error('Evolution API error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('Message sent successfully to:', fullPhone, result);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
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

    let normalizedUrl = mediaUrl;
    if (normalizedUrl.includes('/storage/v1/object/public/')) {
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
      console.error('Evolution API media error:', response.status, errorText);
      return false;
    }

    console.log('Media sent successfully to:', fullPhone);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp media:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EvolutionWebhookMessage = await req.json();
    console.log('Webhook received event:', payload.event, 'instance:', payload.instance);

    // Only process incoming text messages
    if (payload.event !== 'messages.upsert') {
      console.log('Ignoring non-message event:', payload.event);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not a message event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignore messages sent by the bot itself
    if (payload.data?.key?.fromMe) {
      return new Response(JSON.stringify({ status: 'ignored', reason: 'own message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract message text
    const messageText = payload.data?.message?.conversation || 
                       payload.data?.message?.extendedTextMessage?.text;

    if (!messageText) {
      console.log('No text message found in payload');
      return new Response(JSON.stringify({ status: 'ignored', reason: 'no text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract phone number
    const remoteJid = payload.data.key.remoteJid;
    
    // Ignore group messages
    if (remoteJid.endsWith('@g.us')) {
      console.log('Ignoring group message');
      return new Response(JSON.stringify({ status: 'ignored', reason: 'group message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
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
      console.error('No active agent config found for instance:', instanceName, configError);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'no agent config for this instance' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const organizationId = agentConfig.organization_id;
    console.log('Found organization:', organizationId);

    // Session ID based on phone number (persists across conversations)
    const sessionId = `whatsapp_${phoneNumber}`;

    // Close stale conversations (older than 6 hours) to avoid polluted context
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('agente_conversas')
      .update({ status: 'finalizada', closed_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId)
      .eq('status', 'ativa')
      .lt('ultimo_contato_at', sixHoursAgo);

    // Check for existing active conversation or create new one
    let { data: conversa } = await supabase
      .from('agente_conversas')
      .select('id, assigned_to, status, venda_realizada')
      .eq('session_id', sessionId)
      .eq('organization_id', organizationId)
      .in('status', ['ativa', 'humano'])
      .maybeSingle();

    // Check if conversation is handled by a human or already sold
    let skipAI = false;

    if (conversa) {
      // If assigned to a human or status is 'humano', don't send AI response
      if (conversa.assigned_to || conversa.status === 'humano') {
        console.log(`Conversation ${conversa.id} is handled by human, skipping AI response`);
        skipAI = true;
      }
      // If sale was already completed, don't send AI response
      if (conversa.venda_realizada) {
        console.log(`Conversation ${conversa.id} already has a completed sale, skipping AI response`);
        skipAI = true;
      }
    }

    // Also check if there's a human queue entry for this conversation
    if (conversa && !skipAI) {
      const { data: filaEntry } = await supabase
        .from('agente_fila_humana')
        .select('id')
        .eq('conversa_id', conversa.id)
        .in('status', ['aguardando', 'em_atendimento'])
        .maybeSingle();

      if (filaEntry) {
        console.log(`Conversation ${conversa.id} is in human queue, skipping AI response`);
        skipAI = true;
      }
    }

    if (!conversa) {
      const { data: newConversa, error: convError } = await supabase
        .from('agente_conversas')
        .insert({
          session_id: sessionId,
          organization_id: organizationId,
          cliente_nome: senderName,
          cliente_telefone: phoneNumber,
          origem: 'whatsapp',
          status: 'ativa'
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }
      conversa = newConversa;
    } else {
      // Update last contact and reset follow-up flags (client replied)
      await supabase
        .from('agente_conversas')
        .update({ 
          ultimo_contato_at: new Date().toISOString(),
          cliente_nome: senderName,
          follow_up_enviado: false,
          follow_up_at: null,
        })
        .eq('id', conversa.id);
    }

    // Save user message
    await supabase
      .from('agente_mensagens')
      .insert({
        conversa_id: conversa!.id,
        role: 'user',
        content: messageText,
        metadata: { source: 'whatsapp', phoneNumber, senderName }
      });

    // If handled by human, skip AI response
    if (skipAI) {
      console.log('Skipping AI response - conversation handled by human or sale completed');
      return new Response(JSON.stringify({ status: 'skipped', reason: 'human_handling' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation history (last 10 messages for cleaner context)
    const { data: mensagens } = await supabase
      .from('agente_mensagens')
      .select('role, content')
      .eq('conversa_id', conversa!.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Reverse to get chronological order
    mensagens?.reverse();

    const messages = mensagens?.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [{ role: 'user' as const, content: messageText }];

    // Call the AI agent function
    console.log('Calling agente-ia with', messages.length, 'messages');
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
        source: 'whatsapp'
      })
    });

    const agentResult = await agentResponse.json();
    console.log('Agent response status:', agentResponse.status, 'has content:', !!agentResult.content);

    if (agentResult.error) {
      console.error('Agent error:', agentResult.error);
      await sendWhatsAppMessage(phoneNumber, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em instantes. 🙏', instanceName);
    } else if (agentResult.content) {
      // Save assistant message
      await supabase
        .from('agente_mensagens')
        .insert({
          conversa_id: conversa!.id,
          role: 'assistant',
          content: agentResult.content,
          metadata: { source: 'whatsapp' }
        });

      const content = agentResult.content as string;
      
      // Extract image URLs - look for IMAGEM_URL: pattern first (most reliable)
      const imagemUrlRegex = /IMAGEM_URL:\s*(https?:\/\/[^\s\n]+)/gi;
      const imagemMatches = [...content.matchAll(imagemUrlRegex)];
      // Also check markdown image syntax and storage URLs
      const imageUrlRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/gi;
      const imageMatches = [...content.matchAll(imageUrlRegex)];
      const storageUrlRegex = /(https?:\/\/[^\s]+\/storage\/v1\/object\/public\/[^\s]+)/gi;
      const storageMatches = [...content.matchAll(storageUrlRegex)];
      
      const allImageUrls = new Set<string>();
      for (const match of imagemMatches) allImageUrls.add(match[1].replace(/#$/, '').trim());
      for (const match of imageMatches) allImageUrls.add(match[1].replace(/#$/, '').trim());
      for (const match of storageMatches) allImageUrls.add(match[1].replace(/#$/, '').trim());
      
      // Clean text content - remove IMAGEM_URL lines and markdown images
      let textContent = content
        .replace(/IMAGEM_URL:\s*https?:\/\/[^\s\n]+/gi, '')
        .replace(/!\[.*?\]\(https?:\/\/[^\s\)]+\)/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Send images first
      for (const imageUrl of allImageUrls) {
        const captionMatch = content.match(/(?:\*\*|✨)\s*([^\n*]+)[\s\S]*?(?:R\$\s*[\d.,]+)/);
        const caption = captionMatch ? captionMatch[0].replace(/IMAGEM_URL:[^\n]*/g, '').trim() : '';
        
        await sendWhatsAppMedia(phoneNumber, imageUrl, caption, instanceName);
        await new Promise(r => setTimeout(r, 500));
      }

      // Send text message
      if (textContent) {
        // Split long messages (WhatsApp limit ~4096 chars)
        if (textContent.length > 3500) {
          const parts = textContent.match(/[\s\S]{1,3500}/g) || [textContent];
          for (const part of parts) {
            await sendWhatsAppMessage(phoneNumber, part.trim(), instanceName);
            await new Promise(r => setTimeout(r, 300));
          }
        } else {
          await sendWhatsAppMessage(phoneNumber, textContent, instanceName);
        }
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
