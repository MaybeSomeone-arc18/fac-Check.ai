import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'nominal' | 'warning' | 'critical' | 'neutral' | 'ai';
  text: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', text, ...props }, ref) => {
    
    const variants = {
      nominal: 'bg-primary/5 text-primary',
      warning: 'bg-warning/10 text-warning',
      critical: 'bg-critical/10 text-critical',
      neutral: 'bg-on-surface-muted/10 text-on-surface-variant',
      ai: 'bg-insight/10 text-insight'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider',
          variants[variant],
          className
        )}
        {...props}
      >
        {text}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
