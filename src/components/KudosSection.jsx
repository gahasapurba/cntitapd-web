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
  Clock,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatWibTimestamp } from '../utils/dateUtils';

export default function KudosSection({
  kudosList = [],
  onAddKudos,
  onUpdateKudos,
  aspirasiList = [],
  onAddAspirasi
}) {
  const [activeSubTab, setActiveSubTab] = useState('kudos'); // 'kudos' | 'aspirasi'

  // Search & Category Filter for Kudos Wall
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [kudosPage, setKudosPage] = useState(1);
  const [aspirasiPage, setAspirasiPage] = useState(1);

  // Interactive likes tracked locally to prevent double-clicking on same session, while syncing count to parent/cloud
  const [likedMap, setLikedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cnt_liked_kudos') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Form State Kudos
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Kolaboratif');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [kudosErrors, setKudosErrors] = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false);

  // Form State Aspirasi
  const [ideaSender, setIdeaSender] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('Kegiatan & Event');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaSuccess, setIdeaSuccess] = useState(false);
  const [ideaErrors, setIdeaErrors] = useState({});
  const [isSubmittingAspirasi, setIsSubmittingAspirasi] = useState(false);
  const [confirmAspirasiOpen, setConfirmAspirasiOpen] = useState(false);
  const [aspirasiStatusFilter, setAspirasiStatusFilter] = useState('all');

  const handleToggleLike = (kudosItem) => {
    const kudosId = kudosItem.id;
    const alreadyLiked = Boolean(likedMap[kudosId]);
    const nextLikedMap = { ...likedMap, [kudosId]: !alreadyLiked };
    setLikedMap(nextLikedMap);
    try {
      localStorage.setItem('cnt_liked_kudos', JSON.stringify(nextLikedMap));
    } catch (e) { }

    if (onUpdateKudos) {
      const currentLikes = kudosItem.likes || 1;
      const updatedLikes = alreadyLiked ? Math.max(1, currentLikes - 1) : currentLikes + 1;
      onUpdateKudos({ ...kudosItem, likes: updatedLikes });
    }
  };

  // HTML5 Canvas Generator for Shareable PNG Kudos Certificate Card
  const handleDownloadKudosCard = (kudosItem) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient (Mandiri Cosmic Navy)
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 680);
      bgGrad.addColorStop(0, '#040914');
      bgGrad.addColorStop(0.55, '#002855');
      bgGrad.addColorStop(1, '#07132b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 680);

      // 2. Gold & Cyan Decorative Glow Orbs
      const goldGlow = ctx.createRadialGradient(920, 110, 10, 920, 110, 260);
      goldGlow.addColorStop(0, 'rgba(255, 184, 0, 0.25)');
      goldGlow.addColorStop(1, 'rgba(255, 184, 0, 0)');
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, 1080, 680);

      // 3. Outer Gold Frame
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, 1024, 624);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, 1000, 600);

      // 4. Header Badge
      ctx.fillStyle = '#FFB800';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('★ CULTURE NETWORK TEAM (CNT) • GROUP IT APPLICATION DELIVERY', 76, 95);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`NILAI BUDAYA: ${(kudosItem.category || 'KOLABORATIF').toUpperCase()}`, 76, 128);

      // 5. Recipient Title
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.font = '600 20px sans-serif';
      ctx.fillText('SERTIFIKAT APRESIASI & KUDOS DIBERIKAN KEPADA:', 76, 188);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(String(kudosItem.recipient || 'Insan IT APD').slice(0, 38), 76, 242);

      // 6. Divider Line
      ctx.fillStyle = '#FFB800';
      ctx.fillRect(76, 268, 180, 4);

      // 7. Word-wrapped Quote Message
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic 27px sans-serif';
      const rawText = `"${kudosItem.message || ''}"`;
      const words = rawText.split(' ');
      const lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > 910) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.slice(0, 5).forEach((line, idx) => {
        ctx.fillText(line, 76, 330 + idx * 42);
      });

      // 8. Footer Sender & Timestamp
      ctx.fillStyle = '#FFB800';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Dari: ${kudosItem.sender || 'Rekan IT APD'}`, 76, 565);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '500 17px sans-serif';
      const wibTime = formatWibTimestamp(kudosItem.createdAt || kudosItem.created_at || kudosItem.exactTimestamp);
      ctx.fillText(`${wibTime.exact || 'WIB'}  •  ❤️ ${kudosItem.likes || 1} Apresiasi`, 76, 598);

      ctx.fillStyle = 'rgba(255, 184, 0, 0.85)';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Direktorat IT • Bank Mandiri', 1004, 598);

      // 9. Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const safeRecipient = String(kudosItem.recipient || 'apd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 28);
      a.href = dataUrl;
      a.download = `kudos-cnt-apd-${safeRecipient}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { }
  };

  const validateKudos = () => {
    const errs = {};
    if (!sender.trim()) errs.sender = 'Nama pengirim / departemen wajib diisi';
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
    if (isSubmittingKudos) return;
    setIsSubmittingKudos(true);

    const nowIso = new Date().toISOString();
    onAddKudos({
      id: 'kd-' + Date.now(),
      sender: sender.trim() || 'Anonim',
      recipient: recipient.trim(),
      category,
      message: message.trim(),
      likes: 1,
      createdAt: nowIso
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
    setTimeout(() => setIsSubmittingKudos(false), 600);
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

  const handleOpenConfirmAspirasi = (e) => {
    e.preventDefault();
    if (!validateIdea()) return;
    setConfirmAspirasiOpen(true);
  };

  const handleFinalSubmitAspirasi = () => {
    if (isSubmittingAspirasi) return;
    setIsSubmittingAspirasi(true);

    if (onAddAspirasi) {
      onAddAspirasi({
        id: 'asp-' + Date.now(),
        title: ideaTitle.trim(),
        category: ideaCategory,
        description: ideaDesc.trim(),
        sender: ideaSender.trim() || 'Anonim',
        status: 'Menunggu Review',
        adminReply: '',
        isPublic: true,
        submittedAt: getExactTimestamp()
      });
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    setIdeaSuccess(true);
    setIdeaSender('');
    setIdeaTitle('');
    setIdeaDesc('');
    setIdeaErrors({});
    setConfirmAspirasiOpen(false);
    setTimeout(() => setIsSubmittingAspirasi(false), 600);
    setTimeout(() => setIdeaSuccess(false), 4000);
  };

  const totalApresiasi = kudosList.reduce((sum, item) => {
    return sum + (item.likes || 1);
  }, 0);

  const filteredKudos = kudosList.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (item.sender || '').toLowerCase().includes(q) ||
      (item.recipient || '').toLowerCase().includes(q) ||
      (item.message || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* TOP CULTURE CHAMPIONS LEADERBOARD & VALUE DISTRIBUTION */}
          {kudosList.length > 0 && (() => {
            const recipientStats = {};
            const categoryStats = {
              Kolaboratif: 0,
              Inovatif: 0,
              Harmonis: 0,
              Integritas: 0,
              Dedikasi: 0
            };

            kudosList.forEach((k) => {
              const rec = (k.recipient || '').trim();
              if (rec) {
                if (!recipientStats[rec]) {
                  recipientStats[rec] = { name: rec, count: 0, totalLikes: 0, topCategory: k.category || 'Kolaboratif' };
                }
                recipientStats[rec].count += 1;
                recipientStats[rec].totalLikes += Number(k.likes || 1);
              }
              const cat = k.category || 'Kolaboratif';
              categoryStats[cat] = (categoryStats[cat] || 0) + 1;
            });

            const topChampions = Object.values(recipientStats)
              .sort((a, b) => b.totalLikes - a.totalLikes || b.count - a.count)
              .slice(0, 3);

            const medals = ['🥇', '🥈', '🥉'];

            return (
              <div className="glass-panel" style={{
                padding: '24px 28px',
                border: '1.5px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="var(--mandiri-gold)" />
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        🏆 Top Culture Champions & Indeks Nilai Budaya
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Insan & Squad dengan apresiasi tertinggi serta distribusi nilai budaya Group IT APD
                      </span>
                    </div>
                  </div>
                  <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
                    Total {kudosList.length} Shoutout • {totalApresiasi} Likes
                  </span>
                </div>

                {/* Top 3 Champions Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {topChampions.map((champ, idx) => (
                    <div
                      key={champ.name}
                      onClick={() => setSearchQuery(champ.name)}
                      title={`Klik untuk melihat semua apresiasi untuk ${champ.name}`}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: idx === 0 ? 'rgba(255, 184, 0, 0.1)' : 'var(--input-bg)',
                        border: idx === 0 ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '1.45rem', flexShrink: 0 }}>{medals[idx] || '🌟'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {champ.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {champ.count} Kudos • Nilai: {champ.topCategory}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: 'var(--mandiri-gold)',
                        background: 'rgba(255, 184, 0, 0.14)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        flexShrink: 0
                      }}>
                        ❤️ {champ.totalLikes}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 5 Cultural Values Distribution Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--border-card)' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginRight: '4px' }}>
                    Filter Cepat Nilai Budaya:
                  </span>
                  {Object.entries(categoryStats).map(([catName, count]) => {
                    const pct = kudosList.length > 0 ? Math.round((count / kudosList.length) * 100) : 0;
                    const isSelected = categoryFilter === catName;
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCategoryFilter(isSelected ? 'all' : catName)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          border: isSelected ? '1px solid var(--neon-cyan)' : '1px solid var(--border-card)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'var(--input-bg)',
                          color: isSelected ? 'var(--neon-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {catName}: {count} ({pct}%)
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                    Dari Siapa? (Nama / Departemen Kamu) *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dimas (Departemen Wealth)"
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
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

              {/* Search & Category Filter Bar */}
              <div className="glass-panel" style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                border: '1px solid var(--border-card)'
              }}>
                <div style={{ position: 'relative', flex: '1 1 180px' }}>
                  <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama penerima, pengirim, atau isi apresiasi..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setKudosPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} color="var(--text-dim)" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setKudosPage(1);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Semua Kategori ({kudosList.length})</option>
                    <option value="Kolaboratif">Kolaboratif</option>
                    <option value="Inovatif">Inovatif</option>
                    <option value="Harmonis">Harmonis</option>
                    <option value="Integritas">Integritas</option>
                    <option value="Dedikasi">Dedikasi</option>
                  </select>
                </div>
              </div>

              {(() => {
                const KUDOS_PER_PAGE = 8;
                const totalKudosPages = Math.ceil(filteredKudos.length / KUDOS_PER_PAGE) || 1;
                const safeKudosPage = Math.min(Math.max(1, kudosPage), totalKudosPages);
                const paginatedKudos = filteredKudos.slice(
                  (safeKudosPage - 1) * KUDOS_PER_PAGE,
                  safeKudosPage * KUDOS_PER_PAGE
                );

                if (filteredKudos.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Tidak ada kiriman apresiasi yang cocok dengan pencarian atau filter kategori.
                    </div>
                  );
                }

                return (
                  <>
                    {paginatedKudos.map((kudos) => {
                      const isLiked = likedMap[kudos.id] || false;
                      const currentLikes = kudos.likes || 1;

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
                                <span>{formatWibTimestamp(kudos.createdAt || kudos.created_at || kudos.exactTimestamp).full}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleDownloadKudosCard(kudos)}
                                title="Unduh kartu ucapan Kudos beresolusi tinggi (PNG) untuk dibagikan ke WhatsApp / Teams"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: 'rgba(255, 184, 0, 0.12)',
                                  border: '1px solid rgba(255, 184, 0, 0.45)',
                                  color: 'var(--mandiri-gold)',
                                  padding: '4px 11px',
                                  borderRadius: 'var(--radius-full)',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}
                              >
                                <Download size={12} />
                                <span>Unduh Kartu (PNG)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleLike(kudos)}
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
                        </div>
                      );
                    })}

                    {totalKudosPages > 1 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '16px 20px',
                        marginTop: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-card)'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Menampilkan <strong>{(safeKudosPage - 1) * KUDOS_PER_PAGE + 1} - {Math.min(safeKudosPage * KUDOS_PER_PAGE, filteredKudos.length)}</strong> dari <strong>{filteredKudos.length}</strong> apresiasi
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={safeKudosPage === 1}
                            onClick={() => setKudosPage(p => Math.max(1, p - 1))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              color: safeKudosPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: safeKudosPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: safeKudosPage === 1 ? 0.45 : 1
                            }}
                          >
                            <ChevronLeft size={14} />
                            <span>Sebelumnya</span>
                          </button>
                          {Array.from({ length: totalKudosPages }, (_, i) => i + 1).map((pg) => {
                            if (totalKudosPages > 7 && Math.abs(pg - safeKudosPage) > 2 && pg !== 1 && pg !== totalKudosPages) {
                              if (pg === 2 || pg === totalKudosPages - 1) {
                                return <span key={pg} style={{ color: 'var(--text-dim)', padding: '0 4px', fontSize: '0.75rem' }}>...</span>;
                              }
                              return null;
                            }
                            const isActive = pg === safeKudosPage;
                            return (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setKudosPage(pg)}
                                style={{
                                  minWidth: '28px',
                                  height: '28px',
                                  padding: '0 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                                  color: isActive ? '#040914' : 'var(--text-main)',
                                  border: isActive ? 'none' : '1px solid var(--border-card)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {pg}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            disabled={safeKudosPage === totalKudosPages}
                            onClick={() => setKudosPage(p => Math.min(totalKudosPages, p + 1))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              color: safeKudosPage === totalKudosPages ? 'var(--text-dim)' : 'var(--text-main)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: safeKudosPage === totalKudosPages ? 'not-allowed' : 'pointer',
                              opacity: safeKudosPage === totalKudosPages ? 0.45 : 1
                            }}
                          >
                            <span>Selanjutnya</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
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
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
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
      {activeSubTab === 'aspirasi' && (() => {
        const publicAspirasi = (aspirasiList || []).filter(a => a.isPublic !== false);
        const normalizeAspirasiStatus = (status) => {
          if (status === 'Masuk Rencana Proker') return 'Masuk Rencana Event';
          return status || 'Menunggu Review';
        };

        const filteredAspirasi = publicAspirasi.filter(a => {
          if (aspirasiStatusFilter === 'all') return true;
          return normalizeAspirasiStatus(a.status) === aspirasiStatusFilter;
        });

        const getAspirasiBadge = (status) => {
          const norm = normalizeAspirasiStatus(status);
          if (norm === 'Sudah Direalisasikan') {
            return { bg: 'rgba(16, 185, 129, 0.16)', border: '#10b981', color: '#10b981', icon: '✓', label: 'Sudah Direalisasikan' };
          }
          if (norm === 'Masuk Rencana Event') {
            return { bg: 'rgba(255, 184, 0, 0.16)', border: 'var(--mandiri-gold)', color: 'var(--mandiri-gold)', icon: '🚀', label: 'Masuk Rencana Event' };
          }
          return { bg: 'rgba(56, 189, 248, 0.16)', border: 'var(--neon-cyan)', color: 'var(--neon-cyan)', icon: '⏳', label: 'Menunggu Review' };
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
            {/* Form Kotak Ide & Aspirasi */}
            <div className="glass-panel" style={{ padding: '32px', border: '1.5px solid var(--border-card)' }}>
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Lightbulb size={24} color="var(--mandiri-blue)" />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
                    Kotak Ide & Aspirasi Budaya
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Punya ide kegiatan seru, usulan fasilitas penunjang kenyamanan kerja, atau saran program wellbeing? Sampaikan aspirasimu (bisa Anonim atau mencantumkan Squad) dan pantau tindak lanjutnya secara transparan!
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
                  <span>Terima kasih! Idemu telah tersimpan di database CNT IT APD dan muncul di papan tindak lanjut aspirasi.</span>
                </div>
              )}

              <form onSubmit={handleOpenConfirmAspirasi} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Nama / Departemen Pengusul (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Kosongkan jika ingin Anonim"
                      value={ideaSender}
                      onChange={(e) => setIdeaSender(e.target.value)}
                      style={inputStyle(false)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Kategori Usulan
                    </label>
                    <select
                      value={ideaCategory}
                      onChange={(e) => setIdeaCategory(e.target.value)}
                      style={inputStyle(false)}
                    >
                      <option value="Kegiatan & Event">Kegiatan & Event Budaya</option>
                      <option value="Olahraga & Wellness">Olahraga, E-Sports & Wellness</option>
                      <option value="Fasilitas & Ruang Kerja">Fasilitas & Kenyamanan Kerja</option>
                      <option value="Sharing & Pengembangan">Tech Sharing & Pengembangan Diri</option>
                      <option value="Sosial & Kerohanian">Sosial, CSR & Kerohanian</option>
                    </select>
                  </div>
                </div>

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
                    rows={4}
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
                  🔒 Identitas bersifat opsional (otomatis tertulis "Anonim" bila dikosongkan) untuk menjaga kenyamanan berekspresi.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAspirasi}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: isSubmittingAspirasi ? 'var(--input-bg)' : 'var(--mandiri-blue)',
                    color: '#ffffff',
                    padding: '14px 24px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: isSubmittingAspirasi ? 'not-allowed' : 'pointer',
                    marginTop: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={16} />
                  <span>{isSubmittingAspirasi ? 'Mengirim Aspirasi...' : 'Kirimkan Aspirasi ke CNT'}</span>
                </button>
              </form>
            </div>

            {/* Papan Transparansi & Tindak Lanjut Aspirasi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    📌 Papan Transparansi & Tindak Lanjut Aspirasi ({publicAspirasi.length})
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Pantau status realisasi ide dan tanggapan resmi dari pengurus CNT IT APD
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {['all', 'Menunggu Review', 'Masuk Rencana Event', 'Sudah Direalisasikan'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setAspirasiStatusFilter(st);
                        setAspirasiPage(1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: aspirasiStatusFilter === st ? '1px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        background: aspirasiStatusFilter === st ? 'rgba(255, 184, 0, 0.16)' : 'var(--input-bg)',
                        color: aspirasiStatusFilter === st ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {st === 'all' ? 'Semua Status' : st}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const ASPIRASI_PER_PAGE = 6;
                const totalAspirasiPages = Math.ceil(filteredAspirasi.length / ASPIRASI_PER_PAGE) || 1;
                const safeAspirasiPage = Math.min(Math.max(1, aspirasiPage), totalAspirasiPages);
                const paginatedAspirasi = filteredAspirasi.slice(
                  (safeAspirasiPage - 1) * ASPIRASI_PER_PAGE,
                  safeAspirasiPage * ASPIRASI_PER_PAGE
                );

                if (filteredAspirasi.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Belum ada aspirasi publik pada filter status ini. Jadilah yang pertama mengusulkan ide positif!
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {paginatedAspirasi.map((asp) => {
                      const st = asp.status || 'Menunggu Review';
                      const badge = getAspirasiBadge(st);
                      return (
                        <div
                          key={asp.id}
                          className="glass-panel"
                          style={{
                            padding: '20px 22px',
                            borderLeft: `4px solid ${badge.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                                {asp.category || 'Usulan Budaya'}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Oleh: {asp.sender || 'Anonim'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                • {asp.submittedAt}
                              </span>
                            </div>

                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                              fontSize: '0.74rem',
                              fontWeight: 800
                            }}>
                              <span>{badge.icon}</span>
                              <span>{badge.label || st}</span>
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            {asp.title}
                          </h4>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                            {asp.description}
                          </p>

                          {asp.adminReply && (
                            <div style={{
                              marginTop: '4px',
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(16, 185, 129, 0.08)',
                              borderLeft: '3px solid #10b981',
                              fontSize: '0.83rem',
                              color: 'var(--text-main)',
                              lineHeight: 1.5
                            }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '3px' }}>
                                💬 Tanggapan & Tindak Lanjut Pengurus CNT IT APD:
                              </div>
                              <div>{asp.adminReply}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {totalAspirasiPages > 1 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '16px 20px',
                        marginTop: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-card)'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Menampilkan <strong>{(safeAspirasiPage - 1) * ASPIRASI_PER_PAGE + 1} - {Math.min(safeAspirasiPage * ASPIRASI_PER_PAGE, filteredAspirasi.length)}</strong> dari <strong>{filteredAspirasi.length}</strong> aspirasi
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={safeAspirasiPage === 1}
                            onClick={() => setAspirasiPage(p => Math.max(1, p - 1))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              color: safeAspirasiPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: safeAspirasiPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: safeAspirasiPage === 1 ? 0.45 : 1
                            }}
                          >
                            <ChevronLeft size={14} />
                            <span>Sebelumnya</span>
                          </button>
                          {Array.from({ length: totalAspirasiPages }, (_, i) => i + 1).map((pg) => {
                            if (totalAspirasiPages > 7 && Math.abs(pg - safeAspirasiPage) > 2 && pg !== 1 && pg !== totalAspirasiPages) {
                              if (pg === 2 || pg === totalAspirasiPages - 1) {
                                return <span key={pg} style={{ color: 'var(--text-dim)', padding: '0 4px', fontSize: '0.75rem' }}>...</span>;
                              }
                              return null;
                            }
                            const isActive = pg === safeAspirasiPage;
                            return (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setAspirasiPage(pg)}
                                style={{
                                  minWidth: '28px',
                                  height: '28px',
                                  padding: '0 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                                  color: isActive ? '#040914' : 'var(--text-main)',
                                  border: isActive ? 'none' : '1px solid var(--border-card)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {pg}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            disabled={safeAspirasiPage === totalAspirasiPages}
                            onClick={() => setAspirasiPage(p => Math.min(totalAspirasiPages, p + 1))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              color: safeAspirasiPage === totalAspirasiPages ? 'var(--text-dim)' : 'var(--text-main)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: safeAspirasiPage === totalAspirasiPages ? 'not-allowed' : 'pointer',
                              opacity: safeAspirasiPage === totalAspirasiPages ? 0.45 : 1
                            }}
                          >
                            <span>Selanjutnya</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION PREVIEW MODAL SEBELUM KIRIM ASPIRASI */}
      {confirmAspirasiOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
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
                    Konfirmasi Pengiriman Aspirasi
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Pastikan usulan dan ide Anda sudah sesuai sebelum dikirim ke pengurus
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmAspirasiOpen(false)}
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
                <span style={{ color: 'var(--text-dim)' }}>Pengusul: </span>
                <strong style={{ color: 'var(--neon-cyan)' }}>{ideaSender.trim() || 'Anonim'}</strong>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Kategori: </span>
                <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>{ideaCategory}</span>
              </div>
              <div style={{ fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Judul Usulan: </span>
                <strong style={{ color: 'var(--text-main)' }}>{ideaTitle}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Deskripsi Aspirasi:</span>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  "{ideaDesc}"
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              💡 <em>Catatan:</em> Usulan Anda akan masuk ke antrean pengurus CNT IT APD untuk direview dan ditindaklanjuti pada rapat koordinasi budaya kerja.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setConfirmAspirasiOpen(false)}
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
                onClick={handleFinalSubmitAspirasi}
                disabled={isSubmittingAspirasi}
                style={{
                  padding: '9px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: isSubmittingAspirasi ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(255,184,0,0.3)'
                }}
              >
                {isSubmittingAspirasi ? 'Mengirim...' : 'Ya, Kirim Aspirasi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
