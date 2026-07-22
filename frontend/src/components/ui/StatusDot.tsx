import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'nominal' | 'warning' | 'critical' | 'offline';
  ping?: boolean;
}

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, variant = 'nominal', ping = false, ...props }, ref) => {
    
    const variants = {
      nominal: 'bg-primary',
      warning: 'bg-warning',
      critical: 'bg-critical',
      offline: 'bg-on-surface-muted'
    };

    return (
      <span className={cn("relative flex h-2 w-2", className)} ref={ref} {...props}>
        {ping && (
          <span 
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-20 scale-150",
              variants[variant]
            )}
          />
        )}
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            variants[variant]
          )}
        />
      </span>
    );
  }
);

StatusDot.displayName = 'StatusDot';
