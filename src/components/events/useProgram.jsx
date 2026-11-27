// Logic of ProgramSection, moved verbatim from the component. Returns every value the view uses.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppNavigate } from '../../lib/appNavigation';
import { formatWibEventRange } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { fetchEventAttendees } from '../../lib/supabase';

export function useProgram({
  events = [],
  divisions = [],
  departments = [],
  activeTenure = null,
  registrationCounts,
  onAddEventRsvp,
  theme,
  onNavigateOprec,
  initialEventId = null,
  onSelectEventUrl,
  tenures = [],
  forms = [],
  onNavigateForm,
  onNavigateEventStats,
  galleries = [],
  onNavigateGallery
}) {
  const navigateTo = useAppNavigate();
  const isDark = theme === 'dark';
  const publicEvents = (events || []).filter((evt) => evt.isPublic === true);
  const [filterDiv, setFilterDiv] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'
  const [eventPage, setEventPage] = useState(1);
  const [calendarEventPage, setCalendarEventPage] = useState(1);
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);
  const [modalAttendees, setModalAttendees] = useState([]);

  // Attendee names for the open RSVP modal come from a public RPC (names and attendance mode only).
  useEffect(() => {
    setModalAttendees([]);
    if (!rsvpModalEvent?.id) return undefined;
    let cancelled = false;
    fetchEventAttendees(rsvpModalEvent.id)
      .then((list) => { if (!cancelled) setModalAttendees(list); })
      .catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, [rsvpModalEvent?.id]);
  const [sameDayModalEvents, setSameDayModalEvents] = useState([]);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [currentYear, setCurrentYear] = useState(() => {
    const firstWithDate = publicEvents.find(e => e.startDate && e.status !== 'Completed') || publicEvents.find(e => e.startDate);
    if (firstWithDate?.startDate) {
      const yr = parseInt(firstWithDate.startDate.split('-')[0], 10);
      if (!isNaN(yr)) return yr;
    }
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nowM = new Date().getMonth();
    const nowY = new Date().getFullYear();
    const hasEventThisMonth = publicEvents.some(e => {
      if (!e.startDate) return false;
      const parts = e.startDate.split('-');
      return parseInt(parts[0], 10) === nowY && (parseInt(parts[1], 10) - 1) === nowM;
    });
    if (hasEventThisMonth) return nowM;
    const firstWithDate = publicEvents.find(e => e.startDate && e.status !== 'Completed') || publicEvents.find(e => e.startDate);
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
    const tenureEvents = publicEvents.filter(e => e.tenureId === activeTenure.id && e.startDate);
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

  const [eventNotFound, setEventNotFound] = useState(false);
  const [eventDraftHidden, setEventDraftHidden] = useState(false);

  // Handle initial event from direct deep link only once
  useEffect(() => {
    if (initialEventId && events.length > 0) {
      if (lastHandledInitialId.current !== initialEventId) {
        lastHandledInitialId.current = initialEventId;
        const found = events.find(e => e.id === initialEventId);
        if (found) {
          if (found.isPublic === true) {
            setRsvpModalEvent(found);
            setEventNotFound(false);
            setEventDraftHidden(false);
            if (activeTenure?.id && found.tenureId && found.tenureId !== activeTenure.id) {
              setTenureFilter('all');
            }
          } else {
            // Event ini dalam status Draft (disembunyikan dari publik)
            setRsvpModalEvent(null);
            setEventNotFound(false);
            setEventDraftHidden(true);
          }
        } else {
          setEventNotFound(true);
          setEventDraftHidden(false);
        }
      }
    } else if (!initialEventId) {
      lastHandledInitialId.current = null;
      setRsvpModalEvent(null);
      setEventNotFound(false);
      setEventDraftHidden(false);
    }
  }, [initialEventId, events, activeTenure]);

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
      setSameDayModalEvents(dayEventsList.filter(e => e.isPublic === true));
    } else if (evt?.startDate) {
      const dateKey = evt.startDate.slice(0, 10);
      const matches = publicEvents.filter(e => {
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
    return `${getPublicBaseUrl()}/?event=${encodeURIComponent(evtId)}#event`;
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

  const handleFinalSubmitRsvp = async () => {
    if (!rsvpModalEvent || isSubmittingRsvp) return;
    setConfirmRsvpOpen(false);
    setIsSubmittingRsvp(true);
    if (onAddEventRsvp) {
      try {
        const stored = await onAddEventRsvp({
          eventId: rsvpModalEvent.id,
          attendeeName: rsvpName.trim(),
          departmentId: rsvpDepartmentId,
          attendanceMode: rsvpMode,
          notes: rsvpNotes.trim()
        });
        setModalAttendees(prev => [stored, ...prev]);
      } catch (err) {
        console.error(err);
        setIsSubmittingRsvp(false);
        setRsvpErrors({ rsvpName: err.code ? err.message : 'Konfirmasi kehadiran gagal dikirim ke server. Silakan periksa koneksi lalu coba lagi.' });
        return;
      }
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
    ?publicEvents.filter((evt) => evt.tenureId === activeTenure.id)
    : publicEvents;

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

  return {
    activeTab,
    activeTenure,
    calendarEventPage,
    calendarEvents,
    confirmRsvpOpen,
    copiedEventId,
    currentMonth,
    currentYear,
    departments,
    divisions,
    eventDraftHidden,
    eventNotFound,
    eventPage,
    events,
    filterDiv,
    filteredEvents,
    forms,
    galleries,
    getEventDirectUrl,
    handleCloseEventModal,
    handleCopyEventLink,
    handleFinalSubmitRsvp,
    handleOpenConfirmRsvp,
    handleOpenEventModal,
    handleShareEventWa,
    hoveredDate,
    initialEventId,
    isDark,
    isSubmittingRsvp,
    lastHandledInitialId,
    modalAttendees,
    navigateTo,
    onAddEventRsvp,
    onNavigateEventStats,
    onNavigateForm,
    onNavigateGallery,
    onNavigateOprec,
    onSelectEventUrl,
    publicEvents,
    quarters,
    registrationCounts,
    rsvpDepartmentId,
    rsvpErrors,
    rsvpModalEvent,
    rsvpMode,
    rsvpName,
    rsvpNotes,
    rsvpSuccess,
    sameDayModalEvents,
    scopedDivisions,
    scopedEvents,
    setActiveTab,
    setCalendarEventPage,
    setConfirmRsvpOpen,
    setCopiedEventId,
    setCurrentMonth,
    setCurrentYear,
    setEventDraftHidden,
    setEventNotFound,
    setEventPage,
    setFilterDiv,
    setHoveredDate,
    setIsSubmittingRsvp,
    setModalAttendees,
    setRsvpDepartmentId,
    setRsvpErrors,
    setRsvpModalEvent,
    setRsvpMode,
    setRsvpName,
    setRsvpNotes,
    setRsvpSuccess,
    setSameDayModalEvents,
    setTenureFilter,
    setViewMode,
    tenureFilter,
    tenureYear,
    tenures,
    theme,
    viewMode
  };
}
