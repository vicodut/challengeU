import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

const variants = {
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/15 text-destructive',
  muted: 'bg-border text-muted-foreground',
} as const;

export function Badge({
  variant = 'muted',
  className,
  ...props
}: ComponentProps<'span'> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
