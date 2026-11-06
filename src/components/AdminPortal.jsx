import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  Loader2,
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
  Building2,
  FileText,
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
  Share2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { uploadMediaToCloud } from '../lib/supabase';
import { soundFx } from '../utils/audio';
import { 
  parseDateToIso, 
  formatToIndonesianDate, 
  getDeadlineStatus, 
  formatWibTimestamp,
  formatWibDateTime,
  formatDeadlineWib,
  toDatetimeLocalSecondsValue,
  formatWibEventRange,
  toDatetimeLocalValue,
  toDateInputValue,
  parseFlexibleDate,
  buildFlexibleDate
} from '../utils/dateUtils';

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
  departments = [],
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  recruitmentInfo = { isOpen: true, deadline: '' }, 
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
  faqs = [],
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
  announcementBar = {
    isActive: false,
    badge: 'INFO TERBARU',
    message: '',
    ctaText: '',
    ctaTab: 'home'
  },
  onUpdateAnnouncementBar,
  syncStatus = 'synced',
  onForceSync,
  onResetDefault,
  onRestoreBackup,
  theme = 'dark'
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
  const [subCurrentPage, setSubCurrentPage] = useState(1);
  const [adminEventPage, setAdminEventPage] = useState(1);
  const [adminRsvpPage, setAdminRsvpPage] = useState(1);
  const [adminGalleryPage, setAdminGalleryPage] = useState(1);
  const [adminKudosPage, setAdminKudosPage] = useState(1);
  const [adminAspirasiPage, setAdminAspirasiPage] = useState(1);
  const [adminFaqPage, setAdminFaqPage] = useState(1);

  // Form states for new Brand Asset
  const [assetTitle, setAssetTitle] = useState('');
  const [assetCategory, setAssetCategory] = useState('Logo & Brand');
  const [assetBadge, setAssetBadge] = useState('Official Asset');
  const [assetFileType, setAssetFileType] = useState('PNG / ZIP');
  const [assetFileSize, setAssetFileSize] = useState('');
  const [assetFileUrl, setAssetFileUrl] = useState('');
  const [assetPreviewUrl, setAssetPreviewUrl] = useState('');
  const [assetDesc, setAssetDesc] = useState('');

  // Pending Upload States (Deferred upload on Save/Submit only, never prematurely on selection)
  const [pendingAssetFile, setPendingAssetFile] = useState(null);
  const [pendingPreviewFile, setPendingPreviewFile] = useState(null);
  const [pendingMemberPhoto, setPendingMemberPhoto] = useState(null);
  const [pendingGalFiles, setPendingGalFiles] = useState([]);

  // Generic Edit Modal State: { type: 'member'|'division'|'tenure'|'gallery', item: {...} }
  const [editingItem, setEditingItem] = useState(null);
  const [editModalError, setEditModalError] = useState('');

  // Generic Delete Confirmation Modal State: { type: 'member'|'division'|'tenure'|'gallery', id: string, name: string }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form states for new member
  const [memName, setMemName] = useState('');
  const [memCategory, setMemCategory] = useState('anggota'); // 'pembina' | 'inti' | 'pimpro' | 'anggota'
  const [memRole, setMemRole] = useState('');
  const [memDivisionId, setMemDivisionId] = useState(divisions[0]?.id || 'div-exp');
  const [memTenureId, setMemTenureId] = useState(activeTenure?.id || '');
  const [memWhatsapp, setMemWhatsapp] = useState('');
  const [memMotto, setMemMotto] = useState('');
  const [memImage, setMemImage] = useState('');

  // Form states for new division
  const [newDivName, setNewDivName] = useState('');
  const [newDivMemberId, setNewDivMemberId] = useState('');
  const [newDivLead, setNewDivLead] = useState('');
  const [newDivColor, setNewDivColor] = useState('#00529B');
  const [newDivDesc, setNewDivDesc] = useState('');
  const [newDivFocus, setNewDivFocus] = useState('');
  const [newDivTenureId, setNewDivTenureId] = useState(activeTenure?.id || '');

  // Form states for new department
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptPage, setDeptPage] = useState(1);

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
  const [recruitDeadline, setRecruitDeadline] = useState(recruitmentInfo?.deadline ?? '');

  // Form Creator & Field Builder States
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormCategory, setNewFormCategory] = useState('Kegiatan & Event');
  const [newFormDeadline, setNewFormDeadline] = useState('');
  const [newFormSubtitle, setNewFormSubtitle] = useState('');
  const [newFormRequiresTracking, setNewFormRequiresTracking] = useState(true);
  const [newFormTenureId, setNewFormTenureId] = useState(activeTenure?.id || '');
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');
  const [draggedFieldIndex, setDraggedFieldIndex] = useState(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState(null);

  const handleMoveField = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    if (!editingItem || editingItem.type !== 'form' || !editingItem.item?.fields) return;
    const currentFields = [...editingItem.item.fields];
    if (fromIndex < 0 || fromIndex >= currentFields.length || toIndex < 0 || toIndex >= currentFields.length) return;
    const [moved] = currentFields.splice(fromIndex, 1);
    currentFields.splice(toIndex, 0, moved);
    setEditingItem({
      ...editingItem,
      item: { ...editingItem.item, fields: currentFields }
    });
  };

  // Helper to initiate tenure deletion with dependency checks and protection validation
  const handleDeleteTenureClick = (t) => {
    const isOnlyTenure = (tenures || []).length <= 1;
    const isActiveTenure = (activeTenure?.id === t.id) || Boolean(t.isActive);
    const divCount = (divisions || []).filter(d => d.tenureId === t.id).length;
    const memCount = (members || []).filter(m => m.tenureId === t.id).length;
    const evtCount = (events || []).filter(e => e.tenureId === t.id).length;
    const galCount = (galleries || []).filter(g => g.tenureId === t.id).length;
    const formCount = (forms || []).filter(f => f.tenureId === t.id).length;
    const totalDependentCount = divCount + memCount + evtCount + galCount + formCount;

    setDeleteConfirm({
      type: 'tenure',
      id: t.id,
      name: t.title || t.code || 'Periode Kepengurusan',
      code: t.code,
      isOnlyTenure,
      isActiveTenure,
      divCount,
      memCount,
      evtCount,
      galCount,
      formCount,
      totalDependentCount,
      isBlocked: isOnlyTenure || isActiveTenure || totalDependentCount > 0
    });
  };

  // Helper to initiate division deletion with dependency checks
  const handleDeleteDivisionClick = (d) => {
    const memCount = (members || []).filter(m => m.divisionId === d.id).length;
    const evtCount = (events || []).filter(e => e.divisionId === d.id).length;
    const galCount = (galleries || []).filter(g => g.divisionId === d.id || g.division === d.name).length;
    const totalDependentCount = memCount + evtCount + galCount;

    setDeleteConfirm({
      type: 'division',
      id: d.id,
      name: d.name,
      memCount,
      evtCount,
      galCount,
      totalDependentCount,
      isBlocked: totalDependentCount > 0
    });
  };

  // Helper to initiate member deletion with Pimpro / leadership checks
  const handleDeleteMemberClick = (m) => {
    const isPimpro = m.category === 'pimpro';
    const divObj = (divisions || []).find(d => d.id === m.divisionId || d.memberId === m.id || d.leadName === m.name);
    const squadCount = isPimpro && m.divisionId 
      ? (members || []).filter(other => other.category === 'anggota' && other.divisionId === m.divisionId).length 
      : 0;

    setDeleteConfirm({
      type: 'member',
      id: m.id,
      name: m.name,
      category: m.category,
      divName: divObj?.name || 'Terkait',
      squadCount,
      isBlocked: isPimpro && squadCount > 0
    });
  };

  // Helper to initiate event deletion with RSVP dependency checks
  const handleDeleteEventClick = (evt) => {
    const relatedRsvps = (eventRsvps || []).filter(r => r.eventId === evt.id);
    const rsvpCount = relatedRsvps.length;

    setDeleteConfirm({
      type: 'event',
      id: evt.id,
      name: evt.title,
      rsvpCount,
      isBlocked: rsvpCount > 0
    });
  };

  // Helper to initiate dynamic form deletion with submission dependency checks
  const handleDeleteFormClick = (f) => {
    const subCount = (submissions || []).filter(s => s.formId === f.id).length;

    setDeleteConfirm({
      type: 'form',
      id: f.id,
      name: f.title,
      submissionCount: subCount,
      isBlocked: subCount > 0
    });
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingItem) setEditingItem(null);
        else if (deleteConfirm) setDeleteConfirm(null);
        else if (showExecutiveReportModal) setShowExecutiveReportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem, deleteConfirm, showExecutiveReportModal]);

  // Form states for new Gallery Event (Flexible 4 Date Modes)
  const [galTitle, setGalTitle] = useState('');
  const [galDateMode, setGalDateMode] = useState('date'); // 'date' | 'range' | 'month' | 'year'
  const [galDateVal, setGalDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [galStartDate, setGalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [galEndDate, setGalEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [galMonth, setGalMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [galYear, setGalYear] = useState(String(new Date().getFullYear()));
  const [galDivisionId, setGalDivisionId] = useState('');
  const [galDivision, setGalDivision] = useState('Creative Media');
  const [galTenureId, setGalTenureId] = useState(activeTenure?.id || '');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotos, setGalPhotos] = useState('');

  // Form states for Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Program Budaya');
  const [eventDivId, setEventDivId] = useState('');
  const [eventTenureId, setEventTenureId] = useState(activeTenure?.id || '');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventKpi, setEventKpi] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventRab, setEventRab] = useState('');
  const [eventStatus, setEventStatus] = useState('Upcoming');

  // Form State: New FAQ
  const [faqCategory, setFaqCategory] = useState('Tentang CNT');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const handleCreateFaq = (e) => {
    e.preventDefault();
    const errs = {};
    if (!faqQuestion.trim()) errs.faqQuestion = 'Pertanyaan FAQ wajib diisi';
    if (!faqAnswer.trim()) errs.faqAnswer = 'Jawaban / penjelasan FAQ wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi Pertanyaan dan Jawaban FAQ', 'error');
      return;
    }

    if (onAddFaq) {
      onAddFaq({
        id: 'faq-' + Date.now(),
        category: faqCategory || 'Umum',
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        isPublished: true
      });
    }

    setFaqQuestion('');
    setFaqAnswer('');
    showToast('Pertanyaan FAQ baru berhasil ditambahkan & disinkronkan!');
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const errs = {};
    if (!eventTitle.trim()) errs.eventTitle = 'Nama Event wajib diisi';
    if (!eventStartDate) errs.eventStartDate = 'Tanggal Mulai wajib dipilih';
    if (!eventEndDate) errs.eventEndDate = 'Tanggal Berakhir wajib dipilih';
    if (!eventDesc.trim()) errs.eventDesc = 'Deskripsi Event wajib diisi';
    if (eventRab === '' || eventRab === undefined || eventRab === null || isNaN(Number(eventRab)) || Number(eventRab) < 0) {
      errs.eventRab = 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)';
    }

    const targetEventTenureId = eventTenureId || activeTenure?.id || '';
    const availableDivsForEvent = divisions.filter(d => d.tenureId === targetEventTenureId);

    if (availableDivsForEvent.length === 0) {
      errs.eventDivId = 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.';
    } else if (!eventDivId || !availableDivsForEvent.some(d => d.id === eventDivId)) {
      errs.eventDivId = 'Divisi penyelenggara wajib dipilih';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Event', 'error');
      return;
    }

    const divObj = divisions.find(d => d.id === eventDivId);

    const sDate = eventStartDate || new Date().toISOString().split('T')[0];
    const eDate = eventEndDate || sDate;
    const dateLabel = formatWibEventRange(sDate, eDate);

    const finalCategory = eventCategory.trim() || 'Program Budaya';

    if (onAddEvent) {
      onAddEvent({
        id: 'evt-' + Date.now(),
        tenureId: eventTenureId || activeTenure?.id || '',
        divisionId: eventDivId,
        divisionName: divObj?.name || 'CNT IT APD',
        title: eventTitle.trim(),
        date: dateLabel,
        startDate: sDate,
        endDate: eDate,
        category: finalCategory,
        kategori: finalCategory,
        badge: finalCategory,
        location: eventLocation.trim() || 'Plaza Mandiri',
        peserta: eventKpi.trim() || 'Officer IT APD',
        kpi: eventKpi.trim() || 'Officer IT APD',
        description: eventDesc.trim(),
        status: eventStatus,
        totalRab: Number(eventRab)
      });
    }

    const savedTitle = eventTitle.trim();
    setEventTitle('');
    setEventCategory('Program Budaya');
    setEventStartDate('');
    setEventEndDate('');
    setEventLocation('');
    setEventKpi('');
    setEventDesc('');
    setEventRab('');
    showToast(`Event "${savedTitle}" berhasil ditambahkan & disinkronkan!`);
  };

  // Secure SHA-256 Authentication (Zero plaintext in code)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;
    const errs = {};
    if (!username.trim()) errs.loginUsername = 'Username wajib diisi';
    if (!password) errs.loginPassword = 'Password wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      // Natural verification pause so the user perceives credential verification
      await new Promise((resolve) => setTimeout(resolve, 850));

      const uHash = await sha256(username.trim());
      const pHash = await sha256(password);

      if (uHash === ADMIN_USER_HASH && pHash === ADMIN_PASS_HASH) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('cnt_admin_auth_session', 'authenticated_v2');
        } catch (e) {}
        setLoginError('');
        setFormErrors({});
        showToast('Berhasil masuk! Selamat datang di Admin Portal', 'success');
      } else {
        setLoginError('Username atau password salah');
        showToast('Verifikasi gagal: Username atau password salah', 'error');
      }
    } catch (err) {
      setLoginError('Gagal memverifikasi kredensial');
      showToast('Gagal memverifikasi kredensial', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Select photo for Member (New or Edit) - Deferred upload on Save only
  const handleMemberPhotoUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    if (isEdit) {
      setEditingItem(prev => prev ? {
        ...prev,
        pendingPhoto: file,
        item: { ...prev.item, image: localPreview }
      } : null);
      showToast(`Foto baru "${file.name}" dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
    } else {
      setPendingMemberPhoto(file);
      setMemImage(localPreview);
      showToast(`Foto "${file.name}" dipilih (akan diunggah saat Anda klik Tambah Personel)`);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!memName.trim()) errs.memName = 'Nama Lengkap pengurus/anggota wajib diisi';

    const targetTenureId = memTenureId || activeTenure?.id || '';
    const availableDivsForMember = divisions.filter(d => d.tenureId === targetTenureId);

    if (memCategory === 'anggota' || memCategory === 'pimpro') {
      if (availableDivsForMember.length === 0) {
        errs.memDivisionId = 'Divisi masih kosong pada periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih.';
      } else if (!memDivisionId || !availableDivsForMember.some(d => d.id === memDivisionId)) {
        errs.memDivisionId = 'Divisi wajib dipilih untuk posisi Anggota / Pimpro';
      }
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Personel', 'error');
      return;
    }

    let finalImageUrl = memImage || '';
    if (pendingMemberPhoto) {
      setIsUploadingMedia(true);
      showToast('Mengunggah foto profil ke Cloud Storage...');
      try {
        finalImageUrl = await uploadMediaToCloud(pendingMemberPhoto, 'members');
      } catch (err) {
        setIsUploadingMedia(false);
        showToast('Gagal mengunggah foto profil: ' + (err.message || 'Error'), 'error');
        return;
      }
      setIsUploadingMedia(false);
    }

    const divObj = divisions.find(d => d.id === memDivisionId);
    const color = divObj?.color || '#FFB800';

    onAddMember({
      id: 'mem-' + Date.now(),
      tenureId: memTenureId || activeTenure?.id || '',
      divisionId: memCategory === 'anggota' || memCategory === 'pimpro' ? memDivisionId : undefined,
      category: memCategory,
      name: memName,
      role: memRole || (memCategory === 'anggota' ? 'Anggota Divisi' : 'Pengurus'),
      title: memCategory === 'anggota' ? `Anggota ${divObj?.name || 'CNT'}` : memRole,
      image: finalImageUrl,
      color: color,
      whatsapp: memWhatsapp.trim(),
      motto: memMotto || 'Dedikasi & Semangat untuk Insan IT APD',
      responsibilities: ['Kontribusi aktif dalam pelaksanaan event budaya CNT IT APD']
    });

    const savedName = memName;
    setMemName('');
    setMemRole('');
    setMemWhatsapp('');
    setMemMotto('');
    setMemImage('');
    setPendingMemberPhoto(null);
    showToast(`Pengurus/Anggota "${savedName}" berhasil ditambahkan & tersimpan di Cloud!`);
  };

  const handleCreateDivision = (e) => {
    e.preventDefault();
    if (!newDivName.trim()) {
      setFormErrors((prev) => ({ ...prev, newDivName: 'Nama Divisi wajib diisi' }));
      showToast('Mohon isi Nama Divisi terlebih dahulu', 'error');
      return;
    }

    const selPimpro = members.find(m => m.id === newDivMemberId);
    onAddDivision({
      id: 'div-' + Date.now(),
      tenureId: newDivTenureId || activeTenure?.id || '',
      name: newDivName,
      slug: newDivName.toLowerCase().replace(/\s+/g, '-'),
      memberId: newDivMemberId || null,
      leadName: selPimpro ? selPimpro.name : (newDivLead || 'TBD'),
      color: newDivColor,
      motto: 'Mendorong Transformasi Budaya Berkelanjutan',
      description: newDivDesc || 'Divisi pengembangan inisiatif budaya di Group IT APD.',
      focusAreas: newDivFocus ? newDivFocus.split(',').map(s => s.trim()).filter(Boolean) : ['Inisiatif Event Baru'],
      isRecruiting: false
    });

    const savedDiv = newDivName;
    setNewDivName('');
    setNewDivMemberId('');
    setNewDivLead('');
    setNewDivDesc('');
    setNewDivFocus('');
    showToast(`Divisi "${savedDiv}" berhasil ditambahkan & disinkronkan!`);
  };

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      setFormErrors((prev) => ({ ...prev, newDeptName: 'Nama Departemen wajib diisi' }));
      showToast('Mohon isi Nama Departemen terlebih dahulu', 'error');
      return;
    }
    const isDuplicate = departments.some(
      (d) => d.name.toLowerCase().trim() === newDeptName.toLowerCase().trim()
    );
    if (isDuplicate) {
      setFormErrors((prev) => ({ ...prev, newDeptName: 'Nama Departemen sudah terdaftar' }));
      showToast('Departemen dengan nama ini sudah terdaftar', 'error');
      return;
    }

    if (onAddDepartment) {
      onAddDepartment({
        id: 'dept-' + Date.now(),
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
        description: newDeptDesc.trim() || 'Departemen di lingkungan Group IT Application Delivery.',
        sortOrder: departments.length
      });
    }

    const savedDept = newDeptName.trim();
    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptDesc('');
    showToast(`Departemen "${savedDept}" berhasil ditambahkan & disinkronkan!`);
  };

  const handleDeleteDepartmentClick = (dept) => {
    const relatedRsvps = (eventRsvps || []).filter(
      (r) => r.departmentId === dept.id || r.department === dept.id || (dept.name && r.department === dept.name)
    );
    if (relatedRsvps.length > 0) {
      setDeleteConfirm({
        type: 'department',
        id: dept.id,
        name: dept.name,
        isBlocked: true,
        rsvpCount: relatedRsvps.length
      });
      return;
    }

    setDeleteConfirm({
      type: 'department',
      id: dept.id,
      name: dept.name,
      isBlocked: false,
      rsvpCount: 0
    });
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

  // Photos file selector handler - Deferred upload on Submit/Save only
  const handlePhotoUpload = (e, isEditModal = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (isEditModal) {
      const localPreviews = files.map(f => URL.createObjectURL(f));
      setEditingItem(prev => {
        if (!prev) return null;
        const currentPending = prev.pendingPhotos || [];
        const existingPhotos = Array.isArray(prev.item.photos) ? prev.item.photos : [];
        return {
          ...prev,
          pendingPhotos: [...currentPending, ...files],
          item: { ...prev.item, photos: [...existingPhotos, ...localPreviews] }
        };
      });
      showToast(`${files.length} foto baru dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
    } else {
      setPendingGalFiles(prev => [...prev, ...files]);
      const localPreviews = files.map(f => URL.createObjectURL(f));
      setUploadedPhotos(prev => [...prev, ...localPreviews]);
      setFormErrors(prev => ({ ...prev, galPhotos: null }));
      showToast(`${files.length} foto dipilih (akan diunggah saat Anda klik Publikasikan)`);
    }
  };

  // Select Brand Asset file or preview - Deferred upload on Save only
  const handleBrandAssetUpload = (e, field = 'fileUrl', isEditModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeLabel = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';
    const extLabel = (file.name.split('.').pop() || 'FILE').toUpperCase();
    const localBlobUrl = URL.createObjectURL(file);

    if (isEditModal) {
      if (field === 'fileUrl') {
        setEditingItem(prev => prev ? {
          ...prev,
          pendingFile: file,
          originalFileUrl: prev.originalFileUrl || prev.item.fileUrl,
          item: {
            ...prev.item,
            fileUrl: localBlobUrl,
            fileSize: sizeLabel,
            fileType: extLabel
          }
        } : null);
        showToast(`File baru "${file.name}" dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
      } else {
        setEditingItem(prev => prev ? {
          ...prev,
          pendingPreviewFile: file,
          item: { ...prev.item, previewUrl: localBlobUrl }
        } : null);
        showToast(`Preview "${file.name}" dipilih`);
      }
    } else {
      if (field === 'fileUrl') {
        setPendingAssetFile(file);
        setAssetFileUrl(localBlobUrl);
        setAssetFileSize(sizeLabel);
        setAssetFileType(extLabel);
        clearFieldError('assetFileUrl');
        if (!assetTitle) {
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setAssetTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
        }
        if (!assetPreviewUrl && /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file.name)) {
          setPendingPreviewFile(file);
          setAssetPreviewUrl(localBlobUrl);
        }
        showToast(`File "${file.name}" dipilih (akan diunggah saat Anda klik Simpan & Publikasikan)`);
      } else {
        setPendingPreviewFile(file);
        setAssetPreviewUrl(localBlobUrl);
        showToast(`Gambar preview "${file.name}" dipilih`);
      }
    }
  };

  const handleCreateBrandAsset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!assetTitle.trim()) errs.assetTitle = 'Judul Asset / Template wajib diisi';
    if (!pendingAssetFile && !pendingPreviewFile && !assetFileUrl.trim() && !assetPreviewUrl.trim()) {
      errs.assetFileUrl = 'File atau URL Download wajib dipilih / diisi';
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi Judul dan File/URL Asset', 'error');
      return;
    }

    setIsUploadingMedia(true);
    let finalFileUrl = assetFileUrl.trim();
    let finalPreviewUrl = assetPreviewUrl.trim();

    try {
      if (pendingAssetFile) {
        showToast(`Mengunggah file "${pendingAssetFile.name}" ke Cloud Storage...`);
        finalFileUrl = await uploadMediaToCloud(pendingAssetFile, 'assets');
      }
      if (pendingPreviewFile) {
        if (pendingPreviewFile === pendingAssetFile) {
          finalPreviewUrl = finalFileUrl;
        } else {
          showToast(`Mengunggah preview "${pendingPreviewFile.name}" ke Cloud Storage...`);
          finalPreviewUrl = await uploadMediaToCloud(pendingPreviewFile, 'assets');
        }
      }
    } catch (err) {
      setIsUploadingMedia(false);
      showToast('Gagal mengunggah file ke Cloud Storage: ' + (err.message || 'Error jaringan'), 'error');
      return;
    }
    setIsUploadingMedia(false);

    const effectiveFileUrl = finalFileUrl || finalPreviewUrl || '';
    const effectivePreviewUrl = finalPreviewUrl || finalFileUrl || '';

    if (!effectiveFileUrl) {
      showToast('Gagal: File asset atau URL download tidak boleh kosong. Silakan pilih berkas kembali.', 'error');
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
        fileUrl: effectiveFileUrl,
        previewUrl: effectivePreviewUrl,
        description: assetDesc.trim() || 'Asset resmi CNT IT Application Delivery.'
      });
    }

    const saved = assetTitle.trim();
    setAssetTitle('');
    setAssetFileUrl('');
    setAssetPreviewUrl('');
    setAssetFileSize('');
    setAssetDesc('');
    setPendingAssetFile(null);
    setPendingPreviewFile(null);
    showToast(`Asset "${saved}" berhasil disimpan & dipublikasikan!`);
  };

  const removeUploadedPhoto = (idx) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== idx));
    setPendingGalFiles(prev => prev.filter((_, i) => i !== idx));
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

  // Helper to verify if an external image link is reachable and valid
  const verifyImageUrl = (url) => {
    return new Promise((resolve) => {
      if (!url || typeof url !== 'string') {
        return resolve({ valid: false, error: 'URL tidak boleh kosong' });
      }
      const trimmed = url.trim();
      if (trimmed.startsWith('/images/') || trimmed.startsWith('/assets/')) {
        return resolve({ valid: true });
      }
      let parsed;
      try {
        parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return resolve({ valid: false, error: 'Tautan harus diawali dengan http:// atau https://' });
        }
      } catch {
        return resolve({ valid: false, error: 'Format tautan URL tidak valid' });
      }

      const hasImageExtension = /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)($|\?)/i.test(trimmed);
      const isCloudMediaStorage = trimmed.includes('/storage/v1/object/') || trimmed.includes('/storage-proxy/');

      const img = new Image();
      let isSettled = false;

      const timer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        img.onload = null;
        img.onerror = null;
        if (hasImageExtension || isCloudMediaStorage) {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, error: 'Tautan foto melebihi batas waktu (timeout) atau bukan file gambar yang aktif' });
        }
      }, 4500);

      img.onload = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve({ valid: true });
      };

      img.onerror = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        if (hasImageExtension || isCloudMediaStorage) {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, error: 'Tautan tidak dapat memuat gambar atau bukan file foto yang valid' });
        }
      };

      img.src = trimmed;
    });
  };

  const handleAddPhotoLinkToEditModal = async () => {
    const raw = (editingItem?.photoUrlInput || '').trim();
    if (!raw) {
      showToast('Masukkan minimal satu tautan link foto terlebih dahulu', 'error');
      return;
    }
    const urls = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!urls.length) return;

    setIsUploadingMedia(true);
    showToast(`Memverifikasi ${urls.length} link foto...`);
    const validUrls = [];
    for (const u of urls) {
      const check = await verifyImageUrl(u);
      if (!check.valid) {
        setIsUploadingMedia(false);
        showToast(`Tautan foto "${u}" tidak valid: ${check.error}`, 'error');
        return;
      }
      validUrls.push(u);
    }
    setIsUploadingMedia(false);

    setEditingItem(prev => {
      if (!prev) return null;
      const existing = Array.isArray(prev.item.photos) ? prev.item.photos : [];
      return {
        ...prev,
        photoUrlInput: '',
        item: {
          ...prev.item,
          photos: [...existing, ...validUrls]
        }
      };
    });
    soundFx?.playSuccess?.();
    showToast(`Berhasil menambahkan ${validUrls.length} link foto ke carousel!`);
  };

  const handleCreateGallery = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!galTitle.trim()) errs.galTitle = 'Judul Kegiatan wajib diisi';
    if (!galDesc.trim()) errs.galDesc = 'Deskripsi Singkat Acara wajib diisi';

    const targetGalTenureId = galTenureId || activeTenure?.id || '';
    const availableDivsForGal = divisions.filter(d => d.tenureId === targetGalTenureId);
    const selectedDiv = availableDivsForGal.find(d => d.id === galDivisionId || d.name === galDivision);
    if (availableDivsForGal.length === 0) {
      errs.galDivision = 'Divisi masih kosong pada periode ini. Silakan buat divisi baru terlebih dahulu di tab Divisi.';
    } else if (!selectedDiv) {
      errs.galDivision = 'Divisi penyelenggara wajib dipilih';
    }

    // Parse image URLs from text input
    const urlPhotos = galPhotos.trim() 
      ? galPhotos.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const hasUpload = pendingGalFiles.length > 0;
    const hasUrls = urlPhotos.length > 0;

    if (!hasUpload && !hasUrls) {
      errs.galPhotos = 'Wajib memilih salah satu: unggah file foto dari komputer ATAU masukkan tautan foto yang valid';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Galeri', 'error');
      return;
    }

    // Verify all input photo URLs to make sure they are real accessible images
    if (hasUrls) {
      setIsUploadingMedia(true);
      showToast('Memverifikasi tautan foto...');
      for (const u of urlPhotos) {
        const check = await verifyImageUrl(u);
        if (!check.valid) {
          setIsUploadingMedia(false);
          setFormErrors(prev => ({ ...prev, galPhotos: `Tautan "${u}" tidak valid: ${check.error}` }));
          showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
          return;
        }
      }
      setIsUploadingMedia(false);
    }

    let cloudPhotos = [];
    if (pendingGalFiles.length > 0) {
      setIsUploadingMedia(true);
      showToast(`Mengunggah ${pendingGalFiles.length} foto ke Cloud Storage...`);
      try {
        for (const file of pendingGalFiles) {
          const url = await uploadMediaToCloud(file, 'gallery');
          if (url) cloudPhotos.push(url);
        }
      } catch (err) {
        setIsUploadingMedia(false);
        showToast('Gagal mengunggah foto galeri: ' + (err.message || 'Error'), 'error');
        return;
      }
      setIsUploadingMedia(false);
    }

    // Combine cloud uploaded photos, existing uploaded, and text URLs
    const combinedPhotos = [...cloudPhotos, ...urlPhotos];
    const photoList = combinedPhotos;

    // Cleaned valid doc links
    const validDocLinks = galDocLinks.filter(l => l.url.trim() && l.text.trim());

    const finalGalDate = buildFlexibleDate(galDateMode, {
      date: galDateVal,
      startDate: galStartDate,
      endDate: galEndDate,
      month: galMonth,
      year: galYear
    });

    onAddGallery({
      id: 'gal-' + Date.now(),
      tenureId: targetGalTenureId,
      divisionId: selectedDiv ? selectedDiv.id : (galDivisionId || ''),
      division: selectedDiv ? selectedDiv.name : galDivision,
      divisionName: selectedDiv ? selectedDiv.name : galDivision,
      title: galTitle,
      date: finalGalDate,
      description: galDesc,
      photos: photoList,
      docLinks: validDocLinks
    });

    const savedGalTitle = galTitle;
    setGalTitle('');
    setGalDateMode('date');
    setGalDateVal(new Date().toISOString().split('T')[0]);
    setGalStartDate(new Date().toISOString().split('T')[0]);
    setGalEndDate(new Date().toISOString().split('T')[0]);
    setGalMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    setGalYear(String(new Date().getFullYear()));
    setGalDivisionId('');
    setGalDesc('');
    setGalPhotos('');
    setUploadedPhotos([]);
    setPendingGalFiles([]);
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
      <div style={{ maxWidth: '440px', margin: '40px auto 80px auto', padding: '0 16px', position: 'relative' }}>
        {/* Floating Toast Notification Banner */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000000,
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
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
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
                disabled={isLoggingIn}
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
                  fontSize: '0.9rem',
                  opacity: isLoggingIn ? 0.7 : 1
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
                  disabled={isLoggingIn}
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
                    fontSize: '0.9rem',
                    opacity: isLoggingIn ? 0.7 : 1
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
              disabled={isLoggingIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: isLoggingIn ? 'rgba(255, 184, 0, 0.75)' : 'var(--mandiri-gold)',
                color: '#040914',
                padding: '13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'all 0.2s ease',
                opacity: isLoggingIn ? 0.85 : 1
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: SHOW ADMIN DASHBOARD
  return (
    <div className="admin-portal-wrapper" style={{ maxWidth: '1000px', margin: '20px auto 80px auto', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
      {/* Floating Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000000,
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
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
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

          <button
            type="button"
            onClick={() => {
              const snapshot = {
                meta: {
                  app: 'CNT IT APD Portal',
                  exportedAt: new Date().toISOString(),
                  activeTenureId: activeTenure?.id || ''
                },
                tenures,
                divisions,
                members,
                events,
                galleries,
                kudosList,
                aspirasiList,
                forms,
                submissions,
                brandAssets,
                eventRsvps,
                faqs,
                pageVisibility,
                announcementBar
              };
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Backup_CNT_IT_APD_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              showToast('Snapshot Backup Penuh (.json) seluruh 13 tabel berhasil diunduh!');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(168, 85, 247, 0.14)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              padding: '7px 13px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
            title="Unduh Backup Penuh (.json) seluruh data 13 tabel database CNT IT APD"
          >
            <Download size={13} />
            <span>💾 Backup (.json)</span>
          </button>

          {onRestoreBackup && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Pulihkan (Restore) seluruh data dari file Backup (.json)"
            >
              <Upload size={13} />
              <span>📂 Restore (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const parsed = JSON.parse(String(evt.target?.result || '{}'));
                      if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.members) && !Array.isArray(parsed.events))) {
                        showToast('Format file Backup (.json) tidak valid', 'error');
                        return;
                      }
                      await onRestoreBackup(parsed);
                      showToast('Seluruh data berhasil dipulihkan dari file Backup & disinkronkan ke Cloud!');
                    } catch (err) {
                      showToast('Gagal membaca file Backup (.json)', 'error');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {onResetDefault && (
            <button
              type="button"
              onClick={() => setDeleteConfirm({ type: 'reset_all', id: 'reset', name: 'Sync Data' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.14)',
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.12)'
              }}
              title="Clear cache lokal dan reload data terbaru dari database"
            >
              <RefreshCw size={13} />
              <span>Sync Data</span>
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
        const eventPercent = events.length > 0 ? Math.round((completedEvents / events.length) * 100) : 0;
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
                {members.filter(m => m.category === 'pembina').length} Pembina • {members.filter(m => m.category === 'inti').length} BPH • {members.filter(m => m.category === 'pimpro').length} Pimpro • {members.filter(m => m.category === 'anggota').length} Squad
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Realisasi Event
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {completedEvents}/{events.length} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>({eventPercent}%)</span>
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
                Akumulasi {events.length} Event
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Data Pengisian Form
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {submissions.length + applications.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Respon</span>
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
          { id: 'events', label: `Event (${events.length})`, icon: CalendarDays },
          { id: 'forms', label: `Kelola Formulir (${forms.length})`, icon: ClipboardList },
          { id: 'submissions', label: `Data Pengisian Form (${submissions.length + applications.length})`, icon: FileCheck2 },
          { id: 'kudos', label: `Kudos & Aspirasi (${kudosList.length + aspirasiList.length})`, icon: Heart },
          { id: 'gallery', label: `Galeri Kegiatan (${galleries.length})`, icon: ImageIcon },
          { id: 'assets', label: `Asset & Template (${brandAssets.length})`, icon: Download },
          { id: 'faqs', label: `Panduan & FAQ (${faqs.length})`, icon: MessageSquare },
          { id: 'departments', label: `Kelola Departemen (${departments.length})`, icon: Building2 },
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
          { id: 'program', label: 'Events & Kalender', desc: 'Halaman daftar event divisi & kalender budaya bulanan interaktif' },
          { id: 'galeri', label: 'Galeri Kegiatan', desc: 'Halaman dokumentasi foto carousel kegiatan & tautan folder dokumentasi' },
          { id: 'kudos', label: 'Kudos & Aspirasi', desc: 'Halaman papan apresiasi & pengiriman pesan terima kasih serta ide aspirasi antar insan IT APD' },
          { id: 'assets', label: 'Asset', desc: 'Halaman transformasi logo & pengunduhan paket asset resmi CNT IT APD' },
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
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Label Tag / Kategori (misal: INFO / UPDATE)</label>
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
                      <option value="assets">Asset</option>
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
                Periode Kepengurusan *
              </label>
              <select
                value={memTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setMemTenureId(e.target.value);
                  setMemDivisionId('');
                  clearFieldError('memDivisionId');
                }}
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
                {tenures.map(t => (
                  <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                ))}
              </select>
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

            {(memCategory === 'anggota' || memCategory === 'pimpro') && (() => {
              const availableDivsForMember = divisions.filter(d => d.tenureId === (memTenureId || activeTenure?.id));
              return (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi / Squad <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={memDivisionId}
                    onChange={(e) => {
                      setMemDivisionId(e.target.value);
                      clearFieldError('memDivisionId');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${formErrors.memDivisionId ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForMember.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi / Squad (Wajib) --</option>
                        {availableDivsForMember.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {availableDivsForMember.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                  {renderFieldError('memDivisionId')}
                </div>
              );
            })()}

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
                          onClick={() => setEditingItem({
                            type: 'member',
                            item: {
                              ...m,
                              rawResponsibilities: Array.isArray(m.responsibilities) ? m.responsibilities.join('\n') : (m.responsibilities || '')
                            }
                          })}
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
                          onClick={() => handleDeleteMemberClick(m)}
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

      {/* TAB CONTENT: EVENT (DENGAN TANGGAL MULAI & BERAKHIR) */}
      {activeTab === 'events' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Tambah Event Baru
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
                Nama Event <span style={{ color: '#f43f5e' }}>*</span>
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
                Periode Kepengurusan *
              </label>
              <select
                value={eventTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setEventTenureId(e.target.value);
                  setEventDivId('');
                  clearFieldError('eventDivId');
                }}
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
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                ))}
              </select>
            </div>

            {(() => {
              const availableDivsForEvent = divisions.filter(d => d.tenureId === (eventTenureId || activeTenure?.id));
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penyelenggara <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={eventDivId}
                    onChange={(e) => {
                      setEventDivId(e.target.value);
                      clearFieldError('eventDivId');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: `1.5px solid ${formErrors.eventDivId ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForEvent.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi Penyelenggara * --</option>
                        {availableDivsForEvent.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {availableDivsForEvent.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                  {renderFieldError('eventDivId')}
                </div>
              );
            })()}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📅 Tanggal & Jam Mulai (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(eventStartDate)}
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
                📅 Tanggal & Jam Berakhir (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(eventEndDate)}
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
                Target Peserta / KPI
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

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                💰 Estimasi Total RAB (Rp) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Contoh: 15000000 (tanpa titik)"
                value={eventRab}
                onChange={(e) => {
                  setEventRab(e.target.value);
                  clearFieldError('eventRab');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventRab ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('eventRab')}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                🏷️ Kategori Kegiatan
              </label>
              <input
                type="text"
                list="event-category-list"
                placeholder="Pilih atau ketik kategori..."
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
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
              <datalist id="event-category-list">
                <option value="Program Budaya" />
                <option value="Workshop & Sharing Session" />
                <option value="Social & Engagement" />
                <option value="Olahraga & Well-being" />
                <option value="Kompetisi & Inovasi" />
                <option value="Apresiasi & Rekognisi" />
                <option value="Townhall & Perayaan" />
              </datalist>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Status Pelaksanaan
              </label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
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
                <option value="Upcoming">Upcoming (Akan Datang)</option>
                <option value="Ongoing">Ongoing (Sedang Berjalan)</option>
                <option value="Completed">Completed (Selesai)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Deskripsi Event <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan tujuan dan gambaran pelaksanaan event..."
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
                <span>Simpan Event Baru</span>
              </button>
            </div>
          </form>

          {/* List Event */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
              Daftar Event Aktif ({events.length})
            </h4>

            {(() => {
              const ADMIN_EVENTS_PER_PAGE = 8;
              const totalAdminEventPages = Math.ceil(events.length / ADMIN_EVENTS_PER_PAGE) || 1;
              const safeAdminEventPage = Math.min(Math.max(1, adminEventPage), totalAdminEventPages);
              const paginatedAdminEvents = events.slice(
                (safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE,
                safeAdminEventPage * ADMIN_EVENTS_PER_PAGE
              );

              if (events.length === 0) {
                return (
                  <div style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Calendar size={32} color="var(--text-dim)" />
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Belum ada event yang ditambahkan.
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Gunakan formulir di atas untuk menambahkan event baru.
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                    {paginatedAdminEvents.map((evt) => {
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: divObj?.color || 'var(--mandiri-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                                {evt.divisionName || divObj?.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {(evt.category || evt.badge) && (
                                  <span className="badge-cyan" style={{ fontSize: '0.64rem', padding: '2px 8px' }}>
                                    {evt.category || evt.badge}
                                  </span>
                                )}
                                <span className="badge-gold" style={{ fontSize: '0.66rem' }}>
                                  {evt.status}
                                </span>
                              </div>
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>
                              {evt.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                              📅 {formatWibEventRange(evt.startDate, evt.endDate, evt.date)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                              <span>📍 {evt.location}</span>
                              <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                                💰 Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingItem({ type: 'event', item: { ...evt } })}
                              title="Edit Event"
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

                            {onDeleteEvent && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEventClick(evt)}
                                title="Hapus Event"
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
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalAdminEventPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE + 1} - {Math.min(safeAdminEventPage * ADMIN_EVENTS_PER_PAGE, events.length)}</strong> dari <strong>{events.length}</strong> event
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminEventPage === 1}
                          onClick={() => setAdminEventPage(p => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminEventPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminEventPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminEventPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminEventPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminEventPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminEventPage(pg)}
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
                          disabled={safeAdminEventPage === totalAdminEventPages}
                          onClick={() => setAdminEventPage(p => Math.min(totalAdminEventPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminEventPage === totalAdminEventPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminEventPage === totalAdminEventPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminEventPage === totalAdminEventPages ? 0.45 : 1
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

          {/* Daftar Hadir & Konfirmasi RSVP Kegiatan (public.event_rsvps) */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  📋 Daftar Hadir & Konfirmasi RSVP Kegiatan ({eventRsvps.length})
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Data kehadiran pegawai yang mengisi form RSVP Cepat pada kartu Event.
                </p>
              </div>

              {eventRsvps.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const header = ['ID RSVP', 'ID Event', 'Nama Kegiatan', 'Nama Peserta', 'Departemen', 'Mode Kehadiran', 'Catatan', 'Waktu Konfirmasi'].map(escapeCsv).join(',');
                    const rows = eventRsvps.map(r => {
                      const deptObj = departments.find(d => d.id === r.departmentId || d.id === r.department || (d.name && d.name === r.department));
                      const deptName = deptObj ? deptObj.name : (r.department || r.squadUnit || '-');
                      return [
                        r.id,
                        r.eventId,
                        events.find(e => e.id === r.eventId)?.title || r.eventTitle || 'Kegiatan',
                        r.attendeeName,
                        deptName,
                        r.attendanceMode,
                        r.notes || '',
                        formatWibTimestamp(r.createdAt || r.submittedAt).exact || r.submittedAt || r.createdAt || ''
                      ].map(escapeCsv).join(',');
                    });
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

            {(() => {
              const ADMIN_RSVPS_PER_PAGE = 10;
              const totalAdminRsvpPages = Math.ceil(eventRsvps.length / ADMIN_RSVPS_PER_PAGE) || 1;
              const safeAdminRsvpPage = Math.min(Math.max(1, adminRsvpPage), totalAdminRsvpPages);
              const paginatedAdminRsvps = eventRsvps.slice(
                (safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE,
                safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE
              );

              if (eventRsvps.length === 0) {
                return (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    Belum ada konfirmasi kehadiran RSVP pada event.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {paginatedAdminRsvps.map((rsvp) => {
                      const deptObj = departments.find(d => d.id === rsvp.departmentId || d.id === rsvp.department || (d.name && d.name === rsvp.department));
                      const deptName = deptObj ? deptObj.name : (rsvp.department || rsvp.squadUnit || '-');

                      return (
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
                              {events.find(e => e.id === rsvp.eventId)?.title || rsvp.eventTitle || 'Kegiatan'}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {rsvp.attendeeName} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>• {deptName}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {rsvp.attendanceMode} {rsvp.notes ? `• "${rsvp.notes}"` : ''} • {formatWibTimestamp(rsvp.submittedAt || rsvp.createdAt).exact || rsvp.submittedAt}
                            </div>
                          </div>

                          {onDeleteEventRsvp && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({
                                type: 'event_rsvp',
                                id: rsvp.id,
                                name: `Data RSVP "${rsvp.attendeeName}" (${deptName})`
                              })}
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
                            title="Hapus konfirmasi kehadiran RSVP ini"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {totalAdminRsvpPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE + 1} - {Math.min(safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE, eventRsvps.length)}</strong> dari <strong>{eventRsvps.length}</strong> data RSVP
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminRsvpPage === 1}
                          onClick={() => setAdminRsvpPage(p => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminRsvpPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminRsvpPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminRsvpPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminRsvpPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminRsvpPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminRsvpPage(pg)}
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
                          disabled={safeAdminRsvpPage === totalAdminRsvpPages}
                          onClick={() => setAdminRsvpPage(p => Math.min(totalAdminRsvpPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminRsvpPage === totalAdminRsvpPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminRsvpPage === totalAdminRsvpPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminRsvpPage === totalAdminRsvpPages ? 0.45 : 1
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

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 Format & Waktu Pelaksanaan
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'date', label: 'Tanggal Lengkap' },
                    { id: 'range', label: 'Rentang Tanggal' },
                    { id: 'month', label: 'Bulan & Tahun' },
                    { id: 'year', label: 'Tahun Saja' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGalDateMode(m.id)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '5px',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: galDateMode === m.id ? 'var(--mandiri-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: galDateMode === m.id ? '#040914' : 'var(--text-muted)',
                        borderColor: galDateMode === m.id ? 'var(--mandiri-gold)' : 'var(--border-card)'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on galDateMode */}
              {galDateMode === 'date' && (
                <input
                  type="date"
                  value={galDateVal}
                  onChange={(e) => setGalDateVal(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {galDateMode === 'range' && (
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Mulai</span>
                    <input
                      type="date"
                      value={galStartDate}
                      onChange={(e) => setGalStartDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Selesai</span>
                    <input
                      type="date"
                      value={galEndDate}
                      onChange={(e) => setGalEndDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}

              {galDateMode === 'month' && (
                <input
                  type="month"
                  value={galMonth}
                  onChange={(e) => setGalMonth(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {galDateMode === 'year' && (
                <input
                  type="number"
                  min="2000"
                  max="2099"
                  placeholder="Contoh: 2026"
                  value={galYear}
                  onChange={(e) => setGalYear(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              )}

              {/* Live Preview Pill */}
              <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👁️ Tampilan di Web:</span>
                <strong style={{ color: '#fff', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {formatWibDateTime(buildFlexibleDate(galDateMode, { date: galDateVal, startDate: galStartDate, endDate: galEndDate, month: galMonth, year: galYear }))}
                </strong>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Periode Kepengurusan *
              </label>
              <select
                value={galTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setGalTenureId(e.target.value);
                  setGalDivision('');
                }}
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
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                ))}
              </select>
            </div>

            {(() => {
              const availableDivsForGal = divisions.filter(d => d.tenureId === (galTenureId || activeTenure?.id));
              const currentGalDivId = galDivisionId || availableDivsForGal.find(d => d.name === galDivision)?.id || '';
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penyelenggara
                  </label>
                  <select
                    value={currentGalDivId}
                    onChange={(e) => {
                      const divId = e.target.value;
                      setGalDivisionId(divId);
                      const found = availableDivsForGal.find(d => d.id === divId);
                      if (found) setGalDivision(found.name);
                    }}
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
                    {availableDivsForGal.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi Penyelenggara --</option>
                        {availableDivsForGal.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {availableDivsForGal.length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                      ⚠️ <strong>Divisi masih kosong</strong> pada periode kepengurusan ini. Silakan buat divisi baru terlebih dahulu di tab <strong>Divisi</strong>.
                    </div>
                  )}
                </div>
              );
            })()}

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
                Foto Dokumentasi Kegiatan (Wajib salah satu: Unggah File ATAU Masukkan Link Foto) <span style={{ color: '#f43f5e' }}>*</span>
              </label>

              {/* File upload input */}
              <div style={{
                border: `2px dashed ${formErrors.galPhotos && pendingGalFiles.length === 0 ? '#f43f5e' : 'var(--border-card)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                background: formErrors.galPhotos && pendingGalFiles.length === 0 ? 'rgba(244, 63, 94, 0.04)' : 'var(--input-bg)',
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
                  Opsi A: Unggah file foto dari komputer (bisa pilih banyak sekaligus: JPG, PNG, WebP)
                </div>
              </div>

              {renderFieldError('galPhotos')}

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
                Opsi B: Masukkan Link Foto Web (wajib jika tidak mengunggah file foto dari komputer):
              </label>
              <textarea
                rows={2}
                placeholder="https://...link-foto-1.jpg&#10;https://...link-foto-2.png"
                value={galPhotos}
                onChange={(e) => {
                  setGalPhotos(e.target.value);
                  if (formErrors.galPhotos && e.target.value.trim()) {
                    setFormErrors(prev => ({ ...prev, galPhotos: null }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1px solid ${formErrors.galPhotos && pendingGalFiles.length === 0 ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                * Sistem akan otomatis memverifikasi tautan untuk memastikan URL mengarah ke file gambar yang aktif sebelum disimpan.
              </div>
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
            {(() => {
              const ADMIN_GALLERY_PER_PAGE = 8;
              const totalAdminGalleryPages = Math.ceil(galleries.length / ADMIN_GALLERY_PER_PAGE) || 1;
              const safeAdminGalleryPage = Math.min(Math.max(1, adminGalleryPage), totalAdminGalleryPages);
              const paginatedAdminGalleries = galleries.slice(
                (safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE,
                safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE
              );

              if (galleries.length === 0) {
                return (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    Belum ada arsip dokumentasi galeri.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {paginatedAdminGalleries.map((gal) => (
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
                          {(() => {
                            const divObj = divisions.find(d => d.id === gal.divisionId);
                            const displayDiv = divObj?.name || gal.divisionName || gal.division || 'Umum';
                            return `${formatWibDateTime(gal.date)} • ${displayDiv} • ${gal.photos?.length || 0} Foto`;
                          })()}
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

                  {totalAdminGalleryPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      marginTop: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE + 1} - {Math.min(safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE, galleries.length)}</strong> dari <strong>{galleries.length}</strong> galeri
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminGalleryPage === 1}
                          onClick={() => setAdminGalleryPage(p => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminGalleryPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminGalleryPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminGalleryPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminGalleryPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminGalleryPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminGalleryPage(pg)}
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
                          disabled={safeAdminGalleryPage === totalAdminGalleryPages}
                          onClick={() => setAdminGalleryPage(p => Math.min(totalAdminGalleryPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminGalleryPage === totalAdminGalleryPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminGalleryPage === totalAdminGalleryPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminGalleryPage === totalAdminGalleryPages ? 0.45 : 1
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
      )}

      {/* TAB CONTENT: MANAJEMEN DEPARTEMEN IT APD */}
      {activeTab === 'departments' && (() => {
        const DEPTS_PER_PAGE = 10;
        const filteredDepts = (departments || []).filter(d =>
          (d.name || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
          (d.code || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
          (d.description || '').toLowerCase().includes(deptSearchQuery.toLowerCase())
        );
        const totalDeptPages = Math.ceil(filteredDepts.length / DEPTS_PER_PAGE) || 1;
        const safeDeptPage = Math.min(Math.max(1, deptPage), totalDeptPages);
        const paginatedDepts = filteredDepts.slice(
          (safeDeptPage - 1) * DEPTS_PER_PAGE,
          safeDeptPage * DEPTS_PER_PAGE
        );

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Manajemen Departemen IT APD ({departments.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Kelola daftar departemen/unit kerja di lingkungan IT Application Delivery sebagai pilihan resmi saat pendaftaran RSVP kegiatan.
              </p>
            </div>

            {/* Form Tambah Departemen Baru */}
            <form onSubmit={handleCreateDepartment} noValidate className="admin-form-two-col" style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nama Departemen <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Core Banking Delivery"
                  value={newDeptName}
                  onChange={(e) => {
                    setNewDeptName(e.target.value);
                    clearFieldError('newDeptName');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.newDeptName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('newDeptName')}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kode / Singkatan Departemen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: CBD"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Deskripsi / Tanggung Jawab Departemen
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan peran departemen..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
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
                    padding: '9px 20px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Tambahkan Departemen Baru</span>
                </button>
              </div>
            </form>

            {/* Search, Filter & Export CSV Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              borderTop: '1px solid var(--border-card)',
              paddingTop: '20px'
            }}>
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari nama atau kode departemen..."
                  value={deptSearchQuery}
                  onChange={(e) => {
                    setDeptSearchQuery(e.target.value);
                    setDeptPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {departments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const header = ['ID Departemen', 'Nama Departemen', 'Kode', 'Deskripsi', 'Jumlah RSVP Terkait'].map(escapeCsv).join(',');
                    const rows = departments.map(d => {
                      const rsvpCount = (eventRsvps || []).filter(
                        r => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
                      ).length;
                      return [d.id, d.name, d.code || '', d.description || '', rsvpCount].map(escapeCsv).join(',');
                    });
                    const csvString = '\uFEFF' + [header, ...rows].join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `daftar_departemen_cnt_it_apd_${Date.now()}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh data departemen ke CSV!`);
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
                  <span>Export CSV Departemen</span>
                </button>
              )}
            </div>

            {/* List Departemen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paginatedDepts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Tidak ada departemen yang cocok dengan pencarian "{deptSearchQuery}".
                </div>
              ) : (
                paginatedDepts.map((d) => {
                  const rsvpCount = (eventRsvps || []).filter(
                    r => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
                  ).length;
                  const isSafeToDelete = rsvpCount === 0;

                  return (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-card)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.name}</strong>
                          {d.code && (
                            <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              {d.code}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: rsvpCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.05)',
                              color: rsvpCount > 0 ? 'var(--neon-cyan)' : 'var(--text-dim)',
                              border: rsvpCount > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-card)',
                              fontWeight: 700
                            }}
                          >
                            👥 {rsvpCount} RSVP Terkait
                          </span>
                        </div>
                        {d.description && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {d.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            type: 'department',
                            item: { ...d }
                          })}
                          title="Edit Data Departemen"
                          style={{
                            padding: '7px',
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
                          onClick={() => {
                            if (!isSafeToDelete) {
                              showToast(
                                `Departemen "${d.name}" tidak dapat dihapus karena masih digunakan oleh ${rsvpCount} data RSVP. Hapus data RSVP terkait terlebih dahulu.`,
                                'error'
                              );
                              return;
                            }
                            handleDeleteDepartmentClick(d);
                          }}
                          title={isSafeToDelete ? 'Hapus Departemen' : `Tidak dapat dihapus: masih memiliki ${rsvpCount} RSVP`}
                          style={{
                            padding: '7px',
                            background: isSafeToDelete ? 'rgba(244, 63, 94, 0.1)' : 'rgba(148, 163, 184, 0.08)',
                            border: isSafeToDelete ? '1px solid #f43f5e' : '1px solid var(--border-card)',
                            color: isSafeToDelete ? '#f43f5e' : 'var(--text-dim)',
                            borderRadius: '6px',
                            cursor: isSafeToDelete ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isSafeToDelete ? 1 : 0.45
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalDeptPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-card)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Menampilkan <strong>{(safeDeptPage - 1) * DEPTS_PER_PAGE + 1} - {Math.min(safeDeptPage * DEPTS_PER_PAGE, filteredDepts.length)}</strong> dari <strong>{filteredDepts.length}</strong> departemen
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeDeptPage === 1}
                    onClick={() => setDeptPage(p => Math.max(1, p - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeDeptPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: safeDeptPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: safeDeptPage === 1 ? 0.45 : 1
                    }}
                  >
                    <span>Sebelumnya</span>
                  </button>

                  {Array.from({ length: totalDeptPages }, (_, i) => i + 1).map((pg) => {
                    const isActive = pg === safeDeptPage;
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setDeptPage(pg)}
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
                    disabled={safeDeptPage === totalDeptPages}
                    onClick={() => setDeptPage(p => Math.min(totalDeptPages, p + 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeDeptPage === totalDeptPages ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: safeDeptPage === totalDeptPages ? 'not-allowed' : 'pointer',
                      opacity: safeDeptPage === totalDeptPages ? 0.45 : 1
                    }}
                  >
                    <span>Selanjutnya</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
                Nama Pimpro / PIC Divisi (Kategori Pimpro)
              </label>
              {(() => {
                const targetDivTenure = newDivTenureId || activeTenure?.id;
                const availablePimpros = (members || []).filter(m =>
                  (m.category || '').toLowerCase() === 'pimpro' &&
                  (!m.tenureId || m.tenureId === targetDivTenure)
                );
                return (
                  <div>
                    <select
                      value={newDivMemberId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setNewDivMemberId(selId);
                        const selMem = members.find(m => m.id === selId);
                        setNewDivLead(selMem ? selMem.name : '');
                      }}
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
                      <option value="">-- Pilih Pimpro (Opsional / Ditentukan Nanti) --</option>
                      {availablePimpros.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.role ? `(${m.role})` : ''}
                        </option>
                      ))}
                    </select>
                    {availablePimpros.length === 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                        Belum ada anggota dengan kategori Pimpro pada periode kepengurusan ini.
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Periode Kepengurusan *
              </label>
              <select
                value={newDivTenureId || activeTenure?.id || ''}
                onChange={(e) => {
                  setNewDivTenureId(e.target.value);
                  setNewDivMemberId('');
                  setNewDivLead('');
                }}
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
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                ))}
              </select>
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
                      Pimpro: {
                        members.find(m => m.id === d.memberId)?.name ||
                        members.find(m => (m.category || '').toLowerCase() === 'pimpro' && m.divisionId === d.id)?.name ||
                        d.leadName ||
                        'Belum ditentukan'
                      }
                    </span>
                    {d.tenureId && (
                      <span className="badge-gold" style={{ fontSize: '0.68rem', marginLeft: '8px', padding: '2px 8px' }}>
                        {tenures.find(t => t.id === d.tenureId)?.code || d.tenureId}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateDivision) {
                          const nextStatus = !Boolean(d.isRecruiting);
                          onUpdateDivision({ ...d, isRecruiting: nextStatus });
                          showToast(`Status rekrutmen "${d.name}" diubah menjadi: ${nextStatus ? 'Rekrutmen Buka' : 'Rekrutmen Tutup'}`);
                        }
                      }}
                      title="Klik untuk membuka atau menutup status rekrutmen divisi ini di web"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: Boolean(d.isRecruiting) ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)',
                        color: Boolean(d.isRecruiting) ? '#10b981' : 'var(--text-muted)',
                        border: Boolean(d.isRecruiting) ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-card)'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: Boolean(d.isRecruiting) ? '#10b981' : 'var(--text-muted)' }} />
                      <span>{Boolean(d.isRecruiting) ? '● Rekrutmen Buka' : '○ Rekrutmen Tutup'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingItem({
                        type: 'division',
                        item: {
                          ...d,
                          rawFocusAreas: Array.isArray(d.focusAreas) ? d.focusAreas.join(', ') : (d.focusAreas || '')
                        }
                      })}
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
                      onClick={() => handleDeleteDivisionClick(d)}
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
                  <span className={activeTenure?.id === t.id ? "badge-gold" : "badge-cyan"}>
                    {activeTenure?.id === t.id ? 'Periode Aktif' : 'Arsip'}
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
                    onClick={() => setEditingItem({
                      type: 'tenure',
                      item: {
                        ...t,
                        rawMisi: Array.isArray(t.misi) ? t.misi.join('\n') : (t.misi || '')
                      }
                    })}
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
                    onClick={() => handleDeleteTenureClick(t)}
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

              const targetTenureId = newFormTenureId || activeTenure?.id || tenures[0]?.id || '';
              const newForm = {
                id: 'form-' + Date.now(),
                title: newFormTitle.trim(),
                subtitle: newFormSubtitle.trim() || 'Silakan lengkapi formulir di bawah ini.',
                category: newFormCategory,
                deadline: newFormDeadline.trim() || 'Menyesuaikan',
                isOpen: true,
                requiresTracking: newFormRequiresTracking,
                tenureId: targetTenureId,
                fields: newFormRequiresTracking ? [
                  { id: 'f-name', label: 'Nama Lengkap (HCM Mandiri)', type: 'text', placeholder: 'Nama sesuai HCM Mandiri', required: true, isSearchIndex: false },
                  { id: 'f-nip', label: 'NIP / Employee ID', type: 'text', placeholder: 'NIP Mandiri', required: true, isSearchIndex: true },
                  { id: 'f-squad', label: 'Departemen', type: 'select', source: 'departments', required: true, isSearchIndex: false },
                  { id: 'f-wa', label: 'Nomor WhatsApp Aktif', type: 'text', placeholder: '0812xxxxxxxx', required: true, isSearchIndex: false },
                  { id: 'f-divisi', label: 'Pilihan Divisi Terkait', type: 'select', source: 'divisions', required: true, isSearchIndex: false },
                  { id: 'f-notes', label: 'Catatan / Alasan Pendaftaran', type: 'textarea', placeholder: 'Tuliskan keterangan pendukung...', required: true, isSearchIndex: false },
                  { id: 'f-doc', label: 'Upload Dokumen / File Pendukung', type: 'file', accept: '.pdf,.png,.jpg,.jpeg', required: false, isSearchIndex: false }
                ] : [
                  { id: 'f-name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama pengisi formulir', required: true, isSearchIndex: false },
                  { id: 'f-unit', label: 'Departemen', type: 'select', source: 'departments', required: true, isSearchIndex: false },
                  { id: 'f-feedback', label: 'Tanggapan / Isian', type: 'textarea', placeholder: 'Tuliskan respon Anda...', required: true, isSearchIndex: false }
                ]
              };

              if (onAddForm) onAddForm(newForm);
              setNewFormTitle('');
              setNewFormSubtitle('');
              setNewFormDeadline('');
              setNewFormRequiresTracking(true);
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
                📅 Periode Kepengurusan (Tenure) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={newFormTenureId || activeTenure?.id || tenures[0]?.id || ''}
                onChange={(e) => setNewFormTenureId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title || `Kepengurusan CNT ${t.code}`} {t.id === activeTenure?.id ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
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
                📅 Batas Akhir / Deadline Pendaftaran (WIB)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="datetime-local"
                    step="1"
                    value={toDatetimeLocalSecondsValue(newFormDeadline)}
                    onChange={(e) => {
                      setNewFormDeadline(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  />
                  <Calendar 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--mandiri-gold)',
                      pointerEvents: 'none' 
                    }} 
                  />
                </div>
                {newFormDeadline && (
                  <button
                    type="button"
                    onClick={() => setNewFormDeadline('')}
                    title="Hapus deadline / Tanpa batas waktu"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', marginTop: '4px', fontWeight: 600 }}>
                {newFormDeadline ? `Tampilan di Web: ${formatDeadlineWib(newFormDeadline)}` : 'Pilih tanggal & waktu deadline'}
              </div>
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

            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormRequiresTracking ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormRequiresTracking}
                  onChange={(e) => setNewFormRequiresTracking(e.target.checked)}
                />
                <span>Memerlukan Responden untuk Tracking Progres (Status Seleksi / Pendaftaran)</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormRequiresTracking
                  ? 'Aktif: Responden akan diberikan ID Pendaftaran & dapat memantau status di website melalui Indeks Pencarian atau ID Pendaftaran.'
                  : 'Nonaktif: Formulir reguler (kuesioner, absensi, survei) tanpa pelacakan status. Himbauan tracking & card pencarian tidak akan dimunculkan.'}
              </span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{f.category || 'Formulir'}</span>
                      {(() => {
                        const formTenure = tenures.find(t => t.id === f.tenureId);
                        if (formTenure) {
                          return (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                              📅 {formTenure.code || formTenure.title}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.96rem' }}>{f.title}</strong>
                      {f.requiresTracking !== false ? (
                        <span className="badge-gold" style={{ fontSize: '0.65rem' }}>🎯 Tracking Aktif</span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: '4px' }}>📋 Form Reguler</span>
                      )}
                      {(() => {
                        const dl = getDeadlineStatus(f.deadline);
                        if (dl.isExpired) {
                          return <span className="badge-red" style={{ fontSize: '0.65rem' }}>Expired (Lewat Batas)</span>;
                        }
                        if (dl.isToday) {
                          return <span className="badge-gold" style={{ fontSize: '0.65rem' }}>⚠️ Hari Terakhir!</span>;
                        }
                        return null;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Deadline: {f.deadline ? formatDeadlineWib(f.deadline) : 'Tanpa batas waktu'} • {f.fields?.length || 0} Pertanyaan • <strong>{subCount} Data Pengisian</strong>
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
                      onClick={() => handleDeleteFormClick(f)}
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

      {/* TAB CONTENT: SUBMISSIONS (DATA PENGISIAN FORM DINAMIS PER FORM + SELEKSI STATUS & 1-CLICK WA) */}
      {activeTab === 'submissions' && (() => {
        const statusMeta = {
          Submitted: { label: 'Baru Masuk', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)' },
          Reviewed: { label: 'Direview', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
          Interview: { label: 'Wawancara', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
          Accepted: { label: 'Diterima ✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)' },
          Rejected: { label: 'Ditolak / Arsip', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' }
        };

        const resolveFormTitle = (sub) => {
          if (!sub) return 'Formulir';
          const matched = forms.find(f => f.id === sub.formId);
          return matched?.title || sub.formTitle || 'Formulir';
        };

        const filteredSubmissions = submissions.filter(s => {
          const matchesForm = selectedSubFilter === 'all' || s.formId === selectedSubFilter;
          const currentStat = s.status || 'Submitted';
          const matchesStatus = subStatusFilter === 'all' || currentStat === subStatusFilter;
          const q = subSearchQuery.trim().toLowerCase();
          const dataString = JSON.stringify(s.data || {}).toLowerCase();
          const formTitleStr = resolveFormTitle(s).toLowerCase();
          const matchesSearch = !q ||
            dataString.includes(q) ||
            formTitleStr.includes(q) ||
            (s.adminNotes || '').toLowerCase().includes(q);
          return matchesForm && matchesStatus && matchesSearch;
        });

        const SUBS_PER_PAGE = 3;
        const totalSubPages = Math.ceil(filteredSubmissions.length / SUBS_PER_PAGE) || 1;
        const safeSubPage = Math.min(Math.max(1, subCurrentPage), totalSubPages);
        const paginatedSubmissions = filteredSubmissions.slice(
          (safeSubPage - 1) * SUBS_PER_PAGE,
          safeSubPage * SUBS_PER_PAGE
        );

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
                  Data Pengisian Form ({filteredSubmissions.length} dari {submissions.length + applications.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Kelola data respon pengisian formulir pendaftar, ubah status seleksi, tambahkan catatan, hubungi via WhatsApp 1-klik, atau unduh laporan CSV.
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
                    onChange={(e) => {
                      setSubSearchQuery(e.target.value);
                      setSubCurrentPage(1);
                    }}
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
                  onChange={(e) => {
                    setSelectedSubFilter(e.target.value);
                    setSubCurrentPage(1);
                  }}
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
                      showToast('Tidak ada data pengisian untuk diexport.', 'error');
                      return;
                    }

                    const dynamicKeys = Array.from(
                      new Set(
                        itemsToExport.flatMap(s => s.data ? Object.keys(s.data) : ['fullName', 'nip', 'unitSquad', 'div1', 'div2', 'whatsapp', 'email', 'motivation'])
                      )
                    );

                    const getCsvHeaderLabel = (k) => {
                      for (const f of forms) {
                        const m = f.fields?.find(fld => fld.id === k || fld.id === `f-${k}`);
                        if (m?.label) return m.label;
                      }
                      return k.replace(/^f-/, '').toUpperCase();
                    };

                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const headerRow = ['ID Berkas', 'Judul Formulir', 'Status Seleksi', 'Catatan Admin', 'Waktu Submit', ...dynamicKeys.map(getCsvHeaderLabel), 'Lampiran File'].map(escapeCsv).join(',');

                    const dataRows = itemsToExport.map(s => {
                      const baseCols = [
                        s.id,
                        resolveFormTitle(s),
                        s.status || 'Submitted',
                        s.adminNotes || '',
                        formatWibTimestamp(s.createdAt || s.submittedAt).exact || s.submittedAt || s.createdAt || ''
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
                    link.setAttribute("download", `data_pengisian_form_cnt_it_apd_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh ${itemsToExport.length} data pengisian ke CSV!`);
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
                    onClick={() => {
                      setSubStatusFilter(st.id);
                      setSubCurrentPage(1);
                    }}
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
                Tidak ada data pengisian formulir yang sesuai dengan filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {paginatedSubmissions.map((sub) => {
                  const curStatus = sub.status || 'Submitted';
                  const stInfo = statusMeta[curStatus] || statusMeta.Submitted;
                  const applicantName = extractApplicantName(sub);
                  const applicantWa = extractApplicantPhone(sub.data);
                  const formTitle = resolveFormTitle(sub);
                  const waMessage = encodeURIComponent(
                    `Halo ${applicantName}, kami dari Pengurus Culture Network Team (CNT) IT APD Bank Mandiri ingin menindaklanjuti pendaftaran Anda pada "${formTitle}".`
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
                          <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>{formTitle}</span>
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
                            • {formatWibTimestamp(sub.submittedAt || sub.createdAt).exact || sub.submittedAt}
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
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                        background: 'var(--input-bg)',
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}>
                        {(() => {
                          const parentForm = forms.find(f => f.id === sub.formId);
                          const schemaFields = parentForm?.fields || [];

                          const getLabel = (k) => {
                            const match = schemaFields.find(f => f.id === k || f.id === `f-${k}`);
                            if (match?.label) return match.label;
                            for (const f of forms) {
                              const m = f.fields?.find(fld => fld.id === k || fld.id === `f-${k}`);
                              if (m?.label) return m.label;
                            }
                            return k.replace(/^f-/, '').replace(/([A-Z])/g, ' $1').trim();
                          };

                          const dataKeys = Object.keys(sub.data || {});
                          const orderedKeys = [
                            ...schemaFields.map(f => f.id).filter(id => dataKeys.includes(id)),
                            ...dataKeys.filter(k => !schemaFields.some(f => f.id === k))
                          ];

                          return orderedKeys.map((key) => {
                            const val = sub.data?.[key];
                            if (val === undefined || val === null || val === '') return null;
                            const label = getLabel(key);
                            return (
                              <div key={key} style={{ wordBreak: 'break-word', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '3px' }}>
                                  {label}
                                </span>
                                <strong style={{ color: 'var(--text-main)', fontSize: '0.84rem', lineHeight: 1.4 }}>
                                  {typeof val === 'object' && val !== null ? (val.name || JSON.stringify(val)) : String(val)}
                                </strong>
                              </div>
                            );
                          });
                        })()}
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

            {/* Pagination Controls */}
            {totalSubPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-card)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Menampilkan <strong>{(safeSubPage - 1) * SUBS_PER_PAGE + 1} - {Math.min(safeSubPage * SUBS_PER_PAGE, filteredSubmissions.length)}</strong> dari <strong>{filteredSubmissions.length}</strong> data pengisian
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeSubPage === 1}
                    onClick={() => setSubCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeSubPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: safeSubPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: safeSubPage === 1 ? 0.45 : 1
                    }}
                  >
                    ← Sebelumnya
                  </button>

                  {Array.from({ length: totalSubPages }, (_, i) => i + 1).map((pg) => {
                    if (
                      pg === 1 || 
                      pg === totalSubPages || 
                      (pg >= safeSubPage - 1 && pg <= safeSubPage + 1)
                    ) {
                      const isActive = pg === safeSubPage;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setSubCurrentPage(pg)}
                          style={{
                            minWidth: '32px',
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                            color: isActive ? '#040914' : 'var(--text-main)',
                            border: isActive ? 'none' : '1px solid var(--border-card)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {pg}
                        </button>
                      );
                    }
                    if (pg === safeSubPage - 2 || pg === safeSubPage + 2) {
                      return <span key={pg} style={{ color: 'var(--text-dim)', fontSize: '0.8rem', padding: '0 2px' }}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={safeSubPage === totalSubPages}
                    onClick={() => setSubCurrentPage(prev => Math.min(totalSubPages, prev + 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeSubPage === totalSubPages ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: safeSubPage === totalSubPages ? 'not-allowed' : 'pointer',
                      opacity: safeSubPage === totalSubPages ? 0.45 : 1
                    }}
                  >
                    Selanjutnya →
                  </button>
                </div>
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
                    formatWibTimestamp(k.createdAt || k.created_at || k.exactTimestamp).full
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

          {(() => {
            const ADMIN_KUDOS_PER_PAGE = 10;
            const totalAdminKudosPages = Math.ceil(kudosList.length / ADMIN_KUDOS_PER_PAGE) || 1;
            const safeAdminKudosPage = Math.min(Math.max(1, adminKudosPage), totalAdminKudosPages);
            const paginatedAdminKudos = kudosList.slice(
              (safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE,
              safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE
            );

            if (kudosList.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  Belum ada kiriman apresiasi di Wall of Kudos.
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {paginatedAdminKudos.map((kudos) => (
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
                        <span>⏱️ {formatWibTimestamp(kudos.createdAt || kudos.created_at || kudos.exactTimestamp).full}</span>
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

                {totalAdminKudosPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE + 1} - {Math.min(safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE, kudosList.length)}</strong> dari <strong>{kudosList.length}</strong> apresiasi
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminKudosPage === 1}
                        onClick={() => setAdminKudosPage(p => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminKudosPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminKudosPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminKudosPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminKudosPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminKudosPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminKudosPage(pg)}
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
                        disabled={safeAdminKudosPage === totalAdminKudosPages}
                        onClick={() => setAdminKudosPage(p => Math.min(totalAdminKudosPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminKudosPage === totalAdminKudosPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminKudosPage === totalAdminKudosPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminKudosPage === totalAdminKudosPages ? 0.45 : 1
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
                      formatWibTimestamp(a.createdAt || a.submittedAt).exact || a.submittedAt || a.createdAt || ''
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

            {(() => {
              const ADMIN_ASPIRASI_PER_PAGE = 10;
              const totalAdminAspirasiPages = Math.ceil(aspirasiList.length / ADMIN_ASPIRASI_PER_PAGE) || 1;
              const safeAdminAspirasiPage = Math.min(Math.max(1, adminAspirasiPage), totalAdminAspirasiPages);
              const paginatedAdminAspirasi = aspirasiList.slice(
                (safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE,
                safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE
              );

              if (aspirasiList.length === 0) {
                return (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    Belum ada kiriman ide atau aspirasi program budaya dari pengunjung.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {paginatedAdminAspirasi.map((asp) => {
                    const curStatus = asp.status || 'Menunggu Review';
                    const isPub = asp.isPublic !== false;
                    const statusColor = curStatus === 'Sudah Direalisasikan'
                      ? '#10b981'
                      : (curStatus === 'Masuk Rencana Event' || curStatus === 'Masuk Rencana Proker')
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
                                • 📅 {formatWibTimestamp(asp.submittedAt || asp.createdAt).exact || asp.submittedAt}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.96rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
                              {asp.title || asp.description}
                            </div>
                            {asp.description && asp.description !== asp.title && (
                              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {asp.description}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <select
                              value={curStatus === 'Masuk Rencana Proker' ? 'Masuk Rencana Event' : curStatus}
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
                              <option value="Masuk Rencana Event">🚀 Masuk Rencana Event</option>
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
                                onClick={() => setDeleteConfirm({
                                  type: 'aspirasi',
                                  id: asp.id,
                                  name: `Aspirasi "${asp.title || asp.description || 'Kotak Saran'}" dari ${asp.sender || 'Anonim'}`
                                })}
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
                                title="Hapus aspirasi ini secara permanen"
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

                  {totalAdminAspirasiPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      marginTop: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE + 1} - {Math.min(safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE, aspirasiList.length)}</strong> dari <strong>{aspirasiList.length}</strong> aspirasi
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminAspirasiPage === 1}
                          onClick={() => setAdminAspirasiPage(p => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminAspirasiPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminAspirasiPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminAspirasiPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminAspirasiPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminAspirasiPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminAspirasiPage(pg)}
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
                          disabled={safeAdminAspirasiPage === totalAdminAspirasiPages}
                          onClick={() => setAdminAspirasiPage(p => Math.min(totalAdminAspirasiPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminAspirasiPage === totalAdminAspirasiPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminAspirasiPage === totalAdminAspirasiPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminAspirasiPage === totalAdminAspirasiPages ? 0.45 : 1
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
      )}

      {/* TAB CONTENT: BRAND ASSETS & TEMPLATES MANAGEMENT */}
      {activeTab === 'assets' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Kelola Katalog Asset CNT IT APD ({brandAssets.length})
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              Unggah file logo, template PowerPoint Townhall, Virtual Background MS Teams/Zoom, atau dokumen panduan brand langsung ke Supabase Storage agar dapat diunduh di halaman Asset.
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
                Label Kategori Tambahan / Tag (misal: Official Asset / PPTX / HD)
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
                Pilih File Asset (ZIP, PDF, PPTX, PNG, dsb.) atau Masukkan URL Download <span style={{ color: '#f43f5e' }}>*</span>
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
                  <span>{pendingAssetFile ? 'Ganti File Pilihan' : 'Pilih File dari Komputer'}</span>
                  <input
                    type="file"
                    accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx"
                    onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', false)}
                    style={{ display: 'none' }}
                  />
                </label>
                <input
                  type="text"
                  placeholder="Atau tempel URL file langsung (https://... atau /assets/...)"
                  value={assetFileUrl}
                  onChange={(e) => {
                    setAssetFileUrl(e.target.value);
                    clearFieldError('assetFileUrl');
                  }}
                  style={{ flex: '1 1 220px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.assetFileUrl ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>
              {pendingAssetFile && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px dashed var(--neon-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    📦 Berkas lokal: <strong>{pendingAssetFile.name}</strong> ({assetFileSize}) &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Berkas akan diunggah ke Supabase Storage saat Anda klik tombol "Simpan & Publikasikan Asset" di bawah</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAssetFile(null);
                      setAssetFileUrl('');
                      setAssetFileSize('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    ✕ Batalkan
                  </button>
                </div>
              )}
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
                  <span>{pendingPreviewFile ? 'Ganti Preview' : 'Pilih Gambar Preview'}</span>
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
              {pendingPreviewFile && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 184, 0, 0.08)',
                  border: '1px dashed var(--mandiri-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    🖼️ Preview: <strong>{pendingPreviewFile.name}</strong> &bull; <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>Akan diunggah ke Cloud saat Anda klik Simpan</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPreviewFile(null);
                      setAssetPreviewUrl('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    ✕ Batalkan
                  </button>
                </div>
              )}
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
                disabled={isUploadingMedia}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: isUploadingMedia ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  color: isUploadingMedia ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: isUploadingMedia ? 'wait' : 'pointer',
                  boxShadow: isUploadingMedia ? 'none' : '0 4px 14px rgba(255, 184, 0, 0.35)'
                }}
              >
                <Plus size={16} />
                <span>{isUploadingMedia ? '⏳ Mengunggah ke Cloud...' : 'Simpan & Publikasikan Asset'}</span>
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

      {/* TAB CONTENT: PUSAT PANDUAN & TANYA JAWAB (FAQ) */}
      {activeTab === 'faqs' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Kelola Pusat Panduan & Tanya Jawab (FAQ) Budaya CNT
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tambahkan atau perbarui daftar pertanyaan umum seputar kegiatan olahraga/komunitas, pengajuan dana Sekben, aspirasi, hingga alur seleksi Oprec. Tersinkronisasi langsung dengan tabel <code>public.faqs</code> di Supabase.
            </p>
          </div>

          <form onSubmit={handleCreateFaq} noValidate style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div className="mobile-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kategori Topik
                </label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
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
                  <option value="Tentang CNT">Tentang CNT</option>
                  <option value="Kegiatan & Event">Kegiatan & Event</option>
                  <option value="Operasional & Sekben">Operasional & Sekben</option>
                  <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                  <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Pertanyaan (Question) <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bagaimana cara mengusulkan turnamen atau komunitas olahraga baru?"
                  value={faqQuestion}
                  onChange={(e) => {
                    setFaqQuestion(e.target.value);
                    clearFieldError('faqQuestion');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.faqQuestion ? '#f43f5e' : 'var(--border-card)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('faqQuestion')}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Jawaban & Penjelasan Lengkap (Answer) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan penjelasan lengkap yang jelas dan membantu insan IT APD..."
                value={faqAnswer}
                onChange={(e) => {
                  setFaqAnswer(e.target.value);
                  clearFieldError('faqAnswer');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.faqAnswer ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
              {renderFieldError('faqAnswer')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Tambah Pertanyaan FAQ</span>
              </button>
            </div>
          </form>

          {/* List of FAQs */}
          {(() => {
            const ADMIN_FAQS_PER_PAGE = 10;
            const totalAdminFaqPages = Math.ceil(faqs.length / ADMIN_FAQS_PER_PAGE) || 1;
            const safeAdminFaqPage = Math.min(Math.max(1, adminFaqPage), totalAdminFaqPages);
            const paginatedAdminFaqs = faqs.slice(
              (safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE,
              safeAdminFaqPage * ADMIN_FAQS_PER_PAGE
            );

            if (faqs.length === 0) {
              return (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Belum ada pertanyaan FAQ yang ditambahkan.
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {paginatedAdminFaqs.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${f.isPublished !== false ? 'var(--mandiri-gold)' : '#64748b'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
                            {f.category || 'Umum'}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: f.isPublished !== false ? '#10b981' : '#f59e0b'
                          }}>
                            {f.isPublished !== false ? '● Ditampilkan di Publik' : '⏳ Menunggu Jawaban / Draft'}
                          </span>
                          {f.askedBy && f.askedBy !== 'Admin CNT' && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(255, 184, 0, 0.14)',
                              border: '1px solid rgba(255, 184, 0, 0.4)',
                              color: 'var(--mandiri-gold)'
                            }}>
                              💬 Ditanyakan oleh: {f.askedBy} {(f.createdAt || f.submittedAt) ? `• ${formatWibTimestamp(f.createdAt || f.submittedAt).exact || f.createdAt || f.submittedAt}` : ''}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          {f.question}
                        </h4>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                          {f.answer}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onUpdateFaq && onUpdateFaq({ ...f, isPublished: f.isPublished === false ? true : false })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-muted)',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {f.isPublished === false ? 'Tampilkan' : 'Sembunyikan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ type: 'faq', item: { ...f } })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(14, 165, 233, 0.12)',
                            border: '1px solid #0284c7',
                            color: '#0284c7',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ type: 'faq', id: f.id, name: f.question })}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid #f43f5e',
                            color: '#f43f5e',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
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

                {totalAdminFaqPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE + 1} - {Math.min(safeAdminFaqPage * ADMIN_FAQS_PER_PAGE, faqs.length)}</strong> dari <strong>{faqs.length}</strong> pertanyaan FAQ
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminFaqPage === 1}
                        onClick={() => setAdminFaqPage(p => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminFaqPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminFaqPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminFaqPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminFaqPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminFaqPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminFaqPage(pg)}
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
                        disabled={safeAdminFaqPage === totalAdminFaqPages}
                        onClick={() => setAdminFaqPage(p => Math.min(totalAdminFaqPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminFaqPage === totalAdminFaqPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminFaqPage === totalAdminFaqPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminFaqPage === totalAdminFaqPages ? 0.45 : 1
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
      )}

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div 
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel modal-container modal-structured" 
            style={{
              maxWidth: editingItem.type === 'form' ? '680px' : '580px',
              width: '100%',
              maxHeight: 'min(90vh, 780px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
              border: '1.5px solid var(--mandiri-gold)',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.75)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {/* Pinned Sticky Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--mandiri-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Edit {
                    editingItem.type === 'member' ? 'Data Personel' :
                    editingItem.type === 'division' ? 'Data Divisi' :
                    editingItem.type === 'department' ? 'Data Departemen' :
                    editingItem.type === 'gallery' ? 'Dokumentasi Galeri' :
                    editingItem.type === 'kudos' ? 'Apresiasi / Kudos' :
                    editingItem.type === 'form' ? 'Formulir Pendaftaran' :
                    editingItem.type === 'event' ? 'Event' :
                    editingItem.type === 'brand_asset' ? 'Asset & Template' :
                    editingItem.type === 'faq' ? 'Pertanyaan FAQ' :
                    'Periode Kepengurusan'
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Tutup (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inline Error Alert if Required Validation Fails */}
            {editModalError && (
              <div style={{
                margin: '14px 22px 0 22px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid #f43f5e',
                color: '#f43f5e',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{editModalError}</span>
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div style={{
              padding: '20px 22px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>

            {/* Edit Member Form (Complete Fields) */}
            {editingItem.type === 'member' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    {(() => {
                      const editMemberTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                      const editMemberDivs = divisions.filter(d => d.tenureId === editMemberTenureId);
                      return (
                        <>
                          <select
                            value={editingItem.item.divisionId || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, divisionId: e.target.value || undefined } })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            <option value="">-- Lintas Divisi / BPH --</option>
                            {editMemberDivs.length === 0 ? (
                              <option value="" disabled>-- Divisi masih kosong di periode ini --</option>
                            ) : (
                              editMemberDivs.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))
                            )}
                          </select>
                          {editMemberDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi. Silakan buat divisi baru di tab Divisi.
                            </span>
                          )}
                        </>
                      );
                    })()}
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
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter(d => d.tenureId === newTenure);
                        const keepDiv = validDivs.some(d => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : undefined
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggung Jawab Utama (1 baris per poin)</label>
                  <textarea
                    rows={3}
                    placeholder="Tulis tanggung jawab utama (satu poin per baris)..."
                    value={editingItem.item.rawResponsibilities !== undefined ? editingItem.item.rawResponsibilities : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities.join('\n') : '')}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawResponsibilities: textVal,
                          responsibilities: textVal.split('\n').map(s => s.trim()).filter(Boolean)
                        }
                      });
                    }}
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
                      <span>{editingItem.pendingPhoto ? 'Ganti Foto Pilihan' : 'Pilih Foto Baru'}</span>
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
                  {editingItem.pendingPhoto && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>👤 Foto baru: <strong>{editingItem.pendingPhoto.name}</strong> &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? ({ ...prev, pendingPhoto: null, item: { ...prev.item, image: '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Nama Pimpro / PIC (Kategori Pimpro)
                    </label>
                    {(() => {
                      const editDivTenure = editingItem.item.tenureId || activeTenure?.id;
                      const availableEditPimpros = (members || []).filter(m =>
                        (m.category || '').toLowerCase() === 'pimpro' &&
                        (!m.tenureId || m.tenureId === editDivTenure)
                      );
                      const currentSelectedMemberId = editingItem.item.memberId ||
                        members.find(m => (m.category || '').toLowerCase() === 'pimpro' && m.divisionId === editingItem.item.id)?.id ||
                        members.find(m => (m.category || '').toLowerCase() === 'pimpro' && m.name === editingItem.item.leadName)?.id ||
                        '';

                      return (
                        <select
                          value={currentSelectedMemberId}
                          onChange={(e) => {
                            const selId = e.target.value;
                            const selMem = members.find(m => m.id === selId);
                            setEditingItem({
                              ...editingItem,
                              item: {
                                ...editingItem.item,
                                memberId: selId || null,
                                leadName: selMem ? selMem.name : ''
                              }
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--input-border)',
                            color: 'var(--text-main)',
                            fontSize: '0.86rem'
                          }}
                        >
                          <option value="">-- Pilih Pimpro (Opsional / Belum Ditentukan) --</option>
                          {availableEditPimpros.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.role ? `(${m.role})` : ''}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter(d => d.tenureId === newTenure);
                        const keepDiv = validDivs.some(d => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : undefined,
                            memberId: null,
                            leadName: ''
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Status Rekrutmen Divisi (Publik)</label>
                    <select
                      value={Boolean(editingItem.item.isRecruiting) ? 'open' : 'closed'}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, isRecruiting: e.target.value === 'open' } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      <option value="open">● Membuka Rekrutmen (Rekrutmen Buka)</option>
                      <option value="closed">○ Ditutup (Badge Hilang di Web)</option>
                    </select>
                  </div>
                </div>

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
                    value={editingItem.item.rawFocusAreas !== undefined ? editingItem.item.rawFocusAreas : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas.join(', ') : '')}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      const parsed = textVal.split(',').map(s => s.trim()).filter(Boolean);
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawFocusAreas: textVal,
                          focusAreas: parsed
                        }
                      });
                    }}
                    placeholder="Contoh: Internal Engagement, Wellness, Learning"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                  />
                  <div style={{ marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {Array.isArray(editingItem.item.focusAreas) && editingItem.item.focusAreas.length > 0 ? (
                      <span>Fokus aktif ({editingItem.item.focusAreas.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{editingItem.item.focusAreas.join(' • ')}</strong></span>
                    ) : (
                      <span>Ketik fokus area dipisahkan koma (contoh: <code>Internal Engagement, Wellness, Learning</code>)</span>
                    )}
                  </div>
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
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter(d => d.tenureId === newTenure);
                        const keepDiv = validDivs.find(d => d.id === editingItem.item.divisionId || d.name === editingItem.item.division);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? keepDiv.id : '',
                            division: keepDiv ? keepDiv.name : '',
                            divisionName: keepDiv ? keepDiv.name : ''
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      const currentParsed = parseFlexibleDate(editingItem.item.date);
                      const activeMode = editingItem.item._dateMode || currentParsed.mode;
                      
                      const setMode = (newMode) => {
                        const newDateStr = buildFlexibleDate(newMode, {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          startDate: editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate,
                          endDate: editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate,
                          month: editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month,
                          year: editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year
                        });
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            _dateMode: newMode,
                            date: newDateStr
                          }
                        });
                      };

                      const updateField = (key, val) => {
                        const stateObj = {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          startDate: editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate,
                          endDate: editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate,
                          month: editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month,
                          year: editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year,
                          [key]: val
                        };
                        const newDateStr = buildFlexibleDate(activeMode, stateObj);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            [`_${key}`]: val,
                            date: newDateStr
                          }
                        });
                      };

                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              📅 Format & Waktu Pelaksanaan
                            </label>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {[
                                { id: 'date', label: 'Tanggal Lengkap' },
                                { id: 'range', label: 'Rentang Tanggal' },
                                { id: 'month', label: 'Bulan & Tahun' },
                                { id: 'year', label: 'Tahun Saja' }
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setMode(m.id)}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    borderRadius: '5px',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    background: activeMode === m.id ? 'var(--mandiri-gold)' : 'rgba(255, 255, 255, 0.05)',
                                    color: activeMode === m.id ? '#040914' : 'var(--text-muted)',
                                    borderColor: activeMode === m.id ? 'var(--mandiri-gold)' : 'var(--border-card)'
                                  }}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeMode === 'date' && (
                            <input
                              type="date"
                              value={editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date}
                              onChange={(e) => updateField('date', e.target.value)}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          {activeMode === 'range' && (
                            <div className="mobile-two-col" style={{ gap: '10px' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Mulai</span>
                                <input
                                  type="date"
                                  value={editingItem.item._startDate !== undefined ? editingItem.item._startDate : currentParsed.startDate}
                                  onChange={(e) => updateField('startDate', e.target.value)}
                                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Tanggal Selesai</span>
                                <input
                                  type="date"
                                  value={editingItem.item._endDate !== undefined ? editingItem.item._endDate : currentParsed.endDate}
                                  onChange={(e) => updateField('endDate', e.target.value)}
                                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                />
                              </div>
                            </div>
                          )}

                          {activeMode === 'month' && (
                            <input
                              type="month"
                              value={editingItem.item._month !== undefined ? editingItem.item._month : currentParsed.month}
                              onChange={(e) => updateField('month', e.target.value)}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          {activeMode === 'year' && (
                            <input
                              type="number"
                              min="2000"
                              max="2099"
                              placeholder="Contoh: 2026"
                              value={editingItem.item._year !== undefined ? editingItem.item._year : currentParsed.year}
                              onChange={(e) => updateField('year', e.target.value)}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                          )}

                          <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👁️ Tampilan di Web:</span>
                            <strong style={{ color: '#fff', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                              {formatWibDateTime(editingItem.item.date)}
                            </strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penyelenggara</label>
                    {(() => {
                      const editGalTenure = editingItem.item.tenureId || activeTenure?.id || '';
                      const editGalDivs = divisions.filter(d => d.tenureId === editGalTenure);
                      const currentDivId = editingItem.item.divisionId || editGalDivs.find(d => d.name === editingItem.item.division)?.id || '';
                      return (
                        <>
                          <select
                            value={currentDivId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const selectedD = editGalDivs.find(d => d.id === selectedId);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  divisionId: selectedId,
                                  division: selectedD ? selectedD.name : '',
                                  divisionName: selectedD ? selectedD.name : ''
                                }
                              });
                            }}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            {editGalDivs.length === 0 ? (
                              <option value="" disabled>-- Divisi masih kosong di periode ini --</option>
                            ) : (
                              <>
                                <option value="">-- Pilih Divisi Penyelenggara --</option>
                                {editGalDivs.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                          {editGalDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi. Silakan buat divisi baru di tab Divisi.
                            </span>
                          )}
                        </>
                      );
                    })()}
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
                      <span>+ Pilih Foto Baru</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, true)} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0 && (
                    <div style={{
                      marginBottom: '8px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📷 <strong>{editingItem.pendingPhotos.length} foto baru</strong> dipilih &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentPhotos = (editingItem.item.photos || []).filter(p => typeof p === 'string' && !p.startsWith('blob:'));
                          setEditingItem({ ...editingItem, pendingPhotos: [], item: { ...editingItem.item, photos: currentPhotos } });
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan Foto Baru
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(() => {
                      const totalPhotos = (editingItem.item.photos || []).length;
                      const isOnlyOne = totalPhotos <= 1;

                      return (editingItem.item.photos || []).map((photoUrl, pIdx) => (
                        <div key={pIdx} style={{ position: 'relative', width: '68px', height: '52px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isOnlyOne) {
                                soundFx?.playError?.();
                                showToast('Dokumentasi harus memiliki minimal 1 foto! Tidak dapat menghapus foto terakhir.', 'error');
                                return;
                              }
                              soundFx?.playClick?.();
                              setDeleteConfirm({
                                type: 'gallery_photo',
                                id: photoUrl,
                                photoIdx: pIdx,
                                name: `Foto ke-${pIdx + 1}`
                              });
                            }}
                            title={isOnlyOne ? "Dokumentasi wajib memiliki minimal 1 foto (tidak dapat dihapus)" : `Hapus Foto ke-${pIdx + 1}`}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isOnlyOne ? 'rgba(100, 116, 139, 0.7)' : 'rgba(244, 63, 94, 0.9)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '0.7rem',
                              cursor: isOnlyOne ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isOnlyOne ? 0.6 : 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Option B: Input Tambah Link URL Foto */}
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Link2 size={13} color="var(--mandiri-gold)" />
                      <span>Atau Tambah Foto via Link URL Web:</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        rows={2}
                        placeholder="https://...link-foto-1.jpg&#10;https://...link-foto-2.png"
                        value={editingItem.photoUrlInput || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, photoUrlInput: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoLinkToEditModal}
                        disabled={isUploadingMedia || !(editingItem.photoUrlInput || '').trim()}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: (editingItem.photoUrlInput || '').trim() ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                          color: (editingItem.photoUrlInput || '').trim() ? '#040914' : 'var(--text-dim)',
                          border: '1px solid var(--border-card)',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: (editingItem.photoUrlInput || '').trim() ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          height: 'fit-content'
                        }}
                      >
                        <Plus size={13} />
                        <span>Tambah Link</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      * Link diverifikasi aktif sebelum masuk ke carousel. Bisa masukkan beberapa link dipisahkan baris baru.
                    </div>
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
                    placeholder="Tulis poin misi (satu baris per misi)..."
                    value={editingItem.item.rawMisi !== undefined ? editingItem.item.rawMisi : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi.join('\n') : (editingItem.item.misi || ''))}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          rawMisi: textVal,
                          misi: textVal.split('\n').map(s => s.trim()).filter(Boolean)
                        }
                      });
                    }}
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Batas Akhir / Deadline (WIB)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type="datetime-local"
                          step="1"
                          value={toDatetimeLocalSecondsValue(editingItem.item.deadline || '')}
                          onChange={(e) => {
                            setEditingItem({ ...editingItem, item: { ...editingItem.item, deadline: e.target.value } });
                          }}
                          style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--input-border)',
                            color: 'var(--text-main)',
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        />
                        <Calendar 
                          size={16} 
                          style={{ 
                            position: 'absolute', 
                            left: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: 'var(--mandiri-gold)',
                            pointerEvents: 'none' 
                          }} 
                        />
                      </div>
                      {editingItem.item.deadline && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, item: { ...editingItem.item, deadline: '' } })}
                          title="Hapus deadline / Tanpa batas waktu"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-card)',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', marginTop: '4px', fontWeight: 600 }}>
                      {editingItem.item.deadline ? `Tampilan di Web: ${formatDeadlineWib(editingItem.item.deadline)}` : 'Pilih tanggal & waktu deadline'}
                    </div>
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

                {/* Option: Tenure Relation */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    📅 Periode Kepengurusan (Tenure) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={editingItem.item.tenureId || activeTenure?.id || tenures[0]?.id || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, tenureId: e.target.value }
                    })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {tenures.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title || `Kepengurusan CNT ${t.code}`} {t.id === activeTenure?.id ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                    Opsi pertanyaan "Dropdown Divisi" pada formulir ini akan otomatis menampilkan divisi dari periode yang dipilih.
                  </span>
                </div>

                {/* Option: Requires Tracking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.requiresTracking !== false ? 'var(--mandiri-gold)' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={editingItem.item.requiresTracking !== false}
                      onChange={(e) => {
                        const isTracking = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            requiresTracking: isTracking
                          }
                        });
                      }}
                    />
                    <span>Memerlukan Responden untuk Tracking Progres (Status Seleksi / Pendaftaran)</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.requiresTracking !== false
                      ? 'Aktif: Responden dapat melacak progres via ID Pendaftaran atau field Indeks Pencarian. Card pencarian di web akan muncul jika form ini aktif.'
                      : 'Nonaktif: Formulir reguler tanpa fitur pelacakan status. Responden tidak diminta tracking dan indeks pencarian dinonaktifkan.'}
                  </span>
                </div>

                {/* Custom Field Builder */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                        Daftar Pertanyaan / Field ({(editingItem.item.fields || []).length})
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>
                        Drag ikon grip atau klik panah untuk menentukan urutan pertanyaan
                      </span>
                    </div>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(editingItem.item.fields || []).map((fld, idx) => (
                      <div
                        key={fld.id || idx}
                        draggable
                        onDragStart={(e) => {
                          setDraggedFieldIndex(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverFieldIndex !== idx) {
                            setDragOverFieldIndex(idx);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverFieldIndex === idx) setDragOverFieldIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIdx = draggedFieldIndex !== null ? draggedFieldIndex : Number(e.dataTransfer.getData('text/plain'));
                          handleMoveField(fromIdx, idx);
                          setDraggedFieldIndex(null);
                          setDragOverFieldIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedFieldIndex(null);
                          setDragOverFieldIndex(null);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: dragOverFieldIndex === idx && draggedFieldIndex !== idx
                            ? 'rgba(56, 189, 248, 0.12)'
                            : (draggedFieldIndex === idx ? 'rgba(255, 184, 0, 0.05)' : 'rgba(255,255,255,0.03)'),
                          border: dragOverFieldIndex === idx && draggedFieldIndex !== idx
                            ? '2px dashed var(--neon-cyan)'
                            : (draggedFieldIndex === idx ? '1px dashed var(--mandiri-gold)' : '1px solid var(--border-card)'),
                          opacity: draggedFieldIndex === idx ? 0.4 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Drag Handle & Item Position */}
                          <div 
                            title="Tahan & geser untuk mengubah urutan field"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'grab', color: 'var(--text-dim)', userSelect: 'none' }}
                          >
                            <GripVertical size={16} />
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--mandiri-gold)', minWidth: '18px' }}>
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Quick Up/Down Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, idx - 1)}
                              title="Pindahkan ke atas"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                color: idx === 0 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: idx === 0 ? 0.3 : 1
                              }}
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (editingItem.item.fields?.length || 0) - 1}
                              onClick={() => handleMoveField(idx, idx + 1)}
                              title="Pindahkan ke bawah"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-card)',
                                borderRadius: '4px',
                                color: idx === (editingItem.item.fields?.length || 0) - 1 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: idx === (editingItem.item.fields?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: idx === (editingItem.item.fields?.length || 0) - 1 ? 0.3 : 1
                              }}
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>

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
                            style={{ flex: '1 1 150px', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                          />
                          <select
                            value={
                              fld.type === 'select' && fld.source === 'departments'
                                ? 'select_department'
                                : (fld.type === 'select' && fld.source === 'divisions'
                                    ? 'select_division'
                                    : (fld.type || 'text'))
                            }
                            onChange={(e) => {
                              const selectedVal = e.target.value;
                              const nextFields = editingItem.item.fields.map((item, i) => {
                                if (i === idx) {
                                  if (selectedVal === 'select_department') {
                                    return {
                                      ...item,
                                      type: 'select',
                                      source: 'departments',
                                      options: [],
                                      rawOptions: undefined
                                    };
                                  } else if (selectedVal === 'select_division') {
                                    return {
                                      ...item,
                                      type: 'select',
                                      source: 'divisions',
                                      options: [],
                                      rawOptions: undefined
                                    };
                                  } else {
                                    const updated = { ...item, type: selectedVal, source: undefined };
                                    if (selectedVal === 'radio' && (!item.options || item.options.length === 0)) {
                                      updated.options = ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
                                      updated.rawOptions = 'Pilihan 1, Pilihan 2, Pilihan 3';
                                    } else if (selectedVal === 'select' && (!item.options || item.options.length === 0)) {
                                      updated.options = ['Opsi 1', 'Opsi 2', 'Opsi 3'];
                                      updated.rawOptions = 'Opsi 1, Opsi 2, Opsi 3';
                                    }
                                    return updated;
                                  }
                                }
                                return item;
                              });
                              setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                            }}
                            style={{ padding: '6px 8px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                          >
                            <option value="text">Teks Singkat</option>
                            <option value="textarea">Paragraf</option>
                            <option value="radio">Pilihan Ganda (1 Jawaban)</option>
                            <option value="select">Dropdown Pilihan (Ketik Opsi Manual)</option>
                            <option value="select_department">🏢 Dropdown Departemen (Otomatis dari DB)</option>
                            <option value="select_division">👥 Dropdown Divisi (Otomatis dari DB)</option>
                            <option value="email">Email</option>
                            <option value="number">Angka</option>
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

                          {/* Search Index Toggle (Hanya tampil jika form memerlukan tracking) */}
                          {editingItem.item.requiresTracking !== false && (
                            <label
                              title="Jadikan Indeks Pencarian: Centang jika field ini dijadikan kredensial pendaftar untuk mencari & mengecek status pendaftaran/seleksi di web. Jika tidak ada field yang dicentang, pelacakan default menggunakan ID Pendaftaran."
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                color: fld.isSearchIndex ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                                background: fld.isSearchIndex ? 'rgba(255, 184, 0, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                                border: fld.isSearchIndex ? '1px solid rgba(255, 184, 0, 0.45)' : '1px solid var(--border-card)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: fld.isSearchIndex ? 700 : 500,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(fld.isSearchIndex)}
                                onChange={(e) => {
                                  const nextFields = editingItem.item.fields.map((item, i) =>
                                    i === idx ? { ...item, isSearchIndex: e.target.checked } : item
                                  );
                                  setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                                }}
                              />
                              <span>🔍 Jadikan Indeks Pencarian</span>
                            </label>
                          )}

                          {/* Field Delete Button with Confirmation if data exists */}
                          {(() => {
                            const subCount = submissions.filter(s => s.formId === editingItem.item.id).length;

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (subCount > 0) {
                                    const ok = window.confirm(
                                      `Formulir ini sudah memiliki ${subCount} berkas pendaftar.\n\n` +
                                      `Menghapus field "${fld.label}" TIDAK AKAN MENGHAPUS data pendaftar yang sudah ada di database, namun pertanyaan ini tidak akan muncul lagi bagi pendaftar baru.\n\n` +
                                      `Lanjutkan menghapus pertanyaan ini?`
                                    );
                                    if (!ok) return;
                                  }

                                  const nextFields = editingItem.item.fields.filter((_, i) => i !== idx);
                                  setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f43f5e',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  opacity: 0.85
                                }}
                                title={subCount > 0 ? "Form ini sudah ada pendaftar (konfirmasi akan muncul)" : "Hapus pertanyaan"}
                              >
                                <Trash2 size={14} />
                              </button>
                            );
                          })()}
                        </div>

                        {/* Option Editor for Custom Dropdown & Multiple Choice (Radio) */}
                        {(fld.type === 'select' || fld.type === 'radio') && fld.source !== 'divisions' && fld.source !== 'departments' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', paddingLeft: '24px' }}>
                            <input
                              type="text"
                              placeholder={fld.type === 'radio'
                                ? "Pilihan jawaban (pisahkan dengan koma, misal: Pilihan A, Pilihan B, Pilihan C)"
                                : "Opsi dropdown (pisahkan dengan koma, misal: Opsi 1, Opsi 2, Opsi 3)"}
                              value={fld.rawOptions !== undefined ? fld.rawOptions : (Array.isArray(fld.options) ? fld.options.join(', ') : '')}
                              onChange={(e) => {
                                const textVal = e.target.value;
                                const opts = textVal.split(',').map(s => s.trim()).filter(Boolean);
                                const nextFields = editingItem.item.fields.map((item, i) =>
                                  i === idx ? { ...item, options: opts, rawOptions: textVal } : item
                                );
                                setEditingItem({ ...editingItem, item: { ...editingItem.item, fields: nextFields } });
                              }}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.78rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {Array.isArray(fld.options) && fld.options.length > 0 ? (
                                <span>
                                  Opsi aktif ({fld.options.length}): <strong style={{ color: 'var(--neon-cyan)' }}>{fld.options.join(' • ')}</strong>
                                </span>
                              ) : (
                                <span>Ketik opsi dipisahkan koma (contoh: <code>Opsi 1, Opsi 2, Opsi 3</code>)</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Automatic Departments Dropdown Info */}
                        {fld.type === 'select' && fld.source === 'departments' && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '2px',
                            padding: '7px 12px',
                            marginLeft: '24px',
                            borderRadius: '6px',
                            background: 'rgba(255, 184, 0, 0.08)',
                            border: '1px solid rgba(255, 184, 0, 0.3)',
                            fontSize: '0.75rem',
                            color: 'var(--mandiri-gold)'
                          }}>
                            <Building2 size={14} style={{ flexShrink: 0 }} />
                            <span>
                              Opsi dropdown otomatis diambil dari <strong>{departments.length} Departemen</strong> di database (Kelola Departemen). Pilihan akan selalu sinkron otomatis tanpa perlu mengetik manual.
                            </span>
                          </div>
                        )}

                        {/* Automatic Divisions Dropdown Info */}
                        {fld.type === 'select' && fld.source === 'divisions' && (() => {
                          const formTenureId = editingItem.item.tenureId || activeTenure?.id;
                          const currentTenure = tenures.find(t => t.id === formTenureId) || activeTenure;
                          const tenureDivs = (divisions || []).filter(d => !formTenureId || d.tenureId === formTenureId);

                          return (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '2px',
                              padding: '7px 12px',
                              marginLeft: '24px',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              fontSize: '0.75rem',
                              color: 'var(--neon-cyan)'
                            }}>
                              <Layers size={14} style={{ flexShrink: 0 }} />
                              <span>
                                Opsi dropdown otomatis diambil dari <strong>{tenureDivs.length} Divisi</strong> pada periode <strong>{currentTenure?.title || currentTenure?.code || 'Aktif'}</strong> di database.
                              </span>
                            </div>
                          );
                        })()}
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Event</label>
                  <input
                    type="text"
                    value={editingItem.item.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Tanggal & Jam Mulai (WIB) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editingItem.item.startDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = val;
                        const eVal = editingItem.item.endDate || val;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            startDate: sVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Tanggal & Jam Berakhir (WIB) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editingItem.item.endDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = editingItem.item.startDate || val;
                        const eVal = val;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            endDate: eVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Live Preview of Dynamic Date in WIB */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.78rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Tampilan Jadwal di Web:</span>
                  <strong>{formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate, editingItem.item.date || 'TBD')}</strong>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan</label>
                    <select
                      value={editingItem.item.tenureId || activeTenure?.id || ''}
                      onChange={(e) => {
                        const newTenure = e.target.value;
                        const validDivs = divisions.filter(d => d.tenureId === newTenure);
                        const keepDiv = validDivs.some(d => d.id === editingItem.item.divisionId);
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            tenureId: newTenure,
                            divisionId: keepDiv ? editingItem.item.divisionId : '',
                            divisionName: keepDiv ? editingItem.item.divisionName : ''
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    >
                      {tenures.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Divisi Penyelenggara</label>
                    {(() => {
                      const editEventTenure = editingItem.item.tenureId || activeTenure?.id || '';
                      const editEventDivs = divisions.filter(d => d.tenureId === editEventTenure);
                      return (
                        <>
                          <select
                            value={editingItem.item.divisionId || ''}
                            onChange={(e) => {
                              const selDiv = editEventDivs.find(d => d.id === e.target.value);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  divisionId: e.target.value,
                                  divisionName: selDiv?.name || editingItem.item.divisionName || ''
                                }
                              });
                            }}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            {editEventDivs.length === 0 ? (
                              <option value="" disabled>-- Divisi masih kosong di periode ini --</option>
                            ) : (
                              <>
                                <option value="">-- Pilih Divisi Penyelenggara --</option>
                                {editEventDivs.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                          {editEventDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi. Silakan buat divisi baru di tab Divisi.
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      💰 Estimasi Total RAB (Rp) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 15000000 (wajib diisi)"
                      value={editingItem.item.totalRab !== undefined && editingItem.item.totalRab !== null ? editingItem.item.totalRab : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, totalRab: v === '' ? '' : Number(v) } });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Peserta</label>
                    <input
                      type="text"
                      placeholder="Contoh: 150+ Peserta Officer IT APD"
                      value={editingItem.item.peserta !== undefined ? editingItem.item.peserta : (editingItem.item.kpi || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            peserta: val,
                            kpi: val
                          }
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    🏷️ Kategori Program / Kegiatan
                  </label>
                  <input
                    type="text"
                    list="edit-event-category-list"
                    placeholder="Pilih atau ketik kategori..."
                    value={editingItem.item.category || editingItem.item.badge || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          category: val,
                          badge: val
                        }
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                  <datalist id="edit-event-category-list">
                    <option value="Program Budaya" />
                    <option value="Workshop & Sharing Session" />
                    <option value="Social & Engagement" />
                    <option value="Olahraga & Well-being" />
                    <option value="Kompetisi & Inovasi" />
                    <option value="Apresiasi & Rekognisi" />
                    <option value="Townhall & Perayaan" />
                  </datalist>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Label Kategori Tambahan / Tag</label>
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>File Asset / Template (Cloud Storage)</label>
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
                      <span>{editingItem.pendingFile ? 'Ganti File Pilihan' : 'Pilih File Baru'}</span>
                      <input
                        type="file"
                        accept="*/*,.zip,.rar,.7z,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.svg,.docx,.xlsx"
                        onChange={(e) => handleBrandAssetUpload(e, 'fileUrl', true)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Atau tempel URL file langsung"
                      value={editingItem.item.fileUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, fileUrl: e.target.value } })}
                      style={{ flex: 1, minWidth: '180px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  {editingItem.pendingFile && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px dashed var(--neon-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>📦 File baru: <strong>{editingItem.pendingFile.name}</strong> ({editingItem.item.fileSize}) &bull; <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? ({ ...prev, pendingFile: null, item: { ...prev.item, fileUrl: prev.originalFileUrl || '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Preview Thumbnail Gambar (Opsional)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {editingItem.item.previewUrl && (
                      <img src={editingItem.item.previewUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-card)' }} />
                    )}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 184, 0, 0.12)',
                      border: '1px solid var(--mandiri-gold)',
                      color: 'var(--mandiri-gold)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <ImageIcon size={13} />
                      <span>{editingItem.pendingPreviewFile ? 'Ganti Preview' : 'Pilih Gambar'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleBrandAssetUpload(e, 'previewUrl', true)} style={{ display: 'none' }} />
                    </label>
                    <input
                      type="text"
                      placeholder="URL Gambar Thumbnail..."
                      value={editingItem.item.previewUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, previewUrl: e.target.value } })}
                      style={{ flex: 1, minWidth: '180px', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    />
                  </div>
                  {editingItem.pendingPreviewFile && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 184, 0, 0.08)',
                      border: '1px dashed var(--mandiri-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)'
                    }}>
                      <span>🖼️ Preview baru: <strong>{editingItem.pendingPreviewFile.name}</strong> &bull; <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>Akan diunggah saat Anda klik Simpan Perubahan</span></span>
                      <button
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? ({ ...prev, pendingPreviewFile: null, item: { ...prev.item, previewUrl: '' } }) : null)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  )}
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

            {/* Edit FAQ Form */}
            {editingItem.type === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Topik</label>
                  <select
                    value={editingItem.item.category || 'Umum'}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    <option value="Tentang CNT">Tentang CNT</option>
                    <option value="Kegiatan & Event">Kegiatan & Event</option>
                    <option value="Operasional & Sekben">Operasional & Sekben</option>
                    <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                    <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pertanyaan (Question)</label>
                  <input
                    type="text"
                    value={editingItem.item.question || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Jawaban Lengkap (Answer)</label>
                  <textarea
                    rows={4}
                    value={editingItem.item.answer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, answer: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            {/* Edit Department Form */}
            {editingItem.type === 'department' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Departemen <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    placeholder="Contoh: Digital Banking Delivery"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Kode / Singkatan
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.code || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, code: e.target.value.toUpperCase() } })}
                    placeholder="Contoh: DBD"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Deskripsi / Keterangan Fungsi (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.item.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                    placeholder="Deskripsi tugas atau ruang lingkup delivery departemen..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>
            )}

            </div>

            {/* Pinned Sticky Footer Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 22px',
              borderTop: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditModalError('');
                }}
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
                disabled={isUploadingMedia}
                onClick={async () => {
                  setEditModalError('');
                  const it = editingItem.item || {};
                  if ((editingItem.type === 'member' || editingItem.type === 'division' || editingItem.type === 'department') && !(it.name || '').trim()) {
                    setEditModalError('Nama wajib diisi sebelum menyimpan perubahan');
                    showToast('Nama wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if ((editingItem.type === 'gallery' || editingItem.type === 'tenure' || editingItem.type === 'form' || editingItem.type === 'event' || editingItem.type === 'brand_asset') && !(it.title || '').trim()) {
                    setEditModalError('Judul wajib diisi sebelum menyimpan perubahan');
                    showToast('Judul wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if (editingItem.type === 'faq' && (!(it.question || '').trim() || !(it.answer || '').trim())) {
                    setEditModalError('Pertanyaan dan jawaban FAQ wajib diisi');
                    showToast('Pertanyaan dan jawaban FAQ wajib diisi', 'error');
                    return;
                  }
                  if (editingItem.type === 'kudos' && (!(it.sender || '').trim() || !(it.recipient || '').trim() || !(it.message || '').trim())) {
                    setEditModalError('Pengirim, penerima, dan pesan apresiasi wajib diisi');
                    showToast('Pengirim, penerima, dan pesan apresiasi wajib diisi', 'error');
                    return;
                  }

                  if (editingItem.type === 'member' && onUpdateMember) {
                    const cat = editingItem.item.category || 'anggota';
                    if (cat === 'anggota' || cat === 'pimpro') {
                      if (!editingItem.item.divisionId) {
                        setEditModalError('Divisi wajib dipilih untuk posisi Anggota / Pimpro');
                        showToast('Divisi wajib dipilih untuk posisi Anggota / Pimpro', 'error');
                        return;
                      }
                    }
                    let finalImage = editingItem.item.image || '';
                    if (editingItem.pendingPhoto) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah foto "${editingItem.pendingPhoto.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingPhoto, 'members');
                        if (cloudUrl) finalImage = cloudUrl;
                      } catch (err) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto: ' + (err.message || 'Error jaringan'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const finalResp = editingItem.item.rawResponsibilities !== undefined
                      ? editingItem.item.rawResponsibilities.split('\n').map(s => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities : []);
                    const { rawResponsibilities, ...cleanItem } = editingItem.item;
                    onUpdateMember({ ...cleanItem, image: finalImage, responsibilities: finalResp });
                  }
                  if (editingItem.type === 'division' && onUpdateDivision) {
                    const finalFocus = editingItem.item.rawFocusAreas !== undefined
                      ? editingItem.item.rawFocusAreas.split(',').map(s => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas : []);
                    const { rawFocusAreas, ...cleanItem } = editingItem.item;
                    const selMem = members.find(m => m.id === cleanItem.memberId);
                    const finalLeadName = selMem ? selMem.name : (cleanItem.leadName || '');
                    onUpdateDivision({ ...cleanItem, leadName: finalLeadName, focusAreas: finalFocus });
                  }
                  if (editingItem.type === 'gallery' && onUpdateGallery) {
                    let finalPhotos = Array.isArray(editingItem.item.photos) ? [...editingItem.item.photos] : [];
                    if (editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah ${editingItem.pendingPhotos.length} foto ke Cloud Storage...`);
                      try {
                        for (const pFile of editingItem.pendingPhotos) {
                          const cloudUrl = await uploadMediaToCloud(pFile, 'gallery');
                          if (cloudUrl) {
                            const blobIdx = finalPhotos.findIndex(u => typeof u === 'string' && u.startsWith('blob:'));
                            if (blobIdx !== -1) {
                              finalPhotos[blobIdx] = cloudUrl;
                            } else {
                              finalPhotos.push(cloudUrl);
                            }
                          }
                        }
                      } catch (err) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah foto galeri: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    finalPhotos = finalPhotos.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

                    // Auto-include any pending photo links entered in the textarea
                    const pendingRawUrls = (editingItem.photoUrlInput || '').trim();
                    if (pendingRawUrls) {
                      const urls = pendingRawUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                      for (const u of urls) {
                        const check = await verifyImageUrl(u);
                        if (!check.valid) {
                          setEditModalError(`Tautan foto "${u}" tidak valid: ${check.error}`);
                          showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                          return;
                        }
                        if (!finalPhotos.includes(u)) {
                          finalPhotos.push(u);
                        }
                      }
                    }

                    if (finalPhotos.length === 0) {
                      setEditModalError('Dokumentasi kegiatan wajib memiliki minimal 1 foto!');
                      showToast('Dokumentasi kegiatan wajib memiliki minimal 1 foto!', 'error');
                      return;
                    }
                    const {
                      _dateMode,
                      _dateVal,
                      _startDate,
                      _endDate,
                      _month,
                      _year,
                      ...cleanGalItem
                    } = editingItem.item;
                    onUpdateGallery({ ...cleanGalItem, photos: finalPhotos });
                  }
                  if (editingItem.type === 'tenure' && onUpdateTenure) {
                    const finalMisi = editingItem.item.rawMisi !== undefined
                      ? editingItem.item.rawMisi.split('\n').map(s => s.trim()).filter(Boolean)
                      : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi : []);
                    const { rawMisi, ...cleanItem } = editingItem.item;
                    onUpdateTenure({ ...cleanItem, misi: finalMisi });
                  }
                  if (editingItem.type === 'kudos' && onUpdateKudos) onUpdateKudos(editingItem.item);
                  if (editingItem.type === 'form') {
                    const fields = editingItem.item.fields || [];
                    if (onUpdateForm) {
                      const cleanFields = fields.map(({ rawOptions, ...rest }) => rest);
                      onUpdateForm({ ...editingItem.item, fields: cleanFields });
                    }
                  }
                  if (editingItem.type === 'event' && onUpdateEvent) {
                    if (!editingItem.item.divisionId) {
                      setEditModalError('Divisi penyelenggara wajib dipilih untuk Event');
                      showToast('Divisi penyelenggara wajib dipilih untuk Event', 'error');
                      return;
                    }
                    if (editingItem.item.totalRab === '' || editingItem.item.totalRab === undefined || editingItem.item.totalRab === null || isNaN(Number(editingItem.item.totalRab)) || Number(editingItem.item.totalRab) < 0) {
                      setEditModalError('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)');
                      showToast('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)', 'error');
                      return;
                    }
                    const catVal = (editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || 'Program Budaya').trim();
                    const pesertaVal = (editingItem.item.peserta || editingItem.item.kpi || 'Officer IT APD').trim();
                    onUpdateEvent({
                      ...editingItem.item,
                      kategori: catVal,
                      category: catVal,
                      badge: catVal,
                      peserta: pesertaVal,
                      kpi: pesertaVal,
                      totalRab: Number(editingItem.item.totalRab),
                      date: (editingItem.item.date || '').trim() || editingItem.item.startDate || 'TBD'
                    });
                  }
                  if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) {
                    let finalFileUrl = editingItem.item.fileUrl || '';
                    let finalPreviewUrl = editingItem.item.previewUrl || '';
                    if (editingItem.pendingFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah file "${editingItem.pendingFile.name}" ke Cloud Storage...`);
                      try {
                        const cloudUrl = await uploadMediaToCloud(editingItem.pendingFile, 'assets');
                        if (cloudUrl) finalFileUrl = cloudUrl;
                      } catch (err) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah file asset: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    if (editingItem.pendingPreviewFile) {
                      setIsUploadingMedia(true);
                      showToast(`Mengunggah preview "${editingItem.pendingPreviewFile.name}"...`);
                      try {
                        if (editingItem.pendingPreviewFile === editingItem.pendingFile) {
                          finalPreviewUrl = finalFileUrl;
                        } else {
                          const previewCloudUrl = await uploadMediaToCloud(editingItem.pendingPreviewFile, 'assets');
                          if (previewCloudUrl) finalPreviewUrl = previewCloudUrl;
                        }
                      } catch (err) {
                        setIsUploadingMedia(false);
                        showToast('Gagal mengunggah gambar preview: ' + (err.message || 'Error'), 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }
                    const effectiveFileUrl = finalFileUrl || finalPreviewUrl || '';
                    const effectivePreviewUrl = finalPreviewUrl || finalFileUrl || '';
                    onUpdateBrandAsset({
                      ...editingItem.item,
                      fileUrl: effectiveFileUrl,
                      previewUrl: effectivePreviewUrl
                    });
                  }
                  if (editingItem.type === 'department' && onUpdateDepartment) onUpdateDepartment(editingItem.item);
                  if (editingItem.type === 'faq' && onUpdateFaq) onUpdateFaq(editingItem.item);
                  setEditingItem(null);
                  setEditModalError('');
                  showToast('Perubahan data berhasil disimpan & disinkronkan ke Cloud!');
                }}
                style={{
                  padding: '9px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: isUploadingMedia ? 'var(--input-bg)' : 'var(--mandiri-gold)',
                  border: 'none',
                  color: isUploadingMedia ? 'var(--text-muted)' : '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: isUploadingMedia ? 'not-allowed' : 'pointer',
                  boxShadow: isUploadingMedia ? 'none' : '0 4px 14px rgba(255, 184, 0, 0.35)'
                }}
              >
                {isUploadingMedia ? 'Mengunggah & Menyimpan...' : 'Simpan Perubahan'}
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
          zIndex: 100005,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: (deleteConfirm.type === 'tenure' || deleteConfirm.type === 'division') && deleteConfirm.totalDependentCount > 0 ? '480px' : '440px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
            border: deleteConfirm.type === 'reset_all' 
              ? '1.5px solid rgba(56, 189, 248, 0.55)' 
              : (deleteConfirm.isBlocked
                  ? '1.5px solid rgba(255, 184, 0, 0.55)'
                  : '1.5px solid #f43f5e'),
            boxShadow: deleteConfirm.type === 'reset_all' 
              ? '0 10px 40px rgba(56, 189, 248, 0.25)' 
              : (deleteConfirm.isBlocked
                  ? '0 10px 40px rgba(255, 184, 0, 0.25)'
                  : '0 10px 40px rgba(244, 63, 94, 0.3)'),
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: deleteConfirm.type === 'reset_all' 
                ? 'rgba(56, 189, 248, 0.15)' 
                : (deleteConfirm.isBlocked
                    ? 'rgba(255, 184, 0, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)'),
              color: deleteConfirm.type === 'reset_all' 
                ? 'var(--neon-cyan)' 
                : (deleteConfirm.isBlocked
                    ? 'var(--mandiri-gold)'
                    : '#f43f5e'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              {deleteConfirm.type === 'reset_all' ? <RefreshCw size={26} /> : (deleteConfirm.isBlocked ? <AlertCircle size={28} /> : <AlertTriangle size={28} />)}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {deleteConfirm.type === 'reset_all' 
                ? 'Konfirmasi Sync Data' 
                : (deleteConfirm.isBlocked
                    ? (deleteConfirm.type === 'tenure'
                        ? (deleteConfirm.isOnlyTenure
                            ? 'Tidak Dapat Menghapus Periode'
                            : (deleteConfirm.isActiveTenure
                                ? 'Periode Sedang Aktif'
                                : 'Periode Masih Memiliki Data Terkait'))
                        : (deleteConfirm.type === 'division'
                            ? 'Divisi Masih Memiliki Data Terkait'
                            : (deleteConfirm.type === 'department'
                                ? 'Departemen Masih Digunakan RSVP'
                                : (deleteConfirm.type === 'member'
                                    ? 'Pimpro Masih Memimpin Anggota'
                                    : (deleteConfirm.type === 'event'
                                        ? 'Event Memiliki Data RSVP'
                                        : (deleteConfirm.type === 'form'
                                            ? 'Formulir Memiliki Data Pengisian'
                                            : 'Data Masih Memiliki Ketergantungan'))))))
                    : (deleteConfirm.type === 'gallery_photo'
                        ? 'Konfirmasi Hapus Foto'
                        : (deleteConfirm.type === 'tenure'
                            ? 'Konfirmasi Hapus Periode'
                            : (deleteConfirm.type === 'division'
                                ? 'Konfirmasi Hapus Divisi'
                                : (deleteConfirm.type === 'department'
                                    ? 'Konfirmasi Hapus Departemen'
                                    : (deleteConfirm.type === 'member'
                                        ? 'Konfirmasi Hapus Personel'
                                        : (deleteConfirm.type === 'event'
                                            ? 'Konfirmasi Hapus Event'
                                            : (deleteConfirm.type === 'form'
                                                ? 'Konfirmasi Hapus Formulir'
                                                : 'Konfirmasi Penghapusan Data'))))))))}
            </h3>

            {/* TENURE BODY */}
            {deleteConfirm.type === 'tenure' && (
              deleteConfirm.isOnlyTenure ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> adalah satu-satunya periode kepengurusan yang tersisa di sistem.
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1px solid rgba(255, 184, 0, 0.35)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ⚠️ <strong>Proteksi Sistem:</strong> Website mewajibkan minimal <strong>1 periode kepengurusan</strong> tetap ada agar struktur organisasi, event, dan informasi kabinet dapat beroperasi dengan normal.
                  </div>
                </>
              ) : deleteConfirm.isActiveTenure ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> saat ini berstatus sebagai <strong>Periode Aktif Utama</strong> (Default Website).
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1px solid rgba(255, 184, 0, 0.35)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ⚠️ <strong>Proteksi Periode Aktif:</strong> Anda tidak dapat menghapus periode yang sedang aktif. Silakan klik tombol <strong>"Jadikan Aktif"</strong> pada periode lain terlebih dahulu sebelum menghapus periode ini.
                  </div>
                </>
              ) : deleteConfirm.totalDependentCount > 0 ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih menaungi <strong>{deleteConfirm.totalDependentCount} data kepengurusan</strong>. Harap hapus atau pindahkan data berikut terlebih dahulu:
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.divCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.divCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Layers size={18} color={deleteConfirm.divCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Divisi Terkait</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.divCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.divCount} Divisi
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users size={18} color={deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Anggota / Pengurus</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.memCount} Orang
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CalendarDays size={18} color={deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Event</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.evtCount} Event
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.galCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.galCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <ImageIcon size={18} color={deleteConfirm.galCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Galeri Kegiatan</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.galCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.galCount} Album
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.formCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.formCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FileText size={18} color={deleteConfirm.formCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formulir Terkait</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.formCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.formCount} Formulir
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab data terkait di menu navigasi atas untuk menghapus atau mengalihkan periode data-data di atas sebelum menghapus periode ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus periode <strong>"{deleteConfirm.name}"</strong>? Data periode ini akan dihapus permanen dari sistem.
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Periode ini tidak aktif dan tidak memiliki dependensi data (0 Divisi, 0 Anggota, 0 Event, 0 Galeri, 0 Formulir).
                  </div>
                </>
              )
            )}

            {/* DIVISION BODY */}
            {deleteConfirm.type === 'division' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Divisi <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih menaungi <strong>{deleteConfirm.totalDependentCount} data kepengurusan</strong>. Harap alihkan atau hapus data berikut terlebih dahulu:
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: deleteConfirm.galCount > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users size={18} color={deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Anggota Divisi</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.memCount} Orang
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CalendarDays size={18} color={deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Event</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.evtCount} Event
                        </div>
                      </div>
                    </div>

                    {deleteConfirm.galCount > 0 && (
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <ImageIcon size={18} color="#f43f5e" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Galeri Terkait</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f43f5e' }}>
                            {deleteConfirm.galCount} Album
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab <strong>Anggota</strong> dan <strong>Event</strong> untuk memindahkan divisi personel/event atau menghapusnya terlebih dahulu sebelum menghapus divisi ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus divisi <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Divisi ini tidak menaungi anggota maupun event (0 Anggota, 0 Event).
                  </div>
                </>
              )
            )}

            {/* MEMBER BODY */}
            {deleteConfirm.type === 'member' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Personel <strong>"{deleteConfirm.name}"</strong> merupakan <strong>Pemimpin Proyek (Pimpro / Ketua)</strong> dari divisi <strong>"{deleteConfirm.divName}"</strong>.
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <Users size={20} color="#f43f5e" />
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Anggota Aktif di Bawah Divisi Ini</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                          {deleteConfirm.squadCount} Anggota Divisi
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Menghapus ketua divisi akan menyebabkan anggota squad di bawahnya kehilangan garis komando di bagan struktur organisasi. Silakan tunjuk Pimpro pengganti atau alihkan anggota divisi terlebih dahulu.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus personel <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.4
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Personel tidak memimpin anggota divisi aktif. Berkas foto akan dibersihkan dari storage cloud.
                  </div>
                </>
              )
            )}

            {/* EVENT BODY */}
            {deleteConfirm.type === 'event' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Event <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih memiliki <strong>{deleteConfirm.rsvpCount} data konfirmasi RSVP</strong> dari pegawai.
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <ClipboardList size={20} color="#f43f5e" />
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Data RSVP Terdaftar</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                          {deleteConfirm.rsvpCount} Pegawai / Pendaftar
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab <strong>Kehadiran RSVP</strong> untuk meninjau dan mengekspor rekap pendaftar, lalu bersihkan riwayat RSVP event ini terlebih dahulu sebelum menghapusnya.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus event <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Event ini tidak memiliki riwayat RSVP pendaftar (0 RSVP).
                  </div>
                </>
              )
            )}

            {/* FORM BODY */}
            {deleteConfirm.type === 'form' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Formulir <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena sudah memiliki <strong>{deleteConfirm.submissionCount} berkas/respon masuk</strong> dari peserta.
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <FileCheck2 size={20} color="#f43f5e" />
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Data Pengisian Peserta</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                          {deleteConfirm.submissionCount} Respon Terkirim
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab <strong>Data Pengisian Form</strong> untuk meninjau, mengunduh lampiran, atau mengekspor data peserta sebelum membersihkan respon jika formulir ini hendak dihapus.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus formulir dinamis <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Formulir ini tidak memiliki kiriman berkas peserta (0 Berkas).
                  </div>
                </>
              )
            )}

            {/* DEPARTMENT BODY */}
            {deleteConfirm.type === 'department' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Departemen <strong>"{deleteConfirm.name}"</strong> tidak dapat dihapus karena masih digunakan oleh <strong>{deleteConfirm.rsvpCount} pendaftaran RSVP event</strong>.
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab RSVP Event untuk menghapus atau menyesuaikan data pendaftaran terkait sebelum menghapus departemen ini demi konsistensi data.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus departemen <strong>"{deleteConfirm.name}"</strong>? Departemen ini tidak akan lagi muncul pada opsi pilihan RSVP event.
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Tidak ada riwayat RSVP event yang terhubung dengan departemen ini.
                  </div>
                </>
              )
            )}

            {/* GALLERY PHOTO BODY */}
            {deleteConfirm.type === 'gallery_photo' && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong> dari daftar dokumentasi kegiatan? Foto di cloud storage akan otomatis dibersihkan saat Anda klik <strong>Simpan Perubahan</strong>.
              </p>
            )}

            {/* DEFAULT BODY FOR OTHER TYPES */}
            {deleteConfirm.type !== 'tenure' && deleteConfirm.type !== 'division' && deleteConfirm.type !== 'department' && deleteConfirm.type !== 'member' && deleteConfirm.type !== 'event' && deleteConfirm.type !== 'form' && deleteConfirm.type !== 'gallery_photo' && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {deleteConfirm.type === 'reset_all' ? (
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    Clear Cache dan Reload Data? Data tidak akan terhapus melainkan akan dimuat ulang
                  </span>
                ) : (
                  <>Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong>?</>
                )}
              </p>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {deleteConfirm.isBlocked ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    padding: '9px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-blue)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 82, 155, 0.35)'
                  }}
                >
                  Mengerti & Tutup
                </button>
              ) : (
                <>
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
                      if (deleteConfirm.type === 'department' && onDeleteDepartment) onDeleteDepartment(deleteConfirm.id);
                      if (deleteConfirm.type === 'gallery' && onDeleteGallery) onDeleteGallery(deleteConfirm.id);
                      if (deleteConfirm.type === 'tenure' && onDeleteTenure) onDeleteTenure(deleteConfirm.id);
                      if (deleteConfirm.type === 'kudos' && onDeleteKudos) onDeleteKudos(deleteConfirm.id);
                      if (deleteConfirm.type === 'aspirasi' && onDeleteAspirasi) onDeleteAspirasi(deleteConfirm.id);
                      if (deleteConfirm.type === 'event_rsvp' && onDeleteEventRsvp) onDeleteEventRsvp(deleteConfirm.id);
                      if (deleteConfirm.type === 'form' && onDeleteForm) onDeleteForm(deleteConfirm.id, true);
                      if (deleteConfirm.type === 'event' && onDeleteEvent) onDeleteEvent(deleteConfirm.id);
                      if (deleteConfirm.type === 'submission' && onDeleteSubmission) onDeleteSubmission(deleteConfirm.id);
                      if (deleteConfirm.type === 'brand_asset' && onDeleteBrandAsset) onDeleteBrandAsset(deleteConfirm.id);
                      if (deleteConfirm.type === 'faq' && onDeleteFaq) onDeleteFaq(deleteConfirm.id);
                      if (deleteConfirm.type === 'reset_all' && onResetDefault) onResetDefault();
                      if (deleteConfirm.type === 'gallery_photo') {
                        if (editingItem && editingItem.item) {
                          const nextPhotos = (editingItem.item.photos || []).filter((_, i) => i !== deleteConfirm.photoIdx);
                          setEditingItem({ ...editingItem, item: { ...editingItem.item, photos: nextPhotos } });
                        }
                      }

                      const toastMsg = deleteConfirm.type === 'reset_all' 
                        ? 'Cache berhasil dibersihkan & data berhasil dimuat ulang!' 
                        : (deleteConfirm.type === 'gallery_photo'
                            ? `${deleteConfirm.name} berhasil dihapus dari daftar!`
                            : (deleteConfirm.type === 'tenure'
                            ? `Periode "${deleteConfirm.name}" berhasil dihapus!`
                            : (deleteConfirm.type === 'division'
                                ? `Divisi "${deleteConfirm.name}" berhasil dihapus!`
                                : (deleteConfirm.type === 'member'
                                    ? `Personel "${deleteConfirm.name}" berhasil dihapus!`
                                    : (deleteConfirm.type === 'department'
                                        ? `Departemen "${deleteConfirm.name}" berhasil dihapus!`
                                        : (deleteConfirm.type === 'event'
                                            ? `Event "${deleteConfirm.name}" berhasil dihapus!`
                                            : (deleteConfirm.type === 'form'
                                                ? `Formulir "${deleteConfirm.name}" berhasil dihapus!`
                                                : 'Data berhasil dihapus & disinkronkan!')))))));

                      setDeleteConfirm(null);
                      showToast(toastMsg);
                    }}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 'var(--radius-full)',
                      background: deleteConfirm.type === 'reset_all' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f43f5e',
                      border: deleteConfirm.type === 'reset_all' ? '1px solid rgba(56, 189, 248, 0.45)' : 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: deleteConfirm.type === 'reset_all' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none'
                    }}
                  >
                    {deleteConfirm.type === 'reset_all' 
                      ? 'Ya, Sync Data' 
                      : (deleteConfirm.type === 'gallery_photo'
                          ? 'Hapus Foto'
                          : (deleteConfirm.type === 'tenure' 
                              ? 'Ya, Hapus Periode' 
                              : (deleteConfirm.type === 'division'
                                  ? 'Ya, Hapus Divisi'
                                  : (deleteConfirm.type === 'member'
                                      ? 'Ya, Hapus Personel'
                                      : (deleteConfirm.type === 'department'
                                          ? 'Ya, Hapus Departemen'
                                          : (deleteConfirm.type === 'event'
                                              ? 'Ya, Hapus Event'
                                              : (deleteConfirm.type === 'form'
                                                  ? 'Ya, Hapus Formulir'
                                                  : 'Ya, Hapus Data')))))))}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      {showExecutiveReportModal && (() => {
        const completedEvents = events.filter(e => e.status === 'Completed').length;
        const eventPercent = events.length > 0 ? Math.round((completedEvents / events.length) * 100) : 0;
        const totalRab = events.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);
        const coreLeaders = members.filter(m => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro');
        const realizedAspirasi = aspirasiList.filter(a => a.status === 'Sudah Direalisasikan').length;

        return (
          <div className="executive-report-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div className="glass-panel modal-container executive-report-container" style={{
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
                  <h2 style={{ fontSize: 'clamp(1.15rem, 4vw, 1.45rem)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Laporan Pertanggungjawaban & Progres CNT IT APD
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Periode: <strong>{activeTenure?.title || activeTenure?.code || 'Kepengurusan Aktif'}</strong>{activeTenure?.themeTagline ? ` • Tema: "${activeTenure.themeTagline}"` : ''}
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(135px, 42vw, 170px), 1fr))', gap: '10px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL PERSONEL</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{members.length} Orang</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{members.filter(m => m.category === 'pembina').length} Pembina • 4 Divisi & BPH Inti</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>REALISASI KEGIATAN</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{completedEvents}/{events.length} ({eventPercent}%)</div>
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

              {/* 2. Tabel Realisasi Kegiatan & Anggaran */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  I. Rekapitulasi Kegiatan & Rencana Anggaran Biaya (RAB)
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '580px' }}>
                    <thead>
                      <tr style={{ background: 'var(--input-bg)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Nama Kegiatan</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Divisi</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Jadwal</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Target Peserta</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Status</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)', textAlign: 'right' }}>Total RAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Belum ada kegiatan yang terdaftar di database untuk periode ini.
                          </td>
                        </tr>
                      ) : (
                        events.map((evt) => (
                          <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{evt.title}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.divisionName}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.date || formatWibEventRange(evt.startDate, evt.endDate)}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.peserta || evt.kpi}</td>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Susunan Pimpinan & Ketua Divisi */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  II. Susunan Dewan Pembina, Pengurus Inti & Ketua Divisi (Pimpro)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(170px, 45vw, 220px), 1fr))', gap: '10px' }}>
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
