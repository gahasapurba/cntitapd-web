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
  AlertCircle,
  Users,
  Heart,
  X,
  ClipboardList,
  Download,
  CalendarDays,
  Layout,
  Globe,
  RefreshCw,
  Upload,
  MessageSquare,
  RotateCcw
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
  recruitmentInfo = { isOpen: true, deadline: '31 Maret 2026' }, 
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
  onDeleteKudos,
  forms = [],
  onAddForm,
  onUpdateForm,
  onDeleteForm,
  submissions = [],
  onDeleteSubmission,
  pageVisibility = {
    navbar: true,
    home: true,
    organisasi: true,
    program: true,
    galeri: true,
    kudos: true,
    assets: true,
    oprec: true
  },
  onUpdatePageVisibility,
  activeTenure,
  aspirasiList = [],
  onDeleteAspirasi,
  syncStatus = 'synced',
  onForceSync,
  onResetDefault
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Modern Toast Notification State (replaces native browser alert)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3800);
  };

  // Custom Inline Field Validation State (replaces native browser required tooltips)
  const [formErrors, setFormErrors] = useState({});
  const clearFieldError = (fieldKey) => {
    setFormErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };
  const renderFieldError = (fieldKey) => {
    if (!formErrors[fieldKey]) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f43f5e', fontSize: '0.75rem', marginTop: '5px', fontWeight: 600 }}>
        <AlertCircle size={13} />
        <span>{formErrors[fieldKey]}</span>
      </div>
    );
  };

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
  const [isRecruitOpen, setIsRecruitOpen] = useState(recruitmentInfo?.isOpen ?? true);
  const [recruitDeadline, setRecruitDeadline] = useState(recruitmentInfo?.deadline ?? '31 Maret 2026');

  // New Form Creator State
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormCategory, setNewFormCategory] = useState('Kegiatan & Event');
  const [newFormDeadline, setNewFormDeadline] = useState('');
  const [newFormSubtitle, setNewFormSubtitle] = useState('');
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');

  // Form states for new Gallery Event
  const [galTitle, setGalTitle] = useState('');
  const [galDate, setGalDate] = useState('');
  const [galDivision, setGalDivision] = useState('Creative Media');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotos, setGalPhotos] = useState('');

  // Form states for Proker / Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDivId, setEventDivId] = useState(divisions[0]?.id || 'div-exp');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventKpi, setEventKpi] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStatus, setEventStatus] = useState('Upcoming');

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const errs = {};
    if (!eventTitle.trim()) errs.eventTitle = 'Nama Program / Event wajib diisi';
    if (!eventStartDate) errs.eventStartDate = 'Tanggal Mulai wajib dipilih';
    if (!eventEndDate) errs.eventEndDate = 'Tanggal Berakhir wajib dipilih';
    if (!eventDesc.trim()) errs.eventDesc = 'Deskripsi Program Kerja wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Program Kerja', 'error');
      return;
    }

    const divObj = divisions.find(d => d.id === eventDivId);

    const sDate = eventStartDate || new Date().toISOString().split('T')[0];
    const eDate = eventEndDate || sDate;

    // Helper format display string: e.g. "10 - 24 Maret 2026"
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const sParts = sDate.split('-');
    const eParts = eDate.split('-');
    const sMonth = months[parseInt(sParts[1], 10) - 1];
    const eMonth = months[parseInt(eParts[1], 10) - 1];

    let dateLabel = '';
    if (sDate === eDate) {
      dateLabel = `${parseInt(sParts[2], 10)} ${sMonth} ${sParts[0]}`;
    } else if (sParts[1] === eParts[1]) {
      dateLabel = `${parseInt(sParts[2], 10)} - ${parseInt(eParts[2], 10)} ${sMonth} ${sParts[0]}`;
    } else {
      dateLabel = `${parseInt(sParts[2], 10)} ${sMonth} - ${parseInt(eParts[2], 10)} ${eMonth} ${sParts[0]}`;
    }

    if (onAddEvent) {
      onAddEvent({
        id: 'evt-' + Date.now(),
        tenureId: activeTenure?.id || 'tenure-2026',
        divisionId: eventDivId,
        divisionName: divObj?.name || 'CNT IT APD',
        title: eventTitle.trim(),
        date: dateLabel,
        startDate: sDate,
        endDate: eDate,
        badge: 'Program Budaya',
        location: eventLocation.trim() || 'Plaza Mandiri',
        kpi: eventKpi.trim() || 'Officer IT APD',
        description: eventDesc.trim(),
        status: eventStatus,
        totalRab: 10000000
      });
    }

    const savedTitle = eventTitle.trim();
    setEventTitle('');
    setEventStartDate('');
    setEventEndDate('');
    setEventLocation('');
    setEventKpi('');
    setEventDesc('');
    showToast(`Program Kerja "${savedTitle}" berhasil ditambahkan & disinkronkan!`);
  };

  // Secure SHA-256 Authentication (Zero plaintext in code)
  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!username.trim()) errs.loginUsername = 'Username wajib diisi';
    if (!password) errs.loginPassword = 'Password wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      return;
    }
    try {
      const uHash = await sha256(username.trim());
      const pHash = await sha256(password);

      if (uHash === ADMIN_USER_HASH && pHash === ADMIN_PASS_HASH) {
        setIsAuthenticated(true);
        setLoginError('');
        setFormErrors({});
      } else {
        setLoginError('Username atau password salah');
      }
    } catch (err) {
      setLoginError('Gagal memverifikasi kredensial');
    }
  };

  // Upload photo for Member (New or Edit)
  const handleMemberPhotoUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      if (isEdit) {
        setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, image: dataUrl } } : null);
      } else {
        setMemImage(dataUrl);
      }
      showToast('Foto profil berhasil dimuat!');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!memName.trim()) {
      setFormErrors((prev) => ({ ...prev, memName: 'Nama Lengkap pengurus/anggota wajib diisi' }));
      showToast('Mohon isi Nama Lengkap pengurus/anggota', 'error');
      return;
    }

    const divObj = divisions.find(d => d.id === memDivisionId);
    const color = divObj?.color || '#FFB800';

    onAddMember({
      id: 'mem-' + Date.now(),
      tenureId: activeTenure?.id || 'tenure-2026',
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

    const savedName = memName;
    setMemName('');
    setMemRole('');
    setMemWhatsapp('');
    setMemMotto('');
    setMemImage('');
    showToast(`Pengurus/Anggota "${savedName}" berhasil ditambahkan & tersimpan di Cloud!`);
  };

  const handleCreateDivision = (e) => {
    e.preventDefault();
    if (!newDivName.trim()) {
      setFormErrors((prev) => ({ ...prev, newDivName: 'Nama Divisi wajib diisi' }));
      showToast('Mohon isi Nama Divisi terlebih dahulu', 'error');
      return;
    }

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

    const savedDiv = newDivName;
    setNewDivName('');
    setNewDivLead('');
    setNewDivDesc('');
    setNewDivFocus('');
    showToast(`Divisi "${savedDiv}" berhasil ditambahkan & disinkronkan!`);
  };

  const handleCreateTenure = (e) => {
    e.preventDefault();
    if (!newTenureCode.trim()) {
      setFormErrors((prev) => ({ ...prev, newTenureCode: 'Kode Tahun Kepengurusan wajib diisi' }));
      showToast('Mohon isi Kode Tahun Kepengurusan', 'error');
      return;
    }

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

    const savedCode = newTenureCode;
    setNewTenureCode('');
    setNewTenureTitle('');
    setNewTenureTagline('');
    setNewTenureHeadline('');
    setNewTenureHighlight('');
    setNewTenureVisi('');
    setNewTenureMisi('');
    showToast(`Periode Kepengurusan "${savedCode}" beserta Visi Misi berhasil dibuat!`);
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
    const errs = {};
    if (!galTitle.trim()) errs.galTitle = 'Judul Kegiatan wajib diisi';
    if (!galDesc.trim()) errs.galDesc = 'Deskripsi Singkat Acara wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi Judul dan Deskripsi Kegiatan', 'error');
      return;
    }

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

    const savedGalTitle = galTitle;
    setGalTitle('');
    setGalDate('');
    setGalDesc('');
    setGalPhotos('');
    setUploadedPhotos([]);
    setGalDocLinks([{ text: 'Folder Dokumentasi Full HD (Google Drive)', url: '' }]);
    showToast(`Dokumentasi "${savedGalTitle}" berhasil ditambahkan ke Galeri Kegiatan!`);
  };

  const handleSaveRecruitment = () => {
    if (onUpdateRecruitment) {
      onUpdateRecruitment({
        ...recruitmentInfo,
        isOpen: isRecruitOpen,
        deadline: recruitDeadline
      });
    }
    showToast('Pengaturan Open Recruitment berhasil disimpan!');
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

          <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Username <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError('loginUsername');
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.loginUsername ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              {renderFieldError('loginUsername')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Password <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('loginPassword');
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.loginPassword ? '#f43f5e' : 'var(--border-card)'}`,
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
              {renderFieldError('loginPassword')}
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
    <div style={{ maxWidth: '1000px', margin: '20px auto 80px auto', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
      {/* Floating Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '13px 20px',
            borderRadius: 'var(--radius-full)',
            background: toast.type === 'error' ? 'rgba(244, 63, 94, 0.96)' : 'rgba(16, 185, 129, 0.96)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.86rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Admin Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Admin Dashboard CNT IT APD
          </h2>
          {/* Cloud Sync Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.73rem',
              fontWeight: 800,
              background: syncStatus === 'syncing' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${syncStatus === 'syncing' ? 'var(--mandiri-gold)' : '#10b981'}`,
              color: syncStatus === 'syncing' ? 'var(--mandiri-gold)' : '#10b981'
            }}
            title="Seluruh perubahan otomatis disimpan di Cloud Database & LocalStorage agar tersinkronisasi di semua perangkat"
          >
            <Globe size={13} />
            <span>{syncStatus === 'syncing' ? 'Menyinkronkan Cloud...' : 'Cloud Sync Aktif (Multi-Device)'}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onForceSync && (
            <button
              type="button"
              onClick={async () => {
                await onForceSync();
                showToast('Data berhasil disinkronkan dari Cloud!');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Tarik & sinkronkan data terbaru dari Cloud"
            >
              <RefreshCw size={13} />
              <span>Sync Cloud</span>
            </button>
          )}

          {onResetDefault && (
            <button
              type="button"
              onClick={() => setDeleteConfirm({ type: 'reset_all', id: 'reset', name: 'Reset Seluruh Data ke Default Awal' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 184, 0, 0.12)',
                color: 'var(--mandiri-gold)',
                border: '1px solid rgba(255, 184, 0, 0.35)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Kembalikan data ke bawaan awal"
            >
              <RotateCcw size={13} />
              <span>Reset Default</span>
            </button>
          )}

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
          { id: 'visibility', label: 'Visibilitas Halaman & Navbar', icon: Eye },
          { id: 'events', label: `Agenda & Proker (${events.length})`, icon: CalendarDays },
          { id: 'forms', label: `Kelola Formulir (${forms.length})`, icon: ClipboardList },
          { id: 'submissions', label: `Berkas Masuk (${submissions.length + applications.length})`, icon: FileCheck2 },
          { id: 'kudos', label: `Wall of Kudos (${kudosList.length})`, icon: Heart },
          { id: 'gallery', label: `Galeri Kegiatan (${galleries.length})`, icon: ImageIcon },
          { id: 'divisions', label: 'Kelola Divisi', icon: Layers },
          { id: 'tenure', label: 'Periode Kepengurusan', icon: Calendar },
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

      {/* TAB CONTENT: VISIBILITAS HALAMAN & NAVBAR (VIEW / HIDE) */}
      {activeTab === 'visibility' && (() => {
        const pageItems = [
          { id: 'home', label: 'Beranda Utama', desc: 'Halaman depan (Hero Banner, Statistik, Visi & Misi, Pimpinan, dan 4 Pilar Divisi)' },
          { id: 'organisasi', label: 'Struktur Organisasi', desc: 'Halaman bagan hierarki organigram interaktif Pembina, Inti, Pimpro & Anggota' },
          { id: 'program', label: 'Program & Kalender', desc: 'Halaman daftar program kerja divisi & kalender budaya bulanan interaktif' },
          { id: 'galeri', label: 'Galeri Kegiatan', desc: 'Halaman dokumentasi foto carousel kegiatan & tautan folder dokumentasi' },
          { id: 'kudos', label: 'Wall of Kudos', desc: 'Halaman papan apresiasi & pengiriman pesan terima kasih antar insan IT APD' },
          { id: 'assets', label: 'Asset Logo', desc: 'Halaman transformasi logo & pengunduhan paket logo resmi CNT IT APD' },
          { id: 'oprec', label: 'Registrasi & Formulir', desc: 'Halaman pusat pendaftaran event, open recruitment & survei dinamis' },
        ];

        const visiblePagesCount = pageItems.filter(p => pageVisibility[p.id] !== false).length;
        const isNavbarVisible = pageVisibility.navbar !== false;

        const handleToggleKey = (key) => {
          if (!onUpdatePageVisibility) return;
          onUpdatePageVisibility({
            ...pageVisibility,
            [key]: pageVisibility[key] === false ? true : false
          });
        };

        const handleSetAll = (showPages, showNavbar) => {
          if (!onUpdatePageVisibility) return;
          const nextState = { navbar: showNavbar };
          pageItems.forEach(p => {
            nextState[p.id] = showPages;
          });
          onUpdatePageVisibility(nextState);
        };

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Kontrol Visibilitas Halaman & Navbar (View / Hide)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '650px', lineHeight: 1.5 }}>
                  Atur halaman mana saja yang ditampilkan atau disembunyikan dari publik, termasuk visibilitas <strong>Navbar Utama</strong>. Jika seluruh halaman di-hide, pengunjung otomatis dialihkan ke tampilan <em>Mode Standby / Maintenance</em> yang tetap menyediakan tombol akses ke Portal Admin.
                </p>
              </div>

              {/* Quick Bulk Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSetAll(true, true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} />
                  <span>Tampilkan Semua</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll(false, true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 184, 0, 0.15)',
                    border: '1px solid var(--mandiri-gold)',
                    color: 'var(--mandiri-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <EyeOff size={14} />
                  <span>Hide Semua Halaman</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll(false, false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid #f43f5e',
                    color: '#f43f5e',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <EyeOff size={14} />
                  <span>Hide Semua + Navbar</span>
                </button>
              </div>
            </div>

            {/* Live Status Banner */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: visiblePagesCount === 0 
                ? 'rgba(244, 63, 94, 0.12)' 
                : 'rgba(14, 165, 233, 0.08)',
              border: `1px solid ${visiblePagesCount === 0 ? '#f43f5e' : 'rgba(14, 165, 233, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {visiblePagesCount === 0 ? (
                  <AlertTriangle size={18} color="#f43f5e" />
                ) : (
                  <Globe size={18} color="var(--neon-cyan)" />
                )}
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                  {visiblePagesCount === 0 ? (
                    <span>
                      <strong>Perhatian: Semua halaman sedang di-Hide!</strong> Pengunjung saat ini melihat layar <em>Mode Standby / Pemeliharaan</em> dengan akses langsung ke Portal Pengurus.
                    </span>
                  ) : (
                    <span>
                      Status Publik: <strong>{visiblePagesCount} dari {pageItems.length} halaman ditampilkan</strong> • Navbar Utama: <strong>{isNavbarVisible ? 'Ditampilkan (View)' : 'Disembunyikan (Hide)'}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Master Navbar Visibility Control */}
            <div style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              background: isNavbarVisible ? 'rgba(56, 189, 248, 0.06)' : 'rgba(244, 63, 94, 0.06)',
              border: `1.5px solid ${isNavbarVisible ? 'rgba(56, 189, 248, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: isNavbarVisible ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: isNavbarVisible ? 'var(--neon-cyan)' : '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layout size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      Navbar Utama (Header Navigasi Atas)
                    </strong>
                    <span className={isNavbarVisible ? 'badge-cyan' : 'badge-gold'} style={{ fontSize: '0.66rem' }}>
                      {isNavbarVisible ? 'VIEW (TAMPIL)' : 'HIDDEN (SEMBUNYI)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Mengatur tampil/sembunyinya bar navigasi utama beserta logo, pemilih periode, dan tombol tema di bagian atas halaman.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleKey('navbar')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: isNavbarVisible ? '#10b981' : '#f43f5e',
                  color: '#ffffff',
                  boxShadow: isNavbarVisible ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(244, 63, 94, 0.3)'
                }}
              >
                {isNavbarVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{isNavbarVisible ? 'Ditampilkan (Klik untuk Hide)' : 'Disembunyikan (Klik untuk View)'}</span>
              </button>
            </div>

            {/* 2. Individual Pages Visibility Grid */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
                Daftar Halaman Website ({visiblePagesCount}/{pageItems.length} Aktif):
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {pageItems.map((page) => {
                  const isVisible = pageVisibility[page.id] !== false;
                  return (
                    <div
                      key={page.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isVisible ? 'var(--border-card)' : 'rgba(244, 63, 94, 0.35)'}`,
                        borderLeft: `4px solid ${isVisible ? '#10b981' : '#f43f5e'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        opacity: isVisible ? 1 : 0.85
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.96rem', color: 'var(--text-main)' }}>
                            {page.label}
                          </strong>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: isVisible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isVisible ? '#10b981' : '#f43f5e'
                          }}>
                            {isVisible ? '● VIEW' : '○ HIDDEN'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                          {page.desc}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleKey(page.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: `1px solid ${isVisible ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.5)'}`,
                            background: isVisible ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                            color: isVisible ? '#f43f5e' : '#10b981'
                          }}
                        >
                          {isVisible ? (
                            <>
                              <EyeOff size={13} />
                              <span>Hide Halaman</span>
                            </>
                          ) : (
                            <>
                              <Eye size={13} />
                              <span>View Halaman</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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

          <form onSubmit={handleCreateMember} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Raden Bagus Prakoso"
                value={memName}
                onChange={(e) => {
                  setMemName(e.target.value);
                  clearFieldError('memName');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.memName ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('memName')}
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Foto Profil Pengurus (Upload File atau URL Gambar Opsional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {memImage && (
                  <img
                    src={memImage}
                    alt="Preview"
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mandiri-gold)' }}
                  />
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} />
                  <span>Upload Foto</span>
                  <input type="file" accept="image/*" onChange={(e) => handleMemberPhotoUpload(e, false)} style={{ display: 'none' }} />
                </label>
                <input
                  type="text"
                  placeholder="Atau tempel URL foto (/images/... atau https://...)"
                  value={memImage}
                  onChange={(e) => setMemImage(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.83rem'
                  }}
                />
                {memImage && (
                  <button
                    type="button"
                    onClick={() => setMemImage('')}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hapus Foto
                  </button>
                )}
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

      {/* TAB CONTENT: AGENDA & PROKER (DENGAN TANGGAL MULAI & BERAKHIR) */}
      {activeTab === 'events' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Program Kerja & Event Budaya Baru
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Setiap agenda dilengkapi <strong>Tanggal Mulai</strong> dan <strong>Tanggal Berakhir</strong> agar tersorot rapi dalam Kalender Budaya bulanan dan menampilkan popup interaktif saat di-hover.
            </p>
          </div>

          <form onSubmit={handleCreateEvent} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Program / Event <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: APD E-Sports Championship"
                value={eventTitle}
                onChange={(e) => {
                  setEventTitle(e.target.value);
                  clearFieldError('eventTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventTitle ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventTitle')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Divisi Penyelenggara <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={eventDivId}
                onChange={(e) => setEventDivId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
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

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📅 Tanggal Mulai <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => {
                  setEventStartDate(e.target.value);
                  clearFieldError('eventStartDate');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventStartDate ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventStartDate')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📅 Tanggal Berakhir <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => {
                  setEventEndDate(e.target.value);
                  clearFieldError('eventEndDate');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventEndDate ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventEndDate')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Lokasi / Venue
              </label>
              <input
                type="text"
                placeholder="Contoh: Plaza Mandiri Lt. 3 / Online Server"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Target KPI / Peserta
              </label>
              <input
                type="text"
                placeholder="Contoh: 150+ Peserta Officer IT APD"
                value={eventKpi}
                onChange={(e) => setEventKpi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Program Kerja <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan tujuan dan gambaran pelaksanaan program kerja..."
                value={eventDesc}
                onChange={(e) => {
                  setEventDesc(e.target.value);
                  clearFieldError('eventDesc');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventDesc ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
              {renderFieldError('eventDesc')}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Simpan Program Kerja</span>
              </button>
            </div>
          </form>

          {/* List Program Kerja */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
              Daftar Program Kerja Aktif ({events.length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {events.map((evt) => {
                const divObj = divisions.find(d => d.id === evt.divisionId);
                return (
                  <div
                    key={evt.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${divObj?.color || 'var(--mandiri-gold)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: divObj?.color || 'var(--mandiri-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                          {evt.divisionName || divObj?.name}
                        </span>
                        <span className="badge-gold" style={{ fontSize: '0.66rem' }}>
                          {evt.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>
                        {evt.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                        📅 {evt.startDate} s/d {evt.endDate}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        📍 {evt.location}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'event', item: { ...evt } })}
                        title="Edit Proker"
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid var(--mandiri-blue)',
                          color: 'var(--neon-cyan)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ type: 'event', id: evt.id, name: evt.title })}
                        title="Hapus Proker"
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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

          <form onSubmit={handleCreateGallery} noValidate className="admin-form-two-col" style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Judul Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: IT APD Fun Run 5K Gelora Mandiri"
                value={galTitle}
                onChange={(e) => {
                  setGalTitle(e.target.value);
                  clearFieldError('galTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.galTitle ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('galTitle')}
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
                Deskripsi Singkat Acara <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan keseruan acara dan antusiasme insan IT APD..."
                value={galDesc}
                onChange={(e) => {
                  setGalDesc(e.target.value);
                  clearFieldError('galDesc');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.galDesc ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('galDesc')}
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

          <form onSubmit={handleCreateDivision} noValidate style={{
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
                Nama Divisi <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Social Impact & Sustainability"
                value={newDivName}
                onChange={(e) => {
                  setNewDivName(e.target.value);
                  clearFieldError('newDivName');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${formErrors.newDivName ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('newDivName')}
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

          <form onSubmit={handleCreateTenure} noValidate style={{
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
                Kode Tahun <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: 2027"
                value={newTenureCode}
                onChange={(e) => {
                  setNewTenureCode(e.target.value);
                  clearFieldError('newTenureCode');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.newTenureCode ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('newTenureCode')}
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

      {/* TAB CONTENT: DYNAMIC FORM ENGINE */}
      {activeTab === 'forms' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Manajemen Formulir & Pendaftaran Dinamis ({forms.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Buat formulir registrasi baru, atur deadline, aktifkan/tutup form dari website, serta kelola pertanyaan.
              </p>
            </div>
            <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
              Form Engine V2
            </span>
          </div>

          {/* Form Creator */}
          <form 
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFormTitle.trim()) {
                setFormErrors((prev) => ({ ...prev, newFormTitle: 'Judul Formulir wajib diisi' }));
                showToast('Mohon isi Judul Formulir terlebih dahulu', 'error');
                return;
              }

              const newForm = {
                id: 'form-' + Date.now(),
                title: newFormTitle.trim(),
                subtitle: newFormSubtitle.trim() || 'Silakan lengkapi formulir di bawah ini.',
                category: newFormCategory,
                deadline: newFormDeadline.trim() || 'Menyesuaikan',
                isOpen: true,
                fields: [
                  { id: 'f-name', label: 'Nama Lengkap (HCM Mandiri)', type: 'text', placeholder: 'Nama sesuai HCM Mandiri', required: true },
                  { id: 'f-nip', label: 'NIP / Employee ID', type: 'text', placeholder: 'NIP Mandiri', required: true },
                  { id: 'f-squad', label: 'Squad / Unit Kerja', type: 'text', placeholder: 'Squad asal', required: true },
                  { id: 'f-wa', label: 'Nomor WhatsApp Aktif', type: 'text', placeholder: '0812xxxxxxxx', required: true },
                  { id: 'f-divisi', label: 'Pilihan Divisi Terkait', type: 'select', source: 'divisions', required: true },
                  { id: 'f-notes', label: 'Catatan / Alasan Pendaftaran', type: 'textarea', placeholder: 'Tuliskan keterangan pendukung...', required: true },
                  { id: 'f-doc', label: 'Upload Dokumen / File Pendukung', type: 'file', accept: '.pdf,.png,.jpg,.jpeg', required: false }
                ]
              };

              if (onAddForm) onAddForm(newForm);
              setNewFormTitle('');
              setNewFormSubtitle('');
              setNewFormDeadline('');
              showToast(`Formulir "${newForm.title}" berhasil dibuat & dipublikasikan!`);
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)'
            }}
          >
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--mandiri-gold)', marginBottom: '4px' }}>
                + Buat Formulir Registrasi Baru
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Judul Formulir <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pendaftaran Workshop AI Agent Mandiri"
                value={newFormTitle}
                onChange={(e) => {
                  setNewFormTitle(e.target.value);
                  clearFieldError('newFormTitle');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormTitle ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
              {renderFieldError('newFormTitle')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kategori Formulir
              </label>
              <select
                value={newFormCategory}
                onChange={(e) => setNewFormCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                <option value="Kegiatan & Event">Kegiatan & Event</option>
                <option value="Rekrutmen">Rekrutmen & Oprec</option>
                <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                <option value="Workshop & Sharing">Workshop & Sharing</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Batas Akhir / Deadline Pendaftaran
              </label>
              <input
                type="text"
                placeholder="Contoh: 31 Maret 2026"
                value={newFormDeadline}
                onChange={(e) => setNewFormDeadline(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Deskripsi Singkat / Subtitle
              </label>
              <input
                type="text"
                placeholder="Penjelasan singkat tujuan pendaftaran"
                value={newFormSubtitle}
                onChange={(e) => setNewFormSubtitle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
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
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Publikasikan Form</span>
              </button>
            </div>
          </form>

          {/* Existing Forms List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              Daftar Formulir Terdaftar:
            </div>
            {forms.map((f) => {
              const subCount = submissions.filter(s => s.formId === f.id).length;
              return (
                <div key={f.id} style={{
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{f.category || 'Formulir'}</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.96rem' }}>{f.title}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Deadline: {f.deadline} • {f.fields?.length || 0} Pertanyaan • <strong>{subCount} Berkas Masuk</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Switch Buka/Tutup */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateForm) {
                          onUpdateForm({ ...f, isOpen: !f.isOpen });
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: f.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: f.isOpen ? '#10b981' : '#f43f5e'
                      }}
                    >
                      {f.isOpen ? '● Dibuka di Web' : '○ Ditutup'}
                    </button>

                    {/* Edit Form */}
                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'form', item: { ...f } })}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255,184,0,0.12)',
                        border: '1px solid var(--mandiri-gold)',
                        color: 'var(--mandiri-gold)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Form */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ 
                        type: 'form', 
                        id: f.id, 
                        name: f.title,
                        submissionCount: subCount 
                      })}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(244,63,94,0.12)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBMISSIONS (BERKAS MASUK DINAMIS PER FORM) */}
      {activeTab === 'submissions' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Kotak Masuk Berkas & Pendaftar ({submissions.length + applications.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Filter hasil isian formulir berdasarkan judul event pendaftaran dan unduh data.
              </p>
            </div>

            {/* Filter Dropdown & Export Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={selectedSubFilter}
                onChange={(e) => setSelectedSubFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                <option value="all">Semua Formulir ({submissions.length + applications.length})</option>
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const itemsToExport = selectedSubFilter === 'all' 
                    ? [...submissions, ...applications]
                    : submissions.filter(s => s.formId === selectedSubFilter);
                  
                  if (itemsToExport.length === 0) {
                    showToast('Tidak ada data berkas untuk diexport.', 'error');
                    return;
                  }

                  // Collect dynamic field columns across exported submissions
                  const dynamicKeys = Array.from(
                    new Set(
                      itemsToExport.flatMap(s => s.data ? Object.keys(s.data) : ['fullName', 'nip', 'unitSquad', 'div1', 'div2', 'whatsapp', 'email', 'motivation'])
                    )
                  );

                  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const headerRow = ['ID Berkas', 'Judul Formulir', 'Waktu Submit', ...dynamicKeys.map(k => k.replace(/^f-/, '').toUpperCase()), 'Lampiran File'].map(escapeCsv).join(',');

                  const dataRows = itemsToExport.map(s => {
                    const baseCols = [
                      s.id,
                      s.formTitle || 'Oprec 2026',
                      s.submittedAt || ''
                    ];
                    const fieldCols = dynamicKeys.map(k => {
                      if (s.data) return s.data[k] ?? '';
                      return s[k] ?? '';
                    });
                    const fileCol = s.files ? Object.values(s.files).map(f => f.name).join('; ') : '';
                    return [...baseCols, ...fieldCols, fileCol].map(escapeCsv).join(',');
                  });

                  const csvString = '\uFEFF' + [headerRow, ...dataRows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `berkas_cnt_it_apd_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast(`Berhasil mengunduh ${itemsToExport.length} berkas dalam format CSV!`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid #0ea5e9',
                  color: '#0ea5e9',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 && applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              Belum ada berkas pendaftaran yang masuk.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Dynamic Submissions */}
              {submissions
                .filter(s => selectedSubFilter === 'all' || s.formId === selectedSubFilter)
                .map((sub) => (
                  <div key={sub.id} style={{
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{sub.formTitle || 'Formulir'}</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.96rem' }}>
                          {sub.data['f-fullName'] || sub.data['f-teamName'] || sub.data['f-name'] || 'Peserta'}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          • {sub.submittedAt}
                        </span>
                      </div>
                      {onDeleteSubmission && (
                        <button
                          type="button"
                          onClick={() => onDeleteSubmission(sub.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f43f5e',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          Hapus Berkas
                        </button>
                      )}
                    </div>

                    {/* Data Fields Preview */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px',
                      background: 'var(--input-bg)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}>
                      {Object.entries(sub.data || {}).map(([key, val]) => (
                        <div key={key}>
                          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>{key.replace('f-', '').toUpperCase()}</span>
                          <strong style={{ color: 'var(--text-main)' }}>{String(val)}</strong>
                        </div>
                      ))}
                      {/* Attached File Preview */}
                      {sub.files && Object.entries(sub.files).map(([key, fileObj]) => (
                        <div key={key} style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>DOKUMEN TERLAMPIR</span>
                          <a 
                            href={fileObj.dataUrl} 
                            download={fileObj.name} 
                            style={{ color: 'var(--mandiri-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                          >
                            <Download size={13} />
                            <span>Download {fileObj.name} ({fileObj.size})</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Legacy Applications (if any) */}
              {(selectedSubFilter === 'all' || selectedSubFilter === 'form-oprec-2026') && applications.map((app) => (
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
                      <span className="badge-gold" style={{ fontSize: '0.65rem', marginRight: '6px' }}>Oprec 2026</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.96rem' }}>{app.fullName}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (NIP: {app.nip} • {app.unitSquad})
                      </span>
                    </div>
                    <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{app.status || 'Submitted'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--neon-cyan)' }}>
                    Pilihan 1: <strong>{app.div1}</strong> | Pilihan 2: <strong>{app.div2}</strong>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    "{app.motivation}"
                  </p>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    Kontak: {app.whatsapp} | {app.email} • {app.submittedAt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: KUDOS & ASPIRASI MANAGEMENT */}
      {activeTab === 'kudos' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Kelola Kiriman Apresiasi Kudos ({kudosList.length}) & Kotak Aspirasi ({aspirasiList.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Seluruh apresiasi dari Wall of Kudos dan ide dari Kotak Aspirasi tersimpan di Cloud dan dapat diunduh sebagai laporan CSV.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (kudosList.length === 0) {
                    showToast('Belum ada data Kudos untuk diexport.', 'error');
                    return;
                  }
                  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const header = ['ID', 'Kategori Nilai Budaya', 'Pengirim', 'Penerima', 'Pesan Apresiasi', 'Likes', 'Waktu Kirim'].map(escapeCsv).join(',');
                  const rows = kudosList.map(k => [
                    k.id,
                    k.category,
                    k.sender,
                    k.recipient,
                    k.message,
                    k.likes || 1,
                    k.exactTimestamp || k.date || ''
                  ].map(escapeCsv).join(','));
                  const csvString = '\uFEFF' + [header, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `laporan_kudos_cnt_it_apd_${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast(`Berhasil mengunduh ${kudosList.length} kiriman Kudos ke CSV!`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid #0ea5e9',
                  color: '#0ea5e9',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Export CSV Kudos</span>
              </button>
              <span className="badge-gold" style={{ fontSize: '0.75rem' }}>
                Moderasi Konten Aktif
              </span>
            </div>
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

          {/* Kotak Ide & Aspirasi Masuk */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={18} color="var(--neon-cyan)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Kotak Ide & Aspirasi Masuk ({aspirasiList.length})
              </h4>
            </div>
            {aspirasiList.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                Belum ada kiriman ide atau aspirasi program budaya dari pengunjung.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aspirasiList.map((asp) => (
                  <div
                    key={asp.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(56, 189, 248, 0.05)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        "{asp.text}"
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        📅 {asp.submittedAt}
                      </div>
                    </div>
                    {onDeleteAspirasi && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteAspirasi(asp.id);
                          showToast('Aspirasi berhasil dihapus.');
                        }}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(244,63,94,0.12)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div className="glass-panel modal-container" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
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
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Foto Profil Personel</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {editingItem.item.image && (
                      <img
                        src={editingItem.item.image}
                        alt="Avatar"
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mandiri-gold)' }}
                      />
                    )}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid var(--neon-cyan)',
                        color: 'var(--neon-cyan)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={13} />
                      <span>Upload Foto</span>
                      <input type="file" accept="image/*" onChange={(e) => handleMemberPhotoUpload(e, true)} style={{ display: 'none' }} />
                    </label>
                    <input
                      type="text"
                      placeholder="URL Foto (/images/...)"
                      value={editingItem.item.image || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, image: e.target.value } })}
                      style={{ flex: 1, minWidth: '150px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>
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
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Visi CNT IT (Dinamis)</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.visi || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, visi: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Misi CNT IT (1 baris per misi)</label>
                  <textarea
                    rows={4}
                    value={Array.isArray(editingItem.item.misi) ? editingItem.item.misi.join('\n') : (editingItem.item.misi || '')}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, misi: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
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

            {/* Edit Form Fields (With Custom Field Builder) */}
            {editingItem.type === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Formulir</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Formulir</label>
                    <select
                      value={editingItem.item.category || 'Kegiatan & Event'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="Kegiatan & Event">Kegiatan & Event</option>
                      <option value="Rekrutmen">Rekrutmen & Oprec</option>
                      <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                      <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                      <option value="Workshop & Sharing">Workshop & Sharing</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Batas Akhir / Deadline</label>
                    <input
                      type="text"
                      value={editingItem.item.deadline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, deadline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Singkat / Subtitle</label>
                  <textarea
                    rows={2}
                    value={editingItem.item.subtitle || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, subtitle: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem', resize: 'vertical' }}
                  />
                </div>

                {/* Custom Field Builder */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                      Daftar Pertanyaan / Field ({(editingItem.item.fields || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFields = [
                          ...(editingItem.item.fields || []),
                          {
                            id: 'f-custom-' + Date.now(),
                            label: 'Pertanyaan Baru',
                            type: 'text',
                            placeholder: 'Masukkan jawaban...',
                            required: false
                          }
                        ];
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} />
                      <span>Tambah Pertanyaan</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(editingItem.item.fields || []).map((fld, idx) => (
                      <div
                        key={fld.id || idx}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            value={fld.label || ''}
                            placeholder="Label pertanyaan"
                            onChange={(e) => {
                              const nextFields = editingItem.item.fields.map((item, i) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              );
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                          />
                          <select
                            value={fld.type || 'text'}
                            onChange={(e) => {
                              const nextFields = editingItem.item.fields.map((item, i) =>
                                i === idx ? { ...item, type: e.target.value } : item
                              );
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                          >
                            <option value="text">Teks Singkat</option>
                            <option value="textarea">Paragraf</option>
                            <option value="email">Email</option>
                            <option value="number">Angka</option>
                            <option value="select">Dropdown Pilihan</option>
                            <option value="file">Upload File</option>
                          </select>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(fld.required)}
                              onChange={(e) => {
                                const nextFields = editingItem.item.fields.map((item, i) =>
                                  i === idx ? { ...item, required: e.target.checked } : item
                                );
                                setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                              }}
                            />
                            <span>Wajib</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const nextFields = editingItem.item.fields.filter((_, i) => i !== idx);
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '2px' }}
                            title="Hapus pertanyaan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {fld.type === 'select' && fld.source !== 'divisions' && (
                          <input
                            type="text"
                            placeholder="Opsi pilihan (pisahkan dengan koma, misal: Tim A, Tim B, Tim C)"
                            value={Array.isArray(fld.options) ? fld.options.join(', ') : ''}
                            onChange={(e) => {
                              const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              const nextFields = editingItem.item.fields.map((item, i) =>
                                i === idx ? { ...item, options: opts } : item
                              );
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Event Form */}
            {editingItem.type === 'event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Program Kerja</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Mulai</label>
                    <input
                      type="date"
                      value={editingItem.item.startDate || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, startDate: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Berakhir</label>
                    <input
                      type="date"
                      value={editingItem.item.endDate || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, endDate: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Pelaksanaan</label>
                  <select
                    value={editingItem.item.status || 'Upcoming'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, status: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    <option value="Upcoming">Upcoming (Akan Datang)</option>
                    <option value="Ongoing">Ongoing (Sedang Berjalan)</option>
                    <option value="Completed">Completed (Selesai)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lokasi Kegiatan</label>
                  <input
                    type="text"
                    value={editingItem.item.location || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, location: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi Kegiatan</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
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
                  const it = editingItem.item || {};
                  if ((editingItem.type === 'member' || editingItem.type === 'division') && !(it.name || '').trim()) {
                    showToast('Nama wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if ((editingItem.type === 'gallery' || editingItem.type === 'tenure' || editingItem.type === 'form' || editingItem.type === 'event') && !(it.title || '').trim()) {
                    showToast('Judul wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if (editingItem.type === 'kudos' && (!(it.sender || '').trim() || !(it.recipient || '').trim() || !(it.message || '').trim())) {
                    showToast('Pengirim, penerima, dan pesan apresiasi wajib diisi', 'error');
                    return;
                  }

                  if (editingItem.type === 'member' && onUpdateMember) onUpdateMember(editingItem.item);
                  if (editingItem.type === 'division' && onUpdateDivision) onUpdateDivision(editingItem.item);
                  if (editingItem.type === 'gallery' && onUpdateGallery) onUpdateGallery(editingItem.item);
                  if (editingItem.type === 'tenure' && onUpdateTenure) onUpdateTenure(editingItem.item);
                  if (editingItem.type === 'kudos' && onUpdateKudos) onUpdateKudos(editingItem.item);
                  if (editingItem.type === 'form' && onUpdateForm) onUpdateForm(editingItem.item);
                  if (editingItem.type === 'event' && onUpdateEvent) onUpdateEvent(editingItem.item);
                  setEditingItem(null);
                  showToast('Perubahan data berhasil disimpan & disinkronkan ke Cloud!');
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
          <div className="glass-panel modal-container" style={{
            maxWidth: '440px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
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
              Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong>?
            </p>

            {deleteConfirm.submissionCount > 0 && (
              <div style={{
                background: 'rgba(255, 184, 0, 0.12)',
                border: '1px solid rgba(255, 184, 0, 0.35)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--mandiri-gold)',
                textAlign: 'left',
                lineHeight: 1.4
              }}>
                ⚠️ <strong>Perhatian:</strong> Formulir ini sudah memiliki <strong>{deleteConfirm.submissionCount} berkas masuk</strong> dari peserta!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
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

              {deleteConfirm.type === 'form' && deleteConfirm.submissionCount > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteForm) onDeleteForm(deleteConfirm.id, false); // preserve submissions
                      setDeleteConfirm(null);
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--mandiri-blue)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                    title="Hapus form dari website, tapi berkas peserta tetap tersimpan di riwayat"
                  >
                    Hapus Form Saja (Arsipkan Data)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteForm) onDeleteForm(deleteConfirm.id, true); // delete submissions too
                      setDeleteConfirm(null);
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: '#f43f5e',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Hapus Permanen + Berkas
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirm.type === 'member' && onDeleteMember) onDeleteMember(deleteConfirm.id);
                    if (deleteConfirm.type === 'division' && onDeleteDivision) onDeleteDivision(deleteConfirm.id);
                    if (deleteConfirm.type === 'gallery' && onDeleteGallery) onDeleteGallery(deleteConfirm.id);
                    if (deleteConfirm.type === 'tenure' && onDeleteTenure) onDeleteTenure(deleteConfirm.id);
                    if (deleteConfirm.type === 'kudos' && onDeleteKudos) onDeleteKudos(deleteConfirm.id);
                    if (deleteConfirm.type === 'form' && onDeleteForm) onDeleteForm(deleteConfirm.id, true);
                    if (deleteConfirm.type === 'event' && onDeleteEvent) onDeleteEvent(deleteConfirm.id);
                    if (deleteConfirm.type === 'reset_all' && onResetDefault) onResetDefault();
                    setDeleteConfirm(null);
                    showToast(deleteConfirm.type === 'reset_all' ? 'Data berhasil dikembalikan ke bawaan awal!' : 'Data berhasil dihapus & disinkronkan!');
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
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
