import { useEffect, useRef, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, Download, Link2, Share2, X } from 'lucide-react';
import { formatWibDateTime } from '../../utils/dateUtils';
import { getDownloadPhotoUrl } from './useGallery';

type Gallery = Record<string, any>;

/** Horizontal swipe → previous/next (phones). */
export function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<number | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => { start.current = e.touches[0]?.clientX ?? null; },
    onTouchEnd: (e: TouchEvent) => {
      if (start.current === null) return;
      const dx = (e.changedTouches[0]?.clientX ?? start.current) - start.current;
      start.current = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) onNext(); else onPrev();
    }
  };
}

const darkButton =
  'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#3a4660] bg-[#1b2333] px-3.5 text-[0.86rem] font-bold text-white no-underline hover:bg-[#263048] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

/** Full-screen photo viewer. Escape and arrow keys are handled by useGallery. */
export default function Lightbox({ g }: { g: Record<string, any> }) {
  const { activeEvent, copiedGalleryId, currentPhotoUrl, eventPhotos, handleCopyGalleryLink, handleShareGalleryWa, isLightboxOpen, nextPhoto, prevPhoto, safePhotoIdx, setIsLightboxOpen } = g;
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const swipe = useSwipe(prevPhoto, nextPhoto);
  const open = Boolean(isLightboxOpen && activeEvent);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    // Keep Tab inside the viewer
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const gal: Gallery = activeEvent;
  const copied = copiedGalleryId === gal.id;
  const multiple = eventPhotos.length > 1;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${safePhotoIdx + 1} dari ${eventPhotos.length}: ${gal.title}`}
      className="fixed inset-0 z-[1000] flex flex-col bg-[#060a12] text-white"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLightboxOpen(false); }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="m-0 truncate text-[1rem] font-extrabold">{gal.title}</p>
          <p className="m-0 text-[0.82rem] text-[#b6c0d4]" aria-live="polite">
            Foto {safePhotoIdx + 1} dari {eventPhotos.length}{gal.date ? ` · ${formatWibDateTime(gal.date)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={darkButton} onClick={(e) => handleCopyGalleryLink(gal, e)}>
            {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            {copied ? 'Tersalin' : 'Salin tautan'}
          </button>
          <button type="button" className={darkButton} onClick={(e) => handleShareGalleryWa(gal, e)}>
            <Share2 size={15} aria-hidden="true" /> WhatsApp
          </button>
          <a className={darkButton} href={getDownloadPhotoUrl(currentPhotoUrl)} target="_blank" rel="noopener noreferrer"
            download={`${(gal.title || 'dokumentasi').replace(/\s+/g, '_')}_${safePhotoIdx + 1}.jpg`}>
            <Download size={15} aria-hidden="true" /> Unduh foto
          </a>
          <button ref={closeRef} type="button" className={`${darkButton} px-2.5`} onClick={() => setIsLightboxOpen(false)} aria-label="Tutup layar penuh">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16" {...swipe}
        onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLightboxOpen(false); }}>
        <img src={currentPhotoUrl} alt={`${gal.title}, foto ${safePhotoIdx + 1}`} className="max-h-full max-w-full rounded-xl object-contain" />
        {multiple && (
          <>
            <button type="button" onClick={prevPhoto} aria-label="Foto sebelumnya"
              className={`${darkButton} absolute left-2 top-1/2 -translate-y-1/2 rounded-full px-2.5 sm:left-4`}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={nextPhoto} aria-label="Foto berikutnya"
              className={`${darkButton} absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2.5 sm:right-4`}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
