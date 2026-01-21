import { Keyboard } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const shortcuts = [
  { key: 'F2', description: 'Nova Venda' },
  { key: 'F4', description: 'Buscar Produto' },
  { key: 'F6', description: 'Finalizar Pagamento' },
  { key: 'F12', description: 'Fechar Caixa' },
  { key: 'Esc', description: 'Cancelar' },
];

export function ShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-popover" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Atalhos de Teclado</h4>
          <div className="space-y-1">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
