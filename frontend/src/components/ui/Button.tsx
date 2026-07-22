import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Map HTML button props to framer motion props safely
type MotionButtonProps = HTMLMotionProps<"button"> & Omit<ButtonProps, keyof HTMLMotionProps<"button">>;

export const Button = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-on-surface text-background hover:bg-on-surface/90 font-medium shadow-md shadow-black/5',
      secondary: 'bg-surface-solid border border-border-strong text-on-surface hover:bg-on-surface/5',
      ghost: 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5',
      danger: 'bg-critical text-white hover:bg-red-500 font-medium'
    };

    const sizes = {
      sm: 'h-8 px-4 text-xs tracking-wide',
      md: 'h-10 px-5 text-sm tracking-wide',
      lg: 'h-12 px-8 text-base tracking-wide'
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="material-symbols-outlined animate-spin text-[16px] mr-2">progress_activity</span>
        ) : null}
        <>{children}</>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
