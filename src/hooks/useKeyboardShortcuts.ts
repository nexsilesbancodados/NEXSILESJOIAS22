import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toUpperCase() === shortcut.key.toUpperCase() || 
                       event.code === shortcut.key;
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined PDV shortcuts
export function usePDVShortcuts({
  onNovaVenda,
  onBuscar,
  onPagamento,
  onFecharCaixa,
  onCancelar,
}: {
  onNovaVenda?: () => void;
  onBuscar?: () => void;
  onPagamento?: () => void;
  onFecharCaixa?: () => void;
  onCancelar?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onNovaVenda) {
    shortcuts.push({ key: 'F2', action: onNovaVenda, description: 'Nova Venda' });
  }
  if (onBuscar) {
    shortcuts.push({ key: 'F4', action: onBuscar, description: 'Buscar Produto' });
  }
  if (onPagamento) {
    shortcuts.push({ key: 'F6', action: onPagamento, description: 'Pagamento' });
  }
  if (onFecharCaixa) {
    shortcuts.push({ key: 'F12', action: onFecharCaixa, description: 'Fechar Caixa' });
  }
  if (onCancelar) {
    shortcuts.push({ key: 'Escape', action: onCancelar, description: 'Cancelar' });
  }

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
