import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noBorder?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', padding = 'md', noBorder, children, ...props }, ref) => {
    
    const baseStyles = 'rounded-[24px] overflow-hidden transition-all duration-500 ease-out';
    
    const variants = {
      default: 'bg-surface-solid shadow-[var(--glass-shadow)]',
      glass: 'glass-panel',
      interactive: 'glass-panel hover:-translate-y-1 hover:shadow-xl cursor-pointer hover:bg-surface-elevated'
    };

    const paddings = {
      none: '',
      sm: 'p-6',
      md: 'p-8',
      lg: 'p-12'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          noBorder ? 'border-none' : '',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
