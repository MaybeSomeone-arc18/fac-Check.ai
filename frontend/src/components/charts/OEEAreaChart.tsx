import React, { useId } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface OEEAreaChartProps {
  data: { time: string; oee: number; yield: number }[];
  height?: number;
}

export const OEEAreaChart: React.FC<OEEAreaChartProps> = ({ data, height = 300 }) => {
  // Unique IDs per instance to prevent SVG gradient conflicts when multiple charts render
  const uid = useId().replace(/:/g, '');
  const oeeGradientId = `oeeGrad-${uid}`;
  const yieldGradientId = `yieldGrad-${uid}`;

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={oeeGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id={yieldGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-insight)" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="var(--color-insight)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            stroke="var(--color-on-surface-muted)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickMargin={10}
          />
          <YAxis 
            stroke="var(--color-on-surface-muted)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-surface-elevated)', 
              backdropFilter: 'blur(10px)',
              borderColor: 'var(--color-border-strong)',
              borderRadius: '8px',
              color: 'var(--color-on-surface)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            itemStyle={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
            labelStyle={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="oee" 
            stroke="var(--color-primary)" 
            fillOpacity={1} 
            fill={`url(#${oeeGradientId})`}
            strokeWidth={1}
            activeDot={{ r: 4, fill: 'var(--color-background)', stroke: 'var(--color-primary)', strokeWidth: 1.5 }}
          />
          <Area 
            type="monotone" 
            dataKey="yield" 
            stroke="var(--color-insight)" 
            fillOpacity={1} 
            fill={`url(#${yieldGradientId})`}
            strokeWidth={1}
            activeDot={{ r: 4, fill: 'var(--color-background)', stroke: 'var(--color-insight)', strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
