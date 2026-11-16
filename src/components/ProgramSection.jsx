import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  CalendarDays,
  Info,
  X,
  Users,
  Download,
  ExternalLink,
  AlertCircle,
  Send,
  Share2,
  Link2,
  HelpCircle,
  Tag,
  Lock,
  CalendarX
} from 'lucide-react';
import { formatWibEventRange, isEventPassed } from '../utils/dateUtils';

// Helper to determine optimal high-contrast text color (black vs white) on dynamic colored badges
function getBadgeTextColor(bgColor) {
  if (!bgColor) return '#ffffff';
  const lower = String(bgColor).toLowerCase();
  if (lower.includes('gold') || lower.includes('yellow') || lower.includes('#ffb800') || lower.includes('#f59e0b')) return '#040914';
  if (lower.includes('blue') || lower.includes('navy') || lower.includes('purple') || lower.includes('rose') || lower.includes('dark')) return '#ffffff';
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    const fullHex = hex.length === 3 
      ? hex.split('').map(c => c + c).join('') 
      : hex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 140 ? '#040914' : '#ffffff';
  }
  if (bgColor.startsWith('rgb')) {
    const matches = bgColor.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0], 10);
      const g = parseInt(matches[1], 10);
      const b = parseInt(matches[2], 10);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return yiq >= 140 ? '#040914' : '#ffffff';
    }
  }
  return '#ffffff';
}

export default function ProgramSection({
  events = [],
  divisions = [],
  departments = [],
  activeTenure = null,
  eventRsvps = [],
  onAddEventRsvp,
  theme,
  onNavigateOprec,
  initialEventId = null,
  onSelectEventUrl,
  tenures = []
}) {
  const isDark = theme === 'dark';
  const [filterDiv, setFilterDiv] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'
  const [eventPage, setEventPage] = useState(1);
  const [calendarEventPage, setCalendarEventPage] = useState(1);
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);
  const [sameDayModalEvents, setSameDayModalEvents] = useState([]);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [currentYear, setCurrentYear] = useState(() => {
    const firstWithDate = events.find(e => e.startDate && e.status !== 'Completed') || events.find(e => e.startDate);
    if (firstWithDate?.startDate) {
      const yr = parseInt(firstWithDate.startDate.split('-')[0], 10);
      if (!isNaN(yr)) return yr;
    }
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nowM = new Date().getMonth();
    const nowY = new Date().getFullYear();
    const hasEventThisMonth = events.some(e => {
      if (!e.startDate) return false;
      const parts = e.startDate.split('-');
      return parseInt(parts[0], 10) === nowY && (parseInt(parts[1], 10) - 1) === nowM;
    });
    if (hasEventThisMonth) return nowM;
    const firstWithDate = events.find(e => e.startDate && e.status !== 'Completed') || events.find(e => e.startDate);
    if (firstWithDate?.startDate) {
      const mo = parseInt(firstWithDate.startDate.split('-')[1], 10) - 1;
      if (!isNaN(mo) && mo >= 0 && mo <= 11) return mo;
    }
    return nowM;
  });
  const [hoveredDate, setHoveredDate] = useState(null);

  // Auto-sync calendar view to active tenure's event dates when tenure changes
  useEffect(() => {
    if (!activeTenure?.id) return;
    const tenureEvents = events.filter(e => e.tenureId === activeTenure.id && e.startDate);
    if (tenureEvents.length > 0) {
      // Find earliest upcoming event, or first event of the tenure
      const targetEvt = tenureEvents.find(e => e.status !== 'Completed') || tenureEvents[0];
      if (targetEvt?.startDate) {
        const parts = targetEvt.startDate.slice(0, 10).split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y)) setCurrentYear(y);
        if (!isNaN(m) && m >= 0 && m <= 11) setCurrentMonth(m);
        return;
      }
    }
    // Fallback: extract year from activeTenure code (e.g. "2026/2027" -> 2026)
    if (activeTenure.code) {
      const match = activeTenure.code.match(/\d{4}/);
      if (match) {
        const y = parseInt(match[0], 10);
        if (!isNaN(y)) setCurrentYear(y);
      }
    }
  }, [activeTenure?.id]);

  const lastHandledInitialId = useRef(null);

  const handleCloseEventModal = useCallback(() => {
    setRsvpModalEvent(null);
    setSameDayModalEvents([]);
    setRsvpErrors({});
    setRsvpSuccess(false);
    lastHandledInitialId.current = null;
    if (onSelectEventUrl) onSelectEventUrl(null);
  }, [onSelectEventUrl]);

  // Handle initial event from direct deep link only once
  useEffect(() => {
    if (initialEventId && events.length > 0) {
      if (lastHandledInitialId.current !== initialEventId) {
        lastHandledInitialId.current = initialEventId;
        const found = events.find(e => e.id === initialEventId);
        if (found) {
          setRsvpModalEvent(found);
        }
      }
    } else if (!initialEventId) {
      lastHandledInitialId.current = null;
      setRsvpModalEvent(null);
    }
  }, [initialEventId, events]);

  // Close modal on Escape key
  useEffect(() => {
    if (!rsvpModalEvent) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseEventModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rsvpModalEvent, handleCloseEventModal]);

  const handleOpenEventModal = (evt, dayEventsList = []) => {
    setRsvpModalEvent(evt);
    if (dayEventsList.length > 1) {
      setSameDayModalEvents(dayEventsList);
    } else if (evt?.startDate) {
      const dateKey = evt.startDate.slice(0, 10);
      const matches = events.filter(e => {
        const s = (e.startDate || '').slice(0, 10);
        const end = (e.endDate || e.startDate || '').slice(0, 10);
        return dateKey >= s && dateKey <= end;
      });
      setSameDayModalEvents(matches.length > 1 ? matches : []);
    } else {
      setSameDayModalEvents([]);
    }
    lastHandledInitialId.current = evt?.id || null;
    if (onSelectEventUrl && evt?.id) {
      onSelectEventUrl(evt.id);
    }
  };

  const getEventDirectUrl = (evtId) => {
    return `${window.location.origin}/?event=${encodeURIComponent(evtId)}#event`;
  };

  const handleCopyEventLink = (evt) => {
    if (!evt) return;
    try {
      navigator.clipboard.writeText(getEventDirectUrl(evt.id));
      setCopiedEventId(evt.id);
      setTimeout(() => setCopiedEventId(null), 2200);
    } catch (e) { }
  };

  const handleShareEventWa = (evt) => {
    if (!evt) return;
    const url = getEventDirectUrl(evt.id);
    const dateText = formatWibEventRange(evt.startDate, evt.endDate, evt.date);
    const locText = evt.location || 'Plaza Mandiri';
    const text = `🎉 *Agenda Kegiatan CNT IT APD*\n*${evt.title}*\n📅 ${dateText} • 📍 ${locText}\n\nYuk ikuti & konfirmasi kehadiranmu (RSVP) di:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Quick RSVP form states
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpDepartmentId, setRsvpDepartmentId] = useState('');
  const [rsvpMode, setRsvpMode] = useState('Hadir Onsite');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [rsvpErrors, setRsvpErrors] = useState({});
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [confirmRsvpOpen, setConfirmRsvpOpen] = useState(false);

  const handleOpenConfirmRsvp = (e) => {
    e.preventDefault();
    if (!rsvpModalEvent || isSubmittingRsvp) return;
    const errs = {};
    if (!rsvpName.trim()) errs.rsvpName = 'Nama lengkap wajib diisi';
    if (!rsvpDepartmentId.trim()) errs.rsvpDepartmentId = 'Departemen wajib dipilih dari daftar';
    setRsvpErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmRsvpOpen(true);
  };

  const handleFinalSubmitRsvp = () => {
    if (!rsvpModalEvent || isSubmittingRsvp) return;
    setConfirmRsvpOpen(false);
    setIsSubmittingRsvp(true);
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const ts = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (onAddEventRsvp) {
      onAddEventRsvp({
        id: 'rsvp-' + Date.now(),
        eventId: rsvpModalEvent.id,
        eventTitle: rsvpModalEvent.title,
        attendeeName: rsvpName.trim(),
        departmentId: rsvpDepartmentId,
        department: rsvpDepartmentId,
        squadUnit: rsvpDepartmentId,
        attendanceMode: rsvpMode,
        notes: rsvpNotes.trim(),
        submittedAt: ts
      });
    }

    setRsvpSuccess(true);
    setRsvpName('');
    setRsvpDepartmentId('');
    setRsvpNotes('');
    setRsvpErrors({});
    setTimeout(() => setIsSubmittingRsvp(false), 500);
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  const scopedEvents = (tenureFilter === 'active' && activeTenure?.id)
    ? events.filter((evt) => evt.tenureId === activeTenure.id)
    : events;

  const scopedDivisions = (tenureFilter === 'active' && activeTenure?.id)
    ? divisions.filter(d => d.tenureId === activeTenure.id)
    : divisions;

  useEffect(() => {
    if (filterDiv !== 'all' && !scopedDivisions.some(d => d.id === filterDiv)) {
      setFilterDiv('all');
    }
  }, [tenureFilter, activeTenure?.id, divisions]);

  const filteredEvents = scopedEvents.filter((evt) => {
    const matchesDiv = filterDiv === 'all' || evt.divisionId === filterDiv;
    const matchesTab = activeTab === 'all' || (activeTab === 'upcoming' && evt.status !== 'Completed');
    return matchesDiv && matchesTab;
  });

  // Calendar View always displays all scheduled events of the month (including Completed) matching the selected division filter
  const calendarEvents = scopedEvents.filter((evt) => {
    return filterDiv === 'all' || evt.divisionId === filterDiv;
  });

  // Quarter breakdown for Calendar View (Dynamic based on activeTenure)
  const tenureYear = activeTenure?.code || '';
  const quarters = [
    { id: 'Q1', label: tenureYear ? `Q1 ${tenureYear} (Jan - Mar)` : 'Q1 (Jan - Mar)', color: '#0ea5e9', desc: 'Kick-off Budaya, Turnamen E-Sports & Aksi Donor Darah' },
    { id: 'Q2', label: tenureYear ? `Q2 ${tenureYear} (Apr - Jun)` : 'Q2 (Apr - Jun)', color: '#10b981', desc: 'Ramadan Charity, Grand Gathering & Family Teambuilding' },
    { id: 'Q3', label: tenureYear ? `Q3 ${tenureYear} (Jul - Sep)` : 'Q3 (Jul - Sep)', color: '#a855f7', desc: 'Tech Hackathon, Turnamen Olahraga & Wellness Sharing' },
    { id: 'Q4', label: tenureYear ? `Q4 ${tenureYear} (Okt - Des)` : 'Q4 (Okt - Des)', color: '#ffb800', desc: 'APD Got Talent, Townhall Akhir Tahun & Apresiasi Akbar' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '48px', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-cyan" style={{ marginBottom: '12px' }}>
          Kalender & Event Budaya
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Event CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Rangkaian inisiatif terpadu untuk membangun keakraban tim, kesehatan mental & fisik, serta wadah ekspresi bakat seluruh insan IT APD.
        </p>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left: View Mode Toggle & Status Tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode (Grid vs Calendar) */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--input-bg)',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-card)'
          }}>
            <button
              onClick={() => {
                setViewMode('grid');
                setEventPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: viewMode === 'grid' ? 'var(--mandiri-blue)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Grid size={15} />
              <span>List Event</span>
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
                setCalendarEventPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: viewMode === 'calendar' ? 'var(--mandiri-blue)' : 'transparent',
                color: viewMode === 'calendar' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <CalendarDays size={15} />
              <span>Kalender Tahunan</span>
            </button>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-card)' }} />

          {/* Status Tab */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                setActiveTab('upcoming');
                setEventPage(1);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: activeTab === 'upcoming' ? 'none' : '1px solid var(--border-card)',
                background: activeTab === 'upcoming' ? 'var(--mandiri-gold)' : 'transparent',
                color: activeTab === 'upcoming' ? '#0a1128' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              Akan Datang
            </button>
            <button
              onClick={() => {
                setActiveTab('all');
                setEventPage(1);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: activeTab === 'all' ? 'none' : '1px solid var(--border-card)',
                background: activeTab === 'all' ? 'var(--mandiri-gold)' : 'transparent',
                color: activeTab === 'all' ? '#0a1128' : 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              Semua ({scopedEvents.length})
            </button>
          </div>
        </div>

        {/* Right: Tenure Scope & Division Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {activeTenure && (
            <div style={{
              display: 'inline-flex',
              background: 'var(--input-bg)',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-card)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setTenureFilter('active');
                  setEventPage(1);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  background: tenureFilter === 'active' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  color: tenureFilter === 'active' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Periode {activeTenure?.code || activeTenure?.title || ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTenureFilter('all');
                  setEventPage(1);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  background: tenureFilter === 'all' ? 'rgba(255, 184, 0, 0.2)' : 'transparent',
                  color: tenureFilter === 'all' ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Lintas Tahun ({events.length})
              </button>
            </div>
          )}

          <Filter size={16} color="var(--text-dim)" />
          <select
            value={filterDiv}
            onChange={(e) => {
              setFilterDiv(e.target.value);
              setEventPage(1);
            }}
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-main)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Semua Divisi {scopedDivisions.length > 0 ? `(${scopedDivisions.length})` : ''}</option>
            {(() => {
              if (tenureFilter === 'active') {
                return scopedDivisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ));
              }
              // Lintas tahun (Semua Periode): kelompokkan divisi per tahun/tenure
              const renderedDivIds = new Set();
              const groups = (tenures || []).map((t) => {
                const divsInTenure = divisions.filter(d => d.tenureId === t.id);
                divsInTenure.forEach(d => renderedDivIds.add(d.id));
                if (divsInTenure.length === 0) return null;
                return (
                  <optgroup key={t.id} label={`Periode ${t.code} (${t.title || 'Kepengurusan'})`}>
                    {divsInTenure.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({t.code})
                      </option>
                    ))}
                  </optgroup>
                );
              }).filter(Boolean);

              const remainingDivs = divisions.filter(d => !renderedDivIds.has(d.id));
              return (
                <>
                  {groups}
                  {remainingDivs.length > 0 && (
                    <optgroup label="Divisi Lainnya">
                      {remainingDivs.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              );
            })()}
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: GRID VIEW */}
      {viewMode === 'grid' && (
        filteredEvents.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 184, 0, 0.12)',
              color: 'var(--mandiri-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarIcon size={26} />
            </div>
            <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Belum ada event di daftar ini
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '480px', margin: 0, lineHeight: 1.6 }}>
              {scopedEvents.length === 0
                ? `Belum ada agenda kegiatan atau event budaya yang dipublikasikan untuk periode kepengurusan ini (${activeTenure?.title || activeTenure?.code || 'Tenure Aktif'}).`
                : (filterDiv !== 'all' || activeTab !== 'all'
                    ? 'Tidak ada agenda kegiatan yang cocok dengan pilihan filter divisi atau status saat ini. Coba pilih filter lain atau reset filter.'
                    : 'Belum ada agenda kegiatan atau event budaya yang dipublikasikan. Pantau terus informasi terbaru dari pengurus CNT IT APD!')
              }
            </p>
            {scopedEvents.length > 0 && (filterDiv !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterDiv('all');
                  setActiveTab('all');
                  setEventPage(1);
                }}
                style={{
                  marginTop: '6px',
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid var(--mandiri-blue)',
                  color: 'var(--neon-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (() => {
          const EVENTS_PER_PAGE = 8;
          const totalEventPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE) || 1;
          const safeEventPage = Math.min(Math.max(1, eventPage), totalEventPages);
          const paginatedEvents = filteredEvents.slice(
            (safeEventPage - 1) * EVENTS_PER_PAGE,
            safeEventPage * EVENTS_PER_PAGE
          );

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
                gap: '24px',
              }}>
                {paginatedEvents.map((evt) => {
              const divInfo = divisions.find(d => d.id === evt.divisionId);
              const isCompleted = evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate);

              return (
                <div
                  key={evt.id}
                  className="glass-panel"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderLeft: `5px solid ${divInfo?.color || 'var(--mandiri-gold)'}`,
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: divInfo?.color || 'var(--mandiri-gold)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {evt.divisionName || divInfo?.name || 'CNT IT APD'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge-gold" style={{ fontSize: '0.7rem' }}>
                        {formatWibEventRange(evt.startDate, evt.endDate, evt.date)}
                      </span>
                      {(evt.category || evt.badge) && (
                        <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                          {evt.category || evt.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.3 }}>
                      {evt.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {evt.description}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-card)',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <MapPin size={15} color="var(--mandiri-blue)" />
                      <span>{evt.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                      <Users size={15} color="var(--mandiri-gold)" />
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Peserta: {evt.peserta || evt.kpi}</span>
                    </div>
                    {(() => {
                      const count = eventRsvps.filter(r => r.eventId === evt.id).length;
                      const isLimited = Boolean(evt.isLimited);
                      const maxQ = Number(evt.maxQuota || 0);
                      const isFull = isLimited && maxQ > 0 && count >= maxQ;

                      if (isLimited && maxQ > 0) {
                        const quotaColor = isFull ? (isDark ? '#f43f5e' : '#be123c') : (isDark ? 'var(--mandiri-gold)' : '#b45309');
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: quotaColor, fontWeight: 800 }}>
                            <Users size={15} color={quotaColor} />
                            <span>Kuota: {count}/{maxQ} {isFull ? '• (Penuh)' : `• (Sisa ${Math.max(0, maxQ - count)})`}</span>
                          </div>
                        );
                      }
                      return count > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? 'var(--neon-cyan)' : '#0284c7', fontWeight: 700 }}>
                          <Users size={15} color={isDark ? 'var(--neon-cyan)' : '#0284c7'} />
                          <span>{count} Insan IT APD telah konfirmasi hadir (RSVP)</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className="btn-rsvp-action"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: isCompleted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(14, 165, 233, 0.12)',
                        color: isCompleted ? 'var(--text-muted)' : 'var(--neon-cyan)',
                        border: isCompleted ? '1.5px solid var(--border-card)' : '1.5px solid var(--neon-cyan)',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isCompleted ? 'none' : '0 4px 15px rgba(14, 165, 233, 0.15)'
                      }}
                      onClick={() => handleOpenEventModal(evt)}
                      onMouseEnter={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.background = 'var(--neon-cyan)';
                          e.currentTarget.style.color = '#040914';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.12)';
                          e.currentTarget.style.color = 'var(--neon-cyan)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <span>{isCompleted ? 'Lihat Info & Daftar Hadir' : 'RSVP / Info Detail'}</span>
                      <ChevronRight size={16} />
                    </button>

                      <button
                        type="button"
                        onClick={() => handleCopyEventLink(evt)}
                        title="Salin Link Undangan Event"
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: copiedEventId === evt.id ? 'rgba(16, 185, 129, 0.16)' : 'var(--input-bg)',
                          border: `1px solid ${copiedEventId === evt.id ? '#10b981' : 'var(--border-card)'}`,
                          color: copiedEventId === evt.id ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {copiedEventId === evt.id ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {totalEventPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 18px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Menampilkan <strong>{(safeEventPage - 1) * EVENTS_PER_PAGE + 1} - {Math.min(safeEventPage * EVENTS_PER_PAGE, filteredEvents.length)}</strong> dari <strong>{filteredEvents.length}</strong> event
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={safeEventPage === 1}
                  onClick={() => setEventPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeEventPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: safeEventPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: safeEventPage === 1 ? 0.45 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Sebelumnya</span>
                </button>
                {Array.from({ length: totalEventPages }, (_, i) => i + 1).map((pg) => {
                  if (totalEventPages > 7 && Math.abs(pg - safeEventPage) > 2 && pg !== 1 && pg !== totalEventPages) {
                    if (pg === 2 || pg === totalEventPages - 1) {
                      return <span key={pg} style={{ color: 'var(--text-dim)', padding: '0 4px', fontSize: '0.75rem' }}>...</span>;
                    }
                    return null;
                  }
                  const isActive = pg === safeEventPage;
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setEventPage(pg)}
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        padding: '0 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        color: isActive ? '#040914' : 'var(--text-main)',
                        border: isActive ? 'none' : '1px solid var(--border-card)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safeEventPage === totalEventPages}
                  onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeEventPage === totalEventPages ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: safeEventPage === totalEventPages ? 'not-allowed' : 'pointer',
                    opacity: safeEventPage === totalEventPages ? 0.45 : 1
                  }}
                >
                  <span>Selanjutnya</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    })()
  )}

      {/* VIEW MODE 2: AUTHENTIC MONTHLY CALENDAR GRID WITH DATE RANGE MARKING & HOVER TOOLTIPS */}
      {viewMode === 'calendar' && (() => {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

        // Calculate active month events (includes all scheduled events for the calendar month)
        const currentMonthEvents = calendarEvents.filter(evt => {
          if (!evt.startDate) return false;
          const s = new Date(evt.startDate);
          const e = evt.endDate ? new Date(evt.endDate) : s;
          const targetStart = new Date(currentYear, currentMonth, 1, 0, 0, 0);
          const targetEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
          return (s <= targetEnd && e >= targetStart);
        });

        const totalDays = daysInMonth(currentYear, currentMonth);
        const startDayOffset = firstDayOfWeek(currentYear, currentMonth);

        const handlePrevMonth = () => {
          setCalendarEventPage(1);
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
          } else {
            setCurrentMonth(prev => prev - 1);
          }
        };

        const handleNextMonth = () => {
          setCalendarEventPage(1);
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
          } else {
            setCurrentMonth(prev => prev + 1);
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Calendar Controller Header */}
            <div className="glass-panel" style={{
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 184, 0, 0.15)',
                  color: 'var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {currentMonthEvents.length} Event Terjadwal Bulan Ini
                  </span>
                </div>
              </div>

              {/* Month Switcher Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ◀ Bulan Lalu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonth(now.getMonth());
                    setCurrentYear(now.getFullYear());
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid var(--mandiri-blue)',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Bulan Depan ▶
                </button>
              </div>
            </div>

            {/* Calendar Authentic Grid Table */}
            <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
              <div style={{ minWidth: '640px' }}>
                {/* Day Headers (Minggu - Sabtu) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  {dayNames.map((d, dIdx) => (
                    <div
                      key={d}
                      style={{
                        padding: '10px 0',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: dIdx === 0 ? '#f43f5e' : (dIdx === 6 ? 'var(--neon-cyan)' : 'var(--text-muted)'),
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day Slots Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridAutoRows: 'minmax(115px, auto)',
                  gap: '8px'
                }}>
                  {/* Empty cells before month begins */}
                  {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      style={{
                        minHeight: '115px',
                        height: '100%',
                        boxSizing: 'border-box',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px dashed rgba(255, 255, 255, 0.04)',
                        opacity: 0.3
                      }}
                    />
                  ))}

                  {/* Calendar Days */}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayStr = String(dayNum).padStart(2, '0');
                    const monthStr = String(currentMonth + 1).padStart(2, '0');
                    const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

                    // Check which events cover this specific date (from startDate to endDate)
                    const dayEvents = calendarEvents.filter(evt => {
                      if (!evt.startDate) return false;
                      const sDate = evt.startDate.slice(0, 10);
                      const eDate = (evt.endDate || evt.startDate).slice(0, 10);
                      return fullDateStr >= sDate && fullDateStr <= eDate;
                    });

                    const hasEvents = dayEvents.length > 0;
                    const primaryDiv = divisions.find(d => d.id === dayEvents[0]?.divisionId);
                    const tagColor = primaryDiv?.color || 'var(--mandiri-gold)';

                    // Calculate grid row and col for smart popover alignment without clipping
                    const slotIndex = startDayOffset + dayNum - 1;
                    const rowIndex = Math.floor(slotIndex / 7);
                    const colIndex = slotIndex % 7;
                    const isTopHalf = rowIndex <= 1; // Row 0 or 1 opens downwards
                    const isLeftCol = colIndex <= 1;
                    const isRightCol = colIndex >= 5;

                    return (
                      <div
                        key={dayNum}
                        onClick={() => {
                          if (hasEvents) handleOpenEventModal(dayEvents[0], dayEvents);
                        }}
                        onMouseEnter={() => {
                          if (hasEvents) setHoveredDate(fullDateStr);
                        }}
                        onMouseLeave={() => setHoveredDate(null)}
                        style={{
                          minHeight: '115px',
                          height: '100%',
                          boxSizing: 'border-box',
                          borderRadius: 'var(--radius-sm)',
                          background: hasEvents
                            ? (isDark ? `${tagColor}22` : `${tagColor}15`)
                            : 'var(--bg-card)',
                          border: hasEvents
                            ? `2px solid ${tagColor}`
                            : '1px solid var(--border-card)',
                          padding: '6px 7px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          gap: '3px',
                          position: 'relative',
                          zIndex: hoveredDate === fullDateStr ? 70 : 1,
                          cursor: hasEvents ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                          boxShadow: hasEvents ? `0 2px 10px ${tagColor}25` : 'none',
                          overflow: 'visible'
                        }}
                      >
                        {/* Date Number Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1px' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: hasEvents ? 900 : 600,
                            color: hasEvents ? (isDark ? tagColor : '#003d79') : 'var(--text-main)',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: hasEvents ? (isDark ? '#040914' : '#ffffff') : 'transparent',
                            boxShadow: hasEvents && !isDark ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                          }}>
                            {dayNum}
                          </span>
                          {hasEvents && dayEvents.length > 1 && (
                            <span 
                              title={`${dayEvents.length} Event Terjadwal`}
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                background: tagColor,
                                color: getBadgeTextColor(tagColor),
                                padding: '1px 6px',
                                borderRadius: '8px',
                                lineHeight: 1.2,
                                boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.2)'
                              }}
                            >
                              +{dayEvents.length - 1}
                            </span>
                          )}
                        </div>

                        {/* Interactive Event Label Chips in Day Cell */}
                        {hasEvents ? (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2.5px', marginTop: '1px' }}>
                            {dayEvents.slice(0, 2).map((ev, evIdx) => {
                              const divObj = divisions.find(d => d.id === ev.divisionId);
                              const col = divObj?.color || tagColor;
                              const isEvtComp = ev.status === 'Completed' || isEventPassed(ev.startDate, ev.endDate);

                              return (
                                <div
                                  key={ev.id || evIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEventModal(ev, dayEvents);
                                  }}
                                  style={{
                                    fontSize: '0.63rem',
                                    fontWeight: 700,
                                    background: isDark ? 'rgba(0,0,0,0.6)' : '#ffffff',
                                    color: isEvtComp ? 'var(--text-muted)' : (isDark ? col : '#0f172a'),
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    borderLeft: `2.5px solid ${isEvtComp ? '#64748b' : col}`,
                                    borderRight: isDark ? 'none' : '1px solid #e2e8f0',
                                    borderTop: isDark ? 'none' : '1px solid #e2e8f0',
                                    borderBottom: isDark ? 'none' : '1px solid #e2e8f0',
                                    boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                                    lineHeight: 1.25,
                                    width: '100%',
                                    cursor: 'pointer',
                                    opacity: isEvtComp ? 0.75 : 1
                                  }}
                                  title={`${ev.title}${isEvtComp ? ' (Selesai)' : ''}`}
                                >
                                  {isEvtComp ? `✓ ${ev.title}` : ev.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEventModal(dayEvents[0], dayEvents);
                                }}
                                style={{
                                  fontSize: '0.62rem',
                                  color: isDark ? 'var(--mandiri-gold)' : '#b45309',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  lineHeight: 1.2,
                                  borderRadius: '3px',
                                  background: isDark ? 'rgba(255, 184, 0, 0.12)' : '#fef3c7',
                                  border: isDark ? '1px solid rgba(255, 184, 0, 0.25)' : '1px solid #fde68a',
                                  alignSelf: 'flex-start',
                                  marginTop: '1px'
                                }}
                                title="Klik untuk melihat seluruh agenda di tanggal ini"
                              >
                                +{dayEvents.length - 2} lagi...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ height: '14px' }} />
                        )}

                        {/* Interactive Floating Hover Popover (Dengan Smart Auto-Flip, Full Agenda Scroll, & Direct Click) */}
                        {hoveredDate === fullDateStr && hasEvents && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: isTopHalf ? 'calc(100% + 8px)' : 'auto',
                              bottom: isTopHalf ? 'auto' : 'calc(100% + 8px)',
                              left: isLeftCol ? '0' : (isRightCol ? 'auto' : '50%'),
                              right: isRightCol ? '0' : 'auto',
                              transform: (isLeftCol || isRightCol) ? 'none' : 'translateX(-50%)',
                              zIndex: 999,
                              minWidth: '260px',
                              maxWidth: 'min(320px, calc(100vw - 32px))',
                              background: isDark ? '#0b1329' : '#ffffff',
                              border: isDark ? `1.5px solid ${tagColor}` : '1.5px solid #cbd5e1',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: isDark ? '0 18px 40px rgba(0,0,0,0.55)' : '0 14px 35px rgba(0,61,121,0.22)',
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              pointerEvents: 'auto'
                            }}
                          >
                            {/* Hover Bridge to keep popover open seamlessly when mouse enters */}
                            <div style={{
                              position: 'absolute',
                              top: isTopHalf ? '-12px' : 'auto',
                              bottom: isTopHalf ? 'auto' : '-12px',
                              left: 0,
                              right: 0,
                              height: '14px',
                              background: 'transparent'
                            }} />

                            <div style={{
                              fontSize: '0.74rem',
                              color: isDark ? 'var(--text-dim)' : '#475569',
                              fontWeight: 800,
                              borderBottom: isDark ? '1px solid var(--border-card)' : '1px solid #e2e8f0',
                              paddingBottom: '6px',
                              position: 'sticky',
                              top: 0,
                              background: isDark ? '#0b1329' : '#ffffff',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span>📅 {dayNum} {monthNames[currentMonth]} {currentYear}</span>
                              <span style={{
                                background: tagColor,
                                color: getBadgeTextColor(tagColor),
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.15)'
                              }}>
                                {dayEvents.length} Agenda
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px',
                              paddingTop: '2px',
                              maxHeight: '172px',
                              overflowY: dayEvents.length > 3 ? 'auto' : 'visible',
                              paddingRight: dayEvents.length > 3 ? '4px' : '0px',
                              scrollbarWidth: 'thin',
                              scrollbarColor: isDark ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.2) transparent'
                            }}>
                              {dayEvents.map((ev, evIdx) => {
                                const divObj = divisions.find(d => d.id === ev.divisionId);
                                const col = divObj?.color || tagColor;
                                const isEvtComp = ev.status === 'Completed' || isEventPassed(ev.startDate, ev.endDate);

                                return (
                                  <div
                                    key={ev.id || evIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEventModal(ev, dayEvents);
                                    }}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '2px',
                                      padding: '6px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                      border: isDark ? '1px solid var(--border-card)' : '1px solid #e2e8f0',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = isDark ? 'rgba(255,184,0,0.12)' : '#fef3c7';
                                      e.currentTarget.style.borderColor = 'var(--mandiri-gold)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
                                      e.currentTarget.style.borderColor = isDark ? 'var(--border-card)' : '#e2e8f0';
                                    }}
                                    title="Klik untuk membuka rincian agenda ini"
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        background: isEvtComp ? '#64748b' : col,
                                        flexShrink: 0
                                      }} />
                                      <span style={{
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        color: isEvtComp ? 'var(--text-muted)' : (isDark ? 'var(--text-main)' : '#0f172a'),
                                        lineHeight: 1.25,
                                        flex: 1
                                      }}>
                                        {isEvtComp ? `✓ ${ev.title}` : ev.title}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.67rem', color: isDark ? 'var(--text-muted)' : '#64748b', paddingLeft: '13px' }}>
                                      {ev.divisionName || divObj?.name} • 📍 {ev.location}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div style={{
                              fontSize: '0.66rem',
                              color: isDark ? 'var(--mandiri-gold)' : '#b45309',
                              fontWeight: 700,
                              textAlign: 'center',
                              paddingTop: '6px',
                              borderTop: isDark ? '1px solid var(--border-card)' : '1px solid #e2e8f0',
                              marginTop: '2px',
                              position: 'sticky',
                              bottom: 0,
                              background: isDark ? '#0b1329' : '#ffffff',
                              zIndex: 2
                            }}>
                              {dayEvents.length > 3 ? (
                                <span>📜 Scroll untuk agenda lainnya • Klik untuk detail</span>
                              ) : (
                                <span>💡 Klik salah satu agenda untuk melihat detail &amp; RSVP</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Summary Cards of Month's Events */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--mandiri-gold)" />
                  <span>Rincian Event Terjadwal Bulan {monthNames[currentMonth]} {currentYear}:</span>
                </div>
                {currentMonthEvents.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Total {currentMonthEvents.length} Event
                  </span>
                )}
              </div>

              {currentMonthEvents.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Tidak ada agenda event pada bulan {monthNames[currentMonth]} {currentYear}. Gunakan tombol bulan untuk melihat agenda di bulan lainnya.
                </div>
              ) : (() => {
                const CALENDAR_EVENTS_PER_PAGE = 9;
                const totalCalendarPages = Math.ceil(currentMonthEvents.length / CALENDAR_EVENTS_PER_PAGE) || 1;
                const safeCalendarPage = Math.min(Math.max(1, calendarEventPage), totalCalendarPages);
                const paginatedCalendarEvents = currentMonthEvents.slice(
                  (safeCalendarPage - 1) * CALENDAR_EVENTS_PER_PAGE,
                  safeCalendarPage * CALENDAR_EVENTS_PER_PAGE
                );

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      {paginatedCalendarEvents.map((evt) => {
                        const divInfo = divisions.find(d => d.id === evt.divisionId);
                        return (
                          <div
                            key={evt.id}
                            onClick={() => handleOpenEventModal(evt)}
                            className="glass-panel glass-panel-hover"
                            style={{
                              padding: '18px',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: `5px solid ${divInfo?.color || 'var(--mandiri-gold)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: divInfo?.color || 'var(--mandiri-gold)', textTransform: 'uppercase' }}>
                                {evt.divisionName || divInfo?.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {evt.isLimited && Number(evt.maxQuota) > 0 && (() => {
                                  const qCount = eventRsvps.filter(r => r.eventId === evt.id).length;
                                  const isFull = qCount >= Number(evt.maxQuota);
                                  return (
                                    <span className={isFull ? "badge-red" : "badge-gold"} style={{ fontSize: '0.64rem' }}>
                                      Kuota: {qCount}/{evt.maxQuota} {isFull ? '(Penuh)' : ''}
                                    </span>
                                  );
                                })()}
                                <span className={evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate) ? "badge-cyan" : "badge-gold"} style={{ fontSize: '0.68rem' }}>
                                  {evt.status === 'Completed' || isEventPassed(evt.startDate, evt.endDate) ? 'Completed' : evt.status}
                                </span>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                              {evt.title}
                            </h4>
                            <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                              📅 {formatWibEventRange(evt.startDate, evt.endDate, evt.date)}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={13} color="var(--mandiri-blue)" />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.location}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls for Kalender Tahunan (9 per page) */}
                    {totalCalendarPages > 1 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--border-card)'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Menampilkan <strong>{(safeCalendarPage - 1) * CALENDAR_EVENTS_PER_PAGE + 1} - {Math.min(safeCalendarPage * CALENDAR_EVENTS_PER_PAGE, currentMonthEvents.length)}</strong> dari <strong>{currentMonthEvents.length}</strong> event
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={safeCalendarPage === 1}
                            onClick={() => setCalendarEventPage(p => Math.max(1, p - 1))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              border: '1px solid var(--border-card)',
                              background: safeCalendarPage === 1 ? 'transparent' : 'var(--input-bg)',
                              color: safeCalendarPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: safeCalendarPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: safeCalendarPage === 1 ? 0.45 : 1
                            }}
                          >
                            ◀ Prev
                          </button>

                          {Array.from({ length: totalCalendarPages }, (_, i) => i + 1).map((pg) => {
                            if (totalCalendarPages > 7 && Math.abs(pg - safeCalendarPage) > 2 && pg !== 1 && pg !== totalCalendarPages) {
                              if (pg === 2 || pg === totalCalendarPages - 1) {
                                return <span key={pg} style={{ padding: '0 4px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>...</span>;
                              }
                              return null;
                            }
                            const isActive = pg === safeCalendarPage;
                            return (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setCalendarEventPage(pg)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  border: isActive ? 'none' : '1px solid var(--border-card)',
                                  background: isActive ? 'var(--mandiri-gold)' : 'transparent',
                                  color: isActive ? '#040914' : 'var(--text-main)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {pg}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            disabled={safeCalendarPage === totalCalendarPages}
                            onClick={() => setCalendarEventPage(p => Math.min(totalCalendarPages, p + 1))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              border: '1px solid var(--border-card)',
                              background: safeCalendarPage === totalCalendarPages ? 'transparent' : 'var(--input-bg)',
                              color: safeCalendarPage === totalCalendarPages ? 'var(--text-dim)' : 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: safeCalendarPage === totalCalendarPages ? 'not-allowed' : 'pointer',
                              opacity: safeCalendarPage === totalCalendarPages ? 0.45 : 1
                            }}
                          >
                            Next ▶
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* SLEEK PROFESSIONAL RSVP MODAL WITH LIVE ATTENDANCE CONFIRMATION */}
      {rsvpModalEvent && (() => {
        const currentEventRsvps = eventRsvps.filter(r => r.eventId === rsvpModalEvent.id);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
            onClick={handleCloseEventModal}
          >
            <div
              className="glass-panel modal-container"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '580px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '28px',
                position: 'relative',
                border: '1.5px solid var(--mandiri-blue)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <button
                onClick={handleCloseEventModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'var(--text-main)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(0, 61, 121, 0.15)',
                  color: 'var(--mandiri-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Info size={22} />
                </div>
                <div>
                  <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                    RSVP & Info Event • {formatWibEventRange(rsvpModalEvent.startDate, rsvpModalEvent.endDate, rsvpModalEvent.date)}
                  </span>
                  <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {rsvpModalEvent.title}
                  </h3>
                </div>
              </div>

              {/* Share Event Link & WhatsApp Invitation Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleShareEventWa(rsvpModalEvent)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 13px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.45)',
                    color: '#25d366',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={13} />
                  <span>📲 Bagikan Undangan ke WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyEventLink(rsvpModalEvent)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 13px',
                    borderRadius: 'var(--radius-full)',
                    background: copiedEventId === rsvpModalEvent.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--input-bg)',
                    border: `1px solid ${copiedEventId === rsvpModalEvent.id ? '#10b981' : 'var(--border-card)'}`,
                    color: copiedEventId === rsvpModalEvent.id ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Link2 size={13} />
                  <span>{copiedEventId === rsvpModalEvent.id ? '✓ Link Undangan Tersalin!' : 'Salin Link Event'}</span>
                </button>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {rsvpModalEvent.description}
              </p>

              <div style={{
                background: 'rgba(0, 61, 121, 0.05)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--mandiri-blue)" />
                  <strong>Lokasi:</strong> <span>{rsvpModalEvent.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} color="var(--mandiri-gold)" />
                  <strong>Peserta:</strong> <span>{rsvpModalEvent.peserta || rsvpModalEvent.kpi}</span>
                </div>
                {rsvpModalEvent.isLimited && Number(rsvpModalEvent.maxQuota) > 0 && (() => {
                  const maxQ = Number(rsvpModalEvent.maxQuota);
                  const isFull = currentEventRsvps.length >= maxQ;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={14} color={isFull ? '#f43f5e' : 'var(--mandiri-gold)'} />
                      <strong>Batas Kuota:</strong>
                      <span style={{ fontWeight: 800, color: isFull ? '#f43f5e' : 'var(--mandiri-gold)' }}>
                        {currentEventRsvps.length} / {maxQ} Terisi {isFull ? '(Kuota Penuh)' : `(Sisa ${Math.max(0, maxQ - currentEventRsvps.length)})`}
                      </span>
                    </div>
                  );
                })()}
                {(rsvpModalEvent.kategori || rsvpModalEvent.category || rsvpModalEvent.badge) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={14} color="var(--neon-cyan)" />
                    <strong>Kategori:</strong> <span>{rsvpModalEvent.kategori || rsvpModalEvent.category || rsvpModalEvent.badge}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} color="var(--neon-emerald)" />
                  <strong>Divisi Penyelenggara:</strong> <span>{rsvpModalEvent.divisionName || 'CNT IT APD'}</span>
                </div>
              </div>

              {/* Quick RSVP Form (Tersimpan di Tabel Supabase public.event_rsvps) */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {(() => {
                  const isPassed = isEventPassed(rsvpModalEvent.startDate, rsvpModalEvent.endDate) || rsvpModalEvent.status === 'Completed';
                  const isLimited = Boolean(rsvpModalEvent.isLimited);
                  const maxQ = Number(rsvpModalEvent.maxQuota || 0);
                  const isQuotaFull = isLimited && maxQ > 0 && currentEventRsvps.length >= maxQ;

                  if (isPassed) {
                    return (
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: 800, fontSize: '0.88rem' }}>
                          <CalendarX size={17} />
                          <span>Pendaftaran RSVP Telah Ditutup (Event Selesai)</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                          Agenda kegiatan ini telah selesai diselenggarakan pada {formatWibEventRange(rsvpModalEvent.startDate, rsvpModalEvent.endDate, rsvpModalEvent.date)}. Form pendaftaran RSVP tidak lagi menerima respons.
                        </p>
                      </div>
                    );
                  }

                  if (isQuotaFull) {
                    return (
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 184, 0, 0.08)',
                        border: '1px solid rgba(255, 184, 0, 0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mandiri-gold)', fontWeight: 800, fontSize: '0.88rem' }}>
                          <Lock size={17} />
                          <span>Pendaftaran RSVP Telah Ditutup (Kuota Penuh)</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                          Mohon maaf, kuota pendaftaran untuk kegiatan ini telah mencapai batas maksimal ({currentEventRsvps.length}/{maxQ} peserta). Pendaftaran RSVP baru telah resmi ditutup.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ✋ Konfirmasi Kehadiran Instan (RSVP)
                        </div>
                        <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                          {currentEventRsvps.length}{isLimited && maxQ > 0 ? ` / ${maxQ}` : ''} Terdaftar Hadir
                        </span>
                      </div>

                      {rsvpSuccess && (
                        <div style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10b981',
                          color: '#10b981',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <CheckCircle2 size={15} />
                          <span>Konfirmasi kehadiran Anda berhasil tercatat di daftar hadir kegiatan!</span>
                        </div>
                      )}

                      <form onSubmit={handleOpenConfirmRsvp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <input
                              type="text"
                              placeholder="Nama Lengkap Anda *"
                              value={rsvpName}
                              onChange={(e) => {
                                setRsvpName(e.target.value);
                                if (rsvpErrors.rsvpName) setRsvpErrors(prev => ({ ...prev, rsvpName: null }));
                              }}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-card)',
                                border: `1.5px solid ${rsvpErrors.rsvpName ? '#f43f5e' : 'var(--border-card)'}`,
                                color: 'var(--text-main)',
                                fontSize: '0.82rem',
                                outline: 'none'
                              }}
                            />
                            {rsvpErrors.rsvpName && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.7rem', marginTop: '3px' }}>
                                <AlertCircle size={11} />
                                <span>{rsvpErrors.rsvpName}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <select
                              value={rsvpDepartmentId}
                              onChange={(e) => {
                                setRsvpDepartmentId(e.target.value);
                                if (rsvpErrors.rsvpDepartmentId) setRsvpErrors(prev => ({ ...prev, rsvpDepartmentId: null }));
                              }}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-card)',
                                border: `1.5px solid ${rsvpErrors.rsvpDepartmentId ? '#f43f5e' : 'var(--border-card)'}`,
                                color: rsvpDepartmentId ? 'var(--text-main)' : 'var(--text-dim)',
                                fontSize: '0.82rem',
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">-- Pilih Departemen Asal Kamu * --</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} {d.code ? `(${d.code})` : ''}
                                </option>
                              ))}
                            </select>
                            {rsvpErrors.rsvpDepartmentId && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.7rem', marginTop: '3px' }}>
                                <AlertCircle size={11} />
                                <span>{rsvpErrors.rsvpDepartmentId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px' }}>
                          <select
                            value={rsvpMode}
                            onChange={(e) => setRsvpMode(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.82rem',
                              outline: 'none'
                            }}
                          >
                            <option value="Hadir Onsite">📍 Hadir Onsite</option>
                            <option value="Hadir Online">💻 Hadir Online / Teams</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Catatan singkat (opsional)..."
                            value={rsvpNotes}
                            onChange={(e) => setRsvpNotes(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.82rem',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingRsvp}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-full)',
                            background: isSubmittingRsvp ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                            color: '#040914',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: isSubmittingRsvp ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Send size={14} />
                          <span>{isSubmittingRsvp ? 'Menyimpan RSVP...' : 'Konfirmasi Kehadiran Saya'}</span>
                        </button>
                      </form>
                    </>
                  );
                })()}

                {currentEventRsvps.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                      Rekan yang sudah konfirmasi hadir:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '85px', overflowY: 'auto' }}>
                      {currentEventRsvps.slice(0, 12).map((r) => (
                        <span
                          key={r.id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)'
                          }}
                        >
                          ✓ <strong>{r.attendeeName}</strong> <span style={{ color: 'var(--text-dim)' }}>({r.squadUnit})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Calendar Actions (Outlook .ics & Google Calendar) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const defaultIso = new Date().toISOString().slice(0, 10);
                    const sRaw = (rsvpModalEvent.startDate || defaultIso).replace(/-/g, '');
                    const eDateObj = new Date(rsvpModalEvent.endDate || rsvpModalEvent.startDate || defaultIso);
                    eDateObj.setDate(eDateObj.getDate() + 1);
                    const eRaw = eDateObj.toISOString().split('T')[0].replace(/-/g, '');
                    const icsContent = [
                      'BEGIN:VCALENDAR',
                      'VERSION:2.0',
                      'PRODID:-//CNT IT APD Bank Mandiri//ID',
                      'BEGIN:VEVENT',
                      `UID:${rsvpModalEvent.id}@cntitapd.netlify.app`,
                      `DTSTAMP:${sRaw}T010000Z`,
                      `DTSTART;VALUE=DATE:${sRaw}`,
                      `DTEND;VALUE=DATE:${eRaw}`,
                      `SUMMARY:${rsvpModalEvent.title} - CNT IT APD`,
                      `DESCRIPTION:${(rsvpModalEvent.description || '').replace(/\n/g, '\\n')}`,
                      `LOCATION:${rsvpModalEvent.location || 'Plaza Mandiri'}`,
                      'END:VEVENT',
                      'END:VCALENDAR'
                    ].join('\r\n');

                    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${rsvpModalEvent.title.replace(/\s+/g, '_')}.ics`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    flex: '1 1 200px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(14, 165, 233, 0.12)',
                    border: '1px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Simpan ke Outlook / Kalender (.ics)</span>
                </button>

                <a
                  href={(() => {
                    const defaultIso = new Date().toISOString().slice(0, 10);
                    const sRaw = (rsvpModalEvent.startDate || defaultIso).replace(/-/g, '');
                    const eDateObj = new Date(rsvpModalEvent.endDate || rsvpModalEvent.startDate || defaultIso);
                    eDateObj.setDate(eDateObj.getDate() + 1);
                    const eRaw = eDateObj.toISOString().split('T')[0].replace(/-/g, '');
                    const params = new URLSearchParams({
                      action: 'TEMPLATE',
                      text: `${rsvpModalEvent.title} (CNT IT APD)`,
                      dates: `${sRaw}/${eRaw}`,
                      details: rsvpModalEvent.description || '',
                      location: rsvpModalEvent.location || 'Plaza Mandiri'
                    });
                    return `https://calendar.google.com/calendar/render?${params.toString()}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1 1 180px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Google Calendar</span>
                </a>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                {onNavigateOprec && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseEventModal();
                      onNavigateOprec();
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 184, 0, 0.14)',
                      color: 'var(--mandiri-gold)',
                      border: '1px solid var(--mandiri-gold)',
                      padding: '9px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ke Hub Formulir
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseEventModal}
                  style={{
                    flex: 1,
                    background: 'var(--mandiri-blue)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION PREVIEW MODAL SEBELUM KIRIM RSVP KEHADIRAN EVENT */}
      {confirmRsvpOpen && rsvpModalEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1.5px solid var(--mandiri-gold)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  color: 'var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Konfirmasi Kehadiran Event
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Pastikan rincian kehadiran Anda sudah sesuai sebelum disimpan
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRsvpOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Kegiatan: </span>
                <strong style={{ color: 'var(--text-main)' }}>{rsvpModalEvent.title}</strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Jadwal & Lokasi: </span>
                <strong style={{ color: 'var(--mandiri-gold)' }}>
                  {formatWibEventRange(rsvpModalEvent.startDate, rsvpModalEvent.endDate, rsvpModalEvent.date)} • {rsvpModalEvent.location || 'Plaza Mandiri'}
                </strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Nama Peserta: </span>
                <strong style={{ color: 'var(--neon-cyan)' }}>{rsvpName}</strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Departemen: </span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {departments.find(d => d.id === rsvpDepartmentId)?.name || rsvpDepartmentId}
                </strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Status Kehadiran: </span>
                <span className={rsvpMode.toLowerCase().includes('onsite') ? 'badge-gold' : 'badge-cyan'} style={{ fontSize: '0.7rem' }}>
                  {rsvpMode}
                </span>
              </div>
              {rsvpNotes.trim() && (
                <div style={{ fontSize: '0.84rem', borderTop: '1px dashed var(--border-card)', paddingTop: '8px', marginTop: '2px' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Catatan Tambahan:</span>
                  <div style={{ color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4, fontSize: '0.82rem' }}>
                    "{rsvpNotes.trim()}"
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '4px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => setConfirmRsvpOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitRsvp}
                disabled={isSubmittingRsvp}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: isSubmittingRsvp ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} />
                <span>{isSubmittingRsvp ? 'Mengirim...' : 'Ya, Kirim Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
