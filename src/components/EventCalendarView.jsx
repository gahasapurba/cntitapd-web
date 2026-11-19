import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  MapPin, 
  Sparkles, 
  Edit2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatWibEventRange, isEventPassed } from '../utils/dateUtils';
import { getUnifiedEventAttendees } from '../utils/quotaUtils';

// Helper to determine optimal high-contrast text color (black vs white) on dynamic colored badges
function getBadgeTextColor(bgColor) {
  if (!bgColor) return '#ffffff';
  const lower = String(bgColor).toLowerCase();
  if (lower.includes('gold') || lower.includes('yellow') || lower.includes('#ffb800') || lower.includes('#f59e0b')) return '#040914';
  if (lower.includes('blue') || lower.includes('navy') || lower.includes('purple') || lower.includes('rose') || lower.includes('dark')) return '#ffffff';
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 155) ? '#040914' : '#ffffff';
    }
  }
  return '#ffffff';
}

export default function EventCalendarView({
  events = [],
  divisions = [],
  forms = [],
  eventRsvps = [],
  submissions = [],
  theme = 'dark',
  activeTenure = null,
  onSelectEvent = null,
  onEditEvent = null,
  isAdmin = false
}) {
  const isDark = theme === 'dark';

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const [currentYear, setCurrentYear] = useState(() => {
    const firstWithDate = events.find(e => e.startDate && e.status !== 'Completed') || events.find(e => e.startDate);
    if (firstWithDate?.startDate) {
      const parsedYear = new Date(firstWithDate.startDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 2000 && parsedYear < 2100) return parsedYear;
    }
    if (activeTenure?.code) {
      const tenureYear = parseInt(activeTenure.code, 10);
      if (!isNaN(tenureYear) && tenureYear > 2000 && tenureYear < 2100) return tenureYear;
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const nowM = now.getMonth();
    const nowY = now.getFullYear();
    const activeEventsInCurrentYear = events.filter(e => {
      if (!e.startDate || e.status === 'Completed') return false;
      const d = new Date(e.startDate);
      return d.getFullYear() === currentYear;
    });
    if (activeEventsInCurrentYear.length > 0) {
      const futureOrCurrentMonthEvents = activeEventsInCurrentYear.filter(e => new Date(e.startDate).getMonth() >= nowM);
      if (futureOrCurrentMonthEvents.length > 0) {
        return new Date(futureOrCurrentMonthEvents[0].startDate).getMonth();
      }
      return new Date(activeEventsInCurrentYear[0].startDate).getMonth();
    }
    return nowM;
  });

  const [calendarEventPage, setCalendarEventPage] = useState(1);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Auto-sync calendar view to active tenure's event dates when tenure changes
  useEffect(() => {
    if (!activeTenure?.id) return;
    const tenureEvents = events.filter(e => e.tenureId === activeTenure.id && e.startDate);
    if (tenureEvents.length > 0) {
      const upcoming = tenureEvents.find(e => e.status !== 'Completed' && new Date(e.startDate) >= new Date());
      const target = upcoming || tenureEvents[0];
      const d = new Date(target.startDate);
      if (!isNaN(d.getFullYear())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
        setCalendarEventPage(1);
      }
    } else if (activeTenure?.code) {
      const tenureYear = parseInt(activeTenure.code, 10);
      if (!isNaN(tenureYear) && tenureYear > 2000 && tenureYear < 2100) {
        setCurrentYear(tenureYear);
        setCalendarEventPage(1);
      }
    }
  }, [activeTenure?.id, activeTenure?.code]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

  // Calculate active month events (includes all scheduled events for the calendar month)
  const currentMonthEvents = events.filter(evt => {
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

  const handleEventClick = (evt, sameDayEvents = []) => {
    if (onSelectEvent) {
      onSelectEvent(evt, sameDayEvents);
    } else if (isAdmin && onEditEvent) {
      onEditEvent(evt);
    }
  };

  const CALENDAR_EVENTS_PER_PAGE = 9;
  const totalCalendarPages = Math.ceil(currentMonthEvents.length / CALENDAR_EVENTS_PER_PAGE) || 1;
  const safeCalendarPage = Math.min(Math.max(1, calendarEventPage), totalCalendarPages);
  const paginatedCalendarEvents = currentMonthEvents.slice(
    (safeCalendarPage - 1) * CALENDAR_EVENTS_PER_PAGE,
    safeCalendarPage * CALENDAR_EVENTS_PER_PAGE
  );

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
              {isAdmin && (
                <span style={{ marginLeft: '6px', color: 'var(--neon-cyan)' }}>
                  ({currentMonthEvents.filter(e => e.isPublic === true).length} Publik, {currentMonthEvents.filter(e => !e.isPublic).length} Draft)
                </span>
              )}
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
              const dayEvents = events.filter(evt => {
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
              const isTopHalf = rowIndex <= 1;
              const isLeftCol = colIndex <= 1;
              const isRightCol = colIndex >= 5;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    if (hasEvents) handleEventClick(dayEvents[0], dayEvents);
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
                        const isEvtDraft = ev.isPublic !== true;

                        return (
                          <div
                            key={ev.id || evIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(ev, dayEvents);
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
                              opacity: isEvtComp ? 0.75 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title={`${ev.title}${isEvtComp ? ' (Selesai)' : ''}${isAdmin ? (isEvtDraft ? ' [Draft/Privat]' : ' [Publik]') : ''}`}
                          >
                            {isAdmin && isEvtDraft && (
                              <span style={{ fontSize: '0.55rem', color: '#f43f5e', fontWeight: 800 }}>○</span>
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isEvtComp ? `✓ ${ev.title}` : ev.title}
                            </span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(dayEvents[0], dayEvents);
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

                  {/* Interactive Floating Hover Popover */}
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
                      {/* Hover Bridge */}
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
                          const isDraft = ev.isPublic !== true;

                          return (
                            <div
                              key={ev.id || evIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(ev, dayEvents);
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
                                {isAdmin && (
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    background: isDraft ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isDraft ? '#f43f5e' : '#10b981'
                                  }}>
                                    {isDraft ? 'Draft' : 'Publik'}
                                  </span>
                                )}
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
                        {isAdmin ? (
                          <span>💡 Klik salah satu agenda untuk melihat detail / mengedit event</span>
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {paginatedCalendarEvents.map((evt) => {
                const divInfo = divisions.find(d => d.id === evt.divisionId);
                const isDraft = evt.isPublic !== true;

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt)}
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
                        {isAdmin && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: isDraft ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isDraft ? '#f43f5e' : '#10b981'
                          }}>
                            {isDraft ? '○ Draft' : '● Publik'}
                          </span>
                        )}
                        {(() => {
                          const attendeeInfo = getUnifiedEventAttendees(evt, forms, eventRsvps, submissions);
                          if (attendeeInfo.isLimited && attendeeInfo.maxQuota > 0) {
                            return (
                              <span className={attendeeInfo.isFull ? "badge-red" : "badge-gold"} style={{ fontSize: '0.64rem' }}>
                                Kuota: {attendeeInfo.count}/{attendeeInfo.maxQuota} {attendeeInfo.isFull ? '(Penuh)' : ''}
                              </span>
                            );
                          }
                          return null;
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
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--mandiri-blue)" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.location}</span>
                      </div>
                      {isAdmin && onEditEvent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(evt);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid var(--mandiri-blue)',
                            color: 'var(--neon-cyan)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                      )}
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
                          fontWeight: 700,
                          border: isActive ? 'none' : '1px solid var(--border-card)',
                          background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                          color: isActive ? '#0a1128' : 'var(--text-main)',
                          cursor: 'pointer'
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
        )}
      </div>
    </div>
  );
}

