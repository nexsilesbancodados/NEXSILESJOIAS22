/**
 * PIX BR Code Generator
 * Generates EMV-compliant PIX payload strings for QR Code generation.
 * Follows BCB (Banco Central do Brasil) specification.
 */

function pad(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
}

interface PixPayloadParams {
  chave: string;
  nome: string;
  cidade: string;
  valor?: number;
  txid?: string;
  tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
}

export function generatePixPayload({
  chave,
  nome,
  cidade,
  valor,
  txid = '***',
}: PixPayloadParams): string {
  // Payload Format Indicator
  let payload = pad('00', '01');

  // Merchant Account Information (PIX)
  const gui = pad('00', 'br.gov.bcb.pix');
  const key = pad('01', chave);
  payload += pad('26', gui + key);

  // Merchant Category Code
  payload += pad('52', '0000');

  // Transaction Currency (BRL = 986)
  payload += pad('53', '986');

  // Transaction Amount (optional)
  if (valor && valor > 0) {
    payload += pad('54', valor.toFixed(2));
  }

  // Country Code
  payload += pad('58', 'BR');

  // Merchant Name (max 25 chars, no accents)
  const cleanName = removeDiacritics(nome).substring(0, 25).toUpperCase();
  payload += pad('59', cleanName);

  // Merchant City (max 15 chars, no accents)
  const cleanCity = removeDiacritics(cidade).substring(0, 15).toUpperCase();
  payload += pad('60', cleanCity);

  // Additional Data Field Template (txid)
  const txidField = pad('05', txid);
  payload += pad('62', txidField);

  // CRC16 placeholder + calculation
  payload += '6304';
  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}

export function formatPixKey(chave: string, tipo: string): string {
  switch (tipo) {
    case 'cpf':
      return chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'cnpj':
      return chave.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'telefone':
      return chave.replace(/(\+\d{2})(\d{2})(\d{5})(\d{4})/, '$1 ($2) $3-$4');
    default:
      return chave;
  }
}
