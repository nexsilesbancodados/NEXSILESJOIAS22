/**
 * Seed data for testing the system
 * Contains sample data for suppliers, pieces, customers, resellers and sales
 */

import { supabase } from '@/lib/supabase-db';

// Fornecedores (Suppliers)
const fornecedores = [
  {
    nome: 'Atacado Brilho Dourado',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 99999-1234',
    email: 'contato@brilhodourado.com.br',
    endereco: 'Rua das Joias, 100',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    ativo: true,
  },
  {
    nome: 'Folheados Premium',
    cnpj: '98.765.432/0001-10',
    telefone: '(21) 98888-5678',
    email: 'vendas@folheadospremium.com.br',
    endereco: 'Av. Rio Branco, 500',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20040-020',
    ativo: true,
  },
  {
    nome: 'Semijoias Elegance',
    cnpj: '45.678.901/0001-23',
    telefone: '(31) 97777-9012',
    email: 'pedidos@elegance.com.br',
    endereco: 'Rua dos Ourives, 250',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30130-110',
    ativo: true,
  },
  {
    nome: 'Distribuidora Luxo & Cia',
    cnpj: '23.456.789/0001-56',
    telefone: '(41) 96666-3456',
    email: 'comercial@luxoecia.com.br',
    endereco: 'Av. Cândido de Abreu, 800',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80530-000',
    ativo: true,
  },
];

// Peças (Pieces/Jewelry)
const pecas = [
  // Anéis
  { nome: 'Anel Solitário Cristal', codigo: 'AN001', categoria: 'Anéis', subcategoria: 'Solitários', preco_custo: 25, preco_venda: 89.90, preco_revenda: 69.90, estoque: 15, estoque_minimo: 5, material: 'Banho Ouro 18k', peso: 4.5 },
  { nome: 'Anel Três Pedras Zircônia', codigo: 'AN002', categoria: 'Anéis', subcategoria: 'Com Pedras', preco_custo: 35, preco_venda: 129.90, preco_revenda: 99.90, estoque: 12, estoque_minimo: 3, material: 'Banho Ouro 18k', peso: 5.2 },
  { nome: 'Anel Coração Rosé', codigo: 'AN003', categoria: 'Anéis', subcategoria: 'Temáticos', preco_custo: 28, preco_venda: 99.90, preco_revenda: 79.90, estoque: 20, estoque_minimo: 5, material: 'Banho Ouro Rosé', peso: 3.8 },
  { nome: 'Anel Aliança Cravejada', codigo: 'AN004', categoria: 'Anéis', subcategoria: 'Alianças', preco_custo: 45, preco_venda: 159.90, preco_revenda: 129.90, estoque: 8, estoque_minimo: 3, material: 'Banho Ouro 18k', peso: 6.0 },
  { nome: 'Anel Infinito Prata', codigo: 'AN005', categoria: 'Anéis', subcategoria: 'Símbolos', preco_custo: 22, preco_venda: 79.90, preco_revenda: 59.90, estoque: 25, estoque_minimo: 5, material: 'Banho Ródio', peso: 3.2 },
  
  // Colares
  { nome: 'Colar Ponto de Luz', codigo: 'CO001', categoria: 'Colares', subcategoria: 'Pontos de Luz', preco_custo: 40, preco_venda: 149.90, preco_revenda: 119.90, estoque: 18, estoque_minimo: 5, material: 'Banho Ouro 18k', peso: 2.5 },
  { nome: 'Colar Gota Esmeralda', codigo: 'CO002', categoria: 'Colares', subcategoria: 'Gotas', preco_custo: 55, preco_venda: 199.90, preco_revenda: 159.90, estoque: 10, estoque_minimo: 3, material: 'Banho Ouro 18k', peso: 3.8 },
  { nome: 'Colar Corrente Cartier', codigo: 'CO003', categoria: 'Colares', subcategoria: 'Correntes', preco_custo: 65, preco_venda: 229.90, preco_revenda: 179.90, estoque: 7, estoque_minimo: 2, material: 'Banho Ouro 18k', peso: 8.5 },
  { nome: 'Colar Choker Strass', codigo: 'CO004', categoria: 'Colares', subcategoria: 'Chokers', preco_custo: 48, preco_venda: 169.90, preco_revenda: 139.90, estoque: 14, estoque_minimo: 4, material: 'Banho Ródio', peso: 12.0 },
  { nome: 'Colar Letra Personalizada', codigo: 'CO005', categoria: 'Colares', subcategoria: 'Personalizados', preco_custo: 32, preco_venda: 119.90, preco_revenda: 89.90, estoque: 30, estoque_minimo: 8, material: 'Banho Ouro 18k', peso: 2.2 },
  
  // Brincos
  { nome: 'Brinco Argola Média', codigo: 'BR001', categoria: 'Brincos', subcategoria: 'Argolas', preco_custo: 28, preco_venda: 99.90, preco_revenda: 79.90, estoque: 22, estoque_minimo: 6, material: 'Banho Ouro 18k', peso: 5.0 },
  { nome: 'Brinco Gota Pérola', codigo: 'BR002', categoria: 'Brincos', subcategoria: 'Gotas', preco_custo: 35, preco_venda: 129.90, preco_revenda: 99.90, estoque: 16, estoque_minimo: 4, material: 'Banho Ouro 18k', peso: 4.2 },
  { nome: 'Brinco Ear Cuff Estrelas', codigo: 'BR003', categoria: 'Brincos', subcategoria: 'Ear Cuffs', preco_custo: 42, preco_venda: 149.90, preco_revenda: 119.90, estoque: 11, estoque_minimo: 3, material: 'Banho Ouro Rosé', peso: 3.5 },
  { nome: 'Brinco Segundo Furo Zircônia', codigo: 'BR004', categoria: 'Brincos', subcategoria: 'Segundos Furos', preco_custo: 18, preco_venda: 69.90, preco_revenda: 49.90, estoque: 35, estoque_minimo: 10, material: 'Banho Ouro 18k', peso: 1.2 },
  { nome: 'Brinco Franja Longo', codigo: 'BR005', categoria: 'Brincos', subcategoria: 'Longos', preco_custo: 52, preco_venda: 189.90, preco_revenda: 149.90, estoque: 9, estoque_minimo: 3, material: 'Banho Ródio', peso: 8.0 },
  
  // Pulseiras
  { nome: 'Pulseira Riviera Cristal', codigo: 'PU001', categoria: 'Pulseiras', subcategoria: 'Rivieras', preco_custo: 58, preco_venda: 199.90, preco_revenda: 159.90, estoque: 13, estoque_minimo: 4, material: 'Banho Ouro 18k', peso: 9.5 },
  { nome: 'Pulseira Berloques', codigo: 'PU002', categoria: 'Pulseiras', subcategoria: 'Com Berloques', preco_custo: 45, preco_venda: 159.90, preco_revenda: 129.90, estoque: 17, estoque_minimo: 5, material: 'Banho Ouro 18k', peso: 12.0 },
  { nome: 'Pulseira Bracelete Trançado', codigo: 'PU003', categoria: 'Pulseiras', subcategoria: 'Braceletes', preco_custo: 62, preco_venda: 219.90, preco_revenda: 179.90, estoque: 8, estoque_minimo: 2, material: 'Banho Ouro 18k', peso: 15.0 },
  { nome: 'Pulseira Couro com Fecho', codigo: 'PU004', categoria: 'Pulseiras', subcategoria: 'Couro', preco_custo: 38, preco_venda: 139.90, preco_revenda: 109.90, estoque: 20, estoque_minimo: 5, material: 'Couro + Banho Ouro', peso: 18.0 },
  { nome: 'Pulseira Elos Grandes', codigo: 'PU005', categoria: 'Pulseiras', subcategoria: 'Elos', preco_custo: 55, preco_venda: 189.90, preco_revenda: 149.90, estoque: 11, estoque_minimo: 3, material: 'Banho Ouro 18k', peso: 22.0 },
  
  // Conjuntos
  { nome: 'Conjunto Gota Rubi', codigo: 'CJ001', categoria: 'Conjuntos', subcategoria: 'Colar e Brinco', preco_custo: 85, preco_venda: 299.90, preco_revenda: 249.90, estoque: 6, estoque_minimo: 2, material: 'Banho Ouro 18k', peso: 8.5 },
  { nome: 'Conjunto Pérolas Clássico', codigo: 'CJ002', categoria: 'Conjuntos', subcategoria: 'Completo', preco_custo: 120, preco_venda: 399.90, preco_revenda: 329.90, estoque: 4, estoque_minimo: 1, material: 'Banho Ouro 18k', peso: 15.0 },
  { nome: 'Conjunto Zircônias Coloridas', codigo: 'CJ003', categoria: 'Conjuntos', subcategoria: 'Colar e Brinco', preco_custo: 95, preco_venda: 329.90, preco_revenda: 269.90, estoque: 5, estoque_minimo: 2, material: 'Banho Ródio', peso: 10.0 },
];

// Clientes (Customers)
const clientes = [
  { nome: 'Maria Silva Santos', telefone: '(11) 99999-0001', email: 'maria.silva@email.com', cpf: '123.456.789-00', data_nascimento: '1985-03-15', endereco: 'Rua das Flores, 100', cidade: 'São Paulo', estado: 'SP', whatsapp: '(11) 99999-0001' },
  { nome: 'Ana Paula Oliveira', telefone: '(11) 98888-0002', email: 'ana.oliveira@email.com', cpf: '234.567.890-11', data_nascimento: '1990-07-22', endereco: 'Av. Brasil, 200', cidade: 'São Paulo', estado: 'SP', whatsapp: '(11) 98888-0002' },
  { nome: 'Carla Fernandes Costa', telefone: '(21) 97777-0003', email: 'carla.costa@email.com', cpf: '345.678.901-22', data_nascimento: '1988-01-10', endereco: 'Rua Copacabana, 300', cidade: 'Rio de Janeiro', estado: 'RJ', whatsapp: '(21) 97777-0003' },
  { nome: 'Juliana Pereira Lima', telefone: '(31) 96666-0004', email: 'juliana.lima@email.com', cpf: '456.789.012-33', data_nascimento: '1992-05-28', endereco: 'Av. Afonso Pena, 400', cidade: 'Belo Horizonte', estado: 'MG', whatsapp: '(31) 96666-0004' },
  { nome: 'Fernanda Rocha Alves', telefone: '(41) 95555-0005', email: 'fernanda.alves@email.com', cpf: '567.890.123-44', data_nascimento: '1995-11-03', endereco: 'Rua XV de Novembro, 500', cidade: 'Curitiba', estado: 'PR', whatsapp: '(41) 95555-0005' },
  { nome: 'Patricia Souza Martins', telefone: '(51) 94444-0006', email: 'patricia.martins@email.com', cpf: '678.901.234-55', data_nascimento: '1987-08-17', endereco: 'Av. Ipiranga, 600', cidade: 'Porto Alegre', estado: 'RS', whatsapp: '(51) 94444-0006' },
  { nome: 'Luciana Gomes Ribeiro', telefone: '(61) 93333-0007', email: 'luciana.ribeiro@email.com', cpf: '789.012.345-66', data_nascimento: '1993-02-25', endereco: 'SQS 108, Bloco A', cidade: 'Brasília', estado: 'DF', whatsapp: '(61) 93333-0007' },
  { nome: 'Renata Cardoso Dias', telefone: '(71) 92222-0008', email: 'renata.dias@email.com', cpf: '890.123.456-77', data_nascimento: '1989-12-08', endereco: 'Rua Chile, 700', cidade: 'Salvador', estado: 'BA', whatsapp: '(71) 92222-0008' },
  { nome: 'Camila Teixeira Nunes', telefone: '(81) 91111-0009', email: 'camila.nunes@email.com', cpf: '901.234.567-88', data_nascimento: '1991-06-30', endereco: 'Av. Boa Viagem, 800', cidade: 'Recife', estado: 'PE', whatsapp: '(81) 91111-0009' },
  { nome: 'Beatriz Moreira Franco', telefone: '(85) 90000-0010', email: 'beatriz.franco@email.com', cpf: '012.345.678-99', data_nascimento: '1986-09-12', endereco: 'Av. Beira Mar, 900', cidade: 'Fortaleza', estado: 'CE', whatsapp: '(85) 90000-0010' },
  { nome: 'Amanda Barbosa Cruz', telefone: '(11) 99999-0011', email: 'amanda.cruz@email.com', cpf: '111.222.333-00', data_nascimento: '1994-04-05', endereco: 'Rua Augusta, 1000', cidade: 'São Paulo', estado: 'SP', whatsapp: '(11) 99999-0011' },
  { nome: 'Daniela Pinto Araújo', telefone: '(21) 98888-0012', email: 'daniela.araujo@email.com', cpf: '222.333.444-11', data_nascimento: '1997-10-20', endereco: 'Rua Voluntários, 1100', cidade: 'Rio de Janeiro', estado: 'RJ', whatsapp: '(21) 98888-0012' },
];

// Revendedoras (Resellers)
const revendedoras = [
  { nome: 'Sandra Regina Mendes', telefone: '(11) 99999-1001', email: 'sandra.mendes@email.com', cpf: '111.111.111-11', data_nascimento: '1980-04-12', endereco: 'Rua das Palmeiras, 50', cidade: 'São Paulo', estado: 'SP', cep: '01234-000', whatsapp: '(11) 99999-1001', comissao_percentual: 15, ativo: true },
  { nome: 'Rosana Cristina Almeida', telefone: '(11) 98888-1002', email: 'rosana.almeida@email.com', cpf: '222.222.222-22', data_nascimento: '1985-08-25', endereco: 'Av. Paulista, 1500', cidade: 'São Paulo', estado: 'SP', cep: '01310-100', whatsapp: '(11) 98888-1002', comissao_percentual: 12, ativo: true },
  { nome: 'Márcia Helena Ferreira', telefone: '(21) 97777-1003', email: 'marcia.ferreira@email.com', cpf: '333.333.333-33', data_nascimento: '1978-11-30', endereco: 'Rua do Catete, 200', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '22220-000', whatsapp: '(21) 97777-1003', comissao_percentual: 15, ativo: true },
  { nome: 'Cláudia Maria Vieira', telefone: '(31) 96666-1004', email: 'claudia.vieira@email.com', cpf: '444.444.444-44', data_nascimento: '1982-02-14', endereco: 'Av. Amazonas, 800', cidade: 'Belo Horizonte', estado: 'MG', cep: '30180-001', whatsapp: '(31) 96666-1004', comissao_percentual: 10, ativo: true },
  { nome: 'Adriana Lopes Castro', telefone: '(41) 95555-1005', email: 'adriana.castro@email.com', cpf: '555.555.555-55', data_nascimento: '1990-06-08', endereco: 'Rua Marechal Deodoro, 350', cidade: 'Curitiba', estado: 'PR', cep: '80010-010', whatsapp: '(41) 95555-1005', comissao_percentual: 12, ativo: true },
  { nome: 'Vanessa Souza Ramos', telefone: '(51) 94444-1006', email: 'vanessa.ramos@email.com', cpf: '666.666.666-66', data_nascimento: '1988-09-22', endereco: 'Av. Borges de Medeiros, 600', cidade: 'Porto Alegre', estado: 'RS', cep: '90020-025', whatsapp: '(51) 94444-1006', comissao_percentual: 15, ativo: true },
  { nome: 'Fabiana Costa Neves', telefone: '(61) 93333-1007', email: 'fabiana.neves@email.com', cpf: '777.777.777-77', data_nascimento: '1992-12-05', endereco: 'SQS 312, Bloco C', cidade: 'Brasília', estado: 'DF', cep: '70364-030', whatsapp: '(61) 93333-1007', comissao_percentual: 10, ativo: true },
  { nome: 'Simone Barbosa Lima', telefone: '(71) 92222-1008', email: 'simone.lima@email.com', cpf: '888.888.888-88', data_nascimento: '1983-03-18', endereco: 'Rua Carlos Gomes, 150', cidade: 'Salvador', estado: 'BA', cep: '40060-330', whatsapp: '(71) 92222-1008', comissao_percentual: 12, ativo: true },
];

export async function seedDatabase(): Promise<{ success: boolean; message: string; details?: Record<string, number> }> {
  try {
    const results: Record<string, number> = {};
    
    // 1. Insert fornecedores
    const { data: fornecedoresData, error: fornecedoresError } = await supabase
      .from('fornecedores')
      .insert(fornecedores)
      .select();
    
    if (fornecedoresError) throw new Error(`Fornecedores: ${fornecedoresError.message}`);
    results.fornecedores = fornecedoresData?.length || 0;
    
    // Get fornecedor IDs for linking
    const fornecedorIds = fornecedoresData?.map(f => f.id) || [];
    
    // 2. Insert peças with random fornecedor
    const pecasWithFornecedor = pecas.map((peca, index) => ({
      ...peca,
      ativo: true,
      fornecedor_id: fornecedorIds[index % fornecedorIds.length],
    }));
    
    const { data: pecasData, error: pecasError } = await supabase
      .from('pecas')
      .insert(pecasWithFornecedor)
      .select();
    
    if (pecasError) throw new Error(`Peças: ${pecasError.message}`);
    results.pecas = pecasData?.length || 0;
    
    // 3. Insert clientes
    const clientesWithActive = clientes.map(c => ({ ...c, ativo: true, pontos_fidelidade: Math.floor(Math.random() * 500) }));
    
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .insert(clientesWithActive)
      .select();
    
    if (clientesError) throw new Error(`Clientes: ${clientesError.message}`);
    results.clientes = clientesData?.length || 0;
    
    // 4. Insert revendedoras
    const { data: revendedorasData, error: revendedorasError } = await supabase
      .from('revendedoras')
      .insert(revendedoras)
      .select();
    
    if (revendedorasError) throw new Error(`Revendedoras: ${revendedorasError.message}`);
    results.revendedoras = revendedorasData?.length || 0;
    
    // 5. Create some historical vendas
    const clienteIds = clientesData?.map(c => c.id) || [];
    const revendedoraIds = revendedorasData?.map(r => r.id) || [];
    const pecaIds = pecasData?.map(p => p.id) || [];
    const pecaPrecos = pecasData?.reduce((acc, p) => ({ ...acc, [p.id]: p.preco_venda }), {} as Record<string, number>) || {};
    
    const formasPagamento = ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Pix'];
    const vendas = [];
    const vendasPecas = [];
    
    // Generate 20 random sales over the last 60 days
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const dataVenda = new Date();
      dataVenda.setDate(dataVenda.getDate() - daysAgo);
      
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const selectedPecas: string[] = [];
      
      for (let j = 0; j < numItems; j++) {
        const pecaId = pecaIds[Math.floor(Math.random() * pecaIds.length)];
        if (!selectedPecas.includes(pecaId)) {
          selectedPecas.push(pecaId);
          subtotal += pecaPrecos[pecaId] || 100;
        }
      }
      
      const desconto = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0;
      const valorTotal = subtotal * (1 - desconto / 100);
      
      const vendaId = crypto.randomUUID();
      
      vendas.push({
        id: vendaId,
        numero: `V${String(i + 1).padStart(5, '0')}`,
        cliente_id: clienteIds.length > 0 ? clienteIds[Math.floor(Math.random() * clienteIds.length)] : null,
        revendedora_id: Math.random() > 0.5 && revendedoraIds.length > 0 ? revendedoraIds[Math.floor(Math.random() * revendedoraIds.length)] : null,
        data_venda: dataVenda.toISOString().split('T')[0],
        subtotal,
        desconto_percentual: desconto,
        desconto: subtotal * desconto / 100,
        valor_total: valorTotal,
        forma_pagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)],
        parcelas: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 1,
        status: 'finalizada',
      });
      
      selectedPecas.forEach(pecaId => {
        vendasPecas.push({
          venda_id: vendaId,
          peca_id: pecaId,
          quantidade: 1,
          preco_unitario: pecaPrecos[pecaId] || 100,
          subtotal: pecaPrecos[pecaId] || 100,
        });
      });
    }
    
    const { error: vendasError } = await supabase
      .from('vendas')
      .insert(vendas);
    
    if (vendasError) throw new Error(`Vendas: ${vendasError.message}`);
    results.vendas = vendas.length;
    
    const { error: vendasPecasError } = await supabase
      .from('vendas_pecas')
      .insert(vendasPecas);
    
    if (vendasPecasError) throw new Error(`Vendas Peças: ${vendasPecasError.message}`);
    results.vendas_pecas = vendasPecas.length;
    
    return {
      success: true,
      message: 'Banco de dados populado com sucesso!',
      details: results,
    };
  } catch (error) {
    console.error('Seed error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao popular banco',
    };
  }
}

export async function checkDatabaseHasData(): Promise<boolean> {
  const { count } = await supabase
    .from('pecas')
    .select('*', { count: 'exact', head: true });
  
  return (count || 0) > 0;
}
