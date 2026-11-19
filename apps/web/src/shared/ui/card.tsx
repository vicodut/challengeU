import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card text-card-foreground rounded-xl border p-6 shadow-sm', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-lg leading-none font-semibold', className)} {...props} />;
}
