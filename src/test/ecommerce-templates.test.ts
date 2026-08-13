import { describe, expect, it } from 'vitest';
import {
  appendLayoutHistory,
  createLayoutSnapshot,
  DEFAULT_HOME_SECTIONS,
  getTemplateSections,
  normalizeHomeSections,
  TEMPLATE_SECTION_PRESETS,
} from '@/lib/ecommerce-sections';

describe('templates da loja virtual', () => {
  it('possui uma estrutura de homepage para cada modelo disponível', () => {
    expect(Object.keys(TEMPLATE_SECTION_PRESETS)).toEqual([
      'editorial-rose',
      'minimal-gold',
      'sunset-boutique',
      'midnight-studio',
    ]);

    for (const templateId of Object.keys(TEMPLATE_SECTION_PRESETS)) {
      const sections = getTemplateSections(templateId);
      expect(sections.length).toBeGreaterThan(4);
      expect(sections.map(section => section.ordem)).toEqual(sections.map((_, index) => index));
      expect(sections.some(section => section.tipo === 'hero')).toBe(true);
    }
  });

  it('clona presets sem permitir que a edição altere o modelo original', () => {
    const sections = getTemplateSections('editorial-rose');
    sections[0].titulo = 'Título personalizado';

    expect(TEMPLATE_SECTION_PRESETS['editorial-rose'][0].titulo).not.toBe('Título personalizado');
  });

  it('normaliza configurações antigas e usa o padrão quando não há seções', () => {
    expect(normalizeHomeSections(null)).toEqual(DEFAULT_HOME_SECTIONS);

    const normalized = normalizeHomeSections([
      { id: 10, tipo: 'hero', titulo: '', visivel: false, ordem: 99 },
      { id: 'produtos', tipo: 'produtos_destaque', titulo: 'Produtos', visivel: true, ordem: 2 },
    ]);

    expect(normalized).toEqual([
      { id: '10', tipo: 'hero', titulo: 'Seção', visivel: false, ordem: 0 },
      { id: 'produtos', tipo: 'produtos_destaque', titulo: 'Produtos', visivel: true, ordem: 1 },
    ]);
  });

  it('remove credenciais ao criar snapshot e limita o historico', () => {
    const snapshot = createLayoutSnapshot({
      nome_loja: 'Minha loja',
      mercadopago_access_token: 'segredo',
      pix_chave: 'chave-pix',
      secoes_homepage: null,
    });

    expect(snapshot).toMatchObject({ nome_loja: 'Minha loja' });
    expect(snapshot).not.toHaveProperty('mercadopago_access_token');
    expect(snapshot).not.toHaveProperty('pix_chave');
    expect(snapshot.secoes_homepage).toEqual(DEFAULT_HOME_SECTIONS);

    const history = appendLayoutHistory([], { nome_loja: 'Minha loja' }, 'Teste', 1);
    expect(history).toHaveLength(1);
    expect(history[0].label).toBe('Teste');
    expect(history[0].snapshot).toMatchObject({ nome_loja: 'Minha loja' });
  });
});
