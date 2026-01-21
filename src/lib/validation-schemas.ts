import { z } from 'zod';

// Catalog order validation (public endpoint)
export const catalogOrderSchema = z.object({
  cliente_nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo (máx. 100 caracteres)')
    .transform(val => val.trim()),
  cliente_telefone: z.string()
    .regex(/^(\d{10,11})?$/, 'Telefone inválido (use apenas números, 10 ou 11 dígitos)')
    .optional()
    .or(z.literal('')),
  cliente_email: z.string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .optional()
    .or(z.literal('')),
  // Address fields
  endereco_cep: z.string()
    .regex(/^(\d{8})?$/, 'CEP inválido (use apenas números, 8 dígitos)')
    .optional()
    .or(z.literal('')),
  endereco_logradouro: z.string().max(200, 'Logradouro muito longo').optional().or(z.literal('')),
  endereco_numero: z.string().max(20, 'Número muito longo').optional().or(z.literal('')),
  endereco_complemento: z.string().max(100, 'Complemento muito longo').optional().or(z.literal('')),
  endereco_bairro: z.string().max(100, 'Bairro muito longo').optional().or(z.literal('')),
  endereco_cidade: z.string().max(100, 'Cidade muito longa').optional().or(z.literal('')),
  endereco_estado: z.string().max(2, 'Use a sigla do estado (ex: SP)').optional().or(z.literal('')),
});

export type CatalogOrderInput = z.infer<typeof catalogOrderSchema>;

// Client validation
export const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100, 'Nome muito longo'),
  cpf: z.string()
    .regex(/^(\d{11})?$/, 'CPF inválido (use apenas números)')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  telefone: z.string()
    .regex(/^(\d{10,11})?$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  endereco: z.string().max(200, 'Endereço muito longo').optional(),
  data_nascimento: z.string().optional().nullable()
});

export type ClienteInput = z.infer<typeof clienteSchema>;

// Piece/product validation
export const pecaSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100, 'Nome muito longo'),
  codigo: z.string().min(1, 'Código obrigatório').max(50, 'Código muito longo'),
  estoque: z.number().int('Estoque deve ser inteiro').min(0, 'Estoque não pode ser negativo'),
  preco_custo: z.number().min(0, 'Preço de custo não pode ser negativo'),
  preco_venda: z.number().min(0, 'Preço de venda não pode ser negativo'),
  preco_atacado: z.number().min(0).optional().nullable(),
  preco_varejo: z.number().min(0).optional().nullable(),
  estoque_minimo: z.number().int().min(0).optional().nullable(),
  categoria: z.string().max(50).optional().nullable(),
  banho: z.string().max(50).optional().nullable(),
  numeracao: z.string().max(20).optional().nullable()
});

export type PecaInput = z.infer<typeof pecaSchema>;

// Supplier validation
export const fornecedorSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100, 'Nome muito longo'),
  cnpj: z.string()
    .regex(/^(\d{14})?$/, 'CNPJ inválido (use apenas números)')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').max(100).optional().or(z.literal('')),
  telefone: z.string()
    .regex(/^(\d{10,11})?$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  endereco: z.string().max(200, 'Endereço muito longo').optional()
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;

// Helper function to validate and get first error
export function validateWithZod<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Dados inválidos' };
}
