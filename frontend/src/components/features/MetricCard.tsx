import React from 'react';
import { Card } from '../ui/Card';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  iconColor?: string;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendValue,
  icon,
  iconColor = 'text-primary',
  isLoading
}) => {
  return (
    <Card variant="glass" padding="md" className="flex flex-col relative overflow-hidden group">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        </div>
      )}
      
      {icon && (
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <span className={`material-symbols-outlined text-[40px] group-hover:scale-110 transition-transform ${iconColor}`}>
            {icon}
          </span>
        </div>
      )}
      
      <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">
        {label}
      </span>
      
      <div className="flex items-baseline gap-2 mt-auto relative z-10">
        <span className="text-3xl lg:text-4xl font-sans font-medium text-on-surface tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-sans font-medium text-on-surface-variant mb-1">{unit}</span>
        )}
      </div>
      
      {trendValue && (
        <div className={`mt-4 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 z-10 ${
          trend === 'up' ? 'text-success' : trend === 'down' ? 'text-critical' : 'text-on-surface-variant'
        }`}>
          <span className="material-symbols-outlined text-[14px]">
            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'horizontal_rule'}
          </span> 
          {trendValue}
        </div>
      )}
    </Card>
  );
};
