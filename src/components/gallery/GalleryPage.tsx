import {
  AlertCircle, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, Download, ExternalLink, FolderDown, Images, Link2, Maximize2, Search, Share2
} from 'lucide-react';
import { formatWibDateTime } from '../../utils/dateUtils';
import { Button, ButtonLink, Card, Chip, Container, EmptyState, SectionHeader, Segmented, cn } from '../../ui';
import { GALLERIES_PER_PAGE, getDownloadPhotoUrl, useGallery } from './useGallery';
import Lightbox, { useSwipe } from './Lightbox';

type G = Record<string, any>;
const overlayButton =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#ffffff40] bg-[#0b1220cc] text-white hover:bg-[#0b1220] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const selectClass = 'min-h-11 w-full cursor-pointer rounded-xl border border-field-line bg-field px-3.5 text-[0.92rem] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy';

function PhotoViewer({ g }: { g: G }) {
  const {
    activeEvent: gal, connectedEventOf, copiedGalleryId, currentPhotoUrl, eventPhotos, handleCopyGalleryLink, handleShareGalleryWa,
    nextPhoto, openEvent, prevPhoto, safePhotoIdx, setCurrentPhotoIdx, setIsLightboxOpen
  } = g;
  const swipe = useSwipe(prevPhoto, nextPhoto);
  const connected = connectedEventOf(gal);
  const copied = copiedGalleryId === gal.id;
  const multiple = eventPhotos.length > 1;

  return (
    <Card as="section" id="gallery-viewer" padding="none" className="grid scroll-mt-24 overflow-hidden lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]" aria-labelledby="gallery-title">
      <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0a101c]" {...swipe}>
          <button type="button" onClick={() => setIsLightboxOpen(true)} className="block size-full cursor-zoom-in border-0 bg-transparent p-0" aria-label="Perbesar foto ke layar penuh">
            <img src={currentPhotoUrl} alt={`${gal.title}, foto ${safePhotoIdx + 1}`} className="absolute inset-0 size-full object-cover" />
          </button>
          <button type="button" onClick={() => setIsLightboxOpen(true)} className={cn(overlayButton, 'absolute right-3 top-3 min-h-9 px-3 text-[0.8rem] font-bold')}>
            <Maximize2 size={14} aria-hidden="true" /> Layar penuh
          </button>
          {multiple && (
            <>
              <button type="button" onClick={prevPhoto} aria-label="Foto sebelumnya" className={cn(overlayButton, 'absolute left-3 top-1/2 size-11 -translate-y-1/2')}>
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button type="button" onClick={nextPhoto} aria-label="Foto berikutnya" className={cn(overlayButton, 'absolute right-3 top-1/2 size-11 -translate-y-1/2')}>
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-[#0b1220cc] px-3 py-1 text-[0.8rem] font-bold text-white" aria-live="polite">
            {eventPhotos.length > 0 ? `${safePhotoIdx + 1} / ${eventPhotos.length} foto` : 'Belum ada foto'}
          </span>
        </div>
        {multiple && (
          <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1" aria-label="Pilih foto">
            {eventPhotos.map((photo: string, i: number) => (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentPhotoIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  aria-current={i === safePhotoIdx ? 'true' : undefined}
                  className={cn(
                    'block h-14 w-20 cursor-pointer overflow-hidden rounded-lg border-2 bg-subtle p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
                    i === safePhotoIdx ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4 border-t border-line p-5 sm:p-6 lg:border-l lg:border-t-0">
        <div className="flex flex-wrap gap-2">
          <Chip tone="gold"><CalendarDays size={13} aria-hidden="true" />{formatWibDateTime(gal.date) || 'Tanpa tanggal'}</Chip>
          <Chip tone="navy">{gal.divisionName || gal.division || 'Culture Network Team'}</Chip>
        </div>
        <h2 id="gallery-title" className="m-0 text-[clamp(1.35rem,2.6vw,1.75rem)] font-extrabold leading-tight text-ink">{gal.title}</h2>
        {gal.description && <p className="m-0 whitespace-pre-line text-[0.95rem] leading-relaxed text-muted">{gal.description}</p>}
        {connected && (
          <button type="button" onClick={() => openEvent(connected.id)}
            className="inline-flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-xl border border-line bg-subtle px-3.5 py-2 text-left text-[0.88rem] font-bold text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            <CalendarDays size={15} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">Acara: {connected.title}</span>
            <ExternalLink size={13} className="shrink-0 text-muted" aria-hidden="true" />
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => handleCopyGalleryLink(gal, e)}
            icon={copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}>
            {copied ? 'Tautan tersalin' : 'Salin tautan'}
          </Button>
          <Button size="sm" variant="secondary" onClick={(e) => handleShareGalleryWa(gal, e)} icon={<Share2 size={14} aria-hidden="true" />}>WhatsApp</Button>
          {eventPhotos.length > 0 && (
            <ButtonLink size="sm" variant="secondary" href={getDownloadPhotoUrl(currentPhotoUrl)} target="_blank" rel="noopener noreferrer"
              download={`${(gal.title || 'dokumentasi').replace(/\s+/g, '_')}_${safePhotoIdx + 1}.jpg`} icon={<Download size={14} aria-hidden="true" />}>
              Unduh foto
            </ButtonLink>
          )}
        </div>
        {Array.isArray(gal.docLinks) && gal.docLinks.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted">Dokumentasi lengkap</p>
            {gal.docLinks.map((doc: G, i: number) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-[0.9rem] font-bold text-ink no-underline hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                <FolderDown size={16} className="shrink-0 text-gold-ink" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words">{doc.text || doc.url}</span>
                <ExternalLink size={14} className="shrink-0 text-muted" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function DivisionOptions({ g }: { g: G }) {
  const { divisions, scopedDivisions, tenureFilter, tenures, uniqueDivisions } = g;
  if (tenureFilter === 'active') {
    return scopedDivisions.length > 0
      ? scopedDivisions.map((d: G) => <option key={d.id} value={d.id}>{d.name}</option>)
      : uniqueDivisions.map((name: string) => <option key={name} value={name}>{name}</option>);
  }
  // All periods: group divisions by tenure
  const rendered = new Set<string>();
  const groups = (tenures || []).map((t: G) => {
    const inTenure = divisions.filter((d: G) => d.tenureId === t.id);
    inTenure.forEach((d: G) => rendered.add(d.id));
    if (inTenure.length === 0) return null;
    return (
      <optgroup key={t.id} label={`Periode ${t.code}${t.title ? ` (${t.title})` : ''}`}>
        {inTenure.map((d: G) => <option key={d.id} value={d.id}>{d.name} ({t.code})</option>)}
      </optgroup>
    );
  });
  const remaining = divisions.filter((d: G) => !rendered.has(d.id));
  return (
    <>
      {groups}
      {remaining.length > 0 && <optgroup label="Divisi lainnya">{remaining.map((d: G) => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>}
    </>
  );
}

function AlbumCard({ item, g, selected, onSelect }: { item: G; g: G; selected: boolean; onSelect: () => void }) {
  const { connectedEventOf, copiedGalleryId, handleCopyGalleryLink, handleShareGalleryWa, openEvent } = g;
  const cover = Array.isArray(item.photos) ? item.photos[0] : null;
  const connected = connectedEventOf(item);
  const copied = copiedGalleryId === item.id;
  const iconBtn = 'relative z-10 grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy';

  return (
    <article className={cn(
      'relative flex flex-col overflow-hidden rounded-[20px] border bg-surface transition-[transform,border-color] duration-200 hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy',
      selected ? 'border-gold shadow-[inset_0_0_0_1px_var(--gold-fill)]' : 'border-line hover:border-line-strong'
    )}>
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-subtle">
        {cover ? <img src={cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : (
          <div className="grid size-full place-items-center text-dim"><Camera size={28} aria-hidden="true" /></div>
        )}
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#0b1220cc] px-2.5 py-1 text-[0.76rem] font-bold text-white">
          <Images size={13} aria-hidden="true" />{item.photos?.length || 0} foto
        </span>
        {selected && <span className="absolute right-2.5 top-2.5 rounded-full bg-gold px-2.5 py-1 text-[0.74rem] font-bold text-gold-on">Sedang dilihat</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="m-0 text-[0.8rem] font-bold text-gold-ink">{formatWibDateTime(item.date) || 'Tanpa tanggal'}</p>
        <h3 className="m-0 text-[1.02rem] font-extrabold leading-snug text-ink">
          <button type="button" onClick={onSelect} aria-pressed={selected}
            className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] text-ink outline-none after:absolute after:inset-0 after:content-['']">
            {item.title}
          </button>
        </h3>
        {item.description && <p className="m-0 line-clamp-2 text-[0.86rem] leading-relaxed text-muted">{item.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {(item.divisionName || item.division) && <Chip tone="neutral">{item.divisionName || item.division}</Chip>}
          {connected && (
            <button type="button" onClick={(e) => { e.stopPropagation(); openEvent(connected.id); }} title={`Lihat acara: ${connected.title}`}
              className="relative z-10 inline-flex max-w-[12rem] cursor-pointer items-center gap-1 rounded-full border-0 bg-pill px-3 py-1.5 text-[0.78rem] font-bold text-pill-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
              <CalendarDays size={12} className="shrink-0" aria-hidden="true" /><span className="truncate">{connected.title}</span>
            </button>
          )}
          <span className="ml-auto flex gap-1.5">
            <button type="button" className={iconBtn} onClick={(e) => handleCopyGalleryLink(item, e)} aria-label={copied ? 'Tautan tersalin' : `Salin tautan album ${item.title}`}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            </button>
            <button type="button" className={iconBtn} onClick={(e) => handleShareGalleryWa(item, e)} aria-label={`Bagikan album ${item.title} ke WhatsApp`}>
              <Share2 size={15} aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

function Pagination({ g }: { g: G }) {
  const { filteredGalleries, safeGalleryPage: page, setGalleryPage, totalGalleryPages: total } = g;
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav aria-label="Halaman album" className="flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-[0.86rem] text-muted">
        {(page - 1) * GALLERIES_PER_PAGE + 1}–{Math.min(page * GALLERIES_PER_PAGE, filteredGalleries.length)} dari {filteredGalleries.length} album
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setGalleryPage((p: number) => Math.max(1, p - 1))} icon={<ChevronLeft size={14} aria-hidden="true" />} aria-label="Halaman sebelumnya" />
        {pages.map((pg) => {
          if (total > 7 && Math.abs(pg - page) > 2 && pg !== 1 && pg !== total) {
            return pg === 2 || pg === total - 1 ? <span key={pg} className="px-1 text-muted" aria-hidden="true">…</span> : null;
          }
          return (
            <Button key={pg} size="sm" variant={pg === page ? 'primary' : 'secondary'} aria-current={pg === page ? 'page' : undefined} onClick={() => setGalleryPage(pg)} className="min-w-9 px-2">{pg}</Button>
          );
        })}
        <Button size="sm" variant="secondary" disabled={page === total} onClick={() => setGalleryPage((p: number) => Math.min(total, p + 1))} icon={<ChevronRight size={14} aria-hidden="true" />} aria-label="Halaman berikutnya" />
      </div>
    </nav>
  );
}

export default function GalleryPage(props: Record<string, any>) {
  const g = useGallery(props as any) as G;
  const {
    activeEvent, activeTenure, changeDivFilter, changeSearch, changeTenureFilter, closeNotFound, divFilter, filteredGalleries, galleries,
    galleryNotFound, handleSelectGallery, paginatedGalleries, resetFilters, scopedDivisions, scopedGalleries, searchQuery, tenureFilter, uniqueDivisions
  } = g;
  const hasFilters = divFilter !== 'all' || searchQuery.trim() !== '';
  const selectFromList = (id: string) => {
    handleSelectGallery(id);
    // The viewer sits above the list; bring it into view so the change is visible (phones especially)
    requestAnimationFrame(() => document.getElementById('gallery-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="flex flex-col gap-8 pb-20 pt-8">
      <Container className="flex flex-col gap-3">
        <SectionHeader as="h1" eyebrow="Dokumentasi kegiatan" title="Galeri Culture Network Team" />
        <p className="m-0 max-w-[64ch] text-[1rem] leading-relaxed text-muted">
          Momen kebersamaan, kolaborasi, dan keceriaan insan Group IT Application Delivery di setiap program budaya.
        </p>
      </Container>

      {galleryNotFound && (
        <Container>
          <EmptyState icon={<AlertCircle size={22} aria-hidden="true" />} title="Album tidak ditemukan"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={() => closeNotFound(true)}>Kembali ke Beranda</Button>
                <Button variant="secondary" onClick={() => closeNotFound(false)}>Lihat semua album</Button>
              </div>
            }>
            Tautan album yang Anda buka tidak ditemukan atau sudah dihapus pengurus.
          </EmptyState>
        </Container>
      )}

      <Container>
        {activeEvent && filteredGalleries.length > 0 ? <PhotoViewer g={g} /> : (
          <EmptyState icon={<Camera size={22} aria-hidden="true" />} title="Belum ada dokumentasi"
            action={scopedGalleries.length > 0 && hasFilters ? <Button variant="secondary" onClick={resetFilters}>Hapus filter</Button> : undefined}>
            {scopedGalleries.length === 0
              ? `Belum ada foto kegiatan untuk periode ${activeTenure?.title || activeTenure?.code || 'ini'}.`
              : 'Tidak ada album yang cocok dengan filter atau kata kunci.'}
          </EmptyState>
        )}
      </Container>

      <Container className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-[1.35rem] font-extrabold text-ink">Semua album ({filteredGalleries.length})</h2>
        </div>
        <Card padding="sm" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {activeTenure && (
            <Segmented label="Periode album" options={[
              { key: 'active', label: `Periode ${activeTenure?.code || activeTenure?.title || ''}`, active: tenureFilter === 'active', onClick: () => changeTenureFilter('active') },
              { key: 'all', label: `Semua (${galleries.length})`, active: tenureFilter === 'all', onClick: () => changeTenureFilter('all') }
            ]} />
          )}
          <div className="relative flex-1">
            <label htmlFor="gallery-search" className="sr-only">Cari album</label>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" aria-hidden="true" />
            <input id="gallery-search" type="search" placeholder="Cari judul atau deskripsi" value={searchQuery} onChange={(e) => changeSearch(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-field-line bg-field pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-dim focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy" />
          </div>
          <div className="lg:w-60">
            <label htmlFor="gallery-division" className="sr-only">Divisi</label>
            <select id="gallery-division" value={divFilter} onChange={(e) => changeDivFilter(e.target.value)} className={selectClass}>
              <option value="all">Semua divisi{scopedDivisions.length > 0 ? ` (${scopedDivisions.length})` : uniqueDivisions.length > 0 ? ` (${uniqueDivisions.length})` : ''}</option>
              <DivisionOptions g={g} />
            </select>
          </div>
        </Card>

        {filteredGalleries.length === 0 ? (
          <p className="m-0 rounded-2xl border border-dashed border-line px-5 py-6 text-center text-[0.92rem] text-muted">Tidak ada album yang cocok dengan filter.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedGalleries.map((item: G) => (
              <AlbumCard key={item.id} item={item} g={g} selected={activeEvent?.id === item.id} onSelect={() => selectFromList(item.id)} />
            ))}
          </div>
        )}
        <Pagination g={g} />
      </Container>

      <Lightbox g={g} />
    </div>
  );
}
