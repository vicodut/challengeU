import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'border-border h-9 w-full rounded-md border bg-transparent px-3 text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
