export interface VendaRecibo {
  id?: string;
  items: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
  total: number;
  pagamentos: Array<{
    forma: string;
    valor: number;
  }>;
  data?: Date;
}

export interface CatalogoInfo {
  nome: string;
  url: string;
}

export function formatReciboWhatsApp(venda: VendaRecibo, nomeCliente?: string): string {
  const data = venda.data ? new Date(venda.data).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  
  let mensagem = `🧾 *RECIBO DE VENDA*\n`;
  mensagem += `📅 ${data}\n`;
  
  if (nomeCliente) {
    mensagem += `👤 Cliente: ${nomeCliente}\n`;
  }
  
  mensagem += `\n*Itens:*\n`;
  mensagem += `──────────────────\n`;
  
  venda.items.forEach(item => {
    const subtotal = item.quantidade * item.preco;
    mensagem += `• ${item.nome}\n`;
    mensagem += `  ${item.quantidade}x R$ ${item.preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
  });
  
  mensagem += `──────────────────\n`;
  mensagem += `💰 *TOTAL: R$ ${venda.total.toFixed(2)}*\n\n`;
  
  mensagem += `*Pagamento:*\n`;
  venda.pagamentos.forEach(pag => {
    mensagem += `• ${pag.forma}: R$ ${pag.valor.toFixed(2)}\n`;
  });
  
  mensagem += `\n✨ Obrigado pela preferência!`;
  
  return mensagem;
}

export function formatCatalogoWhatsApp(catalogo: CatalogoInfo): string {
  return `✨ Confira nosso catálogo *${catalogo.nome}*!\n\n` +
         `👉 ${catalogo.url}\n\n` +
         `Peças exclusivas esperando por você! 💎`;
}

export function openWhatsApp(phone: string, message: string): void {
  // Clean phone number - remove non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}

export function openWhatsAppWithoutPhone(message: string): void {
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}
