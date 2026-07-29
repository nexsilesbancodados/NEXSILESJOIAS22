/**
 * Configuração LGPD centralizada.
 * EDITAR_AQUI: substitua os placeholders pelos dados reais da empresa
 * quando disponíveis. Todos os arquivos legais leem daqui.
 */
export const LGPD_INFO = {
  razaoSocial: '[RAZAO_SOCIAL]',
  nomeFantasia: 'Nexsiles',
  cnpj: '[CNPJ]',
  endereco: '[ENDERECO_COMPLETO]',
  cidade: '[CIDADE/UF]',
  cep: '[CEP]',
  email: 'contato@nexsiles.com.br',
  emailDPO: 'dpo@nexsiles.com.br',
  telefoneDPO: '[TELEFONE_DPO]',
  whatsappSuporte: '5511937687369',
  nomeDPO: '[NOME_DO_ENCARREGADO]',
  precoMensal: 'R$ 129,00',
  planoNome: 'Nexsiles Prime',
  diasArrependimento: 7,
  diasCarenciaExclusao: 30,
  versaoTermos: '2026.07.28',
  versaoPrivacidade: '2026.07.28',
} as const;

export const COOKIE_CONSENT_KEY = 'nexsiles_cookie_consent_v1';

export type CookieConsent = {
  necessarios: true;
  analiticos: boolean;
  marketing: boolean;
  timestamp: string;
  versao: string;
};
