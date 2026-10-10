import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-accent motion-reduce:animate-none',
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  )
}

export { Skeleton }
