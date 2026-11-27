import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/** Page-width container (max 1240px, 24px gutters on phones). */
export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1240px] px-4 sm:px-6', className)} {...rest} />;
}

export function SectionHeader({ title, action, eyebrow, className, as: Tag = 'h2' }: { title: ReactNode; action?: ReactNode; eyebrow?: ReactNode; className?: string; as?: 'h1' | 'h2' }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex flex-col gap-2">
        {eyebrow && <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-gold-ink">{eyebrow}</p>}
        <Tag className="m-0 text-[clamp(1.6rem,3.2vw,2.25rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">{title}</Tag>
      </div>
      {action}
    </div>
  );
}
