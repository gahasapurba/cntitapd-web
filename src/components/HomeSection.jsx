import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Award, 
  Calendar, 
  Users, 
  Activity, 
  Heart, 
  Video, 
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function HomeSection({ 
  activeTenure, 
  divisions, 
  events, 
  members, 
  setCurrentTab,
  recruitmentInfo
}) {
  const pembina = members.find(m => m.category === 'pembina');
  const ketua = members.find(m => m.role === 'Ketua');
  const wakil = members.find(m => m.role === 'Wakil Ketua');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{
        position: 'relative',
        paddingTop: '60px',
        paddingBottom: '40px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '48px',
          alignItems: 'center',
        }}>
          {/* Left Column: Text & CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-gold">
                <Sparkles size={14} /> {activeTenure.title}
              </span>
              <span className="badge-cyan">
                Group IT Application Delivery
              </span>
            </div>

            <h1 style={{
              fontSize: '3.2rem',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#ffffff',
            }}>
              Membangun Budaya Sinergi,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FFA000 50%, #FFD54F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Energi Inovasi,
              </span>{' '}
              & Kebersamaan Insan APD.
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-muted)',
              maxWidth: '580px',
              lineHeight: 1.7,
            }}>
              Culture Network Team (CNT) adalah motor penggerak keharmonisan, kolaborasi, dan pengembangan talenta di lingkungan Group IT APD Direktorat IT Bank Mandiri.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <button
                onClick={() => setCurrentTab('oprec')}
                className="pulse-glow"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--accent-gold)',
                  color: '#0a1128',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-normal)'
                }}
              >
                <span>Daftar Open Recruitment 2026</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setCurrentTab('organisasi')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <span>Kenali Divisi Kami</span>
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-glass)',
            }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  {divisions.length} Divisi
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Fokus Program Unggulan</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {events.length}+ Event
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Rencana Culture 2026</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Insan APD Terhubung</div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Card / Visual Showcase */}
          <div style={{ position: 'relative' }}>
            <div className="glass-panel" style={{
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* Header inside card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src="/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-logomark.png" 
                    alt="APD Logomark" 
                    style={{ width: '32px', height: '32px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Kepemimpinan CNT</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>Periode {activeTenure.code}</div>
                  </div>
                </div>
                <span className="badge-gold">AKHLAK</span>
              </div>

              {/* Photo Showcase */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[pembina, ketua, wakil].filter(Boolean).map((person) => (
                  <div key={person.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <img 
                      src={person.image} 
                      alt={person.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        margin: '0 auto 8px auto',
                        border: `2px solid ${person.color || 'var(--accent-gold)'}`
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.shortName || person.name.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: person.color || 'var(--accent-gold)' }}>
                      {person.role}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tagline / Motto */}
              <div style={{
                background: 'rgba(255, 184, 0, 0.08)',
                borderLeft: '3px solid var(--accent-gold)',
                padding: '12px 16px',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                fontStyle: 'italic',
                marginBottom: '16px'
              }}>
                "{activeTenure.themeTagline}"
              </div>

              {/* Partner Logos */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                opacity: 0.85
              }}>
                <img 
                  src="/assets/Mandiri/01-Mandiri Master Brand Logo.png" 
                  alt="Bank Mandiri" 
                  style={{ height: '22px', objectFit: 'contain' }}
                />
                <img 
                  src="/assets/Danantara/main-danantara-indonesia-horizontal-logo.png" 
                  alt="Danantara Indonesia" 
                  style={{ height: '22px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECRUITMENT BANNER (IF OPEN) */}
      {recruitmentInfo.isOpen && (
        <section className="glass-panel" style={{
          padding: '36px 40px',
          background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.12) 0%, rgba(0, 82, 155, 0.25) 100%)',
          border: '1px solid rgba(255, 184, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            flexWrap: 'wrap',
          }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge-gold">
                  <Flame size={14} /> Open Recruitment Sedang Berlangsung!
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  Batas Akhir: {recruitmentInfo.deadline}
                </span>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                {recruitmentInfo.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Panggilan terbuka bagi seluruh Officer Group IT APD untuk menjadi bagian dari 4 divisi utama. Asah kepemimpinan, kembangkan portofolio, dan bangun relasi tak ternilai!
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('oprec')}
              className="pulse-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--accent-gold)',
                color: '#0a1128',
                padding: '16px 32px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Isi Formulir Sekarang</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* 3. DYNAMIC DIVISIONS SHOWCASE */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge-cyan" style={{ marginBottom: '12px' }}>
            4 Pilar Gerakan Budaya
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Divisi & Lingkup Peran CNT
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Setiap divisi mengemban misi spesifik untuk memastikan setiap insan IT APD merasa diapresiasi, bugar, dan terinspirasi.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px',
        }}>
          {divisions.map((div) => {
            const getIcon = () => {
              if (div.slug.includes('exp')) return <Activity size={24} color={div.color} />;
              if (div.slug.includes('wellbeing')) return <Heart size={24} color={div.color} />;
              if (div.slug.includes('creative')) return <Video size={24} color={div.color} />;
              return <Sparkles size={24} color={div.color} />;
            };

            return (
              <div 
                key={div.id}
                className="glass-panel"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderTop: `4px solid ${div.color}`,
                  transition: 'var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentTab('organisasi')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = div.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {getIcon()}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    {div.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: div.color, fontWeight: 600 }}>
                    Lead: {div.leadName}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                  {div.description}
                </p>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                    Fokus Program:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {div.focusAreas?.slice(0, 2).map((fa, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.72rem',
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)'
                      }}>
                        {fa}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. UPCOMING EVENTS TEASER */}
      <section>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div>
            <span className="badge-gold">Agenda Budaya</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
              Kegiatan & Program Terdekat
            </h2>
          </div>
          <button
            onClick={() => setCurrentTab('program')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-gold)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Lihat Semua Program</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {event.divisionName}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  {event.date}
                </span>
              </div>

              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {event.title}
              </h4>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                {event.description}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.78rem',
                color: 'var(--text-dim)'
              }}>
                <span>📍 {event.location}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>🎯 {event.kpi}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
