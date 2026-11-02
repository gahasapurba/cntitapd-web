import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight,
  Filter
} from 'lucide-react';

export default function ProgramSection({ events, divisions }) {
  const [filterDiv, setFilterDiv] = useState('all');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all'

  const filteredEvents = events.filter((evt) => {
    const matchesDiv = filterDiv === 'all' || evt.divisionId === filterDiv;
    const matchesTab = activeTab === 'all' || (activeTab === 'upcoming' && evt.status !== 'Completed');
    return matchesDiv && matchesTab;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-cyan" style={{ marginBottom: '12px' }}>
          Kalender & Program Budaya
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
          Program Kerja & Event CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Rangkaian inisiatif terpadu untuk membangun keakraban tim, kesehatan mental & fisik, serta wadah ekspresi bakat seluruh insan IT APD.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Status Tab */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'upcoming' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'upcoming' ? '#0a1128' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Akan Datang (Upcoming)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'all' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'all' ? '#0a1128' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Semua Program
          </button>
        </div>

        {/* Division Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} color="var(--text-dim)" />
          <select
            value={filterDiv}
            onChange={(e) => setFilterDiv(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: '#0f1c3f' }}>Semua Divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id} style={{ background: '#0f1c3f' }}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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
                borderLeft: `5px solid ${divInfo?.color || 'var(--accent-gold)'}`,
                opacity: isCompleted ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: divInfo?.color || 'var(--accent-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {evt.divisionName}
                </span>

                <span style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(255, 184, 0, 0.15)',
                  color: isCompleted ? 'var(--text-muted)' : 'var(--accent-gold)',
                  fontWeight: 700
                }}>
                  {isCompleted ? '✓ Selesai' : evt.date}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                {evt.title}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                {evt.description}
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.82rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                  <MapPin size={15} color="var(--accent-cyan)" />
                  <span>{evt.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                  <Target size={15} color="var(--accent-gold)" />
                  <span style={{ color: '#fff', fontWeight: 600 }}>Target: {evt.kpi}</span>
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
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onClick={() => alert(`Informasi RSVP untuk ${evt.title} akan dibuka mendekati jadwal kegiatan melalui channel MS Teams Group IT APD!`)}
                >
                  <span>RSVP / Info Detail Kegiatan</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
