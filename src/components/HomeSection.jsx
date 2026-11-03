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
  ChevronDown,
  Flame,
  Activity,
  Heart,
  Video,
  Rocket,
  Target,
  ShieldCheck,
  Crown,
  Calendar,
  MapPin,
  HelpCircle,
  Search,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { getDeadlineStatus } from '../utils/dateUtils';

export default function HomeSection({ 
  activeTenure, 
  divisions, 
  events, 
  members, 
  setCurrentTab,
  recruitmentInfo,
  forms = [],
  eventRsvps = [],
  kudosList = [],
  faqs = [],
  onSubmitFaqQuestion,
  theme,
  pageVisibility = {}
}) {
  const isDark = theme === 'dark';
  const [openFaqId, setOpenFaqId] = useState('faq-1');
  const [faqCategory, setFaqCategory] = useState('Semua');
  const [faqSearch, setFaqSearch] = useState('');
  const [askName, setAskName] = useState('');
  const [askCat, setAskCat] = useState('Kegiatan & Event');
  const [askQuestionText, setAskQuestionText] = useState('');
  const [askErrors, setAskErrors] = useState({});
  const [askSuccess, setAskSuccess] = useState(false);
  const [isSubmittingAsk, setIsSubmittingAsk] = useState(false);

  const handleSubmitPublicFaqQuestion = (e) => {
    e.preventDefault();
    if (isSubmittingAsk) return;
    const errs = {};
    if (!askQuestionText.trim() || askQuestionText.trim().length < 8) {
      errs.question = 'Mohon tuliskan pertanyaan Anda minimal 8 karakter';
    }
    setAskErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmittingAsk(true);
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const ts = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (onSubmitFaqQuestion) {
      onSubmitFaqQuestion({
        id: 'faq-user-' + Date.now(),
        category: askCat || 'Umum',
        question: askQuestionText.trim(),
        answer: 'Menunggu jawaban & penjelasan resmi dari Pengurus CNT IT APD.',
        askedBy: askName.trim() || 'Insan IT APD',
        submittedAt: ts,
        isPublished: false
      });
    }

    setAskSuccess(true);
    setAskName('');
    setAskQuestionText('');
    setAskErrors({});
    setTimeout(() => setIsSubmittingAsk(false), 500);
    setTimeout(() => setAskSuccess(false), 5000);
  };
  const isOprecVisible = pageVisibility.oprec !== false;
  const isOrganisasiVisible = pageVisibility.organisasi !== false;
  const isProgramVisible = pageVisibility.program !== false;
  const isKudosVisible = pageVisibility.kudos !== false;
  const activeForms = isOprecVisible 
    ? forms.filter(f => f.isOpen !== false && !getDeadlineStatus(f.deadline).isExpired) 
    : [];
  const primaryForm = activeForms[0] || recruitmentInfo || null;
  const matchingTenureMembers = members.filter(m => !m.tenureId || m.tenureId === activeTenure?.id);
  const activeMembers = matchingTenureMembers.length > 0 ? matchingTenureMembers : members;
  const matchingTenureEvents = events.filter(e => !e.tenureId || e.tenureId === activeTenure?.id);
  const activeEvents = matchingTenureEvents.length > 0 ? matchingTenureEvents : events;
  const pembina = activeMembers.find(m => m.category === 'pembina');
  const ketua = activeMembers.find(m => m.role === 'Ketua');
  const wakil = activeMembers.find(m => m.role === 'Wakil Ketua');

  const handleTabChange = (tabId, formIdParam = null, eventIdParam = null) => {
    if (pageVisibility[tabId] === false) return;
    soundFx.playClick();
    setCurrentTab(tabId, formIdParam, eventIdParam);
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
              PORTAL RESMI • CNT GROUP IT APD {activeTenure?.code || '2026'}
            </span>
          </div>
        </div>

        {/* Main Cosmic Title - Dynamic per Tenure */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.8rem)',
          lineHeight: 1.1,
          fontWeight: 900,
          color: 'var(--text-main)',
          maxWidth: '1000px',
          margin: '0 auto 20px auto',
          letterSpacing: '-0.03em'
        }}>
          {activeTenure?.heroHeadline || 'COMMITTED TO CULTIVATE'}{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FFB800 0%, #38bdf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 35px rgba(56, 189, 248, 0.3)'
          }}>
            {activeTenure?.heroHighlight || 'EXCELLENCE & SYNERGY'}
          </span>
        </h1>

        {/* Dynamic Tagline & Motto per Tenure */}
        <div style={{
          fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
          fontWeight: 700,
          color: 'var(--mandiri-gold)',
          maxWidth: '860px',
          margin: '0 auto 16px auto',
          lineHeight: 1.5,
          fontStyle: 'italic'
        }}>
          "{activeTenure?.themeTagline || 'Sinergi, Inovasi & Cultural Excellence'}"
        </div>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '820px',
          margin: '0 auto 36px auto',
          lineHeight: 1.7,
        }}>
          {activeTenure?.description || (
            <>
              Pusat gerakan budaya kerja <strong style={{ color: 'var(--text-main)' }}>Culture Network Team (CNT)</strong> Group IT Application Delivery, Direktorat IT Bank Mandiri. Mengobarkan semangat kolaborasi lintas squad, inovasi engineering, dan harmoni kerja.
            </>
          )}
        </p>

        {/* Quick Actions (Cerdas & Dinamis Mengikuti Form Aktif & Visibilitas Page) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {activeForms.length > 0 ? (
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
              <span>
                {activeForms.length > 1 
                  ? `Registrasi & Inisiatif Terbuka (${activeForms.length} Formulir)` 
                  : (activeForms[0].title.length > 30 ? `Daftar ${activeForms[0].title.slice(0, 28)}...` : `Daftar ${activeForms[0].title}`)}
              </span>
              <ArrowRight size={18} />
            </button>
          ) : isProgramVisible ? (
            <button
              onClick={() => handleTabChange('program')}
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
              <span>Jelajahi Program & Kalender</span>
              <ArrowRight size={18} />
            </button>
          ) : null}

          {isOrganisasiVisible && (
            <button
              onClick={() => handleTabChange('organisasi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1.5px solid var(--mandiri-blue)',
                padding: '16px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.2s ease'
              }}
            >
              <Compass size={18} color="var(--mandiri-blue)" />
              <span>Jelajahi Struktur Organisasi</span>
            </button>
          )}
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
              {activeMembers.length} Personel
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inti & Pimpro CNT ({activeTenure?.code || '2026'})</div>
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
              {activeEvents.length}+ Event
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Agenda Kerja {activeTenure?.code || '2026'}</div>
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

      {/* 2. VISI & MISI KEBUDAYAAN PERIODE INI (Dinamis per Kepengurusan) */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
          gap: '24px'
        }}>
          {/* Visi Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '4px solid var(--mandiri-gold)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 184, 0, 0.15)',
                color: 'var(--mandiri-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Visi CNT IT {activeTenure?.code || '2026'}
              </h3>
            </div>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{activeTenure?.visi || 'Menjadi akselerator budaya kerja kolaboratif, agile, dan profesional yang mendorong produktivitas engineering prima serta kebahagiaan insan IT Application Delivery.'}"
            </p>
          </div>

          {/* Misi Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            borderTop: '4px solid var(--neon-cyan)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: 'var(--neon-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Misi CNT IT {activeTenure?.code || '2026'}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {(activeTenure?.misi || [
                'Memperkuat sinergi dan komunikasi terbuka antar squad delivery.',
                'Menumbuhkan wellbeing jasmani dan rohani insan IT APD.',
                'Menyediakan panggung kreativitas dan apresiasi prestasi (Kudos).'
              ]).map((m, mIdx) => (
                <div key={mIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 800 }}>•</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. LEADERSHIP HIGHLIGHT (Pembina, Ketua, Wakil, BPH) */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="badge-gold" style={{ marginBottom: '6px' }}>Leadership & BPH</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
              Pimpinan & Pengurus Inti CNT {activeTenure?.code || '2026'}
            </h2>
          </div>
          <button
            onClick={() => handleTabChange('organisasi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--mandiri-blue)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <span>Lihat Organigram Lengkap</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {activeMembers.filter(m => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro').map((person) => (
            <div
              key={person.id}
              onClick={() => handleTabChange('organisasi')}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                borderTop: `3px solid ${person.color || 'var(--mandiri-gold)'}`
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${person.color || 'var(--mandiri-gold)'}`,
                background: '#040914'
              }}>
                <img
                  src={person.image}
                  alt={person.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div>
                <span style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: person.color || 'var(--mandiri-gold)',
                  fontFamily: 'monospace'
                }}>
                  {person.role}
                </span>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {person.name}
                </h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {person.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RECRUITMENT & FORMS SECTION (Theme-aware dynamic cards) */}
      {activeForms.length > 0 && (
        <section style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge-gold" style={{ marginBottom: '6px' }}>
                <Flame size={14} /> Pendaftaran & Inisiatif Dibuka
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                {activeForms.length > 1 ? `${activeForms.length} Formulir Pendaftaran Sedang Dibuka` : 'Pendaftaran Sedang Dibuka'}
              </h2>
            </div>
            {activeForms.length > 1 && (
              <button
                onClick={() => handleTabChange('oprec')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--mandiri-blue)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <span>Buka Hub Registrasi</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* If 1 active form: Display grand wide banner */}
          {activeForms.length === 1 ? (
            <div className="glass-panel-hover" style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(255, 184, 0, 0.15) 0%, rgba(4, 9, 20, 0.95) 60%, rgba(56, 189, 248, 0.15) 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, rgba(254, 243, 199, 0.45) 50%, rgba(224, 242, 254, 0.45) 100%)',
              border: isDark ? '1px solid rgba(255, 184, 0, 0.5)' : '1px solid rgba(255, 184, 0, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 44px',
              boxShadow: isDark 
                ? '0 0 35px rgba(255, 184, 0, 0.2)' 
                : '0 10px 30px -5px rgba(255, 184, 0, 0.15), 0 4px 18px -2px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
              flexWrap: 'wrap',
            }}>
              <div style={{ maxWidth: '680px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge-cyan" style={{ fontSize: '0.72rem' }}>
                    {activeForms[0].category || 'Pendaftaran'}
                  </span>
                  {activeForms[0].deadline && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontFamily: 'monospace', fontWeight: 700 }}>
                      {getDeadlineStatus(activeForms[0].deadline).isToday 
                        ? '⚠️ Hari Terakhir Pendaftaran!' 
                        : `Deadline: ${activeForms[0].deadline}`}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '10px' }}>
                  {activeForms[0].title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {activeForms[0].subtitle || activeForms[0].description}
                </p>
              </div>

              <button
                onClick={() => handleTabChange('oprec', activeForms[0].id)}
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
            </div>
          ) : (
            /* If multiple active forms: Display rich interactive card grid showcasing EACH active form */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: '20px' }}>
              {activeForms.map((f, fIdx) => (
                <div
                  key={f.id}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--border-card)',
                    borderTop: `4px solid ${fIdx === 0 ? 'var(--mandiri-gold)' : 'var(--neon-cyan)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '18px',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className={fIdx === 0 ? 'badge-gold' : 'badge-cyan'} style={{ fontSize: '0.7rem' }}>
                        {f.category || 'Formulir Aktif'}
                      </span>
                      {(() => {
                        const dl = getDeadlineStatus(f.deadline);
                        if (dl.isToday) {
                          return <span className="badge-gold" style={{ fontSize: '0.68rem' }}>⚠️ Hari Terakhir!</span>;
                        }
                        return (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                            📅 {f.deadline}
                          </span>
                        );
                      })()}
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.3 }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {f.subtitle || f.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                      ✓ Terbuka untuk Officer APD
                    </span>
                    <button
                      onClick={() => handleTabChange('oprec', f.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: fIdx === 0 ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
                        color: fIdx === 0 ? '#040914' : '#ffffff',
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <span>Isi Formulir</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <div style={{ fontSize: '0.8rem', color: div.color, fontWeight: 700, marginBottom: div.motto ? '6px' : '0' }}>
                    Lead: {div.leadName}
                  </div>
                  {div.motto && (
                    <div style={{
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      color: 'var(--text-main)',
                      opacity: 0.9,
                      lineHeight: 1.45,
                      padding: '6px 10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderLeft: `3px solid ${div.color}`,
                      borderRadius: '0 6px 6px 0',
                      marginTop: '6px'
                    }}>
                      &ldquo;{div.motto}&rdquo;
                    </div>
                  )}
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

      {/* 5. AGENDA TERDEKAT & SPOTLIGHT KUDOS TERBARU (Dynamic Activity Hub) */}
      {(isProgramVisible || isKudosVisible) && (
        <section style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {/* 5A. Agenda Kegiatan Terdekat */}
          {isProgramVisible && activeEvents.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge-cyan" style={{ marginBottom: '6px' }}>
                    📅 Kalender & Agenda Budaya
                  </span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Program Kerja & Kegiatan Terdekat ({activeTenure?.code || '2026'})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('program')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--mandiri-blue)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Buka Semua Program & RSVP</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: '18px' }}>
                {activeEvents.slice(0, 3).map((evt) => {
                  const rsvpCount = eventRsvps.filter(r => r.eventId === evt.id).length;
                  const statusColor = evt.status === 'Ongoing' ? '#10b981' : evt.status === 'Completed' ? '#64748b' : 'var(--mandiri-gold)';
                  const statusLabel = evt.status === 'Ongoing' ? 'Sedang Berjalan' : evt.status === 'Completed' ? 'Selesai' : 'Segera Hadir';
                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleTabChange('program', null, evt.id)}
                      className="glass-panel glass-panel-hover"
                      style={{
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        cursor: 'pointer',
                        borderTop: `3px solid ${statusColor}`
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 184, 0, 0.14)',
                            color: statusColor
                          }}>
                            ● {statusLabel}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                            {evt.divisionName || evt.badge}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.35 }}>
                          {evt.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                          {(evt.description || '').slice(0, 110)}{(evt.description || '').length > 110 ? '...' : ''}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                          <Calendar size={13} color="var(--neon-cyan)" />
                          <span>{evt.date}</span>
                        </span>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.14)',
                          color: '#10b981',
                          fontWeight: 800,
                          fontSize: '0.7rem'
                        }}>
                          ✋ {rsvpCount} Peserta RSVP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5B. Spotlight Apresiasi & Wall of Kudos Terbaru */}
          {isKudosVisible && kudosList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge-gold" style={{ marginBottom: '6px' }}>
                    🏆 Wall of Kudos & Apresiasi
                  </span>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Spotlight Apresiasi Insan IT APD Terbaru
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('kudos')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--mandiri-blue)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Kirim Kudos & Lihat Semua</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: '18px' }}>
                {kudosList.slice(0, 3).map((k) => (
                  <div
                    key={k.id}
                    onClick={() => handleTabChange('kudos')}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      cursor: 'pointer',
                      borderLeft: '4px solid var(--mandiri-gold)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge-gold" style={{ fontSize: '0.66rem', padding: '2px 9px' }}>
                          {k.category || 'Kolaboratif'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 800 }}>
                          ❤️ {k.likes || 1} Apresiasi
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Untuk: <span style={{ color: 'var(--neon-cyan)' }}>{k.recipient}</span>
                      </div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
                        "{(k.message || '').slice(0, 120)}{(k.message || '').length > 120 ? '...' : ''}"
                      </p>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-card)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Dari: <strong>{k.sender}</strong></span>
                      <span>{k.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. PUSAT PANDUAN & TANYA JAWAB INTERAKTIF (FAQ BUDAYA & OPERASIONAL CNT) */}
      {(() => {
        const publishedFaqs = (faqs || []).filter(f => f.isPublished !== false);
        if (publishedFaqs.length === 0) return null;

        const categories = ['Semua', ...Array.from(new Set(publishedFaqs.map(f => f.category || 'Umum')))];
        const q = faqSearch.trim().toLowerCase();
        const filteredFaqs = publishedFaqs.filter(f => {
          const matchCat = faqCategory === 'Semua' || (f.category || 'Umum') === faqCategory;
          const matchQuery = !q ||
            (f.question || '').toLowerCase().includes(q) ||
            (f.answer || '').toLowerCase().includes(q) ||
            (f.category || '').toLowerCase().includes(q);
          return matchCat && matchQuery;
        });

        return (
          <section style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge-gold" style={{ marginBottom: '10px' }}>
                <HelpCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                Pusat Panduan & FAQ Budaya CNT
              </span>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>
                Tanya Jawab Seputar Kegiatan & Operasional CNT IT APD
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', margin: '0 auto' }}>
                Informasi praktis seputar keikutsertaan olahraga/komunitas, mekanisme usulan kegiatan baru, dukungan Sekben, hingga alur seleksi Oprec.
              </p>
            </div>

            {/* Search & Category Filter for FAQ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
                <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari pertanyaan (misal: olahraga, dana, sekben, oprec)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {categories.map(cat => {
                  const active = faqCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFaqCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        border: active ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        background: active ? 'rgba(255, 184, 0, 0.16)' : 'var(--bg-card)',
                        color: active ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredFaqs.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  Tidak ditemukan pertanyaan yang cocok dengan kata kunci <strong>"{faqSearch}"</strong>.
                </div>
              ) : (
                filteredFaqs.map((item) => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="glass-panel"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        border: isOpen ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          background: 'transparent',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: 'var(--text-main)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(14, 165, 233, 0.14)',
                            color: 'var(--neon-cyan)',
                            textTransform: 'uppercase'
                          }}>
                            {item.category || 'Umum'}
                          </span>
                          <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.4 }}>
                            {item.question}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          color="var(--mandiri-gold)"
                          style={{
                            flexShrink: 0,
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: '0 20px 18px 20px',
                          borderTop: '1px solid var(--border-card)',
                          paddingTop: '14px',
                          fontSize: '0.88rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.65
                        }}>
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Public "Ask a Question" Box (Synced to `public.faqs` with is_published=false for Admin Review) */}
            {onSubmitFaqQuestion && (
              <div className="glass-panel" style={{
                marginTop: '24px',
                padding: '22px 24px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    💬 Punya Pertanyaan Lain yang Belum Tercantum di FAQ?
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Kirimkan pertanyaan Anda langsung ke Pengurus CNT IT APD. Pertanyaan yang dijawab oleh Admin akan ditampilkan pada papan FAQ di atas.
                  </p>
                </div>

                {askSuccess && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={15} />
                    <span>Pertanyaan Anda berhasil dikirim ke antrean FAQ Pengurus CNT!</span>
                  </div>
                )}

                <form onSubmit={handleSubmitPublicFaqQuestion} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nama / Squad Anda (Opsional)"
                      value={askName}
                      onChange={(e) => setAskName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                    <select
                      value={askCat}
                      onChange={(e) => setAskCat(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Kegiatan & Event">Topik: Kegiatan & Event</option>
                      <option value="Operasional & Sekben">Topik: Operasional & Sekben</option>
                      <option value="Pendaftaran & Oprec">Topik: Pendaftaran & Oprec</option>
                      <option value="Aspirasi & Usulan">Topik: Aspirasi & Usulan</option>
                      <option value="Tentang CNT">Topik: Tentang CNT</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px' }}>
                      <input
                        type="text"
                        placeholder="Tuliskan pertanyaan Anda di sini... *"
                        value={askQuestionText}
                        onChange={(e) => {
                          setAskQuestionText(e.target.value);
                          if (askErrors.question) setAskErrors({});
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: `1.5px solid ${askErrors.question ? '#f43f5e' : 'var(--border-card)'}`,
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          outline: 'none'
                        }}
                      />
                      {askErrors.question && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.72rem', marginTop: '4px' }}>
                          <AlertCircle size={12} />
                          <span>{askErrors.question}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAsk}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--mandiri-gold)',
                        color: '#040914',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: isSubmittingAsk ? 'not-allowed' : 'pointer',
                        height: '40px'
                      }}
                    >
                      <Send size={14} />
                      <span>{isSubmittingAsk ? 'Mengirim...' : 'Ajukan Pertanyaan'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        );
      })()}

    </div>
  );
}
