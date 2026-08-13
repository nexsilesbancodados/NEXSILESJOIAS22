export interface HomeSectionConfig {
  id: string;
  tipo: string;
  titulo: string;
  visivel: boolean;
  ordem: number;
}

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  { id: '1', tipo: 'hero', titulo: 'Hero / Banners', visivel: true, ordem: 0 },
  { id: '2', tipo: 'banner_corredor', titulo: 'Banner Corredor', visivel: true, ordem: 1 },
  { id: '3', tipo: 'colecoes', titulo: 'Coleções em Destaque', visivel: true, ordem: 2 },
  { id: '4', tipo: 'produtos_destaque', titulo: 'Produtos em Destaque', visivel: true, ordem: 3 },
  { id: '5', tipo: 'novidades', titulo: 'Novidades', visivel: true, ordem: 4 },
  { id: '6', tipo: 'mais_vendidos', titulo: 'Mais Vendidos', visivel: true, ordem: 5 },
  { id: '7', tipo: 'countdown', titulo: 'Countdown Promoção', visivel: false, ordem: 6 },
  { id: '8', tipo: 'lookbook', titulo: 'Lookbook', visivel: false, ordem: 7 },
  { id: '9', tipo: 'newsletter', titulo: 'Newsletter', visivel: true, ordem: 8 },
  { id: '10', tipo: 'sobre_marca', titulo: 'Sobre a Marca', visivel: false, ordem: 9 },
  { id: '11', tipo: 'instagram_cta', titulo: 'CTA Instagram', visivel: false, ordem: 10 },
];

const section = (id: string, tipo: string, titulo: string, visivel = true): HomeSectionConfig => ({
  id,
  tipo,
  titulo,
  visivel,
  ordem: 0,
});

const orderSections = (sections: HomeSectionConfig[]) => sections.map((item, ordem) => ({ ...item, ordem }));

export const TEMPLATE_SECTION_PRESETS: Record<string, HomeSectionConfig[]> = {
  'editorial-rose': orderSections([
    section('1', 'hero', 'Hero / Banners'),
    section('2', 'banner_corredor', 'Banner Corredor'),
    section('3', 'colecoes', 'Coleções em Destaque'),
    section('4', 'produtos_destaque', 'Produtos em Destaque'),
    section('5', 'novidades', 'Novidades'),
    section('9', 'newsletter', 'Newsletter'),
    section('6', 'mais_vendidos', 'Mais Vendidos'),
  ]),
  'minimal-gold': orderSections([
    section('1', 'hero', 'Hero / Banners'),
    section('3', 'colecoes', 'Coleções em Destaque'),
    section('4', 'produtos_destaque', 'Produtos em Destaque'),
    section('5', 'novidades', 'Novidades'),
    section('6', 'mais_vendidos', 'Mais Vendidos'),
    section('2', 'banner_corredor', 'Banner Corredor'),
    section('9', 'newsletter', 'Newsletter'),
  ]),
  'sunset-boutique': orderSections([
    section('1', 'hero', 'Hero / Banners'),
    section('2', 'banner_corredor', 'Banner Corredor'),
    section('7', 'countdown', 'Countdown Promoção'),
    section('4', 'produtos_destaque', 'Produtos em Destaque'),
    section('5', 'novidades', 'Novidades'),
    section('6', 'mais_vendidos', 'Mais Vendidos'),
    section('3', 'colecoes', 'Coleções em Destaque'),
    section('9', 'newsletter', 'Newsletter'),
  ]),
  'midnight-studio': orderSections([
    section('1', 'hero', 'Hero / Banners'),
    section('3', 'colecoes', 'Coleções em Destaque'),
    section('4', 'produtos_destaque', 'Produtos em Destaque'),
    section('8', 'lookbook', 'Lookbook'),
    section('5', 'novidades', 'Novidades'),
    section('6', 'mais_vendidos', 'Mais Vendidos'),
    section('11', 'instagram_cta', 'CTA Instagram'),
    section('9', 'newsletter', 'Newsletter'),
  ]),
};

export function cloneHomeSections(sections: HomeSectionConfig[]): HomeSectionConfig[] {
  return sections.map(section => ({ ...section }));
}

export function getTemplateSections(templateId: string): HomeSectionConfig[] {
  return cloneHomeSections(TEMPLATE_SECTION_PRESETS[templateId] || DEFAULT_HOME_SECTIONS);
}

export function normalizeHomeSections(value: unknown): HomeSectionConfig[] {
  if (!Array.isArray(value) || value.length === 0) return cloneHomeSections(DEFAULT_HOME_SECTIONS);

  return value
    .filter((item): item is Partial<HomeSectionConfig> => !!item && typeof item === 'object')
    .map((item, ordem) => ({
      id: String(item.id || `section-${ordem + 1}`),
      tipo: String(item.tipo || 'custom'),
      titulo: String(item.titulo || 'Seção'),
      visivel: item.visivel !== false,
      ordem,
    }));
}

export interface LayoutHistoryEntry {
  id: string;
  label: string;
  created_at: string;
  snapshot: Record<string, unknown>;
}

// Credenciais e integrações nunca devem ser copiadas para um template salvo.
const PRIVATE_LAYOUT_KEYS = new Set([
  'mercadopago_access_token',
  'mercadopago_public_key',
  'pix_chave',
  'pix_nome',
  'pix_tipo',
  'pix_cidade',
  'google_analytics_id',
  'facebook_pixel_id',
  'css_personalizado',
]);

export function createLayoutSnapshot(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => !PRIVATE_LAYOUT_KEYS.has(key))
      .map(([key, value]) => [
        key,
        key === 'secoes_homepage' ? normalizeHomeSections(value) : value,
      ]),
  );
}

export function normalizeLayoutHistory(value: unknown): LayoutHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is LayoutHistoryEntry => {
    return !!entry
      && typeof entry === 'object'
      && typeof (entry as LayoutHistoryEntry).id === 'string'
      && typeof (entry as LayoutHistoryEntry).snapshot === 'object';
  });
}

export function appendLayoutHistory(
  history: unknown,
  form: Record<string, unknown>,
  label = 'Versão publicada',
  maxEntries = 12,
): LayoutHistoryEntry[] {
  const entry: LayoutHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    created_at: new Date().toISOString(),
    snapshot: createLayoutSnapshot(form),
  };

  return [...normalizeLayoutHistory(history), entry].slice(-maxEntries);
}
