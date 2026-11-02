import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Sparkles, 
  Activity, 
  Heart, 
  Video, 
  CheckCircle2, 
  ShieldCheck, 
  Target,
  Mail,
  ChevronRight
} from 'lucide-react';

export default function OrganizationSection({ activeTenure, divisions, members }) {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]?.id || 'all');

  const pembina = members.filter(m => m.category === 'pembina');
  const inti = members.filter(m => m.category === 'inti');
  const pimpro = members.filter(m => m.category === 'pimpro');

  const filteredPimpro = selectedDivision === 'all' 
    ? pimpro 
    : pimpro.filter(p => p.divisionId === selectedDivision);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Struktur & Kepengurusan
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
          Organigram CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Sinergi kepengurusan <strong style={{ color: '#fff' }}>{activeTenure.title}</strong> yang berdedikasi mengabdi untuk menciptakan ekosistem kerja yang harmonis, produktif, dan penuh apresiasi.
        </p>
      </div>

      {/* 1. PEMBINA & EXECUTIVE ADVISOR */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <Crown size={22} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pembina & Senior Executive Advisor
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {pembina.map((advisor) => (
            <div 
              key={advisor.id} 
              className="glass-panel"
              style={{
                maxWidth: '680px',
                width: '100%',
                padding: '32px',
                display: 'flex',
                gap: '28px',
                alignItems: 'center',
                border: '1px solid rgba(255, 184, 0, 0.4)',
                background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.08) 0%, rgba(10, 17, 40, 0.9) 100%)',
                boxShadow: 'var(--shadow-gold)'
              }}
            >
              <img 
                src={advisor.image} 
                alt={advisor.name}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent-gold)',
                  boxShadow: '0 0 20px rgba(255,184,0,0.3)',
                  flexShrink: 0
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="badge-gold" style={{ alignSelf: 'flex-start' }}>
                  {advisor.badge}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {advisor.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  {advisor.title}
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  "{advisor.motto}"
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {advisor.responsibilities?.map((resp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      <CheckCircle2 size={13} color="var(--accent-gold)" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TIM INTI (KETUA, WAKIL, SEKBEN) */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tim Inti CNT IT APD
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Nakhoda operasional, strategi penganggaran (RAB), dan tata kelola organisasi
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {inti.map((member) => (
            <div 
              key={member.id} 
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                borderTop: `3px solid ${member.color || 'var(--accent-gold)'}`,
                transition: 'var(--transition-fast)'
              }}
            >
              <img 
                src={member.image} 
                alt={member.name}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${member.color || 'var(--accent-gold)'}`,
                  marginBottom: '4px'
                }}
              />
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: member.color || 'var(--accent-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {member.role}
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {member.name}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {member.title}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                width: '100%'
              }}>
                "{member.motto}"
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PIMPRO & DIVISI DETAIL */}
      <section>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pimpinan Proyek (Pimpro) Divisi
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Penyusun inisiatif spesifik dan motor eksekusi lapangan per divisi
            </p>
          </div>

          {/* Division Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedDivision('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.15)',
                background: selectedDivision === 'all' ? 'var(--accent-gold)' : 'transparent',
                color: selectedDivision === 'all' ? '#0a1128' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Semua Divisi
            </button>
            {divisions.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDivision(d.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: `1px solid ${selectedDivision === d.id ? d.color : 'rgba(255,255,255,0.15)'}`,
                  background: selectedDivision === d.id ? d.color : 'transparent',
                  color: selectedDivision === d.id ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pimpro Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {filteredPimpro.map((lead) => {
            const divInfo = divisions.find(d => d.id === lead.divisionId);
            return (
              <div 
                key={lead.id}
                className="glass-panel"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderTop: `4px solid ${lead.color || '#00529b'}`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <img 
                    src={lead.image} 
                    alt={lead.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      border: `2px solid ${lead.color || 'var(--accent-gold)'}`,
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: lead.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {lead.badge}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                      {lead.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lead.role}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  fontStyle: 'italic',
                  borderLeft: `2px solid ${lead.color}`
                }}>
                  "{lead.motto}"
                </div>

                {divInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Fokus Ruang Lingkup Divisi:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {divInfo.focusAreas?.map((area, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.72rem',
                          background: 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          • {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
