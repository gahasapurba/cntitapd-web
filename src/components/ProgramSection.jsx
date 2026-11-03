import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight,
  Filter,
  Grid,
  CalendarDays,
  Info,
  X,
  Users,
  Download,
  ExternalLink
} from 'lucide-react';

export default function ProgramSection({ events = [], divisions = [], activeTenure = null, theme, onNavigateOprec }) {
  const isDark = theme === 'dark';
  const [filterDiv, setFilterDiv] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2); // 2 = Maret (Q1 kick-off)
  const [hoveredDate, setHoveredDate] = useState(null);

  const hasTenureEvents = activeTenure?.id
    ? events.some((evt) => !evt.tenureId || evt.tenureId === activeTenure.id)
    : false;

  const scopedEvents = (tenureFilter === 'active' && activeTenure?.id && hasTenureEvents)
    ? events.filter((evt) => !evt.tenureId || evt.tenureId === activeTenure.id)
    : events;

  const filteredEvents = scopedEvents.filter((evt) => {
    const matchesDiv = filterDiv === 'all' || evt.divisionId === filterDiv;
    const matchesTab = activeTab === 'all' || (activeTab === 'upcoming' && evt.status !== 'Completed');
    return matchesDiv && matchesTab;
  });

  // Quarter breakdown for Calendar View
  const quarters = [
    { id: 'Q1', label: 'Q1 2026 (Jan - Mar)', color: '#0ea5e9', desc: 'Kick-off Budaya, Turnamen E-Sports & Aksi Donor Darah' },
    { id: 'Q2', label: 'Q2 2026 (Apr - Jun)', color: '#10b981', desc: 'Ramadan Charity, Grand Gathering & Family Teambuilding' },
    { id: 'Q3', label: 'Q3 2026 (Jul - Sep)', color: '#a855f7', desc: 'Tech Hackathon, Turnamen Olahraga & Wellness Sharing' },
    { id: 'Q4', label: 'Q4 2026 (Okt - Des)', color: '#ffb800', desc: 'APD Got Talent, Townhall Akhir Tahun & Apresiasi Akbar' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-cyan" style={{ marginBottom: '12px' }}>
          Kalender & Program Budaya
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Program Kerja & Event CNT IT APD
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
              onClick={() => setViewMode('grid')}
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
              <span>Daftar Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
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
              onClick={() => setActiveTab('upcoming')}
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
              onClick={() => setActiveTab('all')}
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
                onClick={() => setTenureFilter('active')}
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
                Periode {activeTenure.code || activeTenure.label}
              </button>
              <button
                type="button"
                onClick={() => setTenureFilter('all')}
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
                 lintas Tahun ({events.length})
              </button>
            </div>
          )}

          <Filter size={16} color="var(--text-dim)" />
          <select
            value={filterDiv}
            onChange={(e) => setFilterDiv(e.target.value)}
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
            <option value="all">Semua Divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: GRID VIEW */}
      {viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
          gap: '24px',
        }}>
          {filteredEvents.map((evt) => {
            const divInfo = divisions.find(d => d.id === evt.divisionId);
            const isCompleted = evt.status === 'Completed';

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
                      {evt.date}
                    </span>
                    {evt.badge && (
                      <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                        {evt.badge}
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
                    <Target size={15} color="var(--mandiri-gold)" />
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Target: {evt.kpi}</span>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    className="btn-rsvp-action"
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(14, 165, 233, 0.12)',
                      color: 'var(--neon-cyan)',
                      border: '1.5px solid var(--neon-cyan)',
                      padding: '11px 18px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 15px rgba(14, 165, 233, 0.15)'
                    }}
                    onClick={() => setRsvpModalEvent(evt)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--neon-cyan)';
                      e.currentTarget.style.color = '#040914';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(14, 165, 233, 0.12)';
                      e.currentTarget.style.color = 'var(--neon-cyan)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>RSVP / Info Detail Kegiatan</span>
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
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

        // Calculate active month events
        const currentMonthEvents = filteredEvents.filter(evt => {
          if (!evt.startDate) return false;
          const s = new Date(evt.startDate);
          const e = evt.endDate ? new Date(evt.endDate) : s;
          const targetStart = new Date(currentYear, currentMonth, 1);
          const targetEnd = new Date(currentYear, currentMonth + 1, 0);
          return (s <= targetEnd && e >= targetStart);
        });

        const totalDays = daysInMonth(currentYear, currentMonth);
        const startDayOffset = firstDayOfWeek(currentYear, currentMonth);

        const handlePrevMonth = () => {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
          } else {
            setCurrentMonth(prev => prev - 1);
          }
        };

        const handleNextMonth = () => {
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
                    {currentMonthEvents.length} Program Kerja Terjadwal Bulan Ini
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
                    setCurrentMonth(2); // Maret 2026
                    setCurrentYear(2026);
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
                  Hari Ini
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
                  gap: '8px'
                }}>
                  {/* Empty cells before month begins */}
                  {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      style={{
                        height: '100px',
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
                    const dayEvents = filteredEvents.filter(evt => {
                      if (!evt.startDate) return false;
                      const s = evt.startDate;
                      const e = evt.endDate || s;
                      return fullDateStr >= s && fullDateStr <= e;
                    });

                    const hasEvents = dayEvents.length > 0;
                    const primaryDiv = divisions.find(d => d.id === dayEvents[0]?.divisionId);
                    const tagColor = primaryDiv?.color || 'var(--mandiri-gold)';

                    return (
                      <div
                        key={dayNum}
                        onClick={() => {
                          if (hasEvents) setRsvpModalEvent(dayEvents[0]);
                        }}
                        onMouseEnter={() => {
                          if (hasEvents) setHoveredDate(fullDateStr);
                        }}
                        onMouseLeave={() => setHoveredDate(null)}
                        style={{
                          minHeight: '78px',
                          maxHeight: '78px',
                          borderRadius: 'var(--radius-sm)',
                          background: hasEvents 
                            ? (isDark ? `${tagColor}22` : `${tagColor}15`) 
                            : 'var(--bg-card)',
                          border: hasEvents 
                            ? `2px solid ${tagColor}` 
                            : '1px solid var(--border-card)',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          cursor: hasEvents ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                          boxShadow: hasEvents ? `0 2px 10px ${tagColor}25` : 'none',
                          overflow: 'visible'
                        }}
                      >
                        {/* Date Number Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: hasEvents ? 900 : 600,
                            color: hasEvents ? tagColor : 'var(--text-main)',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: hasEvents ? (isDark ? '#040914' : '#ffffff') : 'transparent'
                          }}>
                            {dayNum}
                          </span>
                          {hasEvents && dayEvents.length > 1 && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              background: tagColor,
                              color: '#040914',
                              padding: '1px 5px',
                              borderRadius: '8px',
                              lineHeight: 1
                            }}>
                              +{dayEvents.length - 1}
                            </span>
                          )}
                        </div>

                        {/* Single-line Truncated Event Label (e.g. "APD E-Sports Cha...") */}
                        {hasEvents ? (
                          <div style={{ marginTop: 'auto', width: '100%' }}>
                            {(() => {
                              const ev = dayEvents[0];
                              const divObj = divisions.find(d => d.id === ev.divisionId);
                              const col = divObj?.color || tagColor;

                              return (
                                <div
                                  style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
                                    color: col,
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    borderLeft: `2.5px solid ${col}`,
                                    lineHeight: 1.25,
                                    width: '100%'
                                  }}
                                  title={ev.title}
                                >
                                  {ev.title}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div style={{ height: '14px' }} />
                        )}

                        {/* Interactive Floating Hover Popover (Jika ada 1 atau lebih event tumpang tindih) */}
                        {hoveredDate === fullDateStr && hasEvents && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 'calc(100% + 8px)',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 100,
                              minWidth: '220px',
                              maxWidth: '280px',
                              background: isDark ? '#0b1329' : '#ffffff',
                              border: `1.5px solid ${tagColor}`,
                              borderRadius: 'var(--radius-md)',
                              boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              pointerEvents: 'none'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid var(--border-card)', paddingBottom: '4px' }}>
                              📅 {dayNum} {monthNames[currentMonth]} {currentYear} • {dayEvents.length} Agenda
                            </div>
                            {dayEvents.map((ev, evIdx) => {
                              const divObj = divisions.find(d => d.id === ev.divisionId);
                              return (
                                <div key={ev.id || evIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: divObj?.color || tagColor,
                                      flexShrink: 0
                                    }} />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                                      {ev.title}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '12px' }}>
                                    {ev.divisionName || divObj?.name} • 📍 {ev.location}
                                  </div>
                                </div>
                              );
                            })}
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
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--mandiri-gold)" />
                <span>Rincian Event Terjadwal Bulan {monthNames[currentMonth]} {currentYear}:</span>
              </div>

              {currentMonthEvents.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Tidak ada agenda program kerja pada bulan {monthNames[currentMonth]} {currentYear}. Gunakan tombol bulan untuk melihat agenda di bulan lainnya.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {currentMonthEvents.map((evt) => {
                    const divInfo = divisions.find(d => d.id === evt.divisionId);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setRsvpModalEvent(evt)}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: divInfo?.color || 'var(--mandiri-gold)', textTransform: 'uppercase' }}>
                            {evt.divisionName || divInfo?.name}
                          </span>
                          <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                            {evt.status}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                          {evt.title}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                          📅 {evt.startDate} s/d {evt.endDate}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="var(--mandiri-blue)" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.location}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SLEEK PROFESSIONAL RSVP MODAL (Tanpa alert kuno bawaan browser) */}
      {rsvpModalEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            position: 'relative',
            border: '1px solid var(--mandiri-blue)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <button
              onClick={() => setRsvpModalEvent(null)}
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
                justifyContent: 'center'
              }}>
                <Info size={22} />
              </div>
              <div>
                <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                  RSVP • {rsvpModalEvent.date}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {rsvpModalEvent.title}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {rsvpModalEvent.description}
            </p>

            <div style={{
              background: 'rgba(0, 61, 121, 0.05)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--mandiri-blue)" />
                <strong>Lokasi:</strong> <span>{rsvpModalEvent.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={15} color="var(--mandiri-gold)" />
                <strong>Target Partisipasi:</strong> <span>{rsvpModalEvent.kpi}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={15} color="var(--neon-emerald)" />
                <strong>Divisi Penyelenggara:</strong> <span>{rsvpModalEvent.divisionName || 'CNT IT APD'}</span>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'rgba(255, 184, 0, 0.1)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}>
              📢 <strong>Informasi Pembukaan RSVP:</strong> Pendaftaran dan konfirmasi kehadiran dibuka melalui Hub Registrasi atau pengumuman resmi di <strong>Channel MS Teams Group IT APD</strong>.
            </div>

            {/* Add to Calendar Actions (Outlook .ics & Google Calendar) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const sRaw = (rsvpModalEvent.startDate || '2026-03-10').replace(/-/g, '');
                  const eDateObj = new Date(rsvpModalEvent.endDate || rsvpModalEvent.startDate || '2026-03-10');
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
                  const sRaw = (rsvpModalEvent.startDate || '2026-03-10').replace(/-/g, '');
                  const eDateObj = new Date(rsvpModalEvent.endDate || rsvpModalEvent.startDate || '2026-03-10');
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {onNavigateOprec && (
                <button
                  type="button"
                  onClick={() => {
                    setRsvpModalEvent(null);
                    onNavigateOprec();
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--mandiri-gold)',
                    color: '#040914',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Ke Hub Registrasi
                </button>
              )}
              <button
                type="button"
                onClick={() => setRsvpModalEvent(null)}
                style={{
                  flex: 1,
                  background: 'var(--mandiri-blue)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
