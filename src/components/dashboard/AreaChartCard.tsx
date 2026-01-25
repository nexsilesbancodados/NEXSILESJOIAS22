import { memo, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface DataPoint {
  name: string;
  value: number;
}

interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  highlight?: {
    value: string;
    label: string;
    position?: 'start' | 'middle' | 'end';
  };
  color?: 'green' | 'blue' | 'purple';
  className?: string;
}

const colorStyles = {
  green: {
    gradient: ['#a7f3d0', '#10b981'],
    stroke: '#10b981',
    dot: '#f87171',
  },
  blue: {
    gradient: ['#bfdbfe', '#3b82f6'],
    stroke: '#3b82f6',
    dot: '#f87171',
  },
  purple: {
    gradient: ['#ddd6fe', '#8b5cf6'],
    stroke: '#8b5cf6',
    dot: '#f87171',
  },
};

export const AreaChartCard = memo(function AreaChartCard({
  title,
  subtitle,
  data,
  highlight,
  color = 'green',
  className,
}: AreaChartCardProps) {
  const styles = colorStyles[color];
  const gradientId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);
  const highlightIndex = highlight?.position === 'start' ? 2 : highlight?.position === 'end' ? data.length - 3 : Math.floor(data.length / 3);

  return (
    <div
      className={cn(
        'bg-card border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div className="h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={styles.gradient[0]} stopOpacity={0.8} />
                <stop offset="100%" stopColor={styles.gradient[0]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis hide domain={[0, maxValue * 1.2]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={styles.stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: styles.stroke }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Highlight bubble */}
        {highlight && (
          <div
            className="absolute bg-gradient-to-br from-lime-300 to-green-400 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md"
            style={{
              left: `${(highlightIndex / data.length) * 100}%`,
              top: '20%',
              transform: 'translateX(-50%)',
            }}
          >
            <span className="text-sm font-bold">{highlight.value}</span>
            <span className="block text-[10px] opacity-80">{highlight.label}</span>
          </div>
        )}
      </div>
    </div>
  );
});
