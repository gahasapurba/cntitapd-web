import React, { useState } from 'react';
import { 
  Heart, 
  Send, 
  Sparkles, 
  MessageSquare, 
  ThumbsUp, 
  Lightbulb, 
  CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function KudosSection({ kudosList, onAddKudos }) {
  const [activeSubTab, setActiveSubTab] = useState('kudos'); // 'kudos' | 'aspirasi'
  
  // Form State Kudos
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Kolaboratif');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State Aspirasi
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaSuccess, setIdeaSuccess] = useState(false);

  const handleSubmitKudos = (e) => {
    e.preventDefault();
    if (!sender.trim() || !recipient.trim() || !message.trim()) return;

    onAddKudos({
      id: 'kd-' + Date.now(),
      sender,
      recipient,
      category,
      message,
      likes: 1,
      date: 'Baru saja'
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
    setTimeout(() => setIsSuccess(false), 4000);
  };

  const handleSubmitIdea = (e) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaDesc.trim()) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setIdeaSuccess(true);
    setIdeaTitle('');
    setIdeaDesc('');
    setTimeout(() => setIdeaSuccess(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Interaksi & Suara Insan APD
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Wall of Kudos & Aspirasi
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Apresiasi rekan kerjamu atas dedikasi dan sinerginya (Nilai Utama AKHLAK) atau sampaikan ide kreatif untuk memajukan budaya kerja Group IT APD.
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
            background: activeSubTab === 'kudos' ? 'var(--mandiri-gold)' : 'rgba(0, 61, 121, 0.08)',
            color: activeSubTab === 'kudos' ? '#0a1128' : 'var(--text-main)',
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
            background: activeSubTab === 'aspirasi' ? 'var(--neon-cyan)' : 'rgba(0, 61, 121, 0.08)',
            color: activeSubTab === 'aspirasi' ? '#0a1128' : 'var(--text-main)',
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr',
          gap: '36px',
          alignItems: 'start',
        }}>
          {/* Send Form */}
          <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(255,184,0,0.3)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Beri Shoutout Apresiasi 🌟
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Ucapan tulusmu bisa mencerahkan hari rekan kerja dan menyalakan api semangat tim.
            </p>

            {isSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
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

            <form onSubmit={handleSubmitKudos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Namamu / Squad Asal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas (Squad Wealth)"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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
                  Apresiasi Untuk Siapa?
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarah (QA Lead) / Tim Backend"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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
                  Nilai Utama (AKHLAK)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#0f1c3f',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Amanah">Amanah (Dapat Dipercaya)</option>
                  <option value="Kompeten">Kompeten (Terus Belajar & Unggul)</option>
                  <option value="Harmonis">Harmonis (Saling Peduli & Menghargai)</option>
                  <option value="Loyal">Loyal (Berdedikasi untuk Bangsa & Mandiri)</option>
                  <option value="Adaptif">Adaptif (Cepat Menyesuaikan Inovasi)</option>
                  <option value="Kolaboratif">Kolaboratif (Membangun Kerjasama Sinergis)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Pesan Apresiasimu
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ceritakan bantuan atau tindakan positifnya yang sangat membantumu..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--accent-gold)',
                  color: '#0a1128',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                <Send size={16} />
                <span>Kirimkan Apresiasi</span>
              </button>
            </form>
          </div>

          {/* Kudos Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Wall of Appreciation ({kudosList.length})
              </h3>
              <span className="badge-cyan" style={{ fontSize: '0.72rem' }}>Live Feed</span>
            </div>

            {kudosList.map((kudos) => (
              <div 
                key={kudos.id} 
                className="glass-panel" 
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: '4px solid var(--accent-gold)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--accent-gold)' }}>{kudos.sender}</strong>
                    <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>apresiasi kepada</span>
                    <strong style={{ color: 'var(--text-main)' }}>{kudos.recipient}</strong>
                  </div>
                  <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                    {kudos.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{kudos.message}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>⏱️ {kudos.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-rose)' }}>
                    <Heart size={13} fill="currentColor" />
                    <span>{kudos.likes} apresiasi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT: ASPIRASI */}
      {activeSubTab === 'aspirasi' && (
        <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Lightbulb size={24} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Kotak Ide & Aspirasi Budaya (Anonim)
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Punya ide kegiatan seru, usulan fasilitas penunjang kenyamanan kerja, atau saran program wellbeing? Suaramu sangat berarti untuk kemajuan IT APD!
            </p>

            {ideaSuccess && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
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

            <form onSubmit={handleSubmitIdea} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Judul Ide / Usulan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sesi Coffee Talk dengan Group Head / Turnamen Mini Soccer Lintas Departemen"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Deskripsi & Dampak yang Diharapkan
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Jelaskan detail ide dan kenapa program ini akan bermanfaat bagi insan IT APD..."
                  value={ideaDesc}
                  onChange={(e) => setIdeaDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
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
                  background: 'var(--accent-cyan)',
                  color: '#0a1128',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px'
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
