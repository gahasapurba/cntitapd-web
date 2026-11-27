import type { HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lifts on hover; for cards that are clickable as a whole. */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-7 sm:p-8' };

export function Card({ interactive = false, padding = 'md', as: Tag = 'div', className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[20px] border border-line bg-surface',
        interactive && 'transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong',
        paddings[padding],
        className
      )}
      {...rest}
    />
  );
}

/** Small uppercase label above a card's content. */
export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('m-0 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-muted', className)} {...rest} />;
}
