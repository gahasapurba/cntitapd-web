import { ChevronRight } from 'lucide-react';
import { formatDeadlineWib, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { Chip, cn } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPicker() {
  const { activeForms, events, onSelectFormUrl, registrationCounts, selectedFormId, setErrors, setFileData, setFormData, setIsSubmitted, setSelectedFormId } = useDynamicFormContext();
  if (activeForms.length <= 1) return null;

  const choose = (formId: string) => {
    setSelectedFormId(formId);
    if (onSelectFormUrl) onSelectFormUrl(formId);
    setFormData({});
    setFileData({});
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <nav aria-labelledby="form-picker-title" className="flex flex-col gap-3 lg:sticky lg:top-24">
      <h2 id="form-picker-title" className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">Pilih formulir ({activeForms.length})</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {activeForms.map((f: any) => {
          const isSelected = f.id === selectedFormId;
          const quota = getUnifiedFormQuota(f, events, registrationCounts);
          const deadline = getDeadlineStatus(f.deadline);
          const isClosed = f.isOpen === false || deadline.isExpired;
          const footerLabel = isSelected
            ? (isClosed ? 'Sedang ditampilkan · ditutup' : 'Sedang ditampilkan')
            : isClosed ? 'Ditutup · lihat detail' : quota.isFull ? 'Kuota penuh · lihat detail' : 'Buka formulir';

          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => choose(f.id)}
              className={cn(
                'flex cursor-pointer flex-col gap-2.5 rounded-[20px] border bg-surface p-4 text-left [font:inherit] text-ink transition-[transform,border-color] duration-200 hover:-translate-y-0.5',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
                isSelected ? 'border-gold shadow-[inset_0_0_0_1px_var(--gold-fill)]' : 'border-line hover:border-line-strong'
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="navy">{f.category || 'Formulir'}</Chip>
                {quota.isLimited && quota.maxQuota > 0 && (
                  <Chip tone={quota.isFull ? 'danger' : 'neutral'}>
                    {quota.isFull
                      ? `${quota.isConnected ? 'Kuota acara penuh' : 'Kuota penuh'} (${quota.count}/${quota.maxQuota})`
                      : `${quota.isConnected ? 'Acara' : 'Kuota'}: ${quota.count}/${quota.maxQuota} terisi`}
                  </Chip>
                )}
                {deadline.isExpired ? (
                  <Chip tone="danger">Ditutup</Chip>
                ) : deadline.isToday ? (
                  <Chip tone="gold">Hari terakhir</Chip>
                ) : null}
              </div>
              <h3 className="m-0 text-[1.08rem] font-extrabold leading-snug">{f.title}</h3>
              {f.subtitle && <p className="m-0 flex-1 text-[0.88rem] leading-relaxed text-muted">{f.subtitle}</p>}
              <p className="m-0 text-[0.82rem] text-muted">
                {deadline.isExpired ? `Berakhir ${deadline.formatted}` : `Batas: ${formatDeadlineWib(f.deadline)}`}
              </p>
              <span className={cn(
                'mt-auto flex items-center justify-between border-t border-line pt-3 text-[0.85rem] font-bold',
                isSelected ? 'text-gold-ink' : (isClosed || quota.isFull) ? 'text-loyal-ink' : 'text-muted'
              )}>
                {footerLabel}
                <ChevronRight size={16} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
