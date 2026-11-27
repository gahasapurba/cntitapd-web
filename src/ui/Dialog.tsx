import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Short line under the title. */
  description?: ReactNode;
  /** Small label above the title. */
  eyebrow?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** alertdialog for confirmations. */
  role?: 'dialog' | 'alertdialog';
}

const widths = { sm: 'max-w-[460px]', md: 'max-w-[620px]', lg: 'max-w-[760px]' };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last: only the top one reacts to Escape and Tab.
const stack: string[] = [];

/** Modal dialog: portal, focus trap, Escape to close, focus returns to the opener. */
export function Dialog({ open, onClose, title, description, eyebrow, children, footer, size = 'md', role = 'dialog' }: DialogProps) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    stack.push(id);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('[data-autofocus]') || panel?.querySelector<HTMLElement>(FOCUSABLE) || panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open, id]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(6,12,24,0.6)] p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cn('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface text-ink sm:rounded-[24px]', widths[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow && <p className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-gold-ink">{eyebrow}</p>}
            <h2 id={`${id}-title`} className="m-0 text-[1.3rem] font-extrabold leading-tight text-ink">{title}</h2>
            {description && <p id={`${id}-desc`} className="m-0 text-[0.9rem] text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
