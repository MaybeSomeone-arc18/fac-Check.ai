import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export interface TelemetrySparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const TelemetrySparkline: React.FC<TelemetrySparklineProps> = ({ 
  data, 
  color = '#4B5563', // default mute slate
  height = 40 
}) => {
  // Map raw array to objects for recharts
  const chartData = data.map((val, index) => ({ value: val, index }));

  // Find min/max to scale YAxis properly to show variance
  const validData = data.filter(v => typeof v === 'number' && !isNaN(v));
  const min = validData.length > 0 ? Math.min(...validData) : 0;
  const max = validData.length > 0 ? Math.max(...validData) : 100;
  
  // Add a small padding to min/max
  const padding = (max - min) * 0.1 || 1;

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1} 
            dot={false}
            isAnimationActive={false} // Disable animation for high-frequency updates to save CPU
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
