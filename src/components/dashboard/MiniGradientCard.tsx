import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniGradientCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'pink' | 'purple' | 'teal' | 'orange' | 'cyan' | 'rose' | 'emerald' | 'amber' | 'green' | 'blue';
}

const gradientStyles = {
  pink: 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600',
  purple: 'bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600',
  teal: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500',
  orange: 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600',
  cyan: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500',
  rose: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
  emerald: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
  amber: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500',
  green: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
  blue: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
};

export function MiniGradientCard({
  title,
  value,
  icon: Icon,
  gradient,
}: MiniGradientCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
      gradientStyles[gradient]
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20" />
        <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
      </div>
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium">{title}</p>
          <p className="text-white text-xl font-bold tracking-tight truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
