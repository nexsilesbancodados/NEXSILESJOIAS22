import { supabase } from '@/lib/supabase-db';

type EventoTipo = 'venda_realizada' | 'estoque_baixo' | 'maleta_vencendo' | 'novo_pedido_catalogo' | 'envio_atualizado' | 'pos_venda' | 'reativacao_cliente' | 'novo_pedido_ecommerce';

interface EventoDados {
  [key: string]: any;
}

export async function enviarNotificacaoEmail(tipo: EventoTipo, dados: EventoDados) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(
      `https://ljofnwcvpzqlhagejgbk.supabase.co/functions/v1/notificar-eventos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tipo, dados }),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      console.warn('Erro ao enviar notificação por email:', result.error);
    }
  } catch (err) {
    console.warn('Falha ao enviar notificação por email:', err);
  }
}
