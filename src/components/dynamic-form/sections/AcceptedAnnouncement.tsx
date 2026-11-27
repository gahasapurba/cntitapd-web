import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Button, Card, Chip, Eyebrow, cn } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

const ACCEPTED_PER_PAGE = 8;

export default function AcceptedAnnouncement() {
  const { acceptedList, acceptedPage, currentForm, forms, setAcceptedPage } = useDynamicFormContext();
  if (!currentForm?.showAnnouncement || acceptedList.length === 0) return null;

  const totalPages = Math.ceil(acceptedList.length / ACCEPTED_PER_PAGE) || 1;
  const page = Math.min(Math.max(1, acceptedPage), totalPages);
  const items = acceptedList.slice((page - 1) * ACCEPTED_PER_PAGE, page * ACCEPTED_PER_PAGE);

  return (
      <Card as="section" padding="lg" className="flex w-full flex-col gap-5" aria-labelledby="accepted-title">
        <header className="flex flex-col gap-2">
          <Eyebrow>Pengumuman resmi</Eyebrow>
          <h2 id="accepted-title" className="m-0 text-[1.45rem] font-extrabold leading-tight text-ink">
            Selamat datang, peserta terpilih ({acceptedList.length})
          </h2>
          <p className="m-0 text-[0.95rem] leading-relaxed text-muted">
            Rekan insan IT APD yang dinyatakan <strong className="text-ink">lolos seleksi atau terdaftar</strong> pada program dan rekrutmen Culture Network Team.
          </p>
        </header>

        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {items.map((sub: any) => (
            <li key={sub.id} className="flex flex-col gap-2 rounded-2xl border border-line border-l-4 border-l-kolaboratif bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Chip tone="success">Diterima</Chip>
                <span className="text-[0.78rem] text-muted">{formatWibTimestamp(sub.createdAt || sub.submittedAt).exact || sub.submittedAt || sub.createdAt}</span>
              </div>
              <p className="m-0 break-words text-[1rem] font-extrabold text-ink">{sub.participantName}</p>
              {sub.participantDetail && <p className="m-0 break-words text-[0.86rem] font-bold text-gold-ink">{sub.participantDetail}</p>}
              <p className="m-0 text-[0.82rem] text-muted">{forms.find((f: any) => f.id === sub.formId)?.title || sub.formTitle || 'Formulir'}</p>
              {sub.adminNotes && (
                <div className="rounded-xl bg-kolaboratif-tint px-3 py-2 text-[0.84rem] leading-relaxed text-kolaboratif-ink">
                  <strong className="block text-[0.74rem] uppercase tracking-[0.06em]">Info onboarding</strong>
                  {sub.adminNotes}
                </div>
              )}
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <nav aria-label="Halaman pengumuman" className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="m-0 text-[0.86rem] text-muted">Halaman <strong className="text-ink">{page}</strong> dari <strong className="text-ink">{totalPages}</strong> ({acceptedList.length} peserta)</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setAcceptedPage((prev: number) => Math.max(1, prev - 1))}
                icon={<ChevronLeft size={14} aria-hidden="true" />} aria-label="Halaman sebelumnya" />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button key={pg} size="sm" variant={pg === page ? 'primary' : 'secondary'} aria-current={pg === page ? 'page' : undefined}
                  onClick={() => setAcceptedPage(pg)} className={cn('min-w-9 px-2')}>
                  {pg}
                </Button>
              ))}
              <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setAcceptedPage((prev: number) => Math.min(totalPages, prev + 1))}
                icon={<ChevronRight size={14} aria-hidden="true" />} aria-label="Halaman berikutnya" />
            </div>
          </nav>
        )}
      </Card>
  );
}
