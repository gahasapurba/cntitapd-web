import type { ReactNode } from 'react';
import { cn } from './cn';

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line bg-surface px-6 py-10 text-center', className)}>
      {icon && <div className="grid size-12 place-items-center rounded-full bg-pill text-pill-ink">{icon}</div>}
      <p className="m-0 text-[1.05rem] font-bold text-ink">{title}</p>
      {children && <div className="m-0 max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">{children}</div>}
      {action}
    </div>
  );
}
