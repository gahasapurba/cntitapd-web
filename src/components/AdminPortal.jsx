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
  RotateCcw,
  Search,
  FolderOpen,
  Share2
} from 'lucide-react';
import { uploadMediaToCloud } from '../lib/supabase';

function formatWaPhone(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

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
  onUpdateSubmission,
  onDeleteSubmission,
  brandAssets = [],
  onAddBrandAsset,
  onUpdateBrandAsset,
  onDeleteBrandAsset,
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
  onSelectTenure,
  aspirasiList = [],
  onUpdateAspirasi,
  onDeleteAspirasi,
  eventRsvps = [],
  onDeleteEventRsvp,
  announcementBar = {
    isActive: true,
    badge: 'INFO TERBARU',
    message: 'Pendaftaran Open Recruitment Crew CNT IT APD 2026 & Turnamen E-Sports sedang dibuka!',
    ctaText: 'Buka Hub Registrasi',
    ctaTab: 'oprec'
  },
  onUpdateAnnouncementBar,
  syncStatus = 'synced',
  onForceSync,
  onResetDefault
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('cnt_admin_auth_session') === 'authenticated_v2';
    } catch (e) {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);

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

  // Admin Dashboard Tabs: 'members' | 'visibility' | 'events' | 'forms' | 'submissions' | 'kudos' | 'gallery' | 'assets' | 'divisions' | 'tenure'
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem('cnt_admin_active_tab') || 'members';
    } catch (e) {
      return 'members';
    }
  });
  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    try {
      sessionStorage.setItem('cnt_admin_active_tab', tabId);
    } catch (e) {}
  };

  // Search & Filter states for Members in Admin
  const [adminMemSearch, setAdminMemSearch] = useState('');
  const [adminMemCatFilter, setAdminMemCatFilter] = useState('all');
  const [adminMemDivFilter, setAdminMemDivFilter] = useState('all');

  // Search & Filter states for Submissions in Admin
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');

  // Form states for new Brand Asset
  const [assetTitle, setAssetTitle] = useState('');
  const [assetCategory, setAssetCategory] = useState('Logo & Brand');
  const [assetBadge, setAssetBadge] = useState('Official Asset');
  const [assetFileType, setAssetFileType] = useState('PNG / ZIP');
  const [assetFileSize, setAssetFileSize] = useState('');
  const [assetFileUrl, setAssetFileUrl] = useState('');
  const [assetPreviewUrl, setAssetPreviewUrl] = useState('');
  const [assetDesc, setAssetDesc] = useState('');

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
        try {
          sessionStorage.setItem('cnt_admin_auth_session', 'authenticated_v2');
        } catch (e) {}
        setLoginError('');
        setFormErrors({});
      } else {
        setLoginError('Username atau password salah');
      }
    } catch (err) {
      setLoginError('Gagal memverifikasi kredensial');
    }
  };

  // Upload photo for Member (New or Edit) to Supabase Storage `cnt-media`
  const handleMemberPhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    const cloudUrl = await uploadMediaToCloud(file, 'members');
    setIsUploadingMedia(false);
    if (cloudUrl) {
      if (isEdit) {
        setEditingItem(prev => prev ? { ...prev, item: { ...prev.item, image: cloudUrl } } : null);
      } else {
        setMemImage(cloudUrl);
      }
      showToast('Foto profil berhasil diunggah ke Cloud Storage!');
    }
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

  // Photos file selector handler (Uploads directly to Supabase Storage `cnt-media`)
  const handlePhotoUpload = async (e, isEditModal = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingMedia(true);
    const uploadedUrls = [];
    for (const file of files) {
      const url = await uploadMediaToCloud(file, 'gallery');
      if (url) uploadedUrls.push(url);
    }
    setIsUploadingMedia(false);

    if (uploadedUrls.length > 0) {
      if (isEditModal) {
        setEditingItem(prev => {
          if (!prev) return null;
          const existing = Array.isArray(prev.item.photos) ? prev.item.photos : [];
          return { ...prev, item: { ...prev.item, photos: [...existing, ...uploadedUrls] } };
        });
      } else {
        setUploadedPhotos(prev => [...prev, ...uploadedUrls]);
      }
      showToast(`${uploadedUrls.length} foto berhasil diunggah ke Supabase Storage!`);
    }
  };

  // Upload Brand Asset file or preview to Supabase Storage `cnt-media`
  const handleBrandAssetUpload = async (e, field = 'fileUrl', isEditModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    const cloudUrl = await uploadMediaToCloud(file, 'assets');
    setIsUploadingMedia(false);
    if (!cloudUrl) return;

    const sizeLabel = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';
    const extLabel = (file.name.split('.').pop() || 'FILE').toUpperCase();

    if (isEditModal) {
      setEditingItem(prev => {
        if (!prev) return null;
        const nextItem = { ...prev.item, [field]: cloudUrl };
        if (field === 'fileUrl') {
          if (!nextItem.fileSize) nextItem.fileSize = sizeLabel;
          if (!nextItem.fileType) nextItem.fileType = extLabel;
          if (!nextItem.previewUrl && /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file.name)) {
            nextItem.previewUrl = cloudUrl;
          }
        }
        return { ...prev, item: nextItem };
      });
    } else {
      if (field === 'fileUrl') {
        setAssetFileUrl(cloudUrl);
        setAssetFileSize(sizeLabel);
        setAssetFileType(extLabel);
        clearFieldError('assetFileUrl');
        if (!assetPreviewUrl && /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file.name)) {
          setAssetPreviewUrl(cloudUrl);
        }
      } else {
        setAssetPreviewUrl(cloudUrl);
      }
    }
    showToast(`File "${file.name}" berhasil diunggah ke Cloud Storage!`);
  };

  const handleCreateBrandAsset = (e) => {
    e.preventDefault();
    const errs = {};
    if (!assetTitle.trim()) errs.assetTitle = 'Judul Asset / Template wajib diisi';
    if (!assetFileUrl.trim()) errs.assetFileUrl = 'File atau URL Download wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi Judul dan File/URL Asset', 'error');
      return;
    }

    if (onAddBrandAsset) {
      onAddBrandAsset({
        id: 'asset-' + Date.now(),
        title: assetTitle.trim(),
        category: assetCategory,
        badge: assetBadge.trim() || assetCategory,
        fileType: assetFileType.trim() || 'FILE',
        fileSize: assetFileSize.trim() || '',
        fileUrl: assetFileUrl.trim(),
        previewUrl: assetPreviewUrl.trim() || assetFileUrl.trim(),
        description: assetDesc.trim() || 'Asset resmi CNT IT Application Delivery.'
      });
    }

    const saved = assetTitle.trim();
    setAssetTitle('');
    setAssetFileUrl('');
    setAssetPreviewUrl('');
    setAssetFileSize('');
    setAssetDesc('');
    showToast(`Asset "${saved}" berhasil ditambahkan ke Katalog Asset Logo!`);
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
      tenureId: activeTenure?.id || 'tenure-2026',
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
          <button
            type="button"
            onClick={() => setShowExecutiveReportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
            title="Buka & Cetak Laporan Eksekutif / LPJ Periode Kepengurusan"
          >
            <ClipboardList size={14} />
            <span>📄 Laporan Eksekutif / LPJ</span>
          </button>

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
            onClick={() => {
              try {
                sessionStorage.removeItem('cnt_admin_auth_session');
              } catch (e) {}
              setIsAuthenticated(false);
            }}
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

      {/* Executive Summary Analytics Bar */}
      {(() => {
        const completedEvents = events.filter(e => e.status === 'Completed').length;
        const prokerPercent = events.length > 0 ? Math.round((completedEvents / events.length) * 100) : 0;
        const totalRab = events.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);
        const acceptedSubs = submissions.filter(s => s.status === 'Accepted').length;
        const pendingSubs = submissions.filter(s => !s.status || s.status === 'Submitted').length;

        // Top recipient of kudos
        const recipientCounts = {};
        kudosList.forEach(k => {
          const rec = (k.recipient || '').trim();
          if (rec) recipientCounts[rec] = (recipientCounts[rec] || 0) + 1;
        });
        const topKudosRecipient = Object.entries(recipientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belum ada';

        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--mandiri-gold)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Personel Aktif
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {members.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {members.filter(m => m.category === 'inti').length} BPH • {members.filter(m => m.category === 'pimpro').length} Pimpro • {members.filter(m => m.category === 'anggota').length} Squad
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Realisasi Proker
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {completedEvents}/{events.length} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>({prokerPercent}%)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {events.length - completedEvents} Agenda Upcoming / Berjalan
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Total Anggaran RAB
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                Rp {(totalRab / 1000000).toFixed(1)} Jt
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Akumulasi {events.length} Program Kerja
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Seleksi Pendaftar
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {submissions.length + applications.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Berkas</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: '#10b981' }}>{acceptedSubs} Diterima</strong> • {pendingSubs} Perlu Review
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #f43f5e' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Apresiasi & Aspirasi
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {kudosList.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kudos</span> • {aspirasiList.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ide</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Top: {topKudosRecipient}
              </div>
            </div>
          </div>
        );
      })()}

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
          { id: 'assets', label: `Asset & Template (${brandAssets.length})`, icon: Download },
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

            {/* 1.B. Live Announcement Running Banner Control (public.page_settings -> announcement_bar) */}
            {onUpdateAnnouncementBar && (
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 184, 0, 0.05)',
                border: '1.5px solid rgba(255, 184, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                        📢 Pengumuman Penting / Top Running Banner
                      </strong>
                      <span className={announcementBar?.isActive ? 'badge-gold' : 'badge-cyan'} style={{ fontSize: '0.66rem' }}>
                        {announcementBar?.isActive ? 'AKTIF TAMPIL' : 'NONAKTIF'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tampilkan pengumuman cepat (info Townhall, batas akhir Oprec, atau jadwal penting) di bagian paling atas halaman publik.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextState = { ...announcementBar, isActive: !announcementBar?.isActive };
                      onUpdateAnnouncementBar(nextState);
                      showToast(nextState.isActive ? 'Banner Pengumuman diaktifkan!' : 'Banner Pengumuman disembunyikan!');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: announcementBar?.isActive ? '#10b981' : 'var(--input-bg)',
                      color: announcementBar?.isActive ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    {announcementBar?.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{announcementBar?.isActive ? 'Banner Aktif (Klik Matikan)' : 'Aktifkan Banner'}</span>
                  </button>
                </div>

                <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Label Badge</label>
                    <input
                      type="text"
                      defaultValue={announcementBar?.badge || 'INFO TERBARU'}
                      onBlur={(e) => {
                        onUpdateAnnouncementBar({ ...announcementBar, badge: e.target.value.trim() || 'INFO' });
                        showToast('Label pengumuman disimpan!');
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Isi Pesan Pengumuman</label>
                    <input
                      type="text"
                      defaultValue={announcementBar?.message || ''}
                      onBlur={(e) => {
                        onUpdateAnnouncementBar({ ...announcementBar, message: e.target.value.trim() });
                        showToast('Pesan pengumuman disimpan!');
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Teks Tombol Aksi (Opsional)</label>
                    <input
                      type="text"
                      defaultValue={announcementBar?.ctaText || ''}
                      onBlur={(e) => {
                        onUpdateAnnouncementBar({ ...announcementBar, ctaText: e.target.value.trim() });
                        showToast('Tombol aksi pengumuman disimpan!');
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Halaman Saat Diklik</label>
                    <select
                      value={announcementBar?.ctaTab || 'oprec'}
                      onChange={(e) => {
                        onUpdateAnnouncementBar({ ...announcementBar, ctaTab: e.target.value });
                        showToast('Target halaman pengumuman disimpan!');
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    >
                      <option value="oprec">Registrasi & Formulir</option>
                      <option value="program">Program & Kalender</option>
                      <option value="organisasi">Struktur Organisasi</option>
                      <option value="galeri">Galeri Kegiatan</option>
                      <option value="kudos">Wall of Kudos & Aspirasi</option>
                      <option value="assets">Asset Logo & Template</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

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

          {/* Members List with Search & Filter */}
          {(() => {
            const filteredAdminMembers = members.filter(m => {
              const q = adminMemSearch.trim().toLowerCase();
              const matchesSearch = !q ||
                (m.name || '').toLowerCase().includes(q) ||
                (m.role || '').toLowerCase().includes(q) ||
                (m.title || '').toLowerCase().includes(q) ||
                (m.whatsapp || '').toLowerCase().includes(q);
              const matchesCat = adminMemCatFilter === 'all' || m.category === adminMemCatFilter;
              const matchesDiv = adminMemDivFilter === 'all' || m.divisionId === adminMemDivFilter;
              return matchesSearch && matchesCat && matchesDiv;
            });

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Personel Terdaftar ({filteredAdminMembers.length} dari {members.length}):
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '260px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari nama atau jabatan..."
                        value={adminMemSearch}
                        onChange={(e) => setAdminMemSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem'
                        }}
                      />
                    </div>

                    <select
                      value={adminMemCatFilter}
                      onChange={(e) => setAdminMemCatFilter(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        fontWeight: 600
                      }}
                    >
                      <option value="all">Semua Posisi</option>
                      <option value="pembina">Pembina</option>
                      <option value="inti">Pengurus Inti</option>
                      <option value="pimpro">Ketua Divisi (Pimpro)</option>
                      <option value="anggota">Anggota Divisi</option>
                    </select>

                    <select
                      value={adminMemDivFilter}
                      onChange={(e) => setAdminMemDivFilter(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        fontWeight: 600
                      }}
                    >
                      <option value="all">Semua Divisi</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {filteredAdminMembers.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-card)',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {m.image ? (
                          <img
                            src={m.image}
                            alt={m.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${m.color || 'var(--mandiri-gold)'}`, flexShrink: 0 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.role} {m.title ? `• ${m.title}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {m.whatsapp ? (
                          <a
                            href={`https://wa.me/${formatWaPhone(m.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.7rem', background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, textDecoration: 'none' }}
                          >
                            💬 WA
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
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
            );
          })()}
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

          {/* Daftar Hadir & Konfirmasi RSVP Kegiatan (public.event_rsvps) */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  📋 Daftar Hadir & Konfirmasi RSVP Kegiatan ({eventRsvps.length})
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Data kehadiran pegawai yang mengisi form RSVP Cepat pada kartu Program Kerja (tersimpan di tabel <code>public.event_rsvps</code>).
                </p>
              </div>

              {eventRsvps.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const header = ['ID RSVP', 'ID Event', 'Nama Kegiatan', 'Nama Peserta', 'Squad / Unit', 'Mode Kehadiran', 'Catatan', 'Waktu Konfirmasi'].map(escapeCsv).join(',');
                    const rows = eventRsvps.map(r => [
                      r.id,
                      r.eventId,
                      r.eventTitle,
                      r.attendeeName,
                      r.squadUnit,
                      r.attendanceMode,
                      r.notes || '',
                      r.submittedAt || ''
                    ].map(escapeCsv).join(','));
                    const csvString = '\uFEFF' + [header, ...rows].join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `daftar_hadir_rsvp_cnt_it_apd_${Date.now()}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh ${eventRsvps.length} data RSVP ke CSV!`);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Export CSV Daftar Hadir RSVP</span>
                </button>
              )}
            </div>

            {eventRsvps.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                Belum ada konfirmasi kehadiran RSVP pada program kerja.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {eventRsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rsvp.eventTitle}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {rsvp.attendeeName} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>• {rsvp.squadUnit}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {rsvp.attendanceMode} {rsvp.notes ? `• "${rsvp.notes}"` : ''} • {rsvp.submittedAt}
                      </div>
                    </div>

                    {onDeleteEventRsvp && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteEventRsvp(rsvp.id);
                          showToast('Data RSVP berhasil dihapus.');
                        }}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          background: 'rgba(244, 63, 94, 0.12)',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          color: '#f43f5e',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
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
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: '1 1 180px' }}>
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
                    <div style={{ flex: '1.4 1 220px' }}>
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

          <form onSubmit={handleCreateDivision} noValidate className="admin-form-two-col" style={{
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

          <form onSubmit={handleCreateTenure} noValidate className="admin-form-two-col" style={{
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={t.isActive || activeTenure?.id === t.id ? "badge-gold" : "badge-cyan"}>
                    {t.isActive || activeTenure?.id === t.id ? 'Periode Aktif' : 'Arsip'}
                  </span>

                  {activeTenure?.id !== t.id && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectTenure) onSelectTenure(t);
                        if (onUpdateTenure) onUpdateTenure({ ...t, isActive: true });
                        showToast(`Periode "${t.title}" dijadikan periode aktif!`);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Jadikan Aktif
                    </button>
                  )}

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
            className="admin-form-two-col"
            style={{
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Copy Direct Link */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}#oprec?form=${encodeURIComponent(f.id)}`;
                        navigator.clipboard?.writeText(url);
                        showToast(`Link langsung formulir "${f.title}" berhasil disalin!`);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid var(--neon-cyan)',
                        color: 'var(--neon-cyan)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Salin link langsung ke formulir ini untuk dibagikan ke WhatsApp / Teams"
                    >
                      <Share2 size={12} />
                      <span>Salin Link</span>
                    </button>

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

      {/* TAB CONTENT: SUBMISSIONS (BERKAS MASUK DINAMIS PER FORM + SELEKSI STATUS & 1-CLICK WA) */}
      {activeTab === 'submissions' && (() => {
        const statusMeta = {
          Submitted: { label: 'Baru Masuk', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)' },
          Reviewed: { label: 'Direview', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
          Interview: { label: 'Wawancara', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
          Accepted: { label: 'Diterima ✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)' },
          Rejected: { label: 'Ditolak / Arsip', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' }
        };

        const filteredSubmissions = submissions.filter(s => {
          const matchesForm = selectedSubFilter === 'all' || s.formId === selectedSubFilter;
          const currentStat = s.status || 'Submitted';
          const matchesStatus = subStatusFilter === 'all' || currentStat === subStatusFilter;
          const q = subSearchQuery.trim().toLowerCase();
          const dataString = JSON.stringify(s.data || {}).toLowerCase();
          const matchesSearch = !q ||
            dataString.includes(q) ||
            (s.formTitle || '').toLowerCase().includes(q) ||
            (s.adminNotes || '').toLowerCase().includes(q);
          return matchesForm && matchesStatus && matchesSearch;
        });

        const extractApplicantPhone = (dataObj = {}) => {
          for (const [k, v] of Object.entries(dataObj)) {
            if (/wa|whatsapp|phone|telp|hp/i.test(k) && v) {
              return formatWaPhone(v);
            }
          }
          return '';
        };

        const extractApplicantName = (sub) => {
          const d = sub?.data || {};
          return d['f-fullName'] || d['f-teamName'] || d['f-name'] || d['f-captainName'] || d.fullName || 'Peserta';
        };

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Kotak Masuk & Seleksi Berkas Pendaftar ({filteredSubmissions.length} dari {submissions.length + applications.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Kelola status seleksi pendaftar, tambahkan catatan komite, hubungi via WhatsApp 1-klik, atau unduh laporan CSV.
                </p>
              </div>

              {/* Filter Dropdown & Export Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '200px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama, NIP, divisi..."
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 30px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

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
                    const itemsToExport = filteredSubmissions;
                    
                    if (itemsToExport.length === 0) {
                      showToast('Tidak ada data berkas untuk diexport.', 'error');
                      return;
                    }

                    const dynamicKeys = Array.from(
                      new Set(
                        itemsToExport.flatMap(s => s.data ? Object.keys(s.data) : ['fullName', 'nip', 'unitSquad', 'div1', 'div2', 'whatsapp', 'email', 'motivation'])
                      )
                    );

                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const headerRow = ['ID Berkas', 'Judul Formulir', 'Status Seleksi', 'Catatan Admin', 'Waktu Submit', ...dynamicKeys.map(k => k.replace(/^f-/, '').toUpperCase()), 'Lampiran File'].map(escapeCsv).join(',');

                    const dataRows = itemsToExport.map(s => {
                      const baseCols = [
                        s.id,
                        s.formTitle || 'Oprec 2026',
                        s.status || 'Submitted',
                        s.adminNotes || '',
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

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Semua Status (${submissions.length})` },
                { id: 'Submitted', label: `Baru Masuk (${submissions.filter(s => (s.status || 'Submitted') === 'Submitted').length})` },
                { id: 'Reviewed', label: `Direview (${submissions.filter(s => s.status === 'Reviewed').length})` },
                { id: 'Interview', label: `Wawancara (${submissions.filter(s => s.status === 'Interview').length})` },
                { id: 'Accepted', label: `Diterima (${submissions.filter(s => s.status === 'Accepted').length})` },
                { id: 'Rejected', label: `Ditolak (${submissions.filter(s => s.status === 'Rejected').length})` },
              ].map(st => {
                const active = subStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSubStatusFilter(st.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      background: active ? 'rgba(255, 184, 0, 0.15)' : 'var(--input-bg)',
                      color: active ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 && applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                Tidak ada berkas pendaftaran yang sesuai dengan filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredSubmissions.map((sub) => {
                  const curStatus = sub.status || 'Submitted';
                  const stInfo = statusMeta[curStatus] || statusMeta.Submitted;
                  const applicantName = extractApplicantName(sub);
                  const applicantWa = extractApplicantPhone(sub.data);
                  const waMessage = encodeURIComponent(
                    `Halo ${applicantName}, kami dari Pengurus Culture Network Team (CNT) IT APD Bank Mandiri ingin menindaklanjuti pendaftaran Anda pada "${sub.formTitle || 'Program CNT IT APD'}".`
                  );

                  return (
                    <div key={sub.id} style={{
                      padding: '18px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${stInfo.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{sub.formTitle || 'Formulir'}</span>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.98rem' }}>
                            {applicantName}
                          </strong>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: stInfo.bg,
                            color: stInfo.color,
                            border: `1px solid ${stInfo.color}`
                          }}>
                            {stInfo.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {sub.submittedAt}
                          </span>
                        </div>

                        {/* Status Selector, 1-Click WA & Delete Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <select
                            value={curStatus}
                            onChange={(e) => {
                              const nextStat = e.target.value;
                              if (onUpdateSubmission) {
                                onUpdateSubmission({ ...sub, status: nextStat });
                                showToast(`Status berkas "${applicantName}" diubah menjadi ${statusMeta[nextStat]?.label || nextStat}`);
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--input-bg)',
                              border: `1px solid ${stInfo.color}`,
                              color: 'var(--text-main)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Submitted">Status: Baru Masuk</option>
                            <option value="Reviewed">Status: Direview</option>
                            <option value="Interview">Status: Wawancara</option>
                            <option value="Accepted">Status: Diterima ✓</option>
                            <option value="Rejected">Status: Ditolak</option>
                          </select>

                          {applicantWa && (
                            <a
                              href={`https://wa.me/${applicantWa}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(37, 211, 102, 0.16)',
                                border: '1px solid #25d366',
                                color: '#25d366',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textDecoration: 'none'
                              }}
                              title="Hubungi pendaftar langsung via WhatsApp"
                            >
                              <span>💬 Hubungi WA</span>
                            </a>
                          )}

                          {onDeleteSubmission && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ type: 'submission', id: sub.id, name: `Berkas ${applicantName}` })}
                              style={{
                                background: 'rgba(244, 63, 94, 0.12)',
                                border: '1px solid rgba(244, 63, 94, 0.35)',
                                color: '#f43f5e',
                                padding: '5px 10px',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
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
                          <div key={key} style={{ wordBreak: 'break-word' }}>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>{key.replace('f-', '').toUpperCase()}</span>
                            <strong style={{ color: 'var(--text-main)' }}>
                              {typeof val === 'object' && val !== null ? (val.name || JSON.stringify(val)) : String(val)}
                            </strong>
                          </div>
                        ))}
                        {/* Attached File Preview */}
                        {sub.files && Object.entries(sub.files).map(([key, fileObj]) => (
                          <div key={key} style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem' }}>DOKUMEN TERLAMPIR</span>
                            <a 
                              href={fileObj.dataUrl} 
                              download={fileObj.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--mandiri-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                            >
                              <Download size={13} />
                              <span>Download / Buka {fileObj.name} ({fileObj.size})</span>
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* Admin Notes Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Tambahkan catatan review pengurus (misal: Jadwal interview Kamis 14.00 WIB)..."
                          defaultValue={sub.adminNotes || ''}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (sub.adminNotes || '') && onUpdateSubmission) {
                              onUpdateSubmission({ ...sub, adminNotes: val });
                              showToast('Catatan seleksi berhasil disimpan!');
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '7px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.78rem'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--neon-cyan)" />
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Kotak Ide, Tindak Lanjut & Balasan Aspirasi ({aspirasiList.length})
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Ubah status realisasi dan berikan tanggapan resmi pengurus yang akan tampil di Papan Transparansi Aspirasi publik.
                  </p>
                </div>
              </div>

              {aspirasiList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const header = ['ID', 'Pengusul', 'Kategori', 'Judul Usulan', 'Deskripsi', 'Status Tindak Lanjut', 'Tanggapan Pengurus', 'Publik', 'Waktu Kirim'].map(escapeCsv).join(',');
                    const rows = aspirasiList.map(a => [
                      a.id,
                      a.sender || 'Anonim',
                      a.category || 'Usulan Budaya',
                      a.title || a.text || '',
                      a.description || a.text || '',
                      a.status || 'Menunggu Review',
                      a.adminReply || '',
                      a.isPublic !== false ? 'Ya' : 'Tidak',
                      a.submittedAt || ''
                    ].map(escapeCsv).join(','));
                    const csvString = '\uFEFF' + [header, ...rows].join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `laporan_aspirasi_cnt_it_apd_${Date.now()}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh ${aspirasiList.length} data Aspirasi ke CSV!`);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} />
                  <span>Export CSV Aspirasi</span>
                </button>
              )}
            </div>

            {aspirasiList.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                Belum ada kiriman ide atau aspirasi program budaya dari pengunjung.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aspirasiList.map((asp) => {
                  const curStatus = asp.status || 'Menunggu Review';
                  const isPub = asp.isPublic !== false;
                  const statusColor = curStatus === 'Sudah Direalisasikan'
                    ? '#10b981'
                    : curStatus === 'Masuk Rencana Proker'
                      ? 'var(--mandiri-gold)'
                      : 'var(--neon-cyan)';

                  return (
                    <div
                      key={asp.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(56, 189, 248, 0.04)',
                        border: '1px solid var(--border-card)',
                        borderLeft: `4px solid ${statusColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                              {asp.category || 'Usulan Budaya'}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Pengusul: {asp.sender || 'Anonim'}
                            </span>
                            <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                              • 📅 {asp.submittedAt}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.96rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
                            {asp.title || asp.text}
                          </div>
                          {asp.description && asp.description !== asp.title && (
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {asp.description}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <select
                            value={curStatus}
                            onChange={(e) => {
                              const nextSt = e.target.value;
                              if (onUpdateAspirasi) {
                                onUpdateAspirasi({ ...asp, status: nextSt });
                                showToast(`Status aspirasi diubah menjadi "${nextSt}"`);
                              }
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--input-bg)',
                              border: `1px solid ${statusColor}`,
                              color: 'var(--text-main)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Menunggu Review">⏳ Menunggu Review</option>
                            <option value="Masuk Rencana Proker">🚀 Masuk Rencana Proker</option>
                            <option value="Sudah Direalisasikan">✓ Sudah Direalisasikan</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateAspirasi) {
                                onUpdateAspirasi({ ...asp, isPublic: !isPub });
                                showToast(!isPub ? 'Aspirasi ditampilkan di Papan Publik' : 'Aspirasi disembunyikan dari publik');
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-full)',
                              background: isPub ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${isPub ? '#10b981' : 'var(--border-card)'}`,
                              color: isPub ? '#10b981' : 'var(--text-dim)',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Tampilkan atau sembunyikan di halaman publik Wall of Kudos & Aspirasi"
                          >
                            {isPub ? <Eye size={13} /> : <EyeOff size={13} />}
                            <span>{isPub ? 'Publik' : 'Privat'}</span>
                          </button>

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
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Official Admin Reply Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Tulis tanggapan resmi / tindak lanjut pengurus CNT IT APD (otomatis tersimpan saat klik di luar)..."
                          defaultValue={asp.adminReply || ''}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (asp.adminReply || '') && onUpdateAspirasi) {
                              onUpdateAspirasi({ ...asp, adminReply: val });
                              showToast('Tanggapan pengurus untuk aspirasi berhasil disimpan!');
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BRAND ASSETS & TEMPLATES MANAGEMENT */}
      {activeTab === 'assets' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Kelola Katalog Asset Logo, Template & Media Kit ({brandAssets.length})
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              Unggah file logo, template PowerPoint Townhall, Virtual Background MS Teams/Zoom, atau dokumen panduan brand langsung ke Supabase Storage agar dapat diunduh di halaman Asset Logo.
            </p>
          </div>

          <form onSubmit={handleCreateBrandAsset} noValidate className="admin-form-two-col" style={{
            gap: '14px',
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Judul Asset / Template <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Template PPT Townhall CNT IT APD 2026"
                value={assetTitle}
                onChange={(e) => {
                  setAssetTitle(e.target.value);
                  clearFieldError('assetTitle');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.assetTitle ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
              {renderFieldError('assetTitle')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kategori Katalog
              </label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                <option value="Logo & Brand">Logo & Brand</option>
                <option value="Template Presentasi">Template Presentasi (PPT)</option>
                <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
                <option value="Media & Publikasi">Media, Twibbon & Publikasi</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Label Badge (misal: Official Asset / PPTX / HD)
              </label>
              <input
                type="text"
                placeholder="Contoh: Template Resmi"
                value={assetBadge}
                onChange={(e) => setAssetBadge(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div className="mobile-two-col" style={{ gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Format File
                </label>
                <input
                  type="text"
                  placeholder="PNG / PPTX / ZIP"
                  value={assetFileType}
                  onChange={(e) => setAssetFileType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Ukuran File
                </label>
                <input
                  type="text"
                  placeholder="Otomatis / 2.4 MB"
                  value={assetFileSize}
                  onChange={(e) => setAssetFileSize(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Upload File ke Supabase Storage atau Masukkan URL Download <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}>
                  <Upload size={14} />
                  <span>{isUploadingMedia ? 'Mengunggah...' : 'Upload File ke Cloud'}</span>
                  <input type="file" onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', false)} style={{ display: 'none' }} />
                </label>
                <input
                  type="text"
                  placeholder="Atau tempel URL file (https://... atau /assets/...)"
                  value={assetFileUrl}
                  onChange={(e) => {
                    setAssetFileUrl(e.target.value);
                    clearFieldError('assetFileUrl');
                  }}
                  style={{ flex: '1 1 220px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.assetFileUrl ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>
              {renderFieldError('assetFileUrl')}
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Gambar Preview Thumbnail (Opsional)
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 184, 0, 0.14)',
                  border: '1px solid var(--mandiri-gold)',
                  color: 'var(--mandiri-gold)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  <ImageIcon size={14} />
                  <span>Upload Gambar Preview</span>
                  <input type="file" accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl', false)} style={{ display: 'none' }} />
                </label>
                <input
                  type="text"
                  placeholder="URL Gambar Preview (kosongkan jika sama dengan URL file)"
                  value={assetPreviewUrl}
                  onChange={(e) => setAssetPreviewUrl(e.target.value)}
                  style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Deskripsi Kegunaan Asset
              </label>
              <textarea
                rows={2}
                placeholder="Penjelasan singkat kegunaan file/template..."
                value={assetDesc}
                onChange={(e) => setAssetDesc(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Simpan & Publikasikan Asset</span>
              </button>
            </div>
          </form>

          {/* Existing Brand Assets List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {brandAssets.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                    <span className="badge-gold" style={{ fontSize: '0.66rem' }}>{item.category || 'Logo & Brand'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                      {[item.fileType, item.fileSize].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {item.title}
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-card)' }}>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--neon-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={12} />
                    <span>Buka File</span>
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingItem({ type: 'brand_asset', item: { ...item } })}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'rgba(14, 165, 233, 0.12)',
                        border: '1px solid #0284c7',
                        color: '#0284c7',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'brand_asset', id: item.id, name: item.title })}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                  Edit {
                    editingItem.type === 'member' ? 'Data Personel' :
                    editingItem.type === 'division' ? 'Data Divisi' :
                    editingItem.type === 'gallery' ? 'Dokumentasi Galeri' :
                    editingItem.type === 'kudos' ? 'Apresiasi / Kudos' :
                    editingItem.type === 'form' ? 'Formulir Pendaftaran' :
                    editingItem.type === 'event' ? 'Program Kerja & Agenda' :
                    editingItem.type === 'brand_asset' ? 'Asset & Template' :
                    'Periode Kepengurusan'
                  }
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

            {/* Edit Member Form (Complete Fields) */}
            {editingItem.type === 'member' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
                    <input
                      type="text"
                      value={editingItem.item.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value, shortName: e.target.value.split(' ')[0] } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Posisi</label>
                    <select
                      value={editingItem.item.category || 'anggota'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="pembina">Pembina</option>
                      <option value="inti">Pengurus Inti (BPH)</option>
                      <option value="pimpro">Ketua Divisi (Pimpro)</option>
                      <option value="anggota">Anggota Divisi</option>
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penugasan</label>
                    <select
                      value={editingItem.item.divisionId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, divisionId: e.target.value || undefined } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="">-- Lintas Divisi / BPH --</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Title / Sub-Jabatan</label>
                    <input
                      type="text"
                      value={editingItem.item.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={editingItem.item.whatsapp || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, whatsapp: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.periodLabel} — {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggung Jawab Utama (1 baris per poin)</label>
                  <textarea
                    rows={3}
                    value={Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities.join('\n') : ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item,
                        responsibilities: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Foto Profil Personel (Cloud Storage)</label>
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
                      <span>{isUploadingMedia ? 'Mengunggah...' : 'Upload Foto'}</span>
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

            {/* Edit Division Form (Complete Fields) */}
            {editingItem.type === 'division' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warna Identitas Divisi</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ width: '40px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={editingItem.item.color || '#0284c7'}
                        onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, color: e.target.value } })}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Open Recruitment</label>
                    <select
                      value={editingItem.item.isRecruiting !== false ? 'open' : 'closed'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, isRecruiting: e.target.value === 'open' } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="open">● Membuka Rekrutmen (Oprec Buka)</option>
                      <option value="closed">○ Ditutup Sementara (Oprec Tutup)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto Divisi</label>
                  <input
                    type="text"
                    value={editingItem.item.motto || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
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

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fokus Area (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas.join(', ') : ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: {
                        ...editingItem.item,
                        focusAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Gallery Form (Complete with Photos & DocLinks management) */}
            {editingItem.type === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || 'tenure-2026'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penyelenggara</label>
                    <select
                      value={editingItem.item.division || 'Creative Media'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, division: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {divisions.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
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

                {/* Photos Manager in Edit Modal */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Foto Carousel ({(editingItem.item.photos || []).length})
                    </label>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid var(--neon-cyan)',
                      color: 'var(--neon-cyan)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}>
                      <Upload size={12} />
                      <span>{isUploadingMedia ? 'Mengunggah...' : '+ Upload Foto Baru'}</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, true)} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(editingItem.item.photos || []).map((photoUrl, pIdx) => (
                      <div key={pIdx} style={{ position: 'relative', width: '68px', height: '52px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                        <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => {
                            const nextPhotos = (editingItem.item.photos || []).filter((_, i) => i !== pIdx);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, photos: nextPhotos } });
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'rgba(244, 63, 94, 0.9)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DocLinks Manager in Edit Modal */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Tautan Dokumentasi / Google Drive ({(editingItem.item.docLinks || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLinks = [...(editingItem.item.docLinks || []), { text: 'Dokumentasi GDrive', url: '' }];
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      + Tambah Link
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(editingItem.item.docLinks || []).map((lnk, lIdx) => (
                      <div key={lIdx} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Label tombol"
                          value={lnk.text || ''}
                          onChange={(e) => {
                            const nextLinks = (editingItem.item.docLinks || []).map((item, i) => i === lIdx ? { ...item, text: e.target.value } : item);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ flex: '1 1 130px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                        />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={lnk.url || ''}
                          onChange={(e) => {
                            const nextLinks = (editingItem.item.docLinks || []).map((item, i) => i === lIdx ? { ...item, url: e.target.value } : item);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ flex: '1.4 1 160px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextLinks = (editingItem.item.docLinks || []).filter((_, i) => i !== lIdx);
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, docLinks: nextLinks } });
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Tenure Form */}
            {editingItem.type === 'tenure' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Headline Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHeadline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHeadline: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Highlight Hero</label>
                    <input
                      type="text"
                      value={editingItem.item.heroHighlight || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, heroHighlight: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
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
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                            style={{ flex: '1 1 160px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
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
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || 'tenure-2026'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code}</option>
                      ))}
                    </select>
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
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Estimasi RAB (Rp)</label>
                  <input
                    type="number"
                    value={editingItem.item.totalRab ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, totalRab: Number(e.target.value || 0) } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target KPI / Peserta</label>
                    <input
                      type="text"
                      value={editingItem.item.kpi || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, kpi: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
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

            {/* Edit Brand Asset Form */}
            {editingItem.type === 'brand_asset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Asset / Template</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori</label>
                    <select
                      value={editingItem.item.category || 'Logo & Brand'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="Logo & Brand">Logo & Brand</option>
                      <option value="Template Presentasi">Template Presentasi (PPT)</option>
                      <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
                      <option value="Media & Publikasi">Media, Twibbon & Publikasi</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Label Badge</label>
                    <input
                      type="text"
                      value={editingItem.item.badge || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, badge: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Format File</label>
                    <input
                      type="text"
                      value={editingItem.item.fileType || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileType: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ukuran File</label>
                    <input
                      type="text"
                      value={editingItem.item.fileSize || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileSize: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>URL File Download</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid var(--neon-cyan)',
                      color: 'var(--neon-cyan)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <Upload size={13} />
                      <span>Upload Baru</span>
                      <input type="file" onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', true)} style={{ display: 'none' }} />
                    </label>
                    <input
                      type="text"
                      value={editingItem.item.fileUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileUrl: e.target.value } })}
                      style={{ flex: 1, minWidth: '180px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Deskripsi</label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
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
                  if ((editingItem.type === 'gallery' || editingItem.type === 'tenure' || editingItem.type === 'form' || editingItem.type === 'event' || editingItem.type === 'brand_asset') && !(it.title || '').trim()) {
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
                  if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) onUpdateBrandAsset(editingItem.item);
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
                    if (deleteConfirm.type === 'submission' && onDeleteSubmission) onDeleteSubmission(deleteConfirm.id);
                    if (deleteConfirm.type === 'brand_asset' && onDeleteBrandAsset) onDeleteBrandAsset(deleteConfirm.id);
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

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      {showExecutiveReportModal && (() => {
        const completedEvents = events.filter(e => e.status === 'Completed').length;
        const prokerPercent = events.length > 0 ? Math.round((completedEvents / events.length) * 100) : 0;
        const totalRab = events.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);
        const coreLeaders = members.filter(m => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro');
        const realizedAspirasi = aspirasiList.filter(a => a.status === 'Sudah Direalisasikan').length;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div className="glass-panel modal-container" style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px',
              border: '1.5px solid var(--mandiri-gold)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Modal Top Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
                <div>
                  <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                    Executive Summary & LPJ Resmi
                  </span>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Laporan Pertanggungjawaban & Progres CNT IT APD
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Periode: <strong>{activeTenure?.label || 'Kepengurusan 2026'}</strong> • Tema: <em>{activeTenure?.theme || 'Empowering Synergy'}</em>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={15} />
                    <span>🖨️ Cetak / Simpan PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExecutiveReportModal(false)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 1. Key Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL PERSONEL</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{members.length} Orang</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>4 Divisi & BPH Inti</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>REALISASI PROKER</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{completedEvents}/{events.length} ({prokerPercent}%)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{galleries.length} Dokumentasi Galeri</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL ANGGARAN (RAB)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>Rp {(totalRab / 1000000).toFixed(1)} Jt</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rp {totalRab.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>INDEKS PARTISIPASI</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--mandiri-gold)', marginTop: '4px' }}>{kudosList.length} Kudos</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{aspirasiList.length} Aspirasi ({realizedAspirasi} Terealisasi)</div>
                </div>
              </div>

              {/* 2. Tabel Realisasi Program Kerja & Anggaran */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  I. Rekapitulasi Program Kerja & Rencana Anggaran Biaya (RAB)
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '580px' }}>
                    <thead>
                      <tr style={{ background: 'var(--input-bg)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Program Kerja</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Divisi</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Jadwal</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Target KPI</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Status</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)', textAlign: 'right' }}>Total RAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((evt) => (
                        <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{evt.title}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.divisionName}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.date}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.kpi}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: evt.status === 'Completed' ? '#10b981' : 'var(--mandiri-gold)'
                            }}>
                              {evt.status === 'Completed' ? '✓ Selesai' : evt.status}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                            Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Susunan Pimpinan & Ketua Divisi */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  II. Susunan Dewan Pembina, Pengurus Inti & Ketua Divisi (Pimpro)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {coreLeaders.map((ldr) => (
                    <div key={ldr.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase' }}>{ldr.role}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{ldr.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{ldr.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
