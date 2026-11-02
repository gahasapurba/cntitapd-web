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
  CheckCircle2,
  Link2,
  ExternalLink,
  Eye,
  EyeOff,
  Edit2,
  AlertTriangle,
  Users,
  Heart,
  X
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
  tenures = [], 
  onAddTenure, 
  onUpdateTenure,
  onDeleteTenure,
  divisions = [], 
  onAddDivision, 
  onUpdateDivision,
  onDeleteDivision,
  recruitmentInfo, 
  onUpdateRecruitment, 
  applications = [],
  galleries = [],
  onAddGallery,
  onUpdateGallery,
  onDeleteGallery,
  members = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  events = [],
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  kudosList = [],
  onUpdateKudos,
  onDeleteKudos
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard Tabs: 'members' | 'gallery' | 'divisions' | 'tenure' | 'recruitment' | 'applicants'
  const [activeTab, setActiveTab] = useState('members');

  // Generic Edit Modal State: { type: 'member'|'division'|'tenure'|'gallery', item: {...} }
  const [editingItem, setEditingItem] = useState(null);

  // Generic Delete Confirmation Modal State: { type: 'member'|'division'|'tenure'|'gallery', id: string, name: string }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form states for new member
  const [memName, setMemName] = useState('');
  const [memCategory, setMemCategory] = useState('anggota'); // 'pembina' | 'inti' | 'pimpro' | 'anggota'
  const [memRole, setMemRole] = useState('');
  const [memDivisionId, setMemDivisionId] = useState(divisions[0]?.id || 'div-exp');
  const [memWhatsapp, setMemWhatsapp] = useState('');
  const [memMotto, setMemMotto] = useState('');
  const [memImage, setMemImage] = useState('');

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
  const [newTenureHeadline, setNewTenureHeadline] = useState('');
  const [newTenureHighlight, setNewTenureHighlight] = useState('');
  const [newTenureVisi, setNewTenureVisi] = useState('');
  const [newTenureMisi, setNewTenureMisi] = useState('');

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

  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!memName.trim()) return;

    const divObj = divisions.find(d => d.id === memDivisionId);
    const color = divObj?.color || '#FFB800';

    onAddMember({
      id: 'mem-' + Date.now(),
      tenureId: 'tenure-2026',
      divisionId: memCategory === 'anggota' || memCategory === 'pimpro' ? memDivisionId : undefined,
      category: memCategory,
      name: memName,
      shortName: memName.split(' ')[0],
      role: memRole || (memCategory === 'anggota' ? 'Anggota Divisi' : 'Pengurus'),
      title: memCategory === 'anggota' ? `Anggota ${divObj?.name || 'CNT'}` : memRole,
      image: memImage || '',
      color: color,
      whatsapp: memWhatsapp.trim(),
      motto: memMotto || 'Dedikasi & Semangat untuk Insan IT APD',
      responsibilities: ['Kontribusi aktif dalam pelaksanaan program kerja budaya CNT IT APD']
    });

    setMemName('');
    setMemRole('');
    setMemWhatsapp('');
    setMemMotto('');
    setMemImage('');
    alert(`Pengurus/Anggota "${memName}" berhasil ditambahkan!`);
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
      heroHeadline: newTenureHeadline || 'COMMITTED TO CULTIVATE',
      heroHighlight: newTenureHighlight || 'EXCELLENCE & SYNERGY',
      visi: newTenureVisi || 'Menjadi akselerator budaya kerja kolaboratif, agile, dan profesional.',
      misi: newTenureMisi 
        ? newTenureMisi.split('\n').map(s => s.trim()).filter(Boolean)
        : [
            'Memperkuat sinergi dan komunikasi terbuka antar squad delivery.',
            'Menumbuhkan wellbeing jasmani dan rohani insan IT APD.'
          ],
      isActive: false
    });

    setNewTenureCode('');
    setNewTenureTitle('');
    setNewTenureTagline('');
    setNewTenureHeadline('');
    setNewTenureHighlight('');
    setNewTenureVisi('');
    setNewTenureMisi('');
    alert(`Periode Kepengurusan "${newTenureCode}" beserta Visi Misi berhasil dibuat!`);
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

  // Documentation Links (Dynamic multiple links with Link Text & URL)
  const [galDocLinks, setGalDocLinks] = useState([
    { text: 'Folder Dokumentasi Full HD (Google Drive)', url: '' }
  ]);

  const addDocLinkField = () => {
    setGalDocLinks(prev => [...prev, { text: '', url: '' }]);
  };

  const removeDocLinkField = (index) => {
    setGalDocLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateDocLinkField = (index, field, value) => {
    setGalDocLinks(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
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

    // Cleaned valid doc links
    const validDocLinks = galDocLinks.filter(l => l.url.trim() && l.text.trim());

    onAddGallery({
      id: 'gal-' + Date.now(),
      title: galTitle,
      date: galDate || '2026',
      division: galDivision,
      description: galDesc,
      photos: photoList,
      docLinks: validDocLinks
    });

    setGalTitle('');
    setGalDate('');
    setGalDesc('');
    setGalPhotos('');
    setUploadedPhotos([]);
    setGalDocLinks([{ text: 'Folder Dokumentasi Full HD (Google Drive)', url: '' }]);
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
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
          { id: 'members', label: `Pengurus & Anggota (${members.length})`, icon: Users },
          { id: 'kudos', label: `Wall of Kudos (${kudosList.length})`, icon: Heart },
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

      {/* TAB CONTENT: PENGURUS & ANGGOTA (DENGAN NOMOR WA OPSIONAL) */}
      {activeTab === 'members' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Pengurus & Anggota Divisi Dinamis
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan jajaran pimpinan, pembina, pimpro, maupun anggota divisi ke dalam struktur hierarki organigram lengkap dengan nomor WhatsApp untuk kemudahan koordinasi.
            </p>
          </div>

          <form onSubmit={handleCreateMember} className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Raden Bagus Prakoso"
                value={memName}
                onChange={(e) => setMemName(e.target.value)}
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
                Nomor WhatsApp (Opsional) 💬
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={memWhatsapp}
                onChange={(e) => setMemWhatsapp(e.target.value)}
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
                Kategori Posisi *
              </label>
              <select
                value={memCategory}
                onChange={(e) => setMemCategory(e.target.value)}
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
                <option value="anggota">Anggota Divisi</option>
                <option value="pimpro">Pimpro / Ketua Divisi</option>
                <option value="inti">Pengurus Inti (Ketua / Wakil / Sekben)</option>
                <option value="pembina">Pembina / Advisor</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Jabatan / Role Spesifik
              </label>
              <input
                type="text"
                placeholder="Contoh: Officer Creative Designer / Turnamen Lead"
                value={memRole}
                onChange={(e) => setMemRole(e.target.value)}
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

            {(memCategory === 'anggota' || memCategory === 'pimpro') && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Divisi / Squad
                </label>
                <select
                  value={memDivisionId}
                  onChange={(e) => setMemDivisionId(e.target.value)}
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
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Motto / Pesan Semangat
              </label>
              <input
                type="text"
                placeholder="Contoh: Siap berkontribusi aktif memajukan budaya kolaborasi IT APD"
                value={memMotto}
                onChange={(e) => setMemMotto(e.target.value)}
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
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Simpan ke Database Organisasi</span>
              </button>
            </div>
          </form>

          {/* Members List */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Personel Terdaftar Saat Ini ({members.length}):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {members.map((m) => (
                <div key={m.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {m.role} {m.title ? `• ${m.title}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.whatsapp ? (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        WA: Aktif
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Tanpa WA
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'member', item: { ...m } })}
                      title="Edit Data Personel"
                      style={{
                        padding: '6px',
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: '1px solid #0284c7',
                        color: '#0284c7',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'member', id: m.id, name: m.name })}
                      title="Hapus Personel"
                      style={{
                        padding: '6px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

          <form onSubmit={handleCreateGallery} className="admin-form-two-col" style={{
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

            {/* DYNAMIC DOCUMENTATION LINKS (Link & Link Text) */}
            <div style={{
              gridColumn: 'span 2',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 61, 121, 0.04)',
              border: '1px solid var(--border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link2 size={16} color="var(--mandiri-blue)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Link Dokumentasi Full (Google Drive / OneDrive / Teams)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addDocLinkField}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--badge-bg)',
                    color: 'var(--mandiri-blue)',
                    border: '1px solid var(--border-card)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Link Lain</span>
                </button>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: 0 }}>
                Masukkan URL penyimpanan cloud beserta nama tombol (misal: "Download Foto HD GDrive" atau "Materi Presentasi & Notulensi").
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {galDocLinks.map((linkItem, lIdx) => (
                  <div key={lIdx} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.4fr auto',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Teks (misal: Dokumentasi GDrive)"
                        value={linkItem.text}
                        onChange={(e) => updateDocLinkField(lIdx, 'text', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={linkItem.url}
                        onChange={(e) => updateDocLinkField(lIdx, 'url', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    {galDocLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDocLinkField(lIdx)}
                        title="Hapus Link"
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>Aktif di Web</span>

                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'gallery', item: { ...gal } })}
                      title="Edit Galeri Kegiatan"
                      style={{
                        padding: '6px',
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: '1px solid #0284c7',
                        color: '#0284c7',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'gallery', id: gal.id, name: gal.title })}
                      title="Hapus Galeri"
                      style={{
                        padding: '6px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>
                      {d.isRecruiting ? 'Oprec Buka' : 'Oprec Tutup'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'division', item: { ...d } })}
                      title="Edit Data Divisi"
                      style={{
                        padding: '6px',
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: '1px solid #0284c7',
                        color: '#0284c7',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'division', id: d.id, name: d.name })}
                      title="Hapus Divisi"
                      style={{
                        padding: '6px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kode Tahun *
              </label>
              <input
                type="text"
                required
                placeholder="misal: 2027"
                value={newTenureCode}
                onChange={(e) => setNewTenureCode(e.target.value)}
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

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Nama Periode *
              </label>
              <input
                type="text"
                placeholder="misal: Kepengurusan CNT IT APD 2027"
                value={newTenureTitle}
                onChange={(e) => setNewTenureTitle(e.target.value)}
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Motto / Tagline Tema Budaya
              </label>
              <input
                type="text"
                placeholder="misal: Elevating Culture, Tech Synergy & Human Excellence"
                value={newTenureTagline}
                onChange={(e) => setNewTenureTagline(e.target.value)}
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

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Headline Beranda
              </label>
              <input
                type="text"
                placeholder="misal: COMMITTED TO CULTIVATE"
                value={newTenureHeadline}
                onChange={(e) => setNewTenureHeadline(e.target.value)}
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

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Highlight Berwarna Neon
              </label>
              <input
                type="text"
                placeholder="misal: EXCELLENCE & SYNERGY"
                value={newTenureHighlight}
                onChange={(e) => setNewTenureHighlight(e.target.value)}
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Visi Budaya Periode Ini
              </label>
              <textarea
                rows={2}
                placeholder="Menjadi akselerator budaya kerja kolaboratif, agile, dan profesional..."
                value={newTenureVisi}
                onChange={(e) => setNewTenureVisi(e.target.value)}
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Misi Budaya (Pisahkan baris per butir misi)
              </label>
              <textarea
                rows={3}
                placeholder="Memperkuat sinergi dan komunikasi terbuka&#10;Menumbuhkan wellbeing jasmani dan rohani&#10;Menyediakan panggung apresiasi prestasi"
                value={newTenureMisi}
                onChange={(e) => setNewTenureMisi(e.target.value)}
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
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Simpan & Tambah Periode
              </button>
            </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={t.isActive ? "badge-gold" : "badge-cyan"}>
                    {t.isActive ? 'Periode Aktif' : 'Arsip'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingItem({ type: 'tenure', item: { ...t } })}
                    title="Edit Periode Kepengurusan"
                    style={{
                      padding: '6px',
                      background: 'rgba(14, 165, 233, 0.1)',
                      border: '1px solid #0284c7',
                      color: '#0284c7',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: 'tenure', id: t.id, name: t.title })}
                    title="Hapus Periode"
                    style={{
                      padding: '6px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid #f43f5e',
                      color: '#f43f5e',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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

      {/* TAB CONTENT: KUDOS MANAGEMENT */}
      {activeTab === 'kudos' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Kelola Kiriman Apresiasi & Kudos ({kudosList.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Seluruh apresiasi dari Wall of Kudos dapat diedit atau dihapus oleh Admin untuk menjaga ketertiban konten.
              </p>
            </div>
            <span className="badge-gold" style={{ fontSize: '0.75rem' }}>
              Moderasi Konten Aktif
            </span>
          </div>

          {kudosList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              Belum ada kiriman apresiasi di Wall of Kudos.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {kudosList.map((kudos) => (
                <div key={kudos.id} style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="badge-gold" style={{ fontSize: '0.68rem' }}>{kudos.category}</span>
                      <strong style={{ color: 'var(--neon-cyan)', fontSize: '0.92rem' }}>{kudos.sender}</strong>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>kepada</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{kudos.recipient}</strong>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{kudos.message}"
                    </p>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <span>⏱️ {kudos.exactTimestamp || kudos.date}</span>
                      <span>•</span>
                      <span>❤️ {kudos.likes || 1} Apresiasi</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setEditingItem({ type: 'kudos', item: { ...kudos } })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255,184,0,0.12)',
                        border: '1px solid var(--mandiri-gold)',
                        color: 'var(--mandiri-gold)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Edit kiriman apresiasi"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'kudos', id: kudos.id, name: `Apresiasi dari ${kudos.sender} untuk ${kudos.recipient}` })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(244,63,94,0.12)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Hapus kiriman apresiasi"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '30px',
            border: '1.5px solid var(--mandiri-gold)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--mandiri-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Edit {editingItem.type === 'member' ? 'Personel' : editingItem.type === 'division' ? 'Divisi' : editingItem.type === 'gallery' ? 'Galeri' : editingItem.type === 'kudos' ? 'Apresiasi / Kudos' : 'Periode'}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Edit Member Form */}
            {editingItem.type === 'member' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Jabatan / Role</label>
                  <input
                    type="text"
                    value={editingItem.item.role || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, role: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    value={editingItem.item.whatsapp || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, whatsapp: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto</label>
                  <input
                    type="text"
                    value={editingItem.item.motto || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Division Form */}
            {editingItem.type === 'division' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Divisi</label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Pimpro / PIC</label>
                  <input
                    type="text"
                    value={editingItem.item.leadName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, leadName: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Peran</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Gallery Form */}
            {editingItem.type === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Acara</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal / Jadwal</label>
                  <input
                    type="text"
                    value={editingItem.item.date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, date: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Kegiatan</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Tenure Form */}
            {editingItem.type === 'tenure' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Kepengurusan</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tagline Budaya</label>
                  <input
                    type="text"
                    value={editingItem.item.themeTagline || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, themeTagline: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Kudos Form */}
            {editingItem.type === 'kudos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Pengirim</label>
                  <input
                    type="text"
                    value={editingItem.item.sender || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, sender: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Penerima</label>
                  <input
                    type="text"
                    value={editingItem.item.recipient || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, recipient: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Nilai Budaya</label>
                  <select
                    value={editingItem.item.category || 'Kolaboratif'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    <option value="Kolaboratif">Kolaboratif (Sinergi & Kerjasama Tim)</option>
                    <option value="Inovatif">Inovatif & Solutif (Excellence & Agility)</option>
                    <option value="Harmonis">Harmonis (Saling Peduli & Menghargai)</option>
                    <option value="Integritas">Integritas (Komitmen & Tanggung Jawab)</option>
                    <option value="Dedikasi">Dedikasi (Customer Centric & Prima)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pesan Apresiasi</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.message || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, message: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingItem.type === 'member' && onUpdateMember) onUpdateMember(editingItem.item);
                  if (editingItem.type === 'division' && onUpdateDivision) onUpdateDivision(editingItem.item);
                  if (editingItem.type === 'gallery' && onUpdateGallery) onUpdateGallery(editingItem.item);
                  if (editingItem.type === 'tenure' && onUpdateTenure) onUpdateTenure(editingItem.item);
                  if (editingItem.type === 'kudos' && onUpdateKudos) onUpdateKudos(editingItem.item);
                  setEditingItem(null);
                  alert('Perubahan data berhasil disimpan!');
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE DIALOG */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            border: '1.5px solid #f43f5e',
            boxShadow: '0 10px 40px rgba(244, 63, 94, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Konfirmasi Penghapusan Data
            </h3>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong> secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
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
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'member' && onDeleteMember) onDeleteMember(deleteConfirm.id);
                  if (deleteConfirm.type === 'division' && onDeleteDivision) onDeleteDivision(deleteConfirm.id);
                  if (deleteConfirm.type === 'gallery' && onDeleteGallery) onDeleteGallery(deleteConfirm.id);
                  if (deleteConfirm.type === 'tenure' && onDeleteTenure) onDeleteTenure(deleteConfirm.id);
                  if (deleteConfirm.type === 'kudos' && onDeleteKudos) onDeleteKudos(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
