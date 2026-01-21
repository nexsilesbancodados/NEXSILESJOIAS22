import { useCallback } from 'react';
import { TourStep, useInteractiveTour } from '@/components/onboarding/InteractiveTour';

// ============ TOUR DEFINITIONS ============

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Dashboard!',
    description: 'Este é o painel central do Nexsiles. Aqui você terá uma visão completa do seu negócio de semijoias.',
    placement: 'center',
  },
  {
    id: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Acesse rapidamente as principais áreas: Peças, PDV, Revendedoras e Relatórios.',
    target: '[data-tour="quick-actions"]',
    placement: 'bottom',
  },
  {
    id: 'stats',
    title: 'Estatísticas do Negócio',
    description: 'Acompanhe seu estoque, faturamento e número de revendedoras em tempo real.',
    target: '[data-tour="stats-grid"]',
    placement: 'bottom',
  },
  {
    id: 'meta-progress',
    title: 'Meta Mensal',
    description: 'Visualize o progresso da sua meta de vendas do mês. Configure suas metas em Configurações.',
    target: '[data-tour="meta-progress"]',
    placement: 'right',
  },
  {
    id: 'insights',
    title: 'Insights Inteligentes',
    description: 'Receba dicas e análises automáticas sobre seu negócio para tomar melhores decisões.',
    target: '[data-tour="insights"]',
    placement: 'top',
  },
];

export const PDV_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-pdv',
    title: 'Ponto de Venda (PDV)',
    description: 'Aqui você realiza vendas, gerencia o caixa e acompanha suas transações do dia.',
    placement: 'center',
  },
  {
    id: 'caixa-status',
    title: 'Status do Caixa',
    description: 'Verifique se o caixa está aberto e seu fundo de troco. Você precisa abrir o caixa para iniciar as vendas.',
    target: '[data-tour="caixa-status"]',
    placement: 'bottom',
  },
  {
    id: 'produtos',
    title: 'Catálogo de Produtos',
    description: 'Navegue pelas peças disponíveis. Clique em uma peça para adicioná-la ao carrinho.',
    target: '[data-tour="produtos"]',
    placement: 'left',
  },
  {
    id: 'carrinho',
    title: 'Carrinho de Compras',
    description: 'Veja os itens selecionados, aplique descontos e finalize a venda.',
    target: '[data-tour="carrinho"]',
    placement: 'left',
  },
  {
    id: 'atalhos',
    title: 'Atalhos do Teclado',
    description: 'Use atalhos para agilizar as vendas: F2 para busca, F4 para finalizar, ESC para cancelar.',
    target: '[data-tour="atalhos"]',
    placement: 'bottom',
  },
];

export const PECAS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-pecas',
    title: 'Gestão de Peças',
    description: 'Gerencie seu catálogo de semijoias. Cadastre, edite e controle o estoque das suas peças.',
    placement: 'center',
  },
  {
    id: 'stats-pecas',
    title: 'Resumo do Estoque',
    description: 'Veja rapidamente o total de peças, quantidade em estoque e alertas de estoque baixo.',
    target: '[data-tour="stats-pecas"]',
    placement: 'bottom',
  },
  {
    id: 'filtros-pecas',
    title: 'Busca e Filtros',
    description: 'Use a busca por nome ou código. Os filtros avançados permitem filtrar por categoria, material e fornecedor.',
    target: '[data-tour="filtros-pecas"]',
    placement: 'bottom',
  },
  {
    id: 'adicionar-peca',
    title: 'Adicionar Peça',
    description: 'Clique aqui para cadastrar uma nova peça. Preencha nome, código, preços e foto.',
    target: '[data-tour="adicionar-peca"]',
    placement: 'left',
  },
  {
    id: 'tabela-pecas',
    title: 'Lista de Peças',
    description: 'Visualize todas as peças. Clique nos cabeçalhos para ordenar. Use o menu ⋮ para editar ou excluir.',
    target: '[data-tour="tabela-pecas"]',
    placement: 'top',
  },
];

export const REVENDEDORAS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-revendedoras',
    title: 'Gestão de Revendedoras',
    description: 'Gerencie suas revendedoras, maletas e acompanhe as vendas da sua equipe.',
    placement: 'center',
  },
  {
    id: 'tabs-revendedoras',
    title: 'Abas de Navegação',
    description: 'Alterne entre Revendedoras, Maletas e Romaneios para gerenciar cada aspecto.',
    target: '[data-tour="tabs-revendedoras"]',
    placement: 'bottom',
  },
  {
    id: 'lista-revendedoras',
    title: 'Lista de Revendedoras',
    description: 'Veja todas as suas revendedoras ativas. Clique para ver detalhes ou editar.',
    target: '[data-tour="lista-revendedoras"]',
    placement: 'bottom',
  },
  {
    id: 'maletas',
    title: 'Controle de Maletas',
    description: 'Crie maletas com peças para suas revendedoras. Acompanhe empréstimos e devoluções.',
    target: '[data-tour="maletas"]',
    placement: 'top',
  },
];

export const RELATORIOS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-relatorios',
    title: 'Central de Relatórios',
    description: 'Analise seu negócio com gráficos e dados detalhados sobre vendas, estoque e revendedoras.',
    placement: 'center',
  },
  {
    id: 'filtro-periodo',
    title: 'Filtro de Período',
    description: 'Selecione o período para análise: hoje, semanal, mensal ou personalizado.',
    target: '[data-tour="filtro-periodo"]',
    placement: 'bottom',
  },
  {
    id: 'tabs-relatorios',
    title: 'Tipos de Relatório',
    description: 'Navegue entre Vendas, Lucratividade, Galvânica, Estoque e Revendedoras.',
    target: '[data-tour="tabs-relatorios"]',
    placement: 'bottom',
  },
  {
    id: 'graficos',
    title: 'Gráficos Interativos',
    description: 'Passe o mouse sobre os gráficos para ver detalhes. Os dados são atualizados em tempo real.',
    target: '[data-tour="graficos"]',
    placement: 'top',
  },
];

// ============ TOUR MANAGER HOOK ============

export type TourName = 'dashboard' | 'pdv' | 'pecas' | 'revendedoras' | 'relatorios';

export function useTourManager(tourName: TourName) {
  const storageKey = `tour_${tourName}_completed`;
  const { showTour, startTour, endTour, resetTour } = useInteractiveTour(storageKey);

  const getSteps = useCallback((): TourStep[] => {
    switch (tourName) {
      case 'dashboard':
        return DASHBOARD_TOUR_STEPS;
      case 'pdv':
        return PDV_TOUR_STEPS;
      case 'pecas':
        return PECAS_TOUR_STEPS;
      case 'revendedoras':
        return REVENDEDORAS_TOUR_STEPS;
      case 'relatorios':
        return RELATORIOS_TOUR_STEPS;
      default:
        return [];
    }
  }, [tourName]);

  return {
    showTour,
    startTour,
    endTour,
    resetTour,
    steps: getSteps(),
    storageKey,
  };
}

