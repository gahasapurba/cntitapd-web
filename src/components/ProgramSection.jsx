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
  Users
} from 'lucide-react';

export default function ProgramSection({ events = [], divisions = [] }) {
  const [filterDiv, setFilterDiv] = useState('all');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);

  const filteredEvents = events.filter((evt) => {
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
              Semua ({events.length})
            </button>
          </div>
        </div>

        {/* Division Filter (Dinamis dari divisions) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
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
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'var(--bg-card)',
                      color: 'var(--mandiri-blue)',
                      border: '1px solid var(--mandiri-blue)',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setRsvpModalEvent(evt)}
                  >
                    <span>RSVP / Info Detail Kegiatan</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE CALENDAR ROADMAP VIEW */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {quarters.map((q) => {
            const quarterEvents = filteredEvents.filter(e => e.date?.includes(q.id));

            return (
              <div key={q.id} className="glass-panel" style={{
                padding: '24px',
                borderLeft: `6px solid ${q.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: `${q.color}20`,
                      color: q.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      {q.id}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {q.label}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {q.desc}
                      </p>
                    </div>
                  </div>
                  <span className="badge-cyan" style={{ fontSize: '0.72rem' }}>
                    {quarterEvents.length} Agenda
                  </span>
                </div>

                {quarterEvents.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    Belum ada agenda program kerja terjadwal untuk kuartal ini.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {quarterEvents.map((evt) => {
                      const divInfo = divisions.find(d => d.id === evt.divisionId);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setRsvpModalEvent(evt)}
                          className="glass-panel-hover"
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-card)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: divInfo?.color || 'var(--mandiri-gold)', textTransform: 'uppercase' }}>
                              {evt.divisionName || divInfo?.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              {evt.status}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                            {evt.title}
                          </h4>
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
            );
          })}
        </div>
      )}

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
              📢 <strong>Informasi Pembukaan RSVP:</strong> Pendaftaran dan konfirmasi kehadiran akan dibuka H-14 sebelum kegiatan melalui pengumuman resmi di <strong>Channel MS Teams Group IT APD</strong>.
            </div>

            <button
              onClick={() => setRsvpModalEvent(null)}
              style={{
                background: 'var(--mandiri-blue)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
