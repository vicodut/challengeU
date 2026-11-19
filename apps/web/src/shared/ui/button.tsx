import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

function Button({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(
        'bg-foreground text-background inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Button };
