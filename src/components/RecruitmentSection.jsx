import React, { useState } from 'react';
import { 
  UserPlus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Send, 
  FileText, 
  HelpCircle,
  Briefcase,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RecruitmentSection({ 
  recruitmentInfo, 
  divisions, 
  onSubmitApplication 
}) {
  const [selectedDiv1, setSelectedDiv1] = useState(divisions[0]?.id || '');
  const [selectedDiv2, setSelectedDiv2] = useState('');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [unitSquad, setUnitSquad] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !nip || !email || !motivation) return;

    const div1Obj = divisions.find(d => d.id === selectedDiv1);
    const div2Obj = divisions.find(d => d.id === selectedDiv2);

    const newApp = {
      id: 'app-' + Date.now(),
      fullName,
      nip,
      unitSquad,
      email,
      whatsapp,
      div1: div1Obj?.name || 'N/A',
      div2: div2Obj?.name || 'None',
      motivation,
      portfolioUrl,
      submittedAt: new Date().toLocaleDateString('id-ID'),
      status: 'Submitted'
    };

    onSubmitApplication(newApp);

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });

    setIsSubmitted(true);
  };

  const recruitingDivisions = divisions.filter(d => d.isRecruiting !== false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px' }}>
      
      {/* 1. HERO HEADER */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="badge-gold">
            <Flame size={14} /> {recruitmentInfo.batch}
          </span>
          <span className="badge-cyan">
            Pendaftaran Dibuka s/d {recruitmentInfo.deadline}
          </span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', lineHeight: 1.2 }}>
          {recruitmentInfo.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          {recruitmentInfo.subtitle} Mari berkontribusi nyata, perkuat sinergi tim delivery, dan ciptakan momen berkesan bersama keluarga besar CNT IT APD.
        </p>
      </div>

      {/* 2. TIMELINE & BENEFITS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        gap: '32px',
      }}>
        {/* Timeline */}
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(255, 184, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Clock size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Tahapan & Timeline Seleksi
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {recruitmentInfo.timeline.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.step}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      ({item.date})
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Award size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Benefit Bergabung di CNT IT APD
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recruitmentInfo.benefits.map((benefit, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DIVISI YANG DIBUKA (REQUIREMENTS) */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Kriteria & Kualifikasi Divisi
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
            Pilih divisi yang paling sesuai dengan minat dan keterampilan yang ingin kamu kembangkan
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '20px',
        }}>
          {recruitingDivisions.map((div) => (
            <div 
              key={div.id}
              className="glass-panel"
              style={{
                padding: '24px',
                borderTop: `4px solid ${div.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {div.name}
              </h4>
              <div style={{ fontSize: '0.75rem', color: div.color, fontWeight: 700 }}>
                Lead: {div.leadName}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                {div.description}
              </p>
              
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Kriteria yang Dicari:
                </div>
                {div.requirements?.map((req, rIdx) => (
                  <div key={rIdx} style={{ display: 'flex', gap: '6px', fontSize: '0.76rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    <span style={{ color: div.color }}>•</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. APPLICATION FORM */}
      <section style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '40px',
          border: '1px solid rgba(255, 184, 0, 0.4)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                Pendaftaran Berhasil Dikirim! 🎉
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                Terima kasih, <strong style={{ color: 'var(--text-main)' }}>{fullName}</strong>! Berkas pendaftaranmu telah masuk ke database panitia Oprec CNT IT APD. Tim seleksi akan menghubungi via WhatsApp/Email untuk tahap selanjutnya.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Kirim Formulir Lainnya
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span className="badge-gold" style={{ marginBottom: '8px' }}>
                  Formulir Resmi
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Formulir Pendaftaran Calon Pengurus
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Lengkapi data diri dan motivasi Anda di bawah ini secara lengkap
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Row 1: Name & NIP */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap sesuai HCM Mandiri"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      NIP / Employee ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 1890283"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Unit Squad & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Departemen / Squad di IT APD *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Core APD / Wholesale / Wealth"
                      value={unitSquad}
                      onChange={(e) => setUnitSquad(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Email Mandiri *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nama@bankmandiri.co.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812-xxxx-xxxx (untuk koordinasi jadwal wawancara)"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                {/* Division Choices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Pilihan Divisi Utama (Prioritas 1) *
                    </label>
                    <select
                      value={selectedDiv1}
                      onChange={(e) => setSelectedDiv1(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#0f1c3f',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      {recruitingDivisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Pilihan Divisi Alternatif (Prioritas 2)
                    </label>
                    <select
                      value={selectedDiv2}
                      onChange={(e) => setSelectedDiv2(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#0f1c3f',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Tidak Ada / Opsional --</option>
                      {recruitingDivisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Motivation Essay */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Motivasi & Ide yang Ingin Kamu Bawa ke CNT IT APD *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ceritakan alasanmu ingin bergabung dan program atau kontribusi apa yang ingin kamu jalankan..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '0.88rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Portfolio URL */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Link Portofolio / CV / Social Media (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="Link Google Drive, LinkedIn, Behance, atau Instagram"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="pulse-glow"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'var(--accent-gold)',
                    color: '#0a1128',
                    padding: '16px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '12px'
                  }}
                >
                  <Send size={18} />
                  <span>Kirim Formulir Pendaftaran</span>
                </button>
              </form>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
