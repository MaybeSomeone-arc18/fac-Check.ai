import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusDot } from '../ui/StatusDot';
import { TelemetrySparkline } from '../charts/TelemetrySparkline';
import Link from 'next/link';

export interface MachineCardProps {
  id: string;
  type: string;
  riskLevel: string;
  riskPercentage: string;
  sparklineData: number[];
}

export const MachineCard: React.FC<MachineCardProps> = ({
  id,
  type,
  riskLevel,
  riskPercentage,
  sparklineData
}) => {
  const isCritical = riskLevel === 'CRITICAL';
  const isWarning = riskLevel === 'WARNING';
  
  const statusVariant = isCritical ? 'critical' : isWarning ? 'warning' : 'nominal';
  const riskColor = isCritical ? 'text-critical' : isWarning ? 'text-warning' : 'text-primary';
  const sparklineColor = isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--color-on-surface-muted)';

  return (
    <Link href={`/machine-detail?id=${id}`} className="block outline-none group">
      <Card variant="interactive" padding="none" className="flex flex-row flex-wrap items-center justify-between p-4 sm:p-6 gap-4 sm:gap-6 relative overflow-hidden transition-colors">
        
        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />

        <div className="flex items-center gap-4 flex-1 min-w-[140px] z-10">
          <StatusDot variant={statusVariant} ping={isCritical || isWarning} />
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-on-surface group-hover:text-primary transition-colors tracking-wide truncate">{id}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">{type}</p>
          </div>
        </div>

        <div className="flex-1 min-w-[100px] max-w-[150px] z-10">
          <TelemetrySparkline data={sparklineData} color={sparklineColor} height={30} />
        </div>

        <div className="flex items-center justify-end gap-4 min-w-[100px] z-10 ml-auto">
          <div className="flex flex-col items-end">
            <span className={`font-mono text-sm font-bold whitespace-nowrap ${riskColor}`}>
              {riskPercentage}% Risk
            </span>
            <Badge variant={statusVariant} text={riskLevel} className="mt-1" />
          </div>
        </div>
        
      </Card>
    </Link>
  );
};
