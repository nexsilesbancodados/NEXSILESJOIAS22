import { memo } from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonCardProps {
  title: string;
  subtitle?: string;
  value: string;
  change: number;
  thisWeek: { value: number; label: string };
  lastWeek: { value: number; label: string };
  color?: 'green' | 'yellow' | 'purple' | 'blue';
  className?: string;
}

const colorStyles = {
  green: {
    bar: 'bg-emerald-400',
    barBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  yellow: {
    bar: 'bg-amber-400',
    barBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  purple: {
    bar: 'bg-purple-400',
    barBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  blue: {
    bar: 'bg-blue-400',
    barBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

export const ComparisonCard = memo(function ComparisonCard({
  title,
  subtitle = 'vs yesterday',
  value,
  change,
  thisWeek,
  lastWeek,
  color = 'green',
  className,
}: ComparisonCardProps) {
  const styles = colorStyles[color];
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        'bg-card border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main value with trend */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            'text-2xl font-bold',
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
          )}
        >
          {isPositive ? '+' : ''}
          {value}
        </span>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Bar chart comparison */}
      <div className="flex items-end gap-4">
        {/* This Week */}
        <div className="flex-1">
          <div className="flex items-end gap-2 mb-2">
            <div
              className={cn('w-8 rounded-t-md', styles.bar)}
              style={{ height: `${Math.min(Math.max(thisWeek.value / 10, 20), 60)}px` }}
            />
            <div
              className={cn('w-8 rounded-t-md', styles.bar)}
              style={{ height: `${Math.min(Math.max(thisWeek.value / 8, 25), 70)}px` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{thisWeek.label}</p>
        </div>

        {/* Last Week */}
        <div className="flex-1">
          <div className="flex items-end gap-2 mb-2">
            <div
              className={cn('w-8 rounded-t-md', styles.barBg)}
              style={{ height: `${Math.min(Math.max(lastWeek.value / 10, 15), 50)}px` }}
            />
            <div
              className={cn('w-8 rounded-t-md', styles.bar)}
              style={{ height: `${Math.min(Math.max(lastWeek.value / 8, 20), 55)}px` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{lastWeek.label}</p>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Total per week: <span className="font-medium text-foreground">{thisWeek.value}</span>
        </p>
      </div>
    </div>
  );
});
