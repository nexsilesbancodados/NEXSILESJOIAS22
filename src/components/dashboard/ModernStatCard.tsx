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
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'rose' | 'emerald' | 'amber';
  className?: string;
}

interface VariantStyle {
  card: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  subtitleColor: string;
  hasWave: boolean;
  waveColor?: string;
}

const variantStyles: Record<string, VariantStyle> = {
  default: {
    card: 'bg-card border border-border/50',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    textColor: 'text-foreground',
    subtitleColor: 'text-muted-foreground',
    hasWave: false,
  },
  primary: {
    card: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  success: {
    card: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  warning: {
    card: 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  info: {
    card: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  purple: {
    card: 'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  rose: {
    card: 'bg-gradient-to-br from-rose-500 via-pink-500 to-pink-600 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  emerald: {
    card: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
  },
  amber: {
    card: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 border-0',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtitleColor: 'text-white/60',
    hasWave: true,
    waveColor: 'rgba(255,255,255,0.15)',
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
  const isColorful = variant !== 'default';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
        styles.card,
        className
      )}
    >
      {/* Decorative wave pattern for colorful variants */}
      {styles.hasWave && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg 
            className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-40"
            viewBox="0 0 400 100" 
            preserveAspectRatio="none"
          >
            <path
              d="M0 60 C 80 40, 120 80, 200 50 C 280 20, 320 70, 400 40 L 400 100 L 0 100 Z"
              fill={styles.waveColor}
            />
            <path
              d="M0 75 C 60 60, 140 90, 200 65 C 260 40, 340 85, 400 55 L 400 100 L 0 100 Z"
              fill={styles.waveColor}
            />
          </svg>
        </div>
      )}

      {/* Header with icon and arrow */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', styles.iconBg)}>
          <Icon className={cn('w-5 h-5', styles.iconColor)} />
        </div>
        <button
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            isColorful
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
          'relative text-xs font-medium uppercase tracking-wider mb-1',
          isColorful ? 'text-white/70' : 'text-muted-foreground'
        )}
      >
        {title}
      </p>

      {/* Value */}
      <div className="relative flex items-end gap-3">
        <p className={cn('text-2xl font-bold tracking-tight', styles.textColor)}>
          {value}
        </p>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium mb-1',
              isColorful
                ? 'text-white/90'
                : trend.value >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-500'
            )}
          >
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={cn('relative text-xs mt-1', styles.subtitleColor)}>{subtitle}</p>
      )}
    </div>
  );
});