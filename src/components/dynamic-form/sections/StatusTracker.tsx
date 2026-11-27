import { Search, X } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Card, Chip, Eyebrow } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';
import { Notice, fieldClass, submissionStatus } from './formUi';

export default function StatusTracker() {
  const {
    dynamicSearchKeysString, forms, hasConfiguredIndex, isTracking, matchedSubmissions, setStatusQuery, statusQuery,
    trackingActiveForms, trimmedStatusQuery
  } = useDynamicFormContext();
  if (trackingActiveForms.length === 0) return null;

  const keyHint = hasConfiguredIndex ? `${dynamicSearchKeysString} lengkap atau ID pendaftaran (sub-…)` : 'ID pendaftaran (sub-…)';
  const tooShort = statusQuery.trim().length > 0 && statusQuery.trim().length < 3;
  const showResults = trimmedStatusQuery.length >= 3;

  return (
      <Card as="section" id="status-tracker-section" padding="lg" className="flex w-full scroll-mt-24 flex-col gap-5" aria-labelledby="status-tracker-title">
        <header className="flex flex-col gap-2">
          <Eyebrow>Lacak pendaftaran</Eyebrow>
          <h2 id="status-tracker-title" className="m-0 text-[1.45rem] font-extrabold leading-tight text-ink">Cek status pendaftaran</h2>
          <p className="m-0 text-[0.95rem] leading-relaxed text-muted">
            Sudah mengisi formulir? Ketik <strong className="text-ink">{keyHint}</strong> untuk melihat progres seleksi dan catatan panitia.
          </p>
        </header>

        <Notice tone="info" title="Privasi terjaga">
          Pencarian harus persis sama dengan {hasConfiguredIndex ? `indeks pencarian (${dynamicSearchKeysString}) atau ID pendaftaran` : 'ID pendaftaran (sub-…)'}.
          Pencarian sebagian atau dengan nama sengaja tidak didukung untuk melindungi data pendaftar.
        </Notice>

        <div className="rounded-2xl border border-line bg-subtle px-4 py-3">
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">Berlaku untuk</p>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[0.9rem]">
            {trackingActiveForms.map((f: any) => {
              const labels = (f.fields || []).filter((fld: any) => Boolean(fld.isSearchIndex)).map((fld: any) => fld.label || 'Indeks pencarian');
              return (
                <li key={f.id} className="break-words text-ink">
                  <strong>{f.title}</strong>
                  <span className="text-muted"> — cari dengan {labels.length > 0 ? `${labels.join(', ')} atau ID pendaftaran` : 'ID pendaftaran (sub-…)'}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative">
          <label htmlFor="status-tracker-input" className="sr-only">Kunci pencarian status pendaftaran</label>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" aria-hidden="true" />
          <input
            id="status-tracker-input"
            type="text"
            placeholder={hasConfiguredIndex ? `Ketik ${dynamicSearchKeysString} lengkap atau ID pendaftaran` : 'Ketik ID pendaftaran (misal: sub-1731…)'}
            value={statusQuery}
            onChange={(e) => setStatusQuery(e.target.value)}
            className={fieldClass(false, 'pl-11 pr-12')}
          />
          {statusQuery && (
            <button type="button" onClick={() => setStatusQuery('')} aria-label="Kosongkan pencarian"
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div aria-live="polite" className="flex flex-col gap-3">
          {tooShort && <p className="m-0 text-center text-[0.88rem] text-muted">Ketik minimal 3 karakter {hasConfiguredIndex ? dynamicSearchKeysString : 'ID pendaftaran'}.</p>}
          {showResults && isTracking && <p className="m-0 text-center text-[0.88rem] text-muted">Mencari…</p>}
          {showResults && !isTracking && matchedSubmissions.length === 0 && (
            <p className="m-0 rounded-2xl border border-dashed border-line px-5 py-5 text-center text-[0.9rem] leading-relaxed text-muted">
              Tidak ada pendaftaran dengan kunci <strong className="text-ink">"{statusQuery}"</strong>. Pastikan Anda mengetik {keyHint} persis seperti saat mendaftar.
            </p>
          )}
          {showResults && !isTracking && matchedSubmissions.map((sub: any) => {
            const status = submissionStatus(sub.status || 'Baru Masuk');
            const identity = Object.values(sub.data || {}).slice(0, 3).map((v) => String(v)).filter(Boolean).join(' · ');
            const submittedAt = formatWibTimestamp(sub.createdAt || sub.submittedAt).exact || sub.submittedAt || sub.createdAt;
            return (
              <article key={sub.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 break-all font-mono text-[0.78rem] text-muted">ID {sub.id} · {submittedAt}</p>
                    <h3 className="m-0 mt-1 text-[1.05rem] font-extrabold text-ink">
                      {forms.find((f: any) => f.id === sub.formId)?.title || sub.formTitle || 'Formulir'}
                    </h3>
                  </div>
                  <Chip tone={status.tone}>Status: {status.label}</Chip>
                </div>
                {identity && <p className="m-0 break-words text-[0.9rem] text-muted"><strong className="text-ink">Pendaftar:</strong> {identity}</p>}
                {sub.adminNotes ? (
                  <div className="rounded-xl border-l-4 border-l-amanah bg-subtle px-4 py-3">
                    <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.06em] text-muted">Catatan panitia</p>
                    <p className="m-0 mt-1 whitespace-pre-line text-[0.92rem] leading-relaxed text-ink">{sub.adminNotes}</p>
                  </div>
                ) : (
                  <p className="m-0 text-[0.86rem] italic text-muted">
                    Belum ada catatan dari panitia. Cek lagi secara berkala untuk jadwal wawancara atau pengumuman seleksi.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </Card>
  );
}
