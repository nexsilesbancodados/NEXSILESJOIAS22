import { memo } from 'react';
import { LucideIcon, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card border border-border/50',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    card: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
  },
  success: {
    card: 'bg-card border border-border/50',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    card: 'bg-card border border-border/50',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    card: 'bg-card border border-border/50',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export const ModernStatCard = memo(function ModernStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: ModernStatCardProps) {
  const styles = variantStyles[variant];
  const isPrimary = variant === 'primary';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md',
        styles.card,
        className
      )}
    >
      {/* Header with icon and arrow */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', styles.iconBg)}>
          <Icon className={cn('w-5 h-5', styles.iconColor)} />
        </div>
        <button
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            isPrimary
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <p
        className={cn(
          'text-xs font-medium uppercase tracking-wider mb-1',
          isPrimary ? 'text-white/70' : 'text-muted-foreground'
        )}
      >
        {title}
      </p>

      {/* Value */}
      <div className="flex items-end gap-3">
        <p className={cn('text-2xl font-bold tracking-tight', isPrimary ? 'text-white' : 'text-foreground')}>
          {value}
        </p>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium mb-1',
              trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            )}
          >
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={cn('text-xs mt-1', isPrimary ? 'text-white/60' : 'text-muted-foreground')}>{subtitle}</p>
      )}

      {/* Sparkline placeholder for primary variant */}
      {isPrimary && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
            <path
              d="M0 40 Q 25 35, 50 38 T 100 30 T 150 35 T 200 25"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
});
