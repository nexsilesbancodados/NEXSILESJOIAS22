import { getServiceClient } from "./supabase.ts";

export interface CartItem {
  peca_id: string;
  quantidade: number;
}

export interface PricedItem {
  peca_id: string;
  quantidade: number;
  preco_unitario: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  categoria: string | null;
}

export interface OrderTotals {
  items: PricedItem[];
  valor_subtotal: number;
  valor_desconto: number;
  valor_frete: number;
  valor_total: number;
  cupom_id: string | null;
}

const money = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Recalcula preços e totais do pedido SEMPRE a partir do banco. Nunca confia em
 * `preco_unitario`, `valor_subtotal` ou `valor_desconto` enviados pelo cliente —
 * isso impede a fraude de "comprar por R$ 0,01" e o abuso de desconto.
 *
 * - Valida que cada peça pertence à loja (`organization_id`), está disponível e
 *   tem estoque.
 * - Recalcula o desconto pelo cupom real (por id, escopo da org), replicando a
 *   lógica do RPC `validar_cupom`.
 * - Frete vem do cliente mas é limitado a >= 0 (nunca gera crédito).
 */
export async function computeOrderTotals(opts: {
  organizationId: string;
  items: CartItem[];
  cupomId?: string | null;
  frete?: number | null;
}): Promise<OrderTotals> {
  const supabase = getServiceClient();
  const { organizationId, items } = opts;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Carrinho vazio");
  }

  const pecaIds = items.map((i) => i.peca_id);
  const { data: pecas, error } = await supabase
    .from("pecas")
    .select("id, nome, codigo, descricao, categoria, preco_venda, estoque, disponivel_loja, ativo")
    .in("id", pecaIds)
    .eq("organization_id", organizationId);
  if (error) throw new Error("Erro ao validar itens do pedido");

  const byId = new Map((pecas ?? []).map((p: any) => [p.id, p]));
  const priced: PricedItem[] = [];
  let valor_subtotal = 0;

  for (const item of items) {
    const peca = byId.get(item.peca_id);
    if (!peca) throw new Error(`Peça não encontrada nesta loja: ${item.peca_id}`);
    if (!peca.disponivel_loja || !peca.ativo) throw new Error(`Peça indisponível: ${peca.nome}`);
    const qtd = Math.max(1, Math.floor(Number(item.quantidade) || 0));
    if ((peca.estoque ?? 0) < qtd) throw new Error(`Estoque insuficiente para: ${peca.nome}`);
    const preco = Number(peca.preco_venda) || 0;
    valor_subtotal += preco * qtd;
    priced.push({
      peca_id: peca.id,
      quantidade: qtd,
      preco_unitario: preco,
      nome: peca.nome,
      codigo: peca.codigo ?? null,
      descricao: peca.descricao ?? null,
      categoria: peca.categoria ?? null,
    });
  }
  valor_subtotal = money(valor_subtotal);

  let valor_frete = Math.max(0, money(opts.frete ?? 0));
  let valor_desconto = 0;
  let cupom_id: string | null = null;

  if (opts.cupomId) {
    const { data: cupom } = await supabase
      .from("cupons")
      .select("id, tipo, valor, valor_minimo_pedido, uso_maximo, uso_atual, ativo, valido_ate")
      .eq("id", opts.cupomId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    const valid =
      cupom &&
      cupom.ativo === true &&
      (!cupom.valido_ate || new Date(cupom.valido_ate).getTime() >= Date.now()) &&
      (cupom.uso_maximo == null || cupom.uso_atual < cupom.uso_maximo) &&
      valor_subtotal >= Number(cupom.valor_minimo_pedido ?? 0);

    if (valid) {
      cupom_id = cupom.id;
      if (cupom.tipo === "percentual") {
        valor_desconto = money((valor_subtotal * Number(cupom.valor)) / 100);
      } else if (cupom.tipo === "frete_gratis") {
        valor_frete = 0;
      } else {
        // valor_fixo
        valor_desconto = Math.min(money(cupom.valor), valor_subtotal);
      }
    }
  }

  valor_desconto = money(valor_desconto);
  let valor_total = money(valor_subtotal - valor_desconto + valor_frete);
  if (valor_total < 0) valor_total = 0;

  return { items: priced, valor_subtotal, valor_desconto, valor_frete, valor_total, cupom_id };
}
