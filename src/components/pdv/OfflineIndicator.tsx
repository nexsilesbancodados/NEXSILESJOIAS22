import { Wifi, WifiOff, Loader2, CloudUpload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onFlush?: () => void;
  className?: string;
}

export function OfflineIndicator({
  isOnline,
  pendingCount,
  isSyncing,
  onFlush,
  className,
}: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return (
      <Badge variant="outline" className={cn('gap-1.5 text-emerald-600 border-emerald-500/40', className)}>
        <Wifi className="w-3 h-3" />
        Online
      </Badge>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5',
          !isOnline
            ? 'text-rose-600 border-rose-500/40 bg-rose-500/5'
            : 'text-amber-600 border-amber-500/40 bg-amber-500/5',
        )}
      >
        {isSyncing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : !isOnline ? (
          <WifiOff className="w-3 h-3" />
        ) : (
          <CloudUpload className="w-3 h-3" />
        )}
        {!isOnline ? 'Offline' : isSyncing ? 'Sincronizando...' : 'Pendente'}
        {pendingCount > 0 && (
          <span className="ml-1 rounded-full bg-current/20 px-1.5 text-[10px] font-semibold">
            {pendingCount}
          </span>
        )}
      </Badge>
      {isOnline && pendingCount > 0 && !isSyncing && onFlush && (
        <Button size="sm" variant="outline" className="h-7" onClick={onFlush}>
          Sincronizar agora
        </Button>
      )}
    </div>
  );
}
