/**
 * Plano único Nexsiles Prime: todos os módulos liberados para qualquer assinante ativo.
 * Mantido como passthrough para preservar a API dos consumidores.
 */
export function PlanRouteGuard({ children }: { children: React.ReactNode; path?: string }) {
  return <>{children}</>;
}
