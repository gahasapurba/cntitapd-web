import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Users, 
  Zap, 
  DollarSign, 
  Award, 
  ChevronRight,
  Flame,
  Activity,
  Heart,
  Video,
  Rocket
} from 'lucide-react';
import { soundFx } from '../utils/audio';

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

  const handleTabChange = (tabId) => {
    soundFx.playClick();
    setCurrentTab(tabId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      
      {/* 1. HERO SECTION (Cosmic Presentation Style) */}
      <section style={{
        position: 'relative',
        paddingTop: '50px',
        paddingBottom: '30px',
        textAlign: 'center',
      }}>
        {/* Top Floating Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div className="glass-panel-gold" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 184, 0, 0.5)',
            boxShadow: '0 0 20px rgba(255, 184, 0, 0.25)',
          }}>
            <Rocket size={16} color="var(--mandiri-gold)" />
            <span style={{
              color: 'var(--mandiri-gold)',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              PORTAL RESMI • CNT GROUP IT APD {activeTenure.code}
            </span>
          </div>
        </div>

        {/* Main Cosmic Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.8rem)',
          lineHeight: 1.1,
          fontWeight: 900,
          color: 'var(--text-main)',
          maxWidth: '1000px',
          margin: '0 auto 24px auto',
          letterSpacing: '-0.03em'
        }}>
          COMMITTED TO CULTIVATE{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FFB800 0%, #38bdf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 35px rgba(56, 189, 248, 0.3)'
          }}>
            EXCELLENCE & SYNERGY
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '820px',
          margin: '0 auto 36px auto',
          lineHeight: 1.7,
        }}>
          Pusat gerakan budaya kerja <strong style={{ color: 'var(--text-main)' }}>Culture Network Team (CNT)</strong> Group IT Application Delivery, Direktorat IT Bank Mandiri. Mengobarkan semangat kolaborasi lintas squad, inovasi engineering, dan harmoni kerja.
        </p>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button
            onClick={() => handleTabChange('oprec')}
            className="pulse-glow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #FFB800 0%, #e0a300 100%)',
              color: '#040914',
              padding: '16px 36px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(255, 184, 0, 0.4)'
            }}
          >
            <span>Daftar Open Recruitment {activeTenure.code}</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => handleTabChange('organisasi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(10, 18, 40, 0.8)',
              color: 'var(--text-main)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '16px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Compass size={18} color="var(--neon-cyan)" />
            <span>Jelajahi Struktur Organisasi</span>
          </button>
        </div>

        {/* Quick Stats Grid (Identik dengan presentasi) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px auto'
            }}>
              <Users size={22} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'monospace' }}>
              8 Personel
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inti & Pimpro CNT</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(255, 184, 0, 0.3)' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 184, 0, 0.15)',
              color: 'var(--mandiri-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px auto'
            }}>
              <Zap size={22} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'monospace' }}>
              {divisions.length} Divisi
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pilar Inisiatif Budaya</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(192, 132, 252, 0.15)',
              color: 'var(--neon-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px auto'
            }}>
              <Activity size={22} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--mandiri-gold)', fontFamily: 'monospace' }}>
              {events.length}+ Event
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Agenda Kerja Terencana</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.15)',
              color: 'var(--neon-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px auto'
            }}>
              <Award size={22} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'monospace' }}>
              100%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Insan APD Terkoneksi</div>
          </div>
        </div>
      </section>

      {/* 2. RECRUITMENT BANNER (Cosmic Cyber Card) */}
      {recruitmentInfo.isOpen && (
        <section className="glass-panel-hover" style={{
          background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.15) 0%, rgba(4, 9, 20, 0.95) 60%, rgba(56, 189, 248, 0.15) 100%)',
          border: '1px solid rgba(255, 184, 0, 0.5)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 44px',
          boxShadow: '0 0 35px rgba(255, 184, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="badge-gold">
                <Flame size={14} /> Open Recruitment Sedang Berlangsung!
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontFamily: 'monospace', fontWeight: 700 }}>
                Deadline: {recruitmentInfo.deadline}
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '10px' }}>
              {recruitmentInfo.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Panggilan pengabdian bagi seluruh Officer Group IT APD. Berdayakan ide kreatifmu, jalin koneksi berharga, dan cetak dampak nyata bagi lingkungan kerja kita.
            </p>
          </div>

          <button
            onClick={() => handleTabChange('oprec')}
            className="pulse-glow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              padding: '16px 36px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 900,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Daftar Sekarang</span>
            <ArrowRight size={18} />
          </button>
        </section>
      )}

      {/* 3. 4 PILAR DIVISI (Dynamic Cards) */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="badge-cyan" style={{ marginBottom: '10px' }}>
            4 Pilar Gerakan Budaya
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '10px' }}>
            Divisi & Ruang Lingkup CNT
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Setiap pilar dikawal oleh Pimpinan Proyek (Pimpro) berdedikasi tinggi
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderTop: `4px solid ${div.color}`,
                  cursor: 'pointer'
                }}
                onClick={() => handleTabChange('organisasi')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {getIcon()}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: div.color, fontWeight: 800 }}>
                    DIVISI 0{divisions.indexOf(div) + 1}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {div.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: div.color, fontWeight: 700 }}>
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
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                    Fokus Inisiatif:
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

    </div>
  );
}
