import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  Briefcase, 
  Star, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RecruitmentSection({ 
  recruitmentInfo, 
  divisions = [], 
  onSubmitApplication, 
  theme 
}) {
  const isDark = theme === 'dark';

  // Form states
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [unitSquad, setUnitSquad] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedDiv1, setSelectedDiv1] = useState(divisions[0]?.id || 'div-exp');
  const [selectedDiv2, setSelectedDiv2] = useState('');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi sesuai HCM Mandiri';
    if (!nip.trim()) newErrors.nip = 'NIP / Employee ID wajib diisi';
    if (!unitSquad.trim()) newErrors.unitSquad = 'Departemen atau squad wajib diisi';
    if (!email.trim()) {
      newErrors.email = 'Alamat email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid (gunakan format user@bankmandiri.co.id)';
    }
    if (!motivation.trim() || motivation.trim().length < 15) {
      newErrors.motivation = 'Harap tuliskan motivasi dan kontribusi minimal 15 karakter';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
    setErrors({});
  };

  const recruitingDivisions = divisions.filter(d => d.isRecruiting !== false);

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--input-bg)',
    border: `1.5px solid ${hasError ? '#f43f5e' : 'var(--input-border)'}`,
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '0.88rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: hasError ? '0 0 8px rgba(244, 63, 94, 0.25)' : 'none'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px' }}>
      
      {/* 1. HERO HEADER */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="badge-gold">
            {recruitmentInfo.badge || 'OPEN RECRUITMENT 2026'}
          </span>
          <span className="badge-cyan">
            Deadline: {recruitmentInfo.deadline}
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
      <div className="mobile-stack-grid">
        {/* Timeline */}
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(255, 184, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Clock size={20} color="var(--mandiri-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Tahapan & Timeline Seleksi
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {recruitmentInfo.timeline?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  border: '1px solid var(--mandiri-gold)',
                  color: 'var(--mandiri-gold)',
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--mandiri-gold)', fontWeight: 600 }}>
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
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Star size={20} color="var(--neon-cyan)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Keuntungan Bergabung
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recruitmentInfo.benefits?.map((benefit, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--neon-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. OPEN POSITIONS / DIVISIONS */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge-cyan" style={{ marginBottom: '8px' }}>
            Bidang Tersedia
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Divisi yang Sedang Membuka Rekrutmen
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Pilih divisi yang paling sesuai dengan passion, bakat, dan kontribusi yang ingin kamu berikan.
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
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderTop: `4px solid ${div.color}`,
              }}
            >
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {div.name}
              </h4>
              <div style={{ fontSize: '0.75rem', color: div.color, fontWeight: 700 }}>
                Lead: {div.leadName}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                {div.description}
              </p>
              
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-card)' }}>
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

      {/* 4. APPLICATION FORM (Dengan Border Bersih Sesuai Kudos & Validasi Elegan) */}
      <section style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '40px',
          border: '1.5px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)'
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
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-card)',
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

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Row 1: Name & NIP */}
                <div className="mobile-two-col">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      placeholder="Nama lengkap sesuai HCM Mandiri"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
                      }}
                      style={inputStyle(errors.fullName)}
                    />
                    {errors.fullName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                        <AlertCircle size={12} />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      NIP / Employee ID *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 1890283"
                      value={nip}
                      onChange={(e) => {
                        setNip(e.target.value);
                        if (errors.nip) setErrors(prev => ({ ...prev, nip: null }));
                      }}
                      style={inputStyle(errors.nip)}
                    />
                    {errors.nip && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                        <AlertCircle size={12} />
                        <span>{errors.nip}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Unit Squad & Email */}
                <div className="mobile-two-col">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Departemen / Squad di IT APD *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Core APD / Wholesale / Wealth"
                      value={unitSquad}
                      onChange={(e) => {
                        setUnitSquad(e.target.value);
                        if (errors.unitSquad) setErrors(prev => ({ ...prev, unitSquad: null }));
                      }}
                      style={inputStyle(errors.unitSquad)}
                    />
                    {errors.unitSquad && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                        <AlertCircle size={12} />
                        <span>{errors.unitSquad}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Email Mandiri / Personal *
                    </label>
                    <input
                      type="email"
                      placeholder="nama.depan@bankmandiri.co.id"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                      }}
                      style={inputStyle(errors.email)}
                    />
                    {errors.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                        <AlertCircle size={12} />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: WhatsApp */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx (untuk koordinasi jadwal seleksi)"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={inputStyle(false)}
                  />
                </div>

                {/* Division Choices */}
                <div className="mobile-two-col">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Pilihan Divisi Utama (Prioritas 1) *
                    </label>
                    <select
                      value={selectedDiv1}
                      onChange={(e) => setSelectedDiv1(e.target.value)}
                      style={inputStyle(false)}
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
                      style={inputStyle(false)}
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
                    rows={4}
                    placeholder="Ceritakan alasanmu ingin bergabung dan program atau kontribusi apa yang ingin kamu jalankan..."
                    value={motivation}
                    onChange={(e) => {
                      setMotivation(e.target.value);
                      if (errors.motivation) setErrors(prev => ({ ...prev, motivation: null }));
                    }}
                    style={{
                      ...inputStyle(errors.motivation),
                      resize: 'vertical'
                    }}
                  />
                  {errors.motivation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                      <AlertCircle size={12} />
                      <span>{errors.motivation}</span>
                    </div>
                  )}
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
                    style={inputStyle(false)}
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
                    background: 'var(--mandiri-gold)',
                    color: '#0a1128',
                    padding: '16px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '12px',
                    transition: 'all 0.2s ease'
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
