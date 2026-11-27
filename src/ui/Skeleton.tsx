import { cn } from './cn';

/** Placeholder block shown while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-subtle', className)} />;
}
