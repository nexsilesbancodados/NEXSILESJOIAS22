import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

interface FreteRequest {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // em kg
  comprimento: number; // em cm
  largura: number; // em cm
  altura: number; // em cm
  valor: number; // valor declarado
}

interface FreteResponse {
  sedex: {
    valor: number;
    prazo: number;
    erro?: string;
  } | null;
  pac: {
    valor: number;
    prazo: number;
    erro?: string;
  } | null;
}

// Buscar endereço por CEP
async function buscarEndereco(cep: string): Promise<any> {
  const cepLimpo = cep.replace(/\D/g, '');
  
  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw new Error('Erro ao buscar endereço');
  }
}

// Calcular frete simulado baseado em distância e peso
// Como a API oficial dos Correios exige contrato, usamos uma simulação realista
function calcularFreteSimulado(
  cepOrigem: string,
  cepDestino: string,
  peso: number,
  comprimento: number,
  largura: number,
  altura: number,
  valorDeclarado: number
): FreteResponse {
  // Extrair região do CEP (primeiros 2 dígitos)
  const regiaoOrigem = parseInt(cepOrigem.substring(0, 2));
  const regiaoDestino = parseInt(cepDestino.substring(0, 2));
  
  // Calcular "distância" baseada nas regiões
  const diferenca = Math.abs(regiaoOrigem - regiaoDestino);
  
  // Peso cúbico (peso volumétrico)
  const pesoCubico = (comprimento * largura * altura) / 6000;
  const pesoFinal = Math.max(peso, pesoCubico);
  
  // Base de cálculo
  const taxaBase = 15; // Taxa base
  const taxaPorKg = 3.5; // Por kg adicional
  const taxaDistancia = diferenca * 0.5; // Por diferença de região
  
  // Cálculo SEDEX (mais rápido, mais caro)
  const valorSedex = taxaBase + 
    (pesoFinal * taxaPorKg * 1.8) + 
    (taxaDistancia * 2) + 
    (valorDeclarado > 0 ? valorDeclarado * 0.01 : 0);
  
  // Cálculo PAC (mais barato, mais demorado)
  const valorPac = taxaBase + 
    (pesoFinal * taxaPorKg) + 
    taxaDistancia + 
    (valorDeclarado > 0 ? valorDeclarado * 0.007 : 0);
  
  // Prazo baseado na distância
  const prazoBaseSedex = diferenca < 10 ? 1 : diferenca < 30 ? 2 : 3;
  const prazoBasePac = diferenca < 10 ? 3 : diferenca < 30 ? 5 : 8;
  
  return {
    sedex: {
      valor: Math.round(valorSedex * 100) / 100,
      prazo: prazoBaseSedex,
    },
    pac: {
      valor: Math.round(valorPac * 100) / 100,
      prazo: prazoBasePac,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 120 req/min per IP (CEP/frete lookup)
  const rl = await rateLimit(req, "calcular-frete", { maxRequests: 120 });
  if (rl) return rl;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Buscar endereço por CEP
    if (action === 'buscar-cep') {
      const cep = url.searchParams.get('cep');
      
      if (!cep) {
        return new Response(
          JSON.stringify({ error: 'CEP é obrigatório' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Buscando endereço para CEP: ${cep}`);
      
      const endereco = await buscarEndereco(cep);
      
      console.log(`Endereço encontrado:`, endereco);

      return new Response(
        JSON.stringify(endereco),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calcular frete
    if (req.method === 'POST') {
      const body: FreteRequest = await req.json();
      
      console.log('Calculando frete:', body);

      const { cepOrigem, cepDestino, peso, comprimento, largura, altura, valor } = body;

      if (!cepOrigem || !cepDestino) {
        return new Response(
          JSON.stringify({ error: 'CEP de origem e destino são obrigatórios' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const frete = calcularFreteSimulado(
        cepOrigem.replace(/\D/g, ''),
        cepDestino.replace(/\D/g, ''),
        peso || 0.3,
        comprimento || 20,
        largura || 15,
        altura || 10,
        valor || 0
      );

      console.log('Frete calculado:', frete);

      return new Response(
        JSON.stringify(frete),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
