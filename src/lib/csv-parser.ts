/**
 * CSV Parser Utility
 * Handles parsing CSV files with proper handling of Brazilian number formats
 */

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: { line: number; message: string }[];
}

export interface ColumnMapping {
  csvColumn: string;
  dbField: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

export const PECA_COLUMNS: ColumnMapping[] = [
  { csvColumn: 'nome', dbField: 'nome', type: 'string', required: true },
  { csvColumn: 'codigo', dbField: 'codigo', type: 'string', required: true },
  { csvColumn: 'estoque', dbField: 'estoque', type: 'number', required: false },
  { csvColumn: 'estoque_minimo', dbField: 'estoque_minimo', type: 'number', required: false },
  { csvColumn: 'preco_custo', dbField: 'preco_custo', type: 'number', required: false },
  { csvColumn: 'preco_venda', dbField: 'preco_venda', type: 'number', required: false },
  { csvColumn: 'categoria', dbField: 'categoria', type: 'string', required: false },
  { csvColumn: 'material', dbField: 'material', type: 'string', required: false },
  { csvColumn: 'descricao', dbField: 'descricao', type: 'string', required: false },
];

export const CLIENTE_COLUMNS: ColumnMapping[] = [
  { csvColumn: 'nome', dbField: 'nome', type: 'string', required: true },
  { csvColumn: 'telefone', dbField: 'telefone', type: 'string', required: false },
  { csvColumn: 'email', dbField: 'email', type: 'string', required: false },
  { csvColumn: 'cpf', dbField: 'cpf', type: 'string', required: false },
  { csvColumn: 'data_nascimento', dbField: 'data_nascimento', type: 'string', required: false },
  { csvColumn: 'endereco', dbField: 'endereco', type: 'string', required: false },
  { csvColumn: 'cidade', dbField: 'cidade', type: 'string', required: false },
  { csvColumn: 'estado', dbField: 'estado', type: 'string', required: false },
  { csvColumn: 'cep', dbField: 'cep', type: 'string', required: false },
  { csvColumn: 'observacoes', dbField: 'observacoes', type: 'string', required: false },
];

/**
 * Parse a CSV file into headers and rows
 */
export function parseCSV(content: string): CSVParseResult {
  const lines = content.trim().split(/\r?\n/);
  const errors: { line: number; message: string }[] = [];
  
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: [{ line: 0, message: 'Arquivo vazio' }] };
  }

  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = lines[0];
  const delimiter = detectDelimiter(firstLine);
  
  // Parse headers
  const headers = parseLine(firstLine, delimiter).map(h => 
    normalizeHeader(h.trim().toLowerCase())
  );

  // Parse rows
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseLine(line, delimiter);
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      rows.push(row);
    } catch (error) {
      errors.push({ line: i + 1, message: `Erro ao processar linha: ${error}` });
    }
  }

  return { headers, rows, errors };
}

/**
 * Detect the delimiter used in a CSV line
 */
function detectDelimiter(line: string): string {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  const tabCount = (line.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Normalize header names to match database fields
 */
function normalizeHeader(header: string): string {
  // Common variations
  const mappings: Record<string, string> = {
    'name': 'nome',
    'product': 'nome',
    'produto': 'nome',
    'code': 'codigo',
    'sku': 'codigo',
    'ref': 'codigo',
    'referencia': 'codigo',
    'referência': 'codigo',
    'stock': 'estoque',
    'qty': 'estoque',
    'quantidade': 'estoque',
    'min_stock': 'estoque_minimo',
    'estoque_min': 'estoque_minimo',
    'cost': 'preco_custo',
    'custo': 'preco_custo',
    'preco custo': 'preco_custo',
    'preço custo': 'preco_custo',
    'price': 'preco_venda',
    'preco': 'preco_venda',
    'preço': 'preco_venda',
    'preco venda': 'preco_venda',
    'preço venda': 'preco_venda',
    'category': 'categoria',
    'cat': 'categoria',
    'material': 'material',
    'banho': 'material',
    'bath': 'material',
    'desc': 'descricao',
    'descrição': 'descricao',
    'description': 'descricao',
  };

  // Remove accents and special characters for matching
  const normalized = header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return mappings[header] || mappings[normalized] || normalized;
}

/**
 * Parse Brazilian currency format (1.234,56) to number
 */
export function parseBrazilianNumber(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbol and whitespace
  let cleaned = value.replace(/[R$\s]/g, '').trim();
  
  // Detect format: Brazilian (1.234,56) vs US (1,234.56)
  const hasCommaDecimal = /\d,\d{2}$/.test(cleaned);
  const hasDotDecimal = /\d\.\d{2}$/.test(cleaned);
  
  if (hasCommaDecimal) {
    // Brazilian format: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDotDecimal && cleaned.includes(',')) {
    // US format with comma separator: 1,234.56 -> 1234.56
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validate a row against required columns
 */
export function validateRow(
  row: Record<string, string>,
  mappings: ColumnMapping[],
  existingCodes: Set<string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const mapping of mappings) {
    const value = row[mapping.csvColumn] || row[mapping.dbField] || '';
    
    if (mapping.required && !value.trim()) {
      errors.push(`Campo obrigatório "${mapping.dbField}" está vazio`);
    }
  }

  // Check for duplicate code
  const codigo = row['codigo'] || '';
  if (codigo && existingCodes.has(codigo.toLowerCase())) {
    errors.push(`Código "${codigo}" já existe`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Transform a CSV row into a database-ready object
 */
export function transformRow(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    const value = row[mapping.csvColumn] || row[mapping.dbField] || '';
    
    switch (mapping.type) {
      case 'number':
        result[mapping.dbField] = parseBrazilianNumber(value);
        break;
      case 'boolean':
        result[mapping.dbField] = ['true', 'sim', 'yes', '1', 's'].includes(value.toLowerCase());
        break;
      default:
        result[mapping.dbField] = value.trim();
    }
  }

  return result;
}

/**
 * Generate a sample CSV template for pieces
 */
export function generateSampleCSV(): string {
  const headers = ['nome', 'codigo', 'estoque', 'estoque_minimo', 'preco_custo', 'preco_venda', 'categoria', 'material', 'descricao'];
  const sampleData = [
    ['Anel Dourado', 'ANE-001', '10', '5', '25,00', '89,90', 'Anel', 'Ouro', 'Anel banhado a ouro 18k'],
    ['Colar Pérolas', 'COL-001', '5', '3', '45,00', '159,90', 'Colar', 'Prata', 'Colar com pérolas sintéticas'],
    ['Pulseira Couro', 'PUL-001', '15', '5', '15,00', '49,90', 'Pulseira', 'Couro', 'Pulseira de couro trançado'],
  ];

  return [headers.join(';'), ...sampleData.map(row => row.join(';'))].join('\n');
}

/**
 * Generate a sample CSV template for clients
 */
export function generateClienteSampleCSV(): string {
  const headers = ['nome', 'telefone', 'email', 'cpf', 'data_nascimento', 'endereco', 'cidade', 'estado', 'cep', 'observacoes'];
  const sampleData = [
    ['Maria Silva', '11999998888', 'maria@email.com', '123.456.789-00', '1990-05-15', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'Cliente VIP'],
    ['João Santos', '21988887777', 'joao@email.com', '987.654.321-00', '1985-10-20', 'Av. Central, 456', 'Rio de Janeiro', 'RJ', '20000-000', ''],
    ['Ana Oliveira', '31977776666', 'ana@email.com', '', '1995-03-08', 'Rua Nova, 789', 'Belo Horizonte', 'MG', '30000-000', 'Prefere WhatsApp'],
  ];

  return [headers.join(';'), ...sampleData.map(row => row.join(';'))].join('\n');
}
