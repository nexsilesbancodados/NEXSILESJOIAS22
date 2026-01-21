import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: 'purple' | 'green' | 'orange' | 'blue' | 'teal' | 'pink' | 'cyan';
}

const gradientStyles = {
  purple: 'bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600',
  green: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
  orange: 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
  blue: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
  teal: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500',
  pink: 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-500',
  cyan: 'bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-500',
};

export const GradientStatCard = memo(function GradientStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: GradientStatCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
      gradientStyles[gradient]
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10 flex items-center gap-4">
        {/* Icon container */}
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
});