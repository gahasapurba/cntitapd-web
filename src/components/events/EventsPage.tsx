import {
  AlertCircle, BarChart3, CalendarDays, CalendarX, Camera, CheckCircle2, ChevronLeft, ChevronRight, Download,
  ExternalLink, EyeOff, LayoutGrid, Link2, Lock, MapPin, Send, Share2, Users
} from 'lucide-react';
import { useProgram } from './useProgram';
import EventCalendarView from '../EventCalendarView';
import { formatWibEventRange, isEventPassed, formatDeadlineWib, getDeadlineStatus } from '../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../utils/quotaUtils';
import { Button, Card, Chip, Container, Dialog, EmptyState, SectionHeader, Segmented, cn } from '../../ui';

type AppItem = Record<string, any>;
const EVENTS_PER_PAGE = 8;
const ACCENTS = ['border-t-amanah', 'border-t-loyal', 'border-t-adaptif', 'border-t-harmonis', 'border-t-kompeten', 'border-t-kolaboratif'];

function connectedFormOf(forms: AppItem[], evt: AppItem): AppItem | undefined {
  return (forms || []).find((f) => {
    const isConn = f.isEventConnected || f.fields?.[0]?._isEventConnected;
    const evtId = f.eventId || f.fields?.[0]?._eventId;
    return Boolean(isConn) && String(evtId) === String(evt.id);
  });
}

// Calendar export (unchanged behaviour from the previous page)
function calendarDates(evt: AppItem) {
  const defaultIso = new Date().toISOString().slice(0, 10);
  const sRaw = (evt.startDate || defaultIso).replace(/-/g, '');
  const eDateObj = new Date(evt.endDate || evt.startDate || defaultIso);
  eDateObj.setDate(eDateObj.getDate() + 1);
  const eRaw = eDateObj.toISOString().split('T')[0].replace(/-/g, '');
  return { sRaw, eRaw };
}

function downloadIcs(evt: AppItem) {
  const { sRaw, eRaw } = calendarDates(evt);
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CNT IT APD Bank Mandiri//ID',
    'BEGIN:VEVENT',
    `UID:${evt.id}@cntitapd.netlify.app`,
    `DTSTAMP:${sRaw}T010000Z`,
    `DTSTART;VALUE=DATE:${sRaw}`,
    `DTEND;VALUE=DATE:${eRaw}`,
    `SUMMARY:${evt.title} - CNT IT APD`,
    `DESCRIPTION:${(evt.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${evt.location || 'Plaza Mandiri'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${String(evt.title).replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function googleCalendarUrl(evt: AppItem) {
  const { sRaw, eRaw } = calendarDates(evt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${evt.title} (CNT IT APD)`,
    dates: `${sRaw}/${eRaw}`,
    details: evt.description || '',
    location: evt.location || 'Plaza Mandiri'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const fieldClass = 'w-full min-h-11 rounded-xl border border-field-line bg-field px-4 text-[0.95rem] text-ink';

export default function EventsPage(props: AppItem) {
  const p = useProgram(props as any) as AppItem;
  const {
    activeTab, activeTenure, confirmRsvpOpen, copiedEventId, departments, divisions, eventDraftHidden, eventNotFound,
    eventPage, filteredEvents, filterDiv, forms, galleries, handleCloseEventModal, handleCopyEventLink, handleFinalSubmitRsvp,
    handleOpenConfirmRsvp, handleOpenEventModal, handleShareEventWa, isSubmittingRsvp, modalAttendees, navigateTo,
    onNavigateEventStats, onNavigateForm, onNavigateGallery, onNavigateOprec, onSelectEventUrl, publicEvents, registrationCounts,
    rsvpDepartmentId, rsvpErrors, rsvpModalEvent, rsvpMode, rsvpName, rsvpNotes, rsvpSuccess, scopedDivisions, scopedEvents,
    setActiveTab, setCalendarEventPage, setConfirmRsvpOpen, setEventDraftHidden, setEventNotFound, setEventPage, setFilterDiv,
    setRsvpDepartmentId, setRsvpErrors, setRsvpMode, setRsvpName, setRsvpNotes, setTenureFilter, setViewMode, tenureFilter,
    tenures, theme, viewMode, calendarEvents
  } = p;

  const openGallery = (galleryId: string) => {
    if (onNavigateGallery) onNavigateGallery(galleryId);
    else navigateTo(`/?gallery=${encodeURIComponent(galleryId)}#galeri`);
  };
  const divisionIndex = (divisionId: string) => {
    const d = divisions.find((x: AppItem) => x.id === divisionId);
    const sameTenure = divisions.filter((x: AppItem) => x.tenureId === d?.tenureId);
    return Math.max(0, sameTenure.findIndex((x: AppItem) => x.id === divisionId));
  };

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, eventPage), totalPages);
  const paginated = filteredEvents.slice((safePage - 1) * EVENTS_PER_PAGE, safePage * EVENTS_PER_PAGE);

  return (
    <div className="flex flex-col gap-8 pb-20 pt-8">
      <Container className="flex flex-col gap-3">
        <SectionHeader as="h1" eyebrow="Kalender & acara" title="Acara Culture Network Team" />
        <p className="m-0 max-w-[64ch] text-[1rem] leading-relaxed text-muted">
          Rangkaian kegiatan untuk keakraban tim, kesehatan fisik dan mental, serta wadah ekspresi bakat seluruh insan IT APD.
        </p>
      </Container>

      {eventDraftHidden && (
        <Container>
          <EmptyState icon={<EyeOff size={22} aria-hidden="true" />} title="Kegiatan ini belum dipublikasikan"
            action={<Button variant="primary" onClick={() => { setEventDraftHidden(false); if (onSelectEventUrl) onSelectEventUrl(null); navigateTo('/#event'); }}>Lihat acara lainnya</Button>}>
            Agenda yang Anda tuju masih disiapkan pengurus dan belum dibuka untuk publik. Silakan kembali lagi nanti.
          </EmptyState>
        </Container>
      )}
      {eventNotFound && (
        <Container>
          <EmptyState icon={<AlertCircle size={22} aria-hidden="true" />} title="Acara tidak ditemukan"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => { setEventNotFound(false); if (onSelectEventUrl) onSelectEventUrl(null); navigateTo('/#home'); }}>Kembali ke Beranda</Button>
                <Button variant="primary" onClick={() => { setEventNotFound(false); if (onSelectEventUrl) onSelectEventUrl(null); }}>Lihat semua acara</Button>
              </div>
            }>
            Tautan acara yang Anda tuju tidak ditemukan atau sudah dihapus pengelola.
          </EmptyState>
        </Container>
      )}

      {/* Filters */}
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface p-3">
          <div className="flex flex-wrap gap-2">
            <Segmented label="Tampilan" options={[
              { key: 'grid', label: <><LayoutGrid size={15} aria-hidden="true" />Daftar</>, active: viewMode === 'grid', onClick: () => { setViewMode('grid'); setEventPage(1); } },
              { key: 'calendar', label: <><CalendarDays size={15} aria-hidden="true" />Kalender</>, active: viewMode === 'calendar', onClick: () => { setViewMode('calendar'); setCalendarEventPage(1); } }
            ]} />
            <Segmented label="Status acara" options={[
              { key: 'upcoming', label: 'Mendatang & berjalan', active: activeTab === 'upcoming', onClick: () => { setActiveTab('upcoming'); setEventPage(1); } },
              { key: 'all', label: `Semua (${scopedEvents.length})`, active: activeTab === 'all', onClick: () => { setActiveTab('all'); setEventPage(1); } }
            ]} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTenure && (
              <Segmented label="Periode" options={[
                { key: 'active', label: `Periode ${activeTenure?.code || activeTenure?.title || ''}`, active: tenureFilter === 'active', onClick: () => { setTenureFilter('active'); setEventPage(1); } },
                { key: 'all', label: `Lintas tahun (${publicEvents.length})`, active: tenureFilter === 'all', onClick: () => { setTenureFilter('all'); setEventPage(1); } }
              ]} />
            )}
            <label className="flex items-center gap-2">
              <span className="sr-only">Divisi</span>
              <select value={filterDiv} onChange={(e) => { setFilterDiv(e.target.value); setEventPage(1); }} className={cn(fieldClass, 'w-auto min-w-[200px]')}>
                <option value="all">Semua divisi{scopedDivisions.length > 0 ? ` (${scopedDivisions.length})` : ''}</option>
                {tenureFilter === 'active'
                  ? scopedDivisions.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name}</option>)
                  : (() => {
                      const rendered = new Set<string>();
                      const groups = (tenures || []).map((t: AppItem) => {
                        const inTenure = divisions.filter((d: AppItem) => d.tenureId === t.id);
                        inTenure.forEach((d: AppItem) => rendered.add(d.id));
                        if (inTenure.length === 0) return null;
                        return (
                          <optgroup key={t.id} label={`Periode ${t.code} (${t.title || 'Kepengurusan'})`}>
                            {inTenure.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name} ({t.code})</option>)}
                          </optgroup>
                        );
                      }).filter(Boolean);
                      const remaining = divisions.filter((d: AppItem) => !rendered.has(d.id));
                      return (
                        <>
                          {groups}
                          {remaining.length > 0 && (
                            <optgroup label="Divisi lainnya">{remaining.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
                          )}
                        </>
                      );
                    })()}
              </select>
            </label>
          </div>
        </div>
      </Container>

      {/* List */}
      {viewMode === 'grid' && (
        <Container className="flex flex-col gap-5">
          {filteredEvents.length === 0 ? (
            <EmptyState icon={<CalendarDays size={22} aria-hidden="true" />} title="Belum ada acara di daftar ini"
              action={scopedEvents.length > 0 && (filterDiv !== 'all' || activeTab !== 'all')
                ? <Button variant="secondary" onClick={() => { setFilterDiv('all'); setActiveTab('all'); setEventPage(1); }}>Tampilkan semua acara</Button>
                : undefined}>
              {scopedEvents.length === 0
                ? `Belum ada acara yang dipublikasikan untuk periode ini (${activeTenure?.title || activeTenure?.code || 'periode aktif'}).`
                : (filterDiv !== 'all' || activeTab !== 'all'
                  ? 'Tidak ada acara yang cocok dengan filter saat ini.'
                  : 'Belum ada acara yang dipublikasikan. Pantau informasi terbaru dari pengurus.')}
            </EmptyState>
          ) : (
            <>
              <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2">
                {paginated.map((evt: AppItem) => {
                  const divInfo = divisions.find((d: AppItem) => d.id === evt.divisionId);
                  const isCompleted = evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate);
                  const form = connectedFormOf(forms, evt);
                  const isLucky = form && (form.isLuckyDraw === true || form.fields?.[0]?._isLuckyDraw === true);
                  const att = getUnifiedEventAttendees(evt as any, forms, registrationCounts);
                  const gallery = (galleries || []).find((g: AppItem) => String(g.eventId) === String(evt.id));
                  return (
                    <li key={evt.id}>
                      <Card as="article" className={cn('flex h-full flex-col gap-4 border-t-[5px]', ACCENTS[divisionIndex(evt.divisionId) % ACCENTS.length])}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip tone="navy">{formatWibEventRange(evt.startDate, evt.endDate, evt.date)}</Chip>
                          {(evt.category || evt.badge) && <Chip>{evt.category || evt.badge}</Chip>}
                          {form && <Chip tone="gold">{isLucky ? 'Formulir & undian' : 'Formulir terhubung'}</Chip>}
                          {isCompleted && <Chip>Selesai</Chip>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="m-0 text-[0.8rem] font-bold uppercase tracking-[0.06em] text-dim">{evt.divisionName || divInfo?.name || 'Culture Network Team'}</p>
                          <h2 className="m-0 text-[1.25rem] font-extrabold leading-snug text-ink">{evt.title}</h2>
                          {evt.description && <p className="m-0 line-clamp-3 text-[0.94rem] leading-relaxed text-muted">{evt.description}</p>}
                        </div>
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[0.9rem] text-muted">
                          {evt.location && <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />{evt.location}</li>}
                          {(evt.peserta || evt.kpi) && <li className="flex items-start gap-2"><Users size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />Peserta: {evt.peserta || evt.kpi}</li>}
                          {att.isLimited && att.maxQuota > 0 ? (
                            <li className={cn('flex items-start gap-2 font-semibold', att.isFull ? 'text-danger' : 'text-gold-ink')}>
                              <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Kuota {att.count}/{att.maxQuota} · {att.isFull ? 'penuh' : `sisa ${Math.max(0, att.maxQuota - att.count)}`}
                            </li>
                          ) : att.count > 0 ? (
                            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />{att.count} insan IT APD terdaftar</li>
                          ) : null}
                        </ul>
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                          <Button variant="primary" onClick={() => handleOpenEventModal(evt)} iconRight={<ChevronRight size={16} aria-hidden="true" />}>
                            {isCompleted ? 'Info & daftar hadir' : 'Detail & RSVP'}
                          </Button>
                          {gallery && (
                            <Button variant="secondary" onClick={() => openGallery(gallery.id)} icon={<Camera size={16} aria-hidden="true" />} aria-label={`Galeri foto: ${gallery.title}`} />
                          )}
                          <Button variant="secondary" onClick={() => handleCopyEventLink(evt)} aria-label="Salin tautan acara"
                            icon={copiedEventId === evt.id ? <CheckCircle2 size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />} />
                          {copiedEventId === evt.id && <span role="status" className="text-[0.82rem] font-semibold text-success">Tautan tersalin</span>}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
              {totalPages > 1 && (
                <nav aria-label="Halaman acara" className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-[0.88rem] text-muted">
                    Menampilkan <strong className="text-ink">{(safePage - 1) * EVENTS_PER_PAGE + 1}–{Math.min(safePage * EVENTS_PER_PAGE, filteredEvents.length)}</strong> dari <strong className="text-ink">{filteredEvents.length}</strong> acara
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" disabled={safePage === 1} onClick={() => setEventPage((x: number) => Math.max(1, x - 1))} icon={<ChevronLeft size={14} aria-hidden="true" />}>Sebelumnya</Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <Button key={pg} size="sm" variant={pg === safePage ? 'primary' : 'secondary'} aria-current={pg === safePage ? 'page' : undefined} onClick={() => setEventPage(pg)}>{pg}</Button>
                    ))}
                    <Button variant="secondary" size="sm" disabled={safePage === totalPages} onClick={() => setEventPage((x: number) => Math.min(totalPages, x + 1))} iconRight={<ChevronRight size={14} aria-hidden="true" />}>Berikutnya</Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </Container>
      )}

      {viewMode === 'calendar' && (
        <Container>
          <EventCalendarView
            events={calendarEvents}
            divisions={divisions}
            forms={forms}
            registrationCounts={registrationCounts}
            theme={theme}
            activeTenure={activeTenure}
            onSelectEvent={(evt: AppItem, sameDay?: AppItem[]) => handleOpenEventModal(evt, sameDay)}
            isAdmin={false}
          />
        </Container>
      )}

      {/* Event detail + RSVP */}
      <Dialog
        open={Boolean(rsvpModalEvent)}
        onClose={handleCloseEventModal}
        size="lg"
        eyebrow={rsvpModalEvent ? formatWibEventRange(rsvpModalEvent.startDate, rsvpModalEvent.endDate, rsvpModalEvent.date) : ''}
        title={rsvpModalEvent?.title || ''}
        footer={
          <>
            {onNavigateOprec && <Button variant="secondary" onClick={() => { handleCloseEventModal(); onNavigateOprec(); }}>Semua formulir</Button>}
            <Button variant="primary" onClick={handleCloseEventModal}>Tutup</Button>
          </>
        }
      >
        {rsvpModalEvent && (() => {
          const evt = rsvpModalEvent;
          const rsvpCount = Number(registrationCounts?.events?.[evt.id] || 0);
          const att = getUnifiedEventAttendees(evt as any, forms, registrationCounts);
          const form = connectedFormOf(forms, evt);
          const gallery = (galleries || []).find((g: AppItem) => String(g.eventId) === String(evt.id));
          return (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleShareEventWa(evt)} icon={<Share2 size={14} aria-hidden="true" />}>Bagikan ke WhatsApp</Button>
                <Button size="sm" variant="secondary" onClick={() => handleCopyEventLink(evt)} icon={<Link2 size={14} aria-hidden="true" />}>
                  {copiedEventId === evt.id ? 'Tautan tersalin' : 'Salin tautan'}
                </Button>
              </div>

              {evt.description && <p className="m-0 whitespace-pre-line text-[0.96rem] leading-relaxed text-muted">{evt.description}</p>}

              <dl className="m-0 grid gap-3 rounded-2xl bg-subtle p-4 text-[0.9rem] sm:grid-cols-2">
                {evt.location && <div><dt className="text-dim">Lokasi</dt><dd className="m-0 font-semibold text-ink">{evt.location}</dd></div>}
                {(evt.peserta || evt.kpi) && <div><dt className="text-dim">Peserta</dt><dd className="m-0 font-semibold text-ink">{evt.peserta || evt.kpi}</dd></div>}
                {(evt.kategori || evt.category || evt.badge) && <div><dt className="text-dim">Kategori</dt><dd className="m-0 font-semibold text-ink">{evt.kategori || evt.category || evt.badge}</dd></div>}
                <div><dt className="text-dim">Penyelenggara</dt><dd className="m-0 font-semibold text-ink">{evt.divisionName || 'Culture Network Team'}</dd></div>
                {att.isLimited && att.maxQuota > 0 && (
                  <div><dt className="text-dim">Kuota</dt><dd className={cn('m-0 font-semibold', att.isFull ? 'text-danger' : 'text-ink')}>{att.count}/{att.maxQuota} terisi · {att.isFull ? 'penuh' : `sisa ${att.remaining}`}</dd></div>
                )}
              </dl>

              {form ? (() => {
                const isFormClosed = form.isOpen === false || Boolean(form.isClosed) || (form.deadline ? getDeadlineStatus(form.deadline).isExpired : false);
                return (
                  <section aria-label="Pendaftaran lewat formulir" className="flex flex-col gap-3 rounded-2xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-[0.98rem] font-extrabold text-ink">Pendaftaran lewat formulir resmi</p>
                      <Chip tone="gold">Formulir terhubung</Chip>
                    </div>
                    <div>
                      <p className="m-0 font-bold text-ink">{form.title}</p>
                      {form.subtitle && <p className="m-0 text-[0.88rem] text-muted">{form.subtitle}</p>}
                      <p className="m-0 mt-1 flex flex-wrap gap-x-4 text-[0.85rem] text-muted">
                        {form.deadline && <span>Tenggat: {formatDeadlineWib(form.deadline)}</span>}
                        {att.isLimited && att.maxQuota > 0 && <span>Kuota: {att.count}/{att.maxQuota}{att.isFull ? ' (penuh)' : ` (sisa ${att.remaining})`}</span>}
                      </p>
                    </div>
                    {isFormClosed ? (
                      <p className="m-0 flex items-start gap-2 rounded-xl bg-loyal-tint p-3 text-[0.88rem] font-semibold text-loyal-ink"><Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Formulir sudah ditutup dan tidak menerima respons baru.</p>
                    ) : att.isFull ? (
                      <p className="m-0 flex items-start gap-2 rounded-xl bg-loyal-tint p-3 text-[0.88rem] font-semibold text-loyal-ink"><Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Kuota penuh ({att.count}/{att.maxQuota} peserta).</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="gold" disabled={isFormClosed} icon={isFormClosed || att.isFull ? <Lock size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
                        onClick={() => {
                          if (isFormClosed) return;
                          handleCloseEventModal();
                          if (onNavigateForm) onNavigateForm(form.id);
                          else navigateTo(`/?form=${encodeURIComponent(form.id)}#form`);
                        }}>
                        {isFormClosed ? 'Formulir ditutup' : (att.isFull ? 'Buka formulir (kuota penuh)' : 'Buka formulir pendaftaran')}
                      </Button>
                      <Button variant="secondary" icon={<BarChart3 size={16} aria-hidden="true" />}
                        onClick={() => {
                          handleCloseEventModal();
                          if (onNavigateEventStats) onNavigateEventStats(evt.id);
                          else navigateTo(`/?stats=${encodeURIComponent(evt.id)}#event-stats`);
                        }}>
                        {form.isLuckyDraw === true ? 'Statistik & undian' : 'Statistik pendaftaran'}
                      </Button>
                    </div>
                    <p className="m-0 text-[0.84rem] text-muted">Total terdaftar lewat formulir: <strong className="text-ink">{att.count} peserta</strong>.</p>
                  </section>
                );
              })() : (
                <section aria-label="Konfirmasi kehadiran" className="flex flex-col gap-3 rounded-2xl border border-line p-4">
                  {(() => {
                    const isPassed = isEventPassed(evt.startDate, evt.endDate) || evt.status === 'Completed';
                    const isLimited = Boolean(evt.isLimited);
                    const maxQ = Number(evt.maxQuota || 0);
                    const isQuotaFull = isLimited && maxQ > 0 && rsvpCount >= maxQ;
                    if (isPassed) {
                      return (
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex items-center gap-2 font-extrabold text-ink"><CalendarX size={17} aria-hidden="true" />RSVP ditutup: acara sudah selesai</p>
                          <p className="m-0 text-[0.88rem] text-muted">Acara ini berlangsung pada {formatWibEventRange(evt.startDate, evt.endDate, evt.date)}.</p>
                        </div>
                      );
                    }
                    if (isQuotaFull) {
                      return (
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex items-center gap-2 font-extrabold text-ink"><Lock size={17} aria-hidden="true" />RSVP ditutup: kuota penuh</p>
                          <p className="m-0 text-[0.88rem] text-muted">Kuota sudah mencapai batas ({rsvpCount}/{maxQ} peserta).</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="m-0 text-[0.98rem] font-extrabold text-ink">Konfirmasi kehadiran (RSVP)</p>
                          <Chip tone="navy">{rsvpCount}{isLimited && maxQ > 0 ? ` / ${maxQ}` : ''} hadir</Chip>
                        </div>
                        {rsvpSuccess && (
                          <p role="status" className="m-0 flex items-start gap-2 rounded-xl bg-kolaboratif-tint p-3 text-[0.88rem] font-semibold text-kolaboratif-ink">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Kehadiran Anda tercatat.
                          </p>
                        )}
                        <form onSubmit={handleOpenConfirmRsvp} noValidate className="grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                            Nama lengkap
                            <input type="text" value={rsvpName} maxLength={120} autoComplete="name"
                              aria-invalid={rsvpErrors.rsvpName ? true : undefined}
                              onChange={(e) => { setRsvpName(e.target.value); if (rsvpErrors.rsvpName) setRsvpErrors((prev: AppItem) => ({ ...prev, rsvpName: null })); }}
                              className={fieldClass} />
                            {rsvpErrors.rsvpName && <span role="alert" className="text-[0.82rem] text-danger">{rsvpErrors.rsvpName}</span>}
                          </label>
                          <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                            Departemen
                            <select value={rsvpDepartmentId}
                              aria-invalid={rsvpErrors.rsvpDepartmentId ? true : undefined}
                              onChange={(e) => { setRsvpDepartmentId(e.target.value); if (rsvpErrors.rsvpDepartmentId) setRsvpErrors((prev: AppItem) => ({ ...prev, rsvpDepartmentId: null })); }}
                              className={fieldClass}>
                              <option value="">Pilih departemen…</option>
                              {departments.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ''}</option>)}
                            </select>
                            {rsvpErrors.rsvpDepartmentId && <span role="alert" className="text-[0.82rem] text-danger">{rsvpErrors.rsvpDepartmentId}</span>}
                          </label>
                          <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                            Kehadiran
                            <select value={rsvpMode} onChange={(e) => setRsvpMode(e.target.value)} className={fieldClass}>
                              <option value="Hadir Onsite">Hadir onsite</option>
                              <option value="Hadir Online">Hadir online / Teams</option>
                            </select>
                          </label>
                          <label className="flex flex-col gap-1.5 text-[0.86rem] font-semibold text-ink">
                            Catatan <span className="sr-only">(opsional)</span>
                            <input type="text" maxLength={500} value={rsvpNotes} placeholder="Opsional" onChange={(e) => setRsvpNotes(e.target.value)} className={fieldClass} />
                          </label>
                          <div className="sm:col-span-2">
                            <Button type="submit" variant="primary" loading={isSubmittingRsvp} icon={<Send size={15} aria-hidden="true" />}>Konfirmasi kehadiran saya</Button>
                          </div>
                        </form>
                      </>
                    );
                  })()}
                  {modalAttendees.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-line pt-3">
                      <p className="m-0 text-[0.84rem] font-bold text-dim">Rekan yang sudah konfirmasi hadir</p>
                      <ul className="m-0 flex max-h-28 list-none flex-wrap gap-2 overflow-y-auto p-0">
                        {modalAttendees.slice(0, 12).map((r: AppItem) => {
                          const dept = departments.find((d: AppItem) => d.id === r.departmentId || d.id === r.department || d.id === r.squadUnit || d.name === r.department || d.name === r.squadUnit);
                          const deptName = dept ? dept.name : (r.department || r.squadUnit || '');
                          return (
                            <li key={r.id}><Chip>{r.attendeeName}{deptName ? ` · ${deptName}` : ''}</Chip></li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => downloadIcs(evt)} icon={<Download size={14} aria-hidden="true" />}>Simpan ke Outlook (.ics)</Button>
                <a href={googleCalendarUrl(evt)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-[0.82rem] font-bold text-ink">
                  <ExternalLink size={14} aria-hidden="true" />Google Calendar
                </a>
                {gallery && (
                  <Button variant="secondary" size="sm" onClick={() => { handleCloseEventModal(); openGallery(gallery.id); }} icon={<Camera size={14} aria-hidden="true" />}>Galeri & dokumentasi</Button>
                )}
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* Review before sending the RSVP */}
      <Dialog
        open={Boolean(confirmRsvpOpen && rsvpModalEvent)}
        onClose={() => setConfirmRsvpOpen(false)}
        role="alertdialog"
        size="sm"
        title="Konfirmasi kehadiran"
        description="Pastikan rinciannya sudah sesuai sebelum disimpan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRsvpOpen(false)}>Cek ulang</Button>
            <Button variant="primary" loading={isSubmittingRsvp} onClick={handleFinalSubmitRsvp} icon={<Send size={14} aria-hidden="true" />}>Ya, kirim</Button>
          </>
        }
      >
        {rsvpModalEvent && (
          <dl className="m-0 flex flex-col gap-3 text-[0.92rem]">
            <div><dt className="text-dim">Acara</dt><dd className="m-0 font-semibold text-ink">{rsvpModalEvent.title}</dd></div>
            <div><dt className="text-dim">Jadwal & lokasi</dt><dd className="m-0 font-semibold text-ink">{formatWibEventRange(rsvpModalEvent.startDate, rsvpModalEvent.endDate, rsvpModalEvent.date)} · {rsvpModalEvent.location || 'Plaza Mandiri'}</dd></div>
            <div><dt className="text-dim">Nama</dt><dd className="m-0 font-semibold text-ink">{rsvpName}</dd></div>
            <div><dt className="text-dim">Departemen</dt><dd className="m-0 font-semibold text-ink">{departments.find((d: AppItem) => d.id === rsvpDepartmentId)?.name || rsvpDepartmentId}</dd></div>
            <div><dt className="text-dim">Kehadiran</dt><dd className="m-0"><Chip tone={String(rsvpMode).toLowerCase().includes('onsite') ? 'gold' : 'navy'}>{rsvpMode}</Chip></dd></div>
            {rsvpNotes.trim() && <div><dt className="text-dim">Catatan</dt><dd className="m-0 text-ink">“{rsvpNotes.trim()}”</dd></div>}
          </dl>
        )}
      </Dialog>
    </div>
  );
}
