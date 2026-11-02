import React, { useState } from 'react';
import { 
  Heart, 
  Send, 
  Sparkles, 
  MessageSquare, 
  ThumbsUp, 
  Lightbulb, 
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function KudosSection({ kudosList = [], onAddKudos }) {
  const [activeSubTab, setActiveSubTab] = useState('kudos'); // 'kudos' | 'aspirasi'
  
  // Interactive likes tracked by item ID
  const [likedMap, setLikedMap] = useState({});

  // Form State Kudos
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Kolaboratif');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [kudosErrors, setKudosErrors] = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Form State Aspirasi
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaSuccess, setIdeaSuccess] = useState(false);
  const [ideaErrors, setIdeaErrors] = useState({});

  const handleToggleLike = (kudosId) => {
    setLikedMap(prev => {
      const current = prev[kudosId] || false;
      return { ...prev, [kudosId]: !current };
    });
  };

  const validateKudos = () => {
    const errs = {};
    if (!sender.trim()) errs.sender = 'Nama pengirim / squad wajib diisi';
    if (!recipient.trim()) errs.recipient = 'Nama penerima apresiasi wajib diisi';
    if (!message.trim() || message.trim().length < 8) {
      errs.message = 'Pesan apresiasi minimal 8 karakter';
    }
    setKudosErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!validateKudos()) return;
    setConfirmModalOpen(true);
  };

  const getExactTimestamp = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[now.getDay()];
    const dateNum = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${dayName}, ${dateNum} ${monthName} ${year} • ${hours}:${minutes} WIB`;
  };

  const handleFinalSubmitKudos = () => {
    onAddKudos({
      id: 'kd-' + Date.now(),
      sender: sender.trim(),
      recipient: recipient.trim(),
      category,
      message: message.trim(),
      likes: 1,
      date: 'Baru saja',
      exactTimestamp: getExactTimestamp()
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsSuccess(true);
    setSender('');
    setRecipient('');
    setMessage('');
    setKudosErrors({});
    setConfirmModalOpen(false);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  const validateIdea = () => {
    const errs = {};
    if (!ideaTitle.trim()) errs.ideaTitle = 'Judul ide atau usulan wajib diisi';
    if (!ideaDesc.trim() || ideaDesc.trim().length < 15) {
      errs.ideaDesc = 'Jelaskan deskripsi usulan minimal 15 karakter';
    }
    setIdeaErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitIdea = (e) => {
    e.preventDefault();
    if (!validateIdea()) return;

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    setIdeaSuccess(true);
    setIdeaTitle('');
    setIdeaDesc('');
    setIdeaErrors({});
    setTimeout(() => setIdeaSuccess(false), 4000);
  };

  const totalApresiasi = kudosList.reduce((sum, item) => {
    const isExtraLiked = likedMap[item.id] ? 1 : 0;
    return sum + (item.likes || 1) + isExtraLiked;
  }, 0);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Budaya Apresiasi & Partisipasi Aktif
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Wall of Kudos & Aspirasi
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Apresiasi rekan kerjamu atas dedikasi, sinergi, dan kontribusinya atau sampaikan ide kreatif untuk memajukan budaya kerja Group IT APD.
        </p>
      </div>

      {/* Sub Tabs Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button
          onClick={() => setActiveSubTab('kudos')}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.92rem',
            fontWeight: 700,
            border: 'none',
            background: activeSubTab === 'kudos' ? 'var(--mandiri-gold)' : 'var(--input-bg)',
            color: activeSubTab === 'kudos' ? '#0a1128' : 'var(--text-main)',
            boxShadow: activeSubTab === 'kudos' ? '0 4px 14px rgba(255,184,0,0.3)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Heart size={16} fill={activeSubTab === 'kudos' ? '#0a1128' : 'none'} />
          <span>Kirim Apresiasi (Kudos)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('aspirasi')}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.92rem',
            fontWeight: 700,
            border: 'none',
            background: activeSubTab === 'aspirasi' ? 'var(--mandiri-blue)' : 'var(--input-bg)',
            color: activeSubTab === 'aspirasi' ? '#ffffff' : 'var(--text-main)',
            boxShadow: activeSubTab === 'aspirasi' ? '0 4px 14px rgba(0,61,121,0.3)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Lightbulb size={16} />
          <span>Kotak Aspirasi & Ide Budaya</span>
        </button>
      </div>

      {/* CONTENT: KUDOS */}
      {activeSubTab === 'kudos' && (
        <div className="kudos-grid">
          {/* Send Form */}
          <div className="glass-panel" style={{ padding: '32px', border: '1.5px solid var(--border-card)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Beri Shoutout Apresiasi 🌟
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Ucapan tulusmu bisa mencerahkan hari rekan kerja dan menyalakan api semangat tim.
            </p>

            {isSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#10b981',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>Kudos berhasil dikirim ke Wall of Appreciation! 🎉</span>
              </div>
            )}

            <form onSubmit={handleOpenConfirm} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Dari Siapa? (Nama / Squad Kamu) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dimas (Squad Wealth)"
                  value={sender}
                  onChange={(e) => {
                    setSender(e.target.value);
                    if (kudosErrors.sender) setKudosErrors(prev => ({ ...prev, sender: null }));
                  }}
                  style={inputStyle(kudosErrors.sender)}
                />
                {kudosErrors.sender && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{kudosErrors.sender}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Apresiasi Untuk Siapa? *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah (QA Lead) / Tim Backend Core"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    if (kudosErrors.recipient) setKudosErrors(prev => ({ ...prev, recipient: null }));
                  }}
                  style={inputStyle(kudosErrors.recipient)}
                />
                {kudosErrors.recipient && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{kudosErrors.recipient}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kategori Nilai Budaya
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="Kolaboratif">Kolaboratif (Sinergi & Kerjasama Tim)</option>
                  <option value="Inovatif">Inovatif & Solutif (Excellence & Agility)</option>
                  <option value="Harmonis">Harmonis (Saling Peduli & Menghargai)</option>
                  <option value="Integritas">Integritas (Komitmen & Tanggung Jawab)</option>
                  <option value="Dedikasi">Dedikasi (Customer Centric & Prima)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Pesan Apresiasimu *
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan ucapan terima kasih atau apresiasi terbaikmu..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (kudosErrors.message) setKudosErrors(prev => ({ ...prev, message: null }));
                  }}
                  style={{
                    ...inputStyle(kudosErrors.message),
                    resize: 'vertical'
                  }}
                />
                {kudosErrors.message && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{kudosErrors.message}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--mandiri-gold)',
                  color: '#0a1128',
                  padding: '13px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={16} />
                <span>Kirimkan Apresiasi</span>
              </button>
            </form>
          </div>

          {/* Wall List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--mandiri-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Wall of Appreciation
                </h3>
              </div>
              <span className="badge-cyan" style={{ fontSize: '0.72rem' }}>
                {totalApresiasi} Apresiasi Aktif
              </span>
            </div>

            {kudosList.map((kudos) => {
              const isLiked = likedMap[kudos.id] || false;
              const currentLikes = (kudos.likes || 1) + (isLiked ? 1 : 0);

              return (
                <div
                  key={kudos.id}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: '4px solid var(--mandiri-gold)',
                    border: '1px solid var(--border-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <strong style={{ color: 'var(--neon-cyan)', fontWeight: 800, letterSpacing: '0.2px' }}>
                        {kudos.sender}
                      </strong>
                      <span style={{ color: 'var(--text-dim)' }}>apresiasi kepada</span>
                      <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>
                        {kudos.recipient}
                      </strong>
                    </div>
                    <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                      {kudos.category}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                    "{kudos.message}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.74rem', color: 'var(--text-dim)', paddingTop: '10px', borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Clock size={12} color="var(--mandiri-gold)" />
                        <span>{kudos.exactTimestamp || kudos.date}</span>
                      </div>
                      {kudos.exactTimestamp && kudos.date !== 'Baru saja' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>({kudos.date})</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleLike(kudos.id)}
                      title="Beri like apresiasi"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: isLiked ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                        border: isLiked ? '1px solid #f43f5e' : '1px solid var(--border-card)',
                        color: isLiked ? '#f43f5e' : 'var(--text-muted)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Heart size={13} fill={isLiked ? '#f43f5e' : 'none'} color={isLiked ? '#f43f5e' : 'currentColor'} />
                      <span>{currentLikes} apresiasi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONFIRMATION PREVIEW MODAL SEBELUM KIRIM KUDOS */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            border: '1.5px solid var(--mandiri-gold)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 184, 0, 0.15)',
                  color: 'var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Konfirmasi Pengiriman Apresiasi
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Harap cek kembali pesan sebelum ditayangkan di Wall of Kudos
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Pengirim: </span>
                <strong style={{ color: 'var(--neon-cyan)' }}>{sender}</strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Penerima: </span>
                <strong style={{ color: 'var(--text-main)' }}>{recipient}</strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Kategori: </span>
                <span className="badge-gold" style={{ fontSize: '0.7rem' }}>{category}</span>
              </div>
              <div style={{ fontSize: '0.84rem', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Pesan:</span>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  "{message}"
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 184, 0, 0.1)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              💡 <em>Catatan:</em> Setelah dikirim, apresiasi ini akan langsung muncul secara publik dan tidak dapat diedit sendiri (hanya dapat dikelola atau dihapus oleh Admin di Portal).
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitKudos}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,184,0,0.3)'
                }}
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: ASPIRASI */}
      {activeSubTab === 'aspirasi' && (
        <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '36px', border: '1.5px solid var(--border-card)' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Lightbulb size={24} color="var(--mandiri-blue)" />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                  Kotak Ide & Aspirasi Budaya (Anonim)
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Punya ide kegiatan seru, usulan fasilitas penunjang kenyamanan kerja, atau saran program wellbeing? Suaramu sangat berarti untuk kemajuan IT APD!
              </p>
            </div>

            {ideaSuccess && (
              <div style={{
                background: 'rgba(14, 165, 233, 0.15)',
                border: '1px solid #0ea5e9',
                color: '#0284c7',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>Terima kasih! Idemu telah tersimpan langsung di inbox Tim Inti CNT IT APD.</span>
              </div>
            )}

            <form onSubmit={handleSubmitIdea} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Judul Ide / Usulan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sesi Coffee Talk dengan Group Head / Turnamen Mini Soccer Lintas Departemen"
                  value={ideaTitle}
                  onChange={(e) => {
                    setIdeaTitle(e.target.value);
                    if (ideaErrors.ideaTitle) setIdeaErrors(prev => ({ ...prev, ideaTitle: null }));
                  }}
                  style={inputStyle(ideaErrors.ideaTitle)}
                />
                {ideaErrors.ideaTitle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{ideaErrors.ideaTitle}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Deskripsi & Dampak yang Diharapkan *
                </label>
                <textarea
                  rows={5}
                  placeholder="Jelaskan detail ide dan kenapa program ini akan bermanfaat bagi insan IT APD..."
                  value={ideaDesc}
                  onChange={(e) => {
                    setIdeaDesc(e.target.value);
                    if (ideaErrors.ideaDesc) setIdeaErrors(prev => ({ ...prev, ideaDesc: null }));
                  }}
                  style={{
                    ...inputStyle(ideaErrors.ideaDesc),
                    resize: 'vertical'
                  }}
                />
                {ideaErrors.ideaDesc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e', fontSize: '0.74rem', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{ideaErrors.ideaDesc}</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                🔒 Formulir ini bersifat anonim untuk menjaga kenyamanan berekspresi.
              </div>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--mandiri-blue)',
                  color: '#ffffff',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={16} />
                <span>Kirimkan Aspirasi ke CNT</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
