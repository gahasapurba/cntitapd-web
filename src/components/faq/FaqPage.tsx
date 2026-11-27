import { useId, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, HelpCircle, Search } from 'lucide-react';
import { Button, Card, Container, EmptyState, Eyebrow, SectionHeader, cn } from '../../ui';

type AppItem = Record<string, any>;

const ASK_CATEGORIES = ['Kegiatan & Event', 'Operasional & Sekben', 'Pendaftaran & Oprec', 'Aspirasi & Usulan', 'Tentang CNT'];
const PER_PAGE = 8;

interface FaqPageProps {
  faqs: AppItem[];
  onSubmitFaqQuestion?: (faq: AppItem) => Promise<void>;
}

export default function FaqPage({ faqs, onSubmitFaqQuestion }: FaqPageProps) {
  const published = useMemo(() => faqs.filter((f) => f.isPublished !== false), [faqs]);
  const categories = useMemo(() => ['Semua', ...Array.from(new Set(published.map((f) => f.category || 'Umum')))], [published]);
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(published[0]?.id ?? null);
  const [page, setPage] = useState(1);

  const q = query.trim().toLowerCase();
  const filtered = published.filter((f) => {
    const matchCat = category === 'Semua' || (f.category || 'Umum') === category;
    const matchQuery = !q || [f.question, f.answer, f.category].some((t) => String(t || '').toLowerCase().includes(q));
    return matchCat && matchQuery;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // Ask form
  const formId = useId();
  const [askName, setAskName] = useState('');
  const [askCat, setAskCat] = useState(ASK_CATEGORIES[0]);
  const [askText, setAskText] = useState('');
  const [askError, setAskError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askText.trim() || askText.trim().length < 8) {
      setAskError('Mohon tuliskan pertanyaan Anda minimal 8 karakter');
      return;
    }
    setAskError('');
    setSent(false);
    setConfirming(true);
  };

  const send = async () => {
    if (sending || !onSubmitFaqQuestion) return;
    setSending(true);
    try {
      await onSubmitFaqQuestion({
        id: 'faq-user-' + (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
        category: askCat || 'Umum',
        question: askText.trim(),
        answer: 'Menunggu jawaban & penjelasan resmi dari Pengurus Culture Network Team.',
        askedBy: askName.trim() || 'Insan IT APD',
        createdAt: new Date().toISOString(),
        isPublished: false
      });
      setSent(true);
      setConfirming(false);
      setAskName('');
      setAskText('');
    } catch (err) {
      console.error(err);
      setConfirming(false);
      setAskError('Pertanyaan gagal dikirim ke server. Silakan periksa koneksi lalu coba lagi.');
    } finally {
      setSending(false);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-field-line bg-field px-4 py-3 text-[0.95rem] text-ink';

  return (
    <div className="flex flex-col gap-10 pb-20 pt-8">
      <Container className="flex flex-col gap-3">
        <SectionHeader as="h1" eyebrow="Pusat panduan" title="Pertanyaan umum" />
        <p className="m-0 max-w-[62ch] text-[1rem] leading-relaxed text-muted">
          Jawaban seputar kegiatan, operasional, pendaftaran, dan aspirasi Culture Network Team. Tidak menemukan jawabannya? Kirim pertanyaan di bagian bawah halaman ini.
        </p>
      </Container>

      <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section aria-label="Daftar pertanyaan" className="flex flex-col gap-4">
          <label className="relative block">
            <span className="sr-only">Cari pertanyaan</span>
            <Search size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Cari pertanyaan atau kata kunci…"
              className={cn(fieldClass, 'pl-11')}
            />
          </label>
          {categories.length > 2 && (
            <div role="group" aria-label="Kategori" className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => { setCategory(c); setPage(1); }}
                  className={cn(
                    'min-h-10 cursor-pointer rounded-full border px-4 text-[0.86rem] font-bold',
                    category === c ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-muted hover:text-ink'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {published.length === 0 ? (
            <EmptyState icon={<HelpCircle size={22} aria-hidden="true" />} title="Belum ada pertanyaan yang diterbitkan">
              Pertanyaan yang sudah dijawab pengurus akan tampil di sini.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Search size={22} aria-hidden="true" />} title="Tidak ada yang cocok">
              Coba kata kunci lain atau pilih kategori “Semua”.
            </EmptyState>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {shown.map((f) => {
                const open = openId === f.id;
                const panelId = `faq-panel-${f.id}`;
                return (
                  <li key={f.id} className="overflow-hidden rounded-[20px] border border-line bg-surface">
                    <h2 className="m-0">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenId(open ? null : f.id)}
                        className="flex w-full cursor-pointer items-start justify-between gap-4 border-0 bg-transparent px-5 py-4 text-left"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-dim">{f.category || 'Umum'}</span>
                          <span className="text-[1.02rem] font-bold text-ink">{f.question}</span>
                        </span>
                        <ChevronDown size={20} aria-hidden="true" className={cn('mt-5 shrink-0 text-dim transition-transform', open && 'rotate-180')} />
                      </button>
                    </h2>
                    {open && (
                      <div id={panelId} className="border-t border-line px-5 py-4 text-[0.95rem] leading-relaxed whitespace-pre-line text-muted">
                        {f.answer}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label="Halaman pertanyaan" className="flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === current ? 'page' : undefined}
                  onClick={() => setPage(n)}
                  className={cn('size-10 cursor-pointer rounded-xl border text-[0.9rem] font-bold', n === current ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink')}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </section>

        {onSubmitFaqQuestion && (
          <Card as="section" aria-labelledby={`${formId}-title`} className="flex flex-col gap-4 lg:sticky lg:top-24">
            <Eyebrow>Tidak menemukan jawaban?</Eyebrow>
            <h2 id={`${formId}-title`} className="m-0 text-[1.25rem] font-extrabold text-ink">Kirim pertanyaan</h2>
            <p className="m-0 text-[0.88rem] leading-relaxed text-muted">Pertanyaan ditinjau pengurus dan tampil di halaman ini setelah dijawab.</p>

            {sent && (
              <p role="status" className="m-0 flex items-start gap-2 rounded-xl bg-kolaboratif-tint p-3 text-[0.9rem] font-semibold text-kolaboratif-ink">
                <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                Terima kasih, pertanyaan Anda sudah terkirim.
              </p>
            )}

            {confirming ? (
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-subtle p-4">
                <p className="m-0 text-[0.86rem] font-bold text-ink">Periksa sebelum mengirim</p>
                <dl className="m-0 flex flex-col gap-2 text-[0.88rem]">
                  <div><dt className="text-dim">Nama</dt><dd className="m-0 text-ink">{askName.trim() || 'Insan IT APD'}</dd></div>
                  <div><dt className="text-dim">Kategori</dt><dd className="m-0 text-ink">{askCat}</dd></div>
                  <div><dt className="text-dim">Pertanyaan</dt><dd className="m-0 whitespace-pre-line text-ink">{askText.trim()}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" loading={sending} onClick={send}>Kirim pertanyaan</Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)} disabled={sending}>Ubah</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={review} noValidate className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                  Nama / unit kerja <span className="font-normal text-dim">(opsional)</span>
                  <input value={askName} onChange={(e) => setAskName(e.target.value)} maxLength={120} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                  Kategori
                  <select value={askCat} onChange={(e) => setAskCat(e.target.value)} className={fieldClass}>
                    {ASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                  Pertanyaan
                  <textarea
                    value={askText}
                    onChange={(e) => { setAskText(e.target.value); if (askError) setAskError(''); }}
                    rows={4}
                    maxLength={1000}
                    aria-invalid={askError ? true : undefined}
                    aria-describedby={askError ? `${formId}-err` : undefined}
                    className={fieldClass}
                  />
                </label>
                {askError && <p id={`${formId}-err`} role="alert" className="m-0 text-[0.86rem] font-semibold text-danger">{askError}</p>}
                <Button type="submit" variant="primary">Lanjut</Button>
              </form>
            )}
          </Card>
        )}
      </Container>
    </div>
  );
}
