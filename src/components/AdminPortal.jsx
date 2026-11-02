import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Plus, 
  Settings, 
  Layers, 
  Calendar, 
  FileCheck2, 
  LogOut,
  Image as ImageIcon,
  Trash2,
  CheckCircle2
} from 'lucide-react';

// Client-side SHA-256 hash helper using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Stored SHA-256 hashes (No plaintext credentials in code/repository)
const ADMIN_USER_HASH = '84d50274d92ff024110ab51d81dbe6dc7936eacf67ca813516982befb2fffdf0';
const ADMIN_PASS_HASH = 'f341ad38cdc4d5bbf4678c1452ba532ae2ca6e43590d48f27fe60d09bbb35679';

export default function AdminPortal({ 
  onBack, 
  tenures, 
  onAddTenure, 
  divisions, 
  onAddDivision, 
  recruitmentInfo, 
  onUpdateRecruitment, 
  applications = [],
  galleries = [],
  onAddGallery
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard Tabs: 'divisions' | 'tenure' | 'recruitment' | 'applicants' | 'gallery'
  const [activeTab, setActiveTab] = useState('gallery');

  // Form states for new division
  const [newDivName, setNewDivName] = useState('');
  const [newDivLead, setNewDivLead] = useState('');
  const [newDivColor, setNewDivColor] = useState('#00529B');
  const [newDivDesc, setNewDivDesc] = useState('');
  const [newDivFocus, setNewDivFocus] = useState('');

  // Form states for new tenure
  const [newTenureCode, setNewTenureCode] = useState('');
  const [newTenureTitle, setNewTenureTitle] = useState('');
  const [newTenureTagline, setNewTenureTagline] = useState('');

  // Recruitment controls
  const [isRecruitOpen, setIsRecruitOpen] = useState(recruitmentInfo.isOpen);
  const [recruitDeadline, setRecruitDeadline] = useState(recruitmentInfo.deadline);

  // Form states for new Gallery Event
  const [galTitle, setGalTitle] = useState('');
  const [galDate, setGalDate] = useState('');
  const [galDivision, setGalDivision] = useState('Creative Media');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotos, setGalPhotos] = useState('');

  // Secure SHA-256 Authentication (Zero plaintext in code)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const uHash = await sha256(username.trim());
      const pHash = await sha256(password);

      if (uHash === ADMIN_USER_HASH && pHash === ADMIN_PASS_HASH) {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Username atau password salah');
      }
    } catch (err) {
      setLoginError('Gagal memverifikasi kredensial');
    }
  };

  const handleCreateDivision = (e) => {
    e.preventDefault();
    if (!newDivName.trim()) return;

    onAddDivision({
      id: 'div-' + Date.now(),
      name: newDivName,
      slug: newDivName.toLowerCase().replace(/\s+/g, '-'),
      leadName: newDivLead || 'TBD',
      leadRole: `Pimpro ${newDivName}`,
      badge: `${newDivName} Lead`,
      color: newDivColor,
      motto: 'Mendorong Transformasi Budaya Berkelanjutan',
      description: newDivDesc || 'Divisi pengembangan inisiatif budaya di Group IT APD.',
      focusAreas: newDivFocus ? newDivFocus.split(',').map(s => s.trim()) : ['Program Kerja Baru'],
      isRecruiting: true,
      requirements: ['Memiliki komitmen tinggi', 'Aktif dan kolaboratif']
    });

    setNewDivName('');
    setNewDivLead('');
    setNewDivDesc('');
    setNewDivFocus('');
    alert(`Divisi "${newDivName}" berhasil ditambahkan!`);
  };

  const handleCreateTenure = (e) => {
    e.preventDefault();
    if (!newTenureCode.trim()) return;

    onAddTenure({
      id: 'tenure-' + newTenureCode,
      code: newTenureCode,
      title: newTenureTitle || `Kepengurusan CNT IT APD ${newTenureCode}`,
      themeTagline: newTenureTagline || 'Sinergi, Inovasi & Cultural Excellence',
      isActive: false
    });

    setNewTenureCode('');
    setNewTenureTitle('');
    setNewTenureTagline('');
    alert(`Periode Kepengurusan "${newTenureCode}" berhasil dibuat!`);
  };

  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  // Photos file selector handler
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhotos(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedPhoto = (idx) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateGallery = (e) => {
    e.preventDefault();
    if (!galTitle.trim() || !galDesc.trim()) return;

    // Photos from text URL input + locally uploaded photos
    const urlPhotos = galPhotos.trim() 
      ? galPhotos.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      : [];
    
    const combinedPhotos = [...uploadedPhotos, ...urlPhotos];
    const photoList = combinedPhotos.length > 0 ? combinedPhotos : ['/images/pimpro-adjie.jpg'];

    onAddGallery({
      id: 'gal-' + Date.now(),
      title: galTitle,
      date: galDate || '2026',
      division: galDivision,
      description: galDesc,
      photos: photoList
    });

    setGalTitle('');
    setGalDate('');
    setGalDesc('');
    setGalPhotos('');
    setUploadedPhotos([]);
    alert(`Dokumentasi "${galTitle}" berhasil ditambahkan ke Galeri Kegiatan!`);
  };

  const handleSaveRecruitment = () => {
    onUpdateRecruitment({
      ...recruitmentInfo,
      isOpen: isRecruitOpen,
      deadline: recruitDeadline
    });
    alert('Pengaturan Open Recruitment berhasil disimpan!');
  };

  // IF NOT AUTHENTICATED: SHOW LOGIN FORM
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto 80px auto', padding: '0 16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda Utama</span>
        </button>

        <div className="glass-panel" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(255, 184, 0, 0.15)',
              border: '1px solid var(--mandiri-gold)',
              color: 'var(--mandiri-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Portal Pengurus CNT
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Masuk untuk mengelola galeri kegiatan, divisi, dan pendaftar Oprec.
            </p>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid #f43f5e',
              color: '#f43f5e',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                required
                placeholder="masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
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
                background: 'var(--mandiri-gold)',
                color: '#040914',
                padding: '13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              <KeyRound size={17} />
              <span>Masuk ke Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: SHOW ADMIN DASHBOARD
  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto 80px auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Admin Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Web</span>
          </button>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-card)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Admin Dashboard CNT IT APD
          </h2>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} />
          <span>Logout Admin</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-panel" style={{
        padding: '8px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'gallery', label: `Galeri Kegiatan (${galleries.length})`, icon: ImageIcon },
          { id: 'divisions', label: 'Kelola Divisi', icon: Layers },
          { id: 'tenure', label: 'Periode Kepengurusan', icon: Calendar },
          { id: 'recruitment', label: 'Pengaturan Oprec', icon: Settings },
          { id: 'applicants', label: `Pendaftar Masuk (${applications.length})`, icon: FileCheck2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--mandiri-gold)' : 'transparent',
                color: isActive ? '#040914' : 'var(--text-muted)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 0: GALERI KEGIATAN DINAMIS */}
      {activeTab === 'gallery' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Dokumentasi Kegiatan Baru
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan judul, tanggal, deskripsi kegiatan, dan link foto (otomatis tampil dalam bentuk Carousel di halaman Galeri).
            </p>
          </div>

          <form onSubmit={handleCreateGallery} style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '16px',
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Judul Kegiatan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: IT APD Fun Run 5K Gelora Mandiri"
                value={galTitle}
                onChange={(e) => setGalTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Waktu Pelaksanaan
              </label>
              <input
                type="text"
                placeholder="Contoh: 15 Maret 2026"
                value={galDate}
                onChange={(e) => setGalDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Divisi Penyelenggara
              </label>
              <select
                value={galDivision}
                onChange={(e) => setGalDivision(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Singkat Acara *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ceritakan keseruan acara dan antusiasme insan IT APD..."
                value={galDesc}
                onChange={(e) => setGalDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Upload Foto Kegiatan (Pilih file langsung atau masukkan URL)
              </label>

              {/* File upload input */}
              <div style={{
                border: '2px dashed var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                background: 'var(--input-bg)',
                marginBottom: '12px'
              }}>
                <input
                  type="file"
                  id="galFileInput"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="galFileInput" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--mandiri-blue)',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ImageIcon size={15} />
                  <span>Pilih File Foto dari Komputer</span>
                </label>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Bisa memilih banyak foto sekaligus (JPG, PNG, WebP)
                </div>
              </div>

              {/* Uploaded Photos Thumbnails Preview */}
              {uploadedPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {uploadedPhotos.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img 
                        src={p} 
                        alt="Preview" 
                        style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--mandiri-gold)' }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedPhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#f43f5e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Atau masukkan Link Foto Web / Supabase (opsional):
              </label>
              <textarea
                rows={2}
                placeholder="https://...link-foto-1.jpg&#10;https://...link-foto-2.jpg"
                value={galPhotos}
                onChange={(e) => setGalPhotos(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Publikasikan ke Galeri</span>
              </button>
            </div>
          </form>

          {/* Existing Galleries List */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Arsip Galeri Saat Ini ({galleries.length}):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {galleries.map((gal) => (
                <div key={gal.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>{gal.title}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {gal.date} • {gal.division} • {gal.photos?.length || 0} Foto
                    </div>
                  </div>
                  <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>Aktif di Web</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: DIVISI */}
      {activeTab === 'divisions' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Divisi / Bidang Baru Dinamis
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Jika ada restrukturisasi organisasi pada periode kepengurusan selanjutnya, tambahkan divisi baru di sini.
            </p>
          </div>

          <form onSubmit={handleCreateDivision} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Divisi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Social Impact & Sustainability"
                value={newDivName}
                onChange={(e) => setNewDivName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Pimpro / PIC Divisi
              </label>
              <input
                type="text"
                placeholder="Nama PIC"
                value={newDivLead}
                onChange={(e) => setNewDivLead(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Tugas
              </label>
              <textarea
                rows={2}
                placeholder="Jelaskan peran divisi ini..."
                value={newDivDesc}
                onChange={(e) => setNewDivDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Fokus Program (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                placeholder="Contoh: CSR, Penghijauan, Pilah Sampah"
                value={newDivFocus}
                onChange={(e) => setNewDivFocus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Tambahkan Divisi Baru</span>
              </button>
            </div>
          </form>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Daftar Divisi Aktif ({divisions.length}):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {divisions.map((d) => (
                <div key={d.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${d.color}`
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                      Pimpro: {d.leadName}
                    </span>
                  </div>
                  <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>
                    {d.isRecruiting ? 'Oprec Buka' : 'Oprec Tutup'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: TENURE */}
      {activeTab === 'tenure' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Manajemen Periode Kepengurusan
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Memungkinkan pergantian tahun kepengurusan tanpa menghapus sejarah pengurus lama.
            </p>
          </div>

          <form onSubmit={handleCreateTenure} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <input
              type="text"
              required
              placeholder="Kode Tahun (misal: 2027)"
              value={newTenureCode}
              onChange={(e) => setNewTenureCode(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
            <input
              type="text"
              placeholder="Tagline Tema Budaya Periode Ini"
              value={newTenureTagline}
              onChange={(e) => setNewTenureTagline(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="submit"
              style={{
                gridColumn: 'span 2',
                padding: '9px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Tambah Periode Baru
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tenures.map((t) => (
              <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{t.title}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>"{t.themeTagline}"</div>
                </div>
                <span className={t.isActive ? "badge-gold" : "badge-cyan"}>
                  {t.isActive ? 'Periode Aktif' : 'Arsip'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SETTING OPREC */}
      {activeTab === 'recruitment' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Kontrol Buka / Tutup Pendaftaran Open Recruitment
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Atur status ketersediaan form registrasi calon pengurus
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="recruitStatus"
                checked={isRecruitOpen}
                onChange={(e) => setIsRecruitOpen(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="recruitStatus" style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>
                Buka Pendaftaran Open Recruitment di Website
              </label>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Batas Akhir / Tanggal Deadline Pendaftaran
              </label>
              <input
                type="text"
                value={recruitDeadline}
                onChange={(e) => setRecruitDeadline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <button
              onClick={handleSaveRecruitment}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: APPLICANTS */}
      {activeTab === 'applicants' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Daftar Berkas Pendaftar Masuk ({applications.length})
          </h3>

          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              Belum ada formulir baru yang disubmit pendaftar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {applications.map((app) => (
                <div key={app.id} style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{app.fullName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (NIP: {app.nip} • {app.unitSquad})
                      </span>
                    </div>
                    <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                      {app.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)' }}>
                    Pilihan 1: <strong>{app.div1}</strong> | Pilihan 2: <strong>{app.div2}</strong>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{app.motivation}"
                  </p>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Kontak: {app.whatsapp} | {app.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
