import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { cn, type ChipTone } from '../../../ui';

type NoticeTone = 'danger' | 'warning' | 'info' | 'success';

const noticeTones: Record<NoticeTone, string> = {
  danger: 'bg-loyal-tint text-loyal-ink',
  warning: 'bg-harmonis-tint text-harmonis-ink',
  info: 'bg-amanah-tint text-amanah-ink',
  success: 'bg-kolaboratif-tint text-kolaboratif-ink'
};

const noticeIcons: Record<NoticeTone, ReactNode> = {
  danger: <AlertCircle size={18} aria-hidden="true" />,
  warning: <Clock size={18} aria-hidden="true" />,
  info: <Info size={18} aria-hidden="true" />,
  success: <CheckCircle2 size={18} aria-hidden="true" />
};

/** Tinted message box (closed form, last day, privacy note…). */
export function Notice({ tone, title, children, className }: { tone: NoticeTone; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl px-4 py-3 text-left text-[0.9rem] leading-relaxed', noticeTones[tone], className)}>
      <span className="mt-0.5 shrink-0">{noticeIcons[tone]}</span>
      <div className="min-w-0">
        {title && <p className="m-0 font-bold">{title}</p>}
        <div className={title ? 'mt-0.5' : 'font-semibold'}>{children}</div>
      </div>
    </div>
  );
}

/** Classes for text inputs, selects and textareas on the public form. */
export function fieldClass(hasError: boolean, extra?: string) {
  return cn(
    'w-full min-h-11 rounded-xl border bg-field px-4 py-2.5 text-[0.95rem] text-ink placeholder:text-dim',
    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy',
    hasError ? 'border-loyal' : 'border-field-line',
    extra
  );
}

/** Label and chip tone for a submission status (values stored by the admin portal). */
export function submissionStatus(status: string | null | undefined): { label: string; tone: ChipTone } {
  switch (status) {
    case 'Accepted':
    case 'Diterima':
    case 'Diterima ✓':
      return { label: 'Diterima', tone: 'success' };
    case 'Interview':
    case 'Wawancara':
      return { label: 'Wawancara', tone: 'adaptif' };
    case 'Reviewed':
    case 'Direview':
      return { label: 'Sedang ditinjau', tone: 'gold' };
    case 'Rejected':
    case 'Ditolak':
      return { label: 'Belum lolos', tone: 'danger' };
    default:
      return { label: 'Baru masuk', tone: 'amanah' };
  }
}
