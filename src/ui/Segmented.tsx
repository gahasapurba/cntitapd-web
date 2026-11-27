import type { ReactNode } from 'react';
import { cn } from './cn';

export interface SegmentedOption {
  key: string;
  label: ReactNode;
  active: boolean;
  onClick: () => void;
}

/** Group of toggle buttons where one option is active (filters, view switches). */
export function Segmented({ label, options, className }: { label: string; options: SegmentedOption[]; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-line bg-subtle p-1', className)}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.active}
          onClick={o.onClick}
          className={cn(
            'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-0 px-3.5 text-[0.86rem] font-bold whitespace-nowrap',
            o.active ? 'bg-surface text-ink shadow-card' : 'bg-transparent text-muted hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
