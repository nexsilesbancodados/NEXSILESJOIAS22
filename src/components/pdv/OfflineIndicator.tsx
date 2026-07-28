import { Wifi, WifiOff, Loader2, CloudUpload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * Compact online/offline + pending sync badge for the PDV toolbar.
 */
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1.5 text-emerald-600 border-emerald-500/40', className)}
      >
        <Wifi className="w-3 h-3" />
        Online
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5',
        !isOnline
          ? 'text-rose-600 border-rose-500/40 bg-rose-500/5'
          : 'text-amber-600 border-amber-500/40 bg-amber-500/5',
        className,
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
  );
}
