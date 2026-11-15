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
  Shield,
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
  MessageCircle,
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
  buildFlexibleDate,
  formatLastUpdatedWib
} from '../utils/dateUtils';
import {
  LEVEL_OPTIONS,
  getTenureRoles,
  getCategoryFromLevel,
  canDeleteRole,
  findMatchingRole,
  getMemberLevel,
  validateMemberQuota,
  getTenureQuotaSummary,
  getMemberRoleType,
  formatLevelOptionLabel,
  getDivisionLead,
  getDivisionStructure
} from '../utils/memberQuotaUtils';

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
    event: true,
    program: true,
    galeri: true,
    kudos: true,
    assets: true,
    form: true,
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
  roleQuotas = {},
  onUpdateRoleQuotas,
  tenureRoles = [],
  onAddTenureRole,
  onUpdateTenureRole,
  onDeleteTenureRole,
  syncStatus = 'synced',
  onForceSync,
  onResetDefault,
  onRestoreBackup,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';
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

  // Dynamic Role & Organization Management States
  const [isOrgRolesOpen, setIsOrgRolesOpen] = useState(false);
  const [selectedOrgTenureId, setSelectedOrgTenureId] = useState(activeTenure?.id || tenures[0]?.id || '');
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    mode: 'add',
    tenureId: '',
    role: { id: '', name: '', level: 5, max: 0, requiresDivision: true }
  });
  const [roleDeleteWarning, setRoleDeleteWarning] = useState(null);

  // Search & Filter states for Members in Admin
  // Form & filter states for Role Management
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleTenureId, setNewRoleTenureId] = useState(activeTenure?.id || '');
  const [newRoleLevel, setNewRoleLevel] = useState(5);
  const [newRoleMax, setNewRoleMax] = useState(0);
  const [newRoleRequiresDivision, setNewRoleRequiresDivision] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleTenureFilter, setRoleTenureFilter] = useState('all');
  const [roleLevelFilter, setRoleLevelFilter] = useState('all');
  const [rolePage, setRolePage] = useState(1);

  const [adminMemSearch, setAdminMemSearch] = useState('');
  const [adminMemTenureFilter, setAdminMemTenureFilter] = useState('all');
  const [adminMemCatFilter, setAdminMemCatFilter] = useState('all');
  const [adminMemDivFilter, setAdminMemDivFilter] = useState('all');
  const [adminMemPage, setAdminMemPage] = useState(1);

  // Search & Filter states for Events in Admin
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventTenureFilter, setEventTenureFilter] = useState('all');
  const [eventCatFilter, setEventCatFilter] = useState('all');
  const [eventDivFilter, setEventDivFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [adminEventPage, setAdminEventPage] = useState(1);
  const [adminRsvpPage, setAdminRsvpPage] = useState(1);
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState('');
  const [rsvpEventFilter, setRsvpEventFilter] = useState('all');
  const [rsvpModeFilter, setRsvpModeFilter] = useState('all');

  // Search & Filter states for Gallery in Admin
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryTenureFilter, setGalleryTenureFilter] = useState('all');
  const [galleryDivFilter, setGalleryDivFilter] = useState('all');
  const [adminGalleryPage, setAdminGalleryPage] = useState(1);

  // Search & Filter states for Submissions & Reports in Admin
  const [subTenureFilter, setSubTenureFilter] = useState('all');
  const [reportTenureId, setReportTenureId] = useState('');

  // Search & Filter states for Kudos & Aspirasi in Admin
  const [kudosSearchQuery, setKudosSearchQuery] = useState('');
  const [kudosCatFilter, setKudosCatFilter] = useState('all');
  const [adminKudosPage, setAdminKudosPage] = useState(1);
  const [aspirasiSearchQuery, setAspirasiSearchQuery] = useState('');
  const [aspirasiAdminCatFilter, setAspirasiAdminCatFilter] = useState('all');
  const [aspirasiAdminStatusFilter, setAspirasiAdminStatusFilter] = useState('all');
  const [adminAspirasiPage, setAdminAspirasiPage] = useState(1);

  // Search & Filter states for FAQs in Admin
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCatFilter, setFaqCatFilter] = useState('all');
  const [adminFaqPage, setAdminFaqPage] = useState(1);

  // Search, Filter & Pagination states for Brand Assets in Admin
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetCatFilter, setAssetCatFilter] = useState('all');
  const [assetPage, setAssetPage] = useState(1);

  // Search, Filter & Pagination states for Forms in Admin
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formTenureFilter, setFormTenureFilter] = useState('all');
  const [formCatFilter, setFormCatFilter] = useState('all');
  const [formStatusFilter, setFormStatusFilter] = useState('all');
  const [formPage, setFormPage] = useState(1);

  // Search & Filter states for Submissions in Admin
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subCurrentPage, setSubCurrentPage] = useState(1);

  // Form states for new Brand Asset
  const [assetTitle, setAssetTitle] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetBadge, setAssetBadge] = useState('');
  const [assetFileType, setAssetFileType] = useState('');
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
  const [memRoleId, setMemRoleId] = useState('');
  const [memDivisionId, setMemDivisionId] = useState('');
  const [memTenureId, setMemTenureId] = useState(activeTenure?.id || '');
  const [memWhatsapp, setMemWhatsapp] = useState('');
  const [memMotto, setMemMotto] = useState('');
  const [memImage, setMemImage] = useState('');

  // Form states for new division
  const [newDivName, setNewDivName] = useState('');
  const [newDivColor, setNewDivColor] = useState('#00529B');
  const [newDivDesc, setNewDivDesc] = useState('');
  const [newDivFocus, setNewDivFocus] = useState('');
  const [newDivTenureId, setNewDivTenureId] = useState(activeTenure?.id || '');
  const [divSearchQuery, setDivSearchQuery] = useState('');
  const [divTenureFilter, setDivTenureFilter] = useState('all');
  const [divRecruitFilter, setDivRecruitFilter] = useState('all');
  const [divPage, setDivPage] = useState(1);

  // Form states for new department
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptRsvpFilter, setDeptRsvpFilter] = useState('all');
  const [deptPage, setDeptPage] = useState(1);

  // Form states for new tenure
  const [newTenureCode, setNewTenureCode] = useState('');
  const [newTenureTitle, setNewTenureTitle] = useState('');
  const [newTenureTagline, setNewTenureTagline] = useState('');
  const [newTenureHeadline, setNewTenureHeadline] = useState('');
  const [newTenureHighlight, setNewTenureHighlight] = useState('');
  const [newTenureVisi, setNewTenureVisi] = useState('');
  const [newTenureMisi, setNewTenureMisi] = useState('');
  const [tenureSearchQuery, setTenureSearchQuery] = useState('');
  const [tenureStatusFilter, setTenureStatusFilter] = useState('all');
  const [tenurePage, setTenurePage] = useState(1);

  // Recruitment controls
  const [isRecruitOpen, setIsRecruitOpen] = useState(recruitmentInfo?.isOpen ?? true);
  const [recruitDeadline, setRecruitDeadline] = useState(recruitmentInfo?.deadline ?? '');

  // Form Creator & Field Builder States
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormCategory, setNewFormCategory] = useState('');
  const [newFormDeadline, setNewFormDeadline] = useState('');
  const [newFormSubtitle, setNewFormSubtitle] = useState('');
  const [newFormRequiresTracking, setNewFormRequiresTracking] = useState(true);
  const [newFormShowAnnouncement, setNewFormShowAnnouncement] = useState(false);
  const [newFormIsLimited, setNewFormIsLimited] = useState(false);
  const [newFormMaxQuota, setNewFormMaxQuota] = useState('');
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

  // Form states for new Gallery Event (Flexible 5 Date Modes)
  const [galTitle, setGalTitle] = useState('');
  const [galDateMode, setGalDateMode] = useState('date'); // 'date' | 'dates' | 'range' | 'month' | 'year'
  const [galDateVal, setGalDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [galDates, setGalDates] = useState([
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  ]);
  const [galStartDate, setGalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [galEndDate, setGalEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [galMonth, setGalMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [galYear, setGalYear] = useState(String(new Date().getFullYear()));
  const [galDivisionId, setGalDivisionId] = useState('');
  const [galDivision, setGalDivision] = useState('');
  const [galTenureId, setGalTenureId] = useState(activeTenure?.id || '');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotos, setGalPhotos] = useState('');

  // Form states for Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [eventDivId, setEventDivId] = useState('');
  const [eventTenureId, setEventTenureId] = useState(activeTenure?.id || '');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventKpi, setEventKpi] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventRab, setEventRab] = useState('');
  const [eventStatus, setEventStatus] = useState('Upcoming');
  const [eventIsLimited, setEventIsLimited] = useState(false);
  const [eventMaxQuota, setEventMaxQuota] = useState('');

  // Form State: New FAQ
  const [faqCategory, setFaqCategory] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const handleCreateFaq = (e) => {
    e.preventDefault();
    const errs = {};
    if (!faqCategory.trim()) errs.faqCategory = 'Kategori Topik FAQ wajib dipilih / diisi';
    if (!faqQuestion.trim()) errs.faqQuestion = 'Pertanyaan FAQ wajib diisi';
    if (!faqAnswer.trim()) errs.faqAnswer = 'Jawaban / penjelasan FAQ wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi seluruh kolom wajib pada form FAQ', 'error');
      return;
    }

    if (onAddFaq) {
      onAddFaq({
        id: 'faq-' + Date.now(),
        category: faqCategory.trim(),
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        isPublished: true
      });
    }

    setFaqCategory('');
    setFaqQuestion('');
    setFaqAnswer('');
    showToast('Pertanyaan FAQ baru berhasil ditambahkan & disinkronkan!');
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    const errs = {};
    if (!eventTitle.trim()) errs.eventTitle = 'Nama Event wajib diisi';
    if (!eventCategory.trim()) errs.eventCategory = 'Kategori Kegiatan wajib dipilih';
    if (!eventStartDate) errs.eventStartDate = 'Tanggal & Jam Mulai wajib dipilih';
    if (!eventEndDate) errs.eventEndDate = 'Tanggal & Jam Berakhir wajib dipilih';
    if (eventStartDate && eventEndDate) {
      const normStart = toDatetimeLocalValue(eventStartDate);
      const normEnd = toDatetimeLocalValue(eventEndDate);
      if (normStart && normEnd && normStart > normEnd) {
        errs.eventStartDate = 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir';
        errs.eventEndDate = 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai';
      }
    }
    if (!eventDesc.trim()) errs.eventDesc = 'Deskripsi Event wajib diisi';
    if (eventRab === '' || eventRab === undefined || eventRab === null || isNaN(Number(eventRab)) || Number(eventRab) < 0) {
      errs.eventRab = 'Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)';
    }
    if (eventIsLimited) {
      if (!eventMaxQuota || isNaN(Number(eventMaxQuota)) || Number(eventMaxQuota) <= 0) {
        errs.eventMaxQuota = 'Batas maksimal kuota wajib diisi angka lebih dari 0';
      }
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
      const firstErrMsg = errs.eventStartDate || errs.eventEndDate || 'Mohon lengkapi kolom wajib pada form Event';
      showToast(firstErrMsg, 'error');
      return;
    }

    const divObj = divisions.find(d => d.id === eventDivId);

    const sDate = toDatetimeLocalValue(eventStartDate) || new Date().toISOString().split('T')[0];
    const eDate = toDatetimeLocalValue(eventEndDate) || sDate;
    const dateLabel = formatWibEventRange(sDate, eDate);

    const finalCategory = eventCategory.trim();

    if (onAddEvent) {
      onAddEvent({
        id: 'evt-' + Date.now(),
        tenureId: eventTenureId || activeTenure?.id || '',
        divisionId: eventDivId,
        divisionName: divObj?.name || '',
        title: eventTitle.trim(),
        date: dateLabel,
        startDate: sDate,
        endDate: eDate,
        category: finalCategory,
        kategori: finalCategory,
        badge: finalCategory,
        location: eventLocation.trim() || '',
        peserta: eventKpi.trim() || '',
        kpi: eventKpi.trim() || '',
        description: eventDesc.trim(),
        status: eventStatus,
        isLimited: eventIsLimited,
        maxQuota: eventIsLimited ? Number(eventMaxQuota || 0) : 0,
        totalRab: Number(eventRab)
      });
    }

    const savedTitle = eventTitle.trim();
    setEventTitle('');
    setEventCategory('');
    setEventStartDate('');
    setEventEndDate('');
    setEventLocation('');
    setEventKpi('');
    setEventDesc('');
    setEventRab('');
    setEventIsLimited(false);
    setEventMaxQuota('');
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
    const availableRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
    if (availableRoles.length === 0) {
      errs.memRole = 'Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.';
    }
    const selectedRole = availableRoles.find(r => r.id === memRoleId) || 
      availableRoles.find(r => r.name.toLowerCase() === (memRole || '').toLowerCase()) ||
      null;

    if (!selectedRole && availableRoles.length > 0) {
      errs.memRole = 'Jabatan / Role wajib dipilih';
    }

    if (selectedRole?.requiresDivision) {
      const availableDivsForMember = divisions.filter(d => d.tenureId === targetTenureId);
      if (availableDivsForMember.length === 0) {
        errs.memDivisionId = 'Divisi masih kosong pada periode ini. Silakan buat divisi terlebih dahulu.';
      } else if (!memDivisionId || !availableDivsForMember.some(d => d.id === memDivisionId)) {
        errs.memDivisionId = `Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`;
      }
    }

    // Validasi kuota dinamis
    const quotaCheck = validateMemberQuota(
      {
        tenureId: targetTenureId,
        roleId: selectedRole?.id,
        role: selectedRole?.name || memRole,
        divisionId: selectedRole?.requiresDivision ? memDivisionId : undefined
      },
      members,
      divisions,
      roleQuotas,
      tenureRoles
    );

    if (!quotaCheck.isValid) {
      errs[quotaCheck.field || 'memRole'] = quotaCheck.error;
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast(quotaCheck.error, 'error');
      return;
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Personel', 'error');
      return;
    }

    let finalImageUrl = (memImage || '').trim();

    // Validasi URL foto jika diinput dalam bentuk tautan web
    if (finalImageUrl && !pendingMemberPhoto && !finalImageUrl.startsWith('blob:')) {
      setIsUploadingMedia(true);
      showToast('Memverifikasi tautan foto profil...');
      const check = await verifyImageUrl(finalImageUrl, { requireHttps: true, allowRelative: false });
      if (!check.valid) {
        setIsUploadingMedia(false);
        setFormErrors((prev) => ({ ...prev, memImage: check.error }));
        showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
        return;
      }
      setIsUploadingMedia(false);
    }

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

    const divObj = selectedRole?.requiresDivision ? divisions.find(d => d.id === memDivisionId) : null;
    const finalRoleName = selectedRole?.requiresDivision && selectedRole?.name.toLowerCase() === 'pimpro' && divObj
      ? `Pimpro ${divObj.name}`
      : (selectedRole?.name || memRole || 'Anggota Divisi');
    const finalCategory = getCategoryFromLevel(selectedRole?.level ?? 5);

    onAddMember({
      id: 'mem-' + Date.now(),
      tenureId: targetTenureId,
      divisionId: selectedRole?.requiresDivision ? memDivisionId : undefined,
      roleId: selectedRole?.id,
      category: finalCategory,
      name: memName,
      role: finalRoleName,
      title: divObj?.name || '',
      image: finalImageUrl,
      color: divObj?.color || '#FFB800',
      whatsapp: memWhatsapp.trim(),
      motto: memMotto.trim() || '',
      responsibilities: []
    });

    const savedName = memName;
    setMemName('');
    setMemRole('');
    setMemRoleId('');
    setMemWhatsapp('');
    setMemMotto('');
    setMemImage('');
    setPendingMemberPhoto(null);
    showToast(`Pengurus/Anggota "${savedName}" berhasil ditambahkan & tersimpan di Cloud!`);
  };

  const handleSaveRole = async (targetTenureId, roleData) => {
    if (!roleData.name || !roleData.name.trim()) {
      showToast('Nama Jabatan/Role wajib diisi', 'error');
      return;
    }
    const currentRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
    let updatedRoles;
    if (roleData.id) {
      updatedRoles = currentRoles.map(r => r.id === roleData.id ? {
        ...r,
        name: roleData.name.trim(),
        level: Number(roleData.level ?? 5),
        max: Number(roleData.max ?? 0),
        requiresDivision: Boolean(roleData.requiresDivision)
      } : r);
    } else {
      const newRole = {
        id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tenureId: targetTenureId,
        name: roleData.name.trim(),
        level: Number(roleData.level ?? 5),
        max: Number(roleData.max ?? 0),
        maxQuota: Number(roleData.max ?? 0),
        requiresDivision: Boolean(roleData.requiresDivision)
      };
      updatedRoles = [...currentRoles, newRole];
      if (onAddTenureRole) onAddTenureRole(newRole);
    }

    if (roleData.id && onUpdateTenureRole) {
      onUpdateTenureRole({
        ...roleData,
        tenureId: targetTenureId,
        name: roleData.name.trim(),
        level: Number(roleData.level ?? 5),
        max: Number(roleData.max ?? 0),
        maxQuota: Number(roleData.max ?? 0),
        requiresDivision: Boolean(roleData.requiresDivision)
      });
    }

    const updatedQuotas = {
      ...(roleQuotas || {}),
      [targetTenureId]: {
        ...(roleQuotas?.[targetTenureId] || {}),
        roles: updatedRoles
      }
    };

    if (onUpdateRoleQuotas) {
      await onUpdateRoleQuotas(updatedQuotas);
    }
    setRoleModal({ isOpen: false, mode: 'add', tenureId: '', role: { id: '', name: '', level: 5, max: 0, requiresDivision: true } });
    showToast(`Role "${roleData.name}" berhasil disimpan untuk periode kepengurusan ini!`);
  };

  const handleDeleteRole = async (targetTenureId, roleToDelete) => {
    const check = canDeleteRole(roleToDelete, targetTenureId, members);
    if (!check.canDelete) {
      setRoleDeleteWarning({
        role: roleToDelete,
        tenureId: targetTenureId,
        reason: check.reason,
        members: check.members
      });
      return;
    }
    const currentRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
    const updatedRoles = currentRoles.filter(r => r.id !== roleToDelete.id);
    const updatedQuotas = {
      ...(roleQuotas || {}),
      [targetTenureId]: {
        ...(roleQuotas?.[targetTenureId] || {}),
        roles: updatedRoles
      }
    };
    if (onDeleteTenureRole) {
      onDeleteTenureRole(roleToDelete.id);
    }
    if (onUpdateRoleQuotas) {
      await onUpdateRoleQuotas(updatedQuotas);
    }
    showToast(`Role "${roleToDelete.name}" berhasil dihapus.`);
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
      tenureId: newDivTenureId || activeTenure?.id || '',
      name: newDivName,
      slug: newDivName.toLowerCase().replace(/\s+/g, '-'),
      memberId: null,
      leadName: '',
      color: newDivColor || '#00529B',
      motto: '',
      description: newDivDesc.trim() || '',
      focusAreas: newDivFocus ? newDivFocus.split(',').map(s => s.trim()).filter(Boolean) : [],
      isRecruiting: false
    });

    const savedDiv = newDivName;
    setNewDivName('');
    setNewDivDesc('');
    setNewDivFocus('');
    showToast(`Divisi "${savedDiv}" berhasil ditambahkan & disinkronkan!`);
  };

  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setFormErrors((prev) => ({ ...prev, newRoleName: 'Nama Jabatan / Role wajib diisi' }));
      showToast('Mohon isi Nama Jabatan terlebih dahulu', 'error');
      return;
    }
    const targetTenureId = newRoleTenureId || activeTenure?.id || tenures[0]?.id || '';
    const isDuplicate = (tenureRoles || []).some(
      (r) => r.tenureId === targetTenureId && r.name.toLowerCase().trim() === newRoleName.toLowerCase().trim()
    );
    if (isDuplicate) {
      setFormErrors((prev) => ({ ...prev, newRoleName: 'Role dengan nama ini sudah terdaftar pada periode tersebut' }));
      showToast('Role dengan nama ini sudah terdaftar pada periode tersebut', 'error');
      return;
    }

    const nowIso = new Date().toISOString();
    if (onAddTenureRole) {
      onAddTenureRole({
        id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tenureId: targetTenureId,
        name: newRoleName.trim(),
        level: Number(newRoleLevel ?? 5),
        max: Number(newRoleMax ?? 0),
        maxQuota: Number(newRoleMax ?? 0),
        requiresDivision: Boolean(newRoleRequiresDivision),
        sortOrder: tenureRoles.length,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }

    const savedRole = newRoleName;
    setNewRoleName('');
    setNewRoleMax(0);
    setNewRoleRequiresDivision(false);
    clearFieldError('newRoleName');
    showToast(`Role "${savedRole}" berhasil ditambahkan & disinkronkan ke Cloud!`);
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
        description: newDeptDesc.trim() || '',
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
    const errors = {};
    if (!newTenureCode.trim()) {
      errors.newTenureCode = 'Kode Tahun Kepengurusan wajib diisi';
    }
    if (!newTenureTitle.trim()) {
      errors.newTenureTitle = 'Nama Periode Kepengurusan wajib diisi';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      showToast('Mohon lengkapi field wajib (Kode Tahun & Nama Periode)', 'error');
      return;
    }

    onAddTenure({
      id: 'tenure-' + newTenureCode,
      code: newTenureCode,
      title: newTenureTitle.trim() || '',
      themeTagline: newTenureTagline.trim() || '',
      heroHeadline: newTenureHeadline.trim() || '',
      heroHighlight: newTenureHighlight.trim() || '',
      visi: newTenureVisi.trim() || '',
      misi: newTenureMisi 
        ? newTenureMisi.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
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
    if (!assetCategory.trim()) errs.assetCategory = 'Kategori Asset wajib dipilih';
    if (!assetFileType.trim()) errs.assetFileType = 'Format File Asset wajib diisi';
    if (!pendingAssetFile && !pendingPreviewFile && !assetFileUrl.trim() && !assetPreviewUrl.trim()) {
      errs.assetFileUrl = 'File atau URL Download wajib dipilih / diisi';
    }
    if (assetFileUrl.trim() && !pendingAssetFile) {
      const isValidUrl = /^https?:\/\/.+/i.test(assetFileUrl.trim()) || assetFileUrl.trim().startsWith('/');
      if (!isValidUrl) {
        errs.assetFileUrl = 'URL file harus berupa tautan web yang valid (diawali http:// atau https://)';
      }
    }
    if (assetPreviewUrl.trim() && !pendingPreviewFile) {
      const isValidUrl = /^https?:\/\/.+/i.test(assetPreviewUrl.trim()) || assetPreviewUrl.trim().startsWith('/');
      if (!isValidUrl) {
        errs.assetPreviewUrl = 'URL preview harus berupa tautan web yang valid (diawali http:// atau https://)';
      }
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi seluruh kolom wajib pada form Asset', 'error');
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

    const isImageFile = (url) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');
    const effectiveFileUrl = finalFileUrl || (isImageFile(finalPreviewUrl) ? finalPreviewUrl : '');
    const effectivePreviewUrl = finalPreviewUrl || (isImageFile(finalFileUrl) ? finalFileUrl : '');

    if (!effectiveFileUrl) {
      showToast('Gagal: File asset atau URL download tidak boleh kosong. Silakan pilih berkas kembali.', 'error');
      return;
    }

    if (onAddBrandAsset) {
      onAddBrandAsset({
        id: 'asset-' + Date.now(),
        title: assetTitle.trim(),
        category: assetCategory.trim(),
        badge: assetBadge.trim() || '',
        fileType: assetFileType.trim(),
        fileSize: assetFileSize.trim() || '',
        fileUrl: effectiveFileUrl,
        previewUrl: effectivePreviewUrl,
        description: assetDesc.trim() || ''
      });
    }

    const saved = assetTitle.trim();
    setAssetTitle('');
    setAssetCategory('');
    setAssetBadge('');
    setAssetFileType('');
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
  const verifyImageUrl = (url, options = {}) => {
    const { requireHttps = false, allowRelative = false } = options;
    return new Promise((resolve) => {
      if (!url || typeof url !== 'string') {
        return resolve({ valid: false, error: 'URL tidak boleh kosong' });
      }
      const trimmed = url.trim();
      if (trimmed.startsWith('blob:')) {
        return resolve({ valid: true });
      }
      if (allowRelative && (trimmed.startsWith('/images/') || trimmed.startsWith('/assets/'))) {
        return resolve({ valid: true });
      }
      let parsed;
      try {
        parsed = new URL(trimmed);
        if (requireHttps) {
          if (parsed.protocol !== 'https:') {
            return resolve({ valid: false, error: 'Tautan URL foto wajib diawali dengan https://' });
          }
        } else if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return resolve({ valid: false, error: 'Tautan harus diawali dengan http:// atau https://' });
        }
      } catch {
        return resolve({ valid: false, error: requireHttps ? 'Format tautan URL tidak valid (wajib diawali https://)' : 'Format tautan URL tidak valid' });
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
      dates: galDates,
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
    setGalDates([
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    ]);
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
              Portal Pengurus CNT IT APD
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Masuk untuk mengelola galeri, event, divisi, form, dll.
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
        const activeTenureId = activeTenure?.id || '';
        const scopedMembers = activeTenureId ? members.filter(m => m.tenureId === activeTenureId) : members;
        const scopedEvents = activeTenureId
          ? events.filter(e => e.tenureId === activeTenureId || (!e.tenureId && divisions.find(d => d.id === e.divisionId)?.tenureId === activeTenureId))
          : events;
        const completedEvents = scopedEvents.filter(e => e.status === 'Completed').length;
        const eventPercent = scopedEvents.length > 0 ? Math.round((completedEvents / scopedEvents.length) * 100) : 0;
        const totalRab = scopedEvents.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);

        const scopedForms = activeTenureId ? forms.filter(f => f.tenureId === activeTenureId) : forms;
        const scopedFormIds = new Set(scopedForms.map(f => f.id));
        const scopedSubs = activeTenureId
          ? submissions.filter(s => s.tenureId === activeTenureId || scopedFormIds.has(s.formId))
          : submissions;
        const acceptedSubs = scopedSubs.filter(s => s.status === 'Accepted').length;
        const pendingSubs = scopedSubs.filter(s => !s.status || s.status === 'Submitted').length;

        const tenureLabel = activeTenure?.code || activeTenure?.title || 'Aktif';

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
                Personel ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {scopedMembers.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {scopedMembers.filter(m => m.category === 'pembina').length} Pembina • {scopedMembers.filter(m => m.category === 'inti').length} BPH • {scopedMembers.filter(m => m.category === 'pimpro').length} Pimpro • {scopedMembers.filter(m => m.category === 'anggota').length} Squad
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Realisasi Event ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {completedEvents}/{scopedEvents.length} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>({eventPercent}%)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {scopedEvents.length - completedEvents} Agenda Upcoming / Berjalan
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Total RAB ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                Rp {(totalRab / 1000000).toFixed(1)} Jt
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Akumulasi {scopedEvents.length} Event Periode {tenureLabel}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Data Respon ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {scopedSubs.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Respon</span>
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
          { id: 'roles', label: `Role & Jabatan (${tenureRoles.length})`, icon: Shield },
          { id: 'visibility', label: 'Visibilitas Halaman & Navbar', icon: Eye },
          { id: 'events', label: `Event (${events.length})`, icon: CalendarDays },
          { id: 'forms', label: `Kelola Formulir (${forms.length})`, icon: ClipboardList },
          { id: 'submissions', label: `Data Pengisian Form (${submissions.length + applications.length})`, icon: FileCheck2 },
          { id: 'kudos', label: `Kudos & Aspirasi (${kudosList.length + aspirasiList.length})`, icon: Heart },
          { id: 'gallery', label: `Galeri Kegiatan (${galleries.length})`, icon: ImageIcon },
          { id: 'assets', label: `Asset & Template (${brandAssets.length})`, icon: Download },
          { id: 'faqs', label: `Panduan & FAQ (${faqs.length})`, icon: MessageSquare },
          { id: 'departments', label: `Kelola Departemen (${departments.length})`, icon: Building2 },
          { id: 'divisions', label: `Kelola Divisi (${divisions.length})`, icon: Layers },
          { id: 'tenure', label: `Periode Kepengurusan (${tenures.length})`, icon: Calendar },
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
          { id: 'event', label: 'Events & Kalender', desc: 'Halaman daftar event divisi & kalender budaya bulanan interaktif' },
          { id: 'galeri', label: 'Galeri Kegiatan', desc: 'Halaman dokumentasi foto carousel kegiatan & tautan folder dokumentasi' },
          { id: 'kudos', label: 'Kudos & Aspirasi', desc: 'Halaman papan apresiasi & pengiriman pesan terima kasih serta ide aspirasi antar insan IT APD' },
          { id: 'assets', label: 'Asset', desc: 'Halaman transformasi logo & pengunduhan paket asset resmi CNT IT APD' },
          { id: 'form', label: 'Registrasi & Formulir', desc: 'Halaman pusat pendaftaran event, open recruitment & survei dinamis' },
        ];

        const isPageItemVisible = (id) => {
          if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
          if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
          return pageVisibility[id] !== false;
        };

        const visiblePagesCount = pageItems.filter(p => isPageItemVisible(p.id)).length;
        const isNavbarVisible = pageVisibility.navbar !== false;

        const handleToggleKey = (key) => {
          if (!onUpdatePageVisibility) return;
          const currentVal = isPageItemVisible(key);
          const nextVal = !currentVal;
          const nextState = {
            ...pageVisibility,
            [key]: nextVal
          };
          if (key === 'event') nextState.program = nextVal;
          if (key === 'form') nextState.oprec = nextVal;
          onUpdatePageVisibility(nextState);
        };

        const handleSetAll = (showPages, showNavbar) => {
          if (!onUpdatePageVisibility) return;
          const nextState = {
            navbar: showNavbar,
            event: showPages,
            program: showPages,
            form: showPages,
            oprec: showPages
          };
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '650px', lineHeight: 1.5, margin: 0 }}>
                  Atur halaman mana saja yang ditampilkan atau disembunyikan dari publik, termasuk visibilitas <strong>Navbar Utama</strong>. Jika seluruh halaman di-hide, pengunjung otomatis dialihkan ke tampilan <em>Mode Standby / Maintenance</em> yang tetap menyediakan tombol akses ke Portal Admin.
                </p>
                {pageVisibility?._updatedAt && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                    {formatLastUpdatedWib(pageVisibility._updatedAt)}
                  </div>
                )}
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
                      <strong>Perhatian: Semua halaman sedang di-Hide!</strong> Pengunjung saat ini melihat layar <em>Mode Standby / Pemeliharaan</em> dengan akses langsung ke Portal Pengurus CNT IT APD.
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
                    {announcementBar?._updatedAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        {formatLastUpdatedWib(announcementBar._updatedAt)}
                      </div>
                    )}
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
                  const isVisible = isPageItemVisible(page.id);
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
                Jabatan / Role Pengurus <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              {(() => {
                const currentTenureId = memTenureId || activeTenure?.id || '';
                const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
                const currentRoleObj = availableRoles.find(r => r.id === memRoleId) || 
                  availableRoles.find(r => r.name.toLowerCase() === (memRole || '').toLowerCase()) ||
                  null;

                return (
                  <div>
                    <select
                      value={currentRoleObj?.id || ''}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const rObj = availableRoles.find(r => r.id === rId);
                        if (rObj) {
                          setMemRoleId(rObj.id);
                          setMemRole(rObj.name);
                          setMemCategory(getCategoryFromLevel(rObj.level));
                          if (!rObj.requiresDivision) {
                            setMemDivisionId('');
                          }
                        } else {
                          setMemRoleId('');
                          setMemRole('');
                        }
                        clearFieldError('memRole');
                        clearFieldError('memDivisionId');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        border: `1.5px solid ${formErrors.memRole ? '#f43f5e' : 'var(--border-card)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {availableRoles.length === 0 ? (
                        <option value="" disabled>-- Role kepengurusan masih kosong di periode ini. Silakan buat role baru di menu Kelola Role & Jabatan --</option>
                      ) : (
                        <>
                          <option value="">-- Pilih Jabatan / Role --</option>
                          {availableRoles.map((r) => {
                            const levelInfo = LEVEL_OPTIONS.find(l => l.level === r.level);
                            const quotaText = r.max > 0 ? `Maks ${r.max}` : 'Unlimited';
                            const divText = r.requiresDivision ? ' • Butuh Divisi' : '';
                            return (
                              <option key={r.id} value={r.id}>
                                {r.name} ({levelInfo?.shortLabel || `Level ${r.level}`} • {quotaText}{divText})
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                    {availableRoles.length === 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                        ⚠️ <strong>Role kepengurusan masih kosong</strong> pada periode kepengurusan ini. Silakan buat role baru terlebih dahulu di menu <strong>Kelola Role & Jabatan</strong>.
                      </div>
                    )}
                    {renderFieldError('memRole')}
                  </div>
                );
              })()}
            </div>

            {/* DIVISI PENUGASAN: HANYA MUNCUL JIKA ROLE MEMBUTUHKAN DIVISI */}
            {(() => {
              const currentTenureId = memTenureId || activeTenure?.id || '';
              const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
              const currentRoleObj = availableRoles.find(r => r.id === memRoleId) || 
                availableRoles.find(r => r.name.toLowerCase() === (memRole || '').toLowerCase()) ||
                null;

              if (!currentRoleObj || !currentRoleObj.requiresDivision) {
                return null;
              }

              const availableDivsForMember = divisions.filter(d => d.tenureId === currentTenureId);
              return (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', marginLeft: '6px' }}>
                      (Wajib untuk jabatan "{currentRoleObj.name}")
                    </span>
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
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru di tab Divisi --</option>
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

            {/* RINGKASAN STATUS KUOTA PERIODE (COMPACT & RAPI) */}
            {(() => {
              const currentTenureId = memTenureId || activeTenure?.id || '';
              const availableRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);
              if (availableRoles.length === 0) {
                return null;
              }
              const tenureObj = tenures.find(t => t.id === currentTenureId);
              const tenureName = tenureObj?.title || tenureObj?.code || 'Periode Ini';
              const targetMembers = members.filter(m => !currentTenureId || m.tenureId === currentTenureId);

              return (
                <div style={{
                  gridColumn: 'span 2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: isDark ? 'rgba(56, 189, 248, 0.04)' : '#f0f9ff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #bae6fd'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        🛡️ Status Kuota Kepengurusan: {tenureName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({targetMembers.length} anggota terdaftar)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {availableRoles.map(role => {
                      const matched = targetMembers.filter(m => {
                        if (m.roleId && m.roleId === role.id) return true;
                        const mRole = String(m.role || '').toLowerCase().trim();
                        const rName = role.name.toLowerCase().trim();
                        return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                      });
                      const count = matched.length;
                      const isFull = role.max > 0 && count >= role.max;
                      const occNames = matched.map(m => m.name).join(', ');

                      return (
                        <div
                          key={role.id}
                          title={occNames ? `Terisi oleh: ${occNames}` : (role.max > 0 ? `Tersedia ${role.max - count} slot` : 'Tanpa batas')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isFull ? 'rgba(255, 184, 0, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: `1px solid ${isFull ? 'rgba(255, 184, 0, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: isFull ? 'var(--mandiri-gold)' : '#10b981'
                          }}
                        >
                          <span>{role.name}: <strong>{count}{role.max > 0 ? `/${role.max}` : ''}</strong></span>
                          {isFull && <span style={{ fontSize: '0.64rem', opacity: 0.9 }}>(Penuh)</span>}
                        </div>
                      );
                    })}
                  </div>
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
                  placeholder="Atau tempel URL foto (https://...)"
                  value={memImage}
                  onChange={(e) => {
                    setMemImage(e.target.value);
                    clearFieldError('memImage');
                  }}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${formErrors.memImage ? '#f43f5e' : 'var(--border-card)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.83rem'
                  }}
                />
                {memImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemImage('');
                      setPendingMemberPhoto(null);
                      clearFieldError('memImage');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
              {renderFieldError('memImage')}
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
            const ADMIN_MEM_PER_PAGE = 12;
            const memberFilterRoles = (adminMemTenureFilter === 'all'
              ? tenures.flatMap(t => getTenureRoles(t.id, roleQuotas, tenureRoles))
              : getTenureRoles(adminMemTenureFilter, roleQuotas, tenureRoles)
            ).sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder);

            const filteredAdminMembers = members.filter(m => {
              const q = adminMemSearch.trim().toLowerCase();
              const matchesSearch = !q ||
                (m.name || '').toLowerCase().includes(q) ||
                (m.role || '').toLowerCase().includes(q) ||
                (m.title || '').toLowerCase().includes(q) ||
                (m.whatsapp || '').toLowerCase().includes(q);
              const matchesTenure = adminMemTenureFilter === 'all' || m.tenureId === adminMemTenureFilter;
              const matchesCat = adminMemCatFilter === 'all' || (() => {
                const targetRole = memberFilterRoles.find(r => r.id === adminMemCatFilter);
                if (!targetRole) return m.roleId === adminMemCatFilter || m.category === adminMemCatFilter;
                if (m.tenureId && targetRole.tenureId && m.tenureId !== targetRole.tenureId) return false;
                if (m.roleId && m.roleId === targetRole.id) return true;
                const matched = findMatchingRole(m, getTenureRoles(m.tenureId, roleQuotas, tenureRoles));
                return matched
                  ? matched.id === targetRole.id
                  : (m.role || '').toLowerCase().trim() === targetRole.name.toLowerCase().trim();
              })();
              const matchesDiv = adminMemDivFilter === 'all' || m.divisionId === adminMemDivFilter;
              return matchesSearch && matchesTenure && matchesCat && matchesDiv;
            });

            const totalAdminMemPages = Math.ceil(filteredAdminMembers.length / ADMIN_MEM_PER_PAGE) || 1;
            const safeAdminMemPage = Math.min(Math.max(1, adminMemPage), totalAdminMemPages);
            const paginatedAdminMembers = filteredAdminMembers.slice(
              (safeAdminMemPage - 1) * ADMIN_MEM_PER_PAGE,
              safeAdminMemPage * ADMIN_MEM_PER_PAGE
            );

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
                        onChange={(e) => {
                          setAdminMemSearch(e.target.value);
                          setAdminMemPage(1);
                        }}
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
                      value={adminMemTenureFilter}
                      onChange={(e) => {
                        setAdminMemTenureFilter(e.target.value);
                        setAdminMemCatFilter('all');
                        setAdminMemDivFilter('all');
                        setAdminMemPage(1);
                      }}
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
                      <option value="all">Semua Periode ({members.length})</option>
                      {tenures.map((t) => (
                        <option key={t.id} value={t.id}>
                          Periode {t.code || t.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={adminMemCatFilter}
                      onChange={(e) => {
                        setAdminMemCatFilter(e.target.value);
                        setAdminMemPage(1);
                      }}
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
                      <option value="all">Semua Role / Jabatan</option>
                      {memberFilterRoles.map((r) => {
                        const tObj = tenures.find(t => t.id === r.tenureId);
                        const yearLabel = adminMemTenureFilter === 'all' && tObj ? ` (${tObj.code || tObj.title})` : '';
                        return (
                          <option key={r.id} value={r.id}>
                            {r.name}{yearLabel}
                          </option>
                        );
                      })}
                    </select>

                    <select
                      value={adminMemDivFilter}
                      onChange={(e) => {
                        setAdminMemDivFilter(e.target.value);
                        setAdminMemPage(1);
                      }}
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
                      {(adminMemTenureFilter === 'all'
                        ? divisions
                        : divisions.filter(d => d.tenureId === adminMemTenureFilter)
                      ).map(d => {
                        const tObj = tenures.find(t => t.id === d.tenureId);
                        const yearLabel = adminMemTenureFilter === 'all' && tObj ? ` (${tObj.code || tObj.title})` : '';
                        return (
                          <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {paginatedAdminMembers.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada personel yang sesuai dengan kriteria pencarian/filter.
                    </div>
                  ) : (
                    paginatedAdminMembers.map((m) => (
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
                            {(() => {
                              const roleObj = findMatchingRole(m, tenureRoles);
                              const roleName = roleObj?.name || m.role || 'Anggota';
                              const divObj = (divisions || []).find(d => d.id === m.divisionId);
                              if (divObj && !roleName.toLowerCase().includes(divObj.name.toLowerCase())) {
                                return `${roleName} • ${divObj.name}`;
                              }
                              return roleName;
                            })()}
                          </div>
                          {m.updatedAt && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {formatLastUpdatedWib(m.updatedAt)}
                            </div>
                          )}
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
                  )))}
                </div>

                {totalAdminMemPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminMemPage - 1) * ADMIN_MEM_PER_PAGE + 1} - {Math.min(safeAdminMemPage * ADMIN_MEM_PER_PAGE, filteredAdminMembers.length)}</strong> dari <strong>{filteredAdminMembers.length}</strong> personel
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminMemPage === 1}
                        onClick={() => setAdminMemPage(p => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminMemPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminMemPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminMemPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminMemPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminMemPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminMemPage(pg)}
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
                        disabled={safeAdminMemPage === totalAdminMemPages}
                        onClick={() => setAdminMemPage(p => Math.min(totalAdminMemPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminMemPage === totalAdminMemPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminMemPage === totalAdminMemPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminMemPage === totalAdminMemPages ? 0.45 : 1
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

      {/* TAB CONTENT: STRUKTUR ROLE & JABATAN */}
      {activeTab === 'roles' && (() => {
        const ROLES_PER_PAGE = 8;
        const filteredRoles = (tenureRoles || []).filter(r => {
          const matchQuery = (r.name || '').toLowerCase().includes(roleSearchQuery.toLowerCase());
          const matchTenure = roleTenureFilter === 'all' || r.tenureId === roleTenureFilter;
          const matchLevel = roleLevelFilter === 'all' || String(r.level) === String(roleLevelFilter);
          return matchQuery && matchTenure && matchLevel;
        });

        const totalRolePages = Math.ceil(filteredRoles.length / ROLES_PER_PAGE) || 1;
        const safeRolePage = Math.min(Math.max(1, rolePage), totalRolePages);
        const paginatedRoles = filteredRoles.slice(
          (safeRolePage - 1) * ROLES_PER_PAGE,
          safeRolePage * ROLES_PER_PAGE
        );

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Manajemen Struktur Role & Batasan Kuota ({tenureRoles.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Kelola jabatan/role organisasi per periode kepengurusan lengkap dengan kuota maksimal, tingkatan organigram (Level 0–5), dan kewajiban penugasan divisi.
              </p>
            </div>

            {/* Form Tambah Role Baru */}
            <form onSubmit={handleCreateRole} noValidate className="admin-form-two-col" style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nama Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sekretaris Jenderal, Wakil Pimpro, Dewan Penasehat"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    clearFieldError('newRoleName');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.newRoleName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('newRoleName')}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Periode Kepengurusan <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={newRoleTenureId || activeTenure?.id || tenures[0]?.id || ''}
                  onChange={(e) => setNewRoleTenureId(e.target.value)}
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
                  Tingkatan di Bagan Organigram <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={newRoleLevel}
                  onChange={(e) => setNewRoleLevel(Number(e.target.value))}
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
                  {LEVEL_OPTIONS.map(lvl => (
                    <option key={lvl.level} value={lvl.level}>
                      {formatLevelOptionLabel(lvl, tenureRoles, newRoleTenureId || activeTenure?.id || tenures[0]?.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Batas Maksimal Kuota Personel (0 = Tanpa Batas)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 = Unlimited"
                    value={newRoleMax}
                    onChange={(e) => setNewRoleMax(parseInt(e.target.value) || 0)}
                    style={{
                      width: '110px',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {newRoleMax > 0 ? `orang per ${newRoleRequiresDivision ? 'divisi' : 'periode'}` : 'orang (Tanpa Batas / Unlimited)'}
                  </span>
                </div>
              </div>

              <div style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-card)'
              }}>
                <input
                  type="checkbox"
                  id="newRoleRequiresDiv"
                  checked={newRoleRequiresDivision}
                  onChange={(e) => setNewRoleRequiresDivision(e.target.checked)}
                  style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <label htmlFor="newRoleRequiresDiv" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.4 }}>
                  <strong>Memerlukan Pilihan Divisi Penugasan</strong>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Centang opsi ini jika personel dengan jabatan ini wajib ditempatkan di divisi tertentu (contoh: Pimpro, Anggota Divisi).
                  </span>
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-gold)',
                    border: 'none',
                    color: '#040914',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(255, 184, 0, 0.35)'
                  }}
                >
                  <Plus size={16} />
                  <span>Tambah Role Baru</span>
                </button>
              </div>
            </form>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Cari nama jabatan / role..."
                  value={roleSearchQuery}
                  onChange={(e) => {
                    setRoleSearchQuery(e.target.value);
                    setRolePage(1);
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
                {roleSearchQuery && (
                  <button
                    type="button"
                    onClick={() => { setRoleSearchQuery(''); setRolePage(1); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Periode:</label>
                  <select
                    value={roleTenureFilter}
                    onChange={(e) => { setRoleTenureFilter(e.target.value); setRolePage(1); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">Semua Periode ({tenureRoles.length})</option>
                    {tenures.map(t => (
                      <option key={t.id} value={t.id}>{t.title || t.code}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tingkat:</label>
                  <select
                    value={roleLevelFilter}
                    onChange={(e) => { setRoleLevelFilter(e.target.value); setRolePage(1); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">Semua Tingkat</option>
                    {LEVEL_OPTIONS.map(lvl => (
                      <option key={lvl.level} value={String(lvl.level)}>
                        {formatLevelOptionLabel(lvl, tenureRoles, roleTenureFilter === 'all' ? null : roleTenureFilter, true)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table Daftar Role */}
            <div style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-card)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Jabatan / Role</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kepengurusan</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Tingkat Organigram</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kuota Maks</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Perlu Divisi?</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terisi</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terakhir Diperbarui</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Tidak ada role yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role) => {
                      const levelInfo = LEVEL_OPTIONS.find(l => l.level === role.level);
                      const tObj = tenures.find(t => t.id === role.tenureId);
                      const targetMembers = members.filter(m => (!role.tenureId || m.tenureId === role.tenureId));
                      const matched = targetMembers.filter(m => {
                        if (m.roleId && m.roleId === role.id) return true;
                        const mRole = String(m.role || '').toLowerCase().trim();
                        const rName = role.name.toLowerCase().trim();
                        return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                      });
                      const count = matched.length;
                      const maxQ = Number(role.maxQuota ?? role.max ?? 0);
                      const isFull = maxQ > 0 && count >= maxQ;
                      const occNames = matched.map(m => m.name).join(', ');

                      return (
                        <tr key={role.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {role.name}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-main)',
                              fontSize: '0.74rem',
                              fontWeight: 600
                            }}>
                              {tObj?.code || tObj?.title || 'Global'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: role.level <= 1 ? 'rgba(255, 184, 0, 0.15)' : (role.level <= 3 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                              color: role.level <= 1 ? 'var(--mandiri-gold)' : (role.level <= 3 ? 'var(--neon-cyan)' : 'var(--text-muted)'),
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}>
                              {levelInfo?.shortLabel || `Level ${role.level}`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>
                            {maxQ > 0 ? (
                              <span style={{ fontWeight: 700 }}>{maxQ} orang</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Unlimited</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {role.requiresDivision ? (
                              <span style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
                                ✓ Ya (Per Divisi)
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                — Tidak (Global)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              title={occNames ? `Terisi oleh: ${occNames}` : (maxQ > 0 ? `Tersedia ${maxQ - count} slot` : 'Tanpa batas')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: isFull ? 'rgba(255, 184, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isFull ? 'var(--mandiri-gold)' : '#10b981',
                                fontWeight: 700,
                                fontSize: '0.72rem'
                              }}
                            >
                              {count}{maxQ > 0 ? `/${maxQ}` : ''} {isFull && '(Penuh)'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                            {formatLastUpdatedWib(role.updatedAt || role.createdAt)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingItem({ type: 'role', item: { ...role } })}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  color: 'var(--neon-cyan)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                                title="Edit Role ini"
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const check = canDeleteRole(role, role.tenureId, members);
                                  setDeleteConfirm({
                                    type: 'role',
                                    id: role.id,
                                    name: role.name,
                                    tenureId: role.tenureId,
                                    isBlocked: !check.canDelete,
                                    dependentMembers: check.members,
                                    dependentCount: check.count,
                                    reason: check.reason
                                  });
                                }}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(244, 63, 94, 0.1)',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  color: '#f43f5e',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                                title="Hapus Role ini"
                              >
                                <Trash2 size={12} />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalRolePages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Menampilkan {(safeRolePage - 1) * ROLES_PER_PAGE + 1} - {Math.min(safeRolePage * ROLES_PER_PAGE, filteredRoles.length)} dari {filteredRoles.length} role
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeRolePage <= 1}
                    onClick={() => setRolePage(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeRolePage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: safeRolePage <= 1 ? 'not-allowed' : 'pointer',
                      opacity: safeRolePage <= 1 ? 0.5 : 1
                    }}
                  >
                    « Prev
                  </button>

                  {Array.from({ length: totalRolePages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setRolePage(pg)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-sm)',
                        background: safeRolePage === pg ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeRolePage === pg ? '#040914' : 'var(--text-main)',
                        fontSize: '0.78rem',
                        fontWeight: safeRolePage === pg ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeRolePage >= totalRolePages}
                    onClick={() => setRolePage(prev => Math.min(totalRolePages, prev + 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeRolePage >= totalRolePages ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      cursor: safeRolePage >= totalRolePages ? 'not-allowed' : 'pointer',
                      opacity: safeRolePage >= totalRolePages ? 0.5 : 1
                    }}
                  >
                    Next »
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
                max={eventEndDate ? toDatetimeLocalValue(eventEndDate) : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setEventStartDate(val);
                  const normStart = toDatetimeLocalValue(val);
                  const normEnd = toDatetimeLocalValue(eventEndDate);
                  if (normStart && normEnd && normStart > normEnd) {
                    setFormErrors((prev) => ({
                      ...prev,
                      eventStartDate: 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir'
                    }));
                  } else {
                    clearFieldError('eventStartDate');
                    clearFieldError('eventEndDate');
                  }
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
                min={eventStartDate ? toDatetimeLocalValue(eventStartDate) : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setEventEndDate(val);
                  const normStart = toDatetimeLocalValue(eventStartDate);
                  const normEnd = toDatetimeLocalValue(val);
                  if (normStart && normEnd && normEnd < normStart) {
                    setFormErrors((prev) => ({
                      ...prev,
                      eventEndDate: 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai'
                    }));
                  } else {
                    clearFieldError('eventEndDate');
                    clearFieldError('eventStartDate');
                  }
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
                Peserta
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
                🏷️ Kategori Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={eventCategory}
                onChange={(e) => {
                  setEventCategory(e.target.value);
                  clearFieldError('eventCategory');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.eventCategory ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="">-- Pilih Kategori Kegiatan * --</option>
                <option value="Program Budaya">Program Budaya</option>
                <option value="Workshop & Sharing Session">Workshop & Sharing Session</option>
                <option value="Social & Engagement">Social & Engagement</option>
                <option value="Olahraga & Well-being">Olahraga & Well-being</option>
                <option value="Kompetisi & Inovasi">Kompetisi & Inovasi</option>
                <option value="Apresiasi & Rekognisi">Apresiasi & Rekognisi</option>
                <option value="Townhall & Perayaan">Townhall & Perayaan</option>
              </select>
              {renderFieldError('eventCategory')}
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

            <div style={{
              gridColumn: 'span 2',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 184, 0, 0.06)',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={eventIsLimited}
                  onChange={(e) => setEventIsLimited(e.target.checked)}
                  style={{ accentColor: 'var(--mandiri-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  🔒 Batasi Kuota Pendaftaran RSVP untuk Event Ini?
                </span>
              </label>

              {eventIsLimited && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Batas Maksimal Kuota Peserta (Orang) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={eventMaxQuota}
                    onChange={(e) => {
                      setEventMaxQuota(e.target.value);
                      clearFieldError('eventMaxQuota');
                    }}
                    style={{
                      maxWidth: '220px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: `1.5px solid ${formErrors.eventMaxQuota ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.84rem'
                    }}
                  />
                  {renderFieldError('eventMaxQuota')}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    RSVP akan ditutup otomatis ketika jumlah peserta yang mendaftar telah mencapai angka ini.
                  </span>
                </div>
              )}
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
            {(() => {
              const ADMIN_EVENTS_PER_PAGE = 8;
              const filteredAdminEvents = events.filter(evt => {
                const q = eventSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (evt.title || '').toLowerCase().includes(q) ||
                  (evt.location || '').toLowerCase().includes(q) ||
                  (evt.description || '').toLowerCase().includes(q) ||
                  (evt.category || evt.badge || '').toLowerCase().includes(q);
                const evtTenure = evt.tenureId || divisions.find(d => d.id === evt.divisionId)?.tenureId;
                const matchesTenure = eventTenureFilter === 'all' || evtTenure === eventTenureFilter;
                const matchesCat = eventCatFilter === 'all' || (evt.category || evt.badge) === eventCatFilter;
                const matchesDiv = eventDivFilter === 'all' || evt.divisionId === eventDivFilter;
                const matchesStat = eventStatusFilter === 'all' || evt.status === eventStatusFilter;
                return matchesSearch && matchesTenure && matchesCat && matchesDiv && matchesStat;
              });

              const totalAdminEventPages = Math.ceil(filteredAdminEvents.length / ADMIN_EVENTS_PER_PAGE) || 1;
              const safeAdminEventPage = Math.min(Math.max(1, adminEventPage), totalAdminEventPages);
              const paginatedAdminEvents = filteredAdminEvents.slice(
                (safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE,
                safeAdminEventPage * ADMIN_EVENTS_PER_PAGE
              );

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Daftar Event ({filteredAdminEvents.length} dari {events.length}):
                    </h4>

                    {/* Search & Filter Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari nama, lokasi..."
                          value={eventSearchQuery}
                          onChange={(e) => {
                            setEventSearchQuery(e.target.value);
                            setAdminEventPage(1);
                          }}
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
                        value={eventTenureFilter}
                        onChange={(e) => {
                          setEventTenureFilter(e.target.value);
                          setEventDivFilter('all');
                          setAdminEventPage(1);
                          setAdminRsvpPage(1);
                        }}
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
                        <option value="all">Semua Periode ({events.length})</option>
                        {tenures.map((t) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={eventCatFilter}
                        onChange={(e) => {
                          setEventCatFilter(e.target.value);
                          setAdminEventPage(1);
                        }}
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
                        <option value="all">Semua Kategori</option>
                        <option value="Program Budaya">Program Budaya</option>
                        <option value="Workshop & Sharing Session">Workshop & Sharing Session</option>
                        <option value="Social & Engagement">Social & Engagement</option>
                        <option value="Olahraga & Well-being">Olahraga & Well-being</option>
                        <option value="Kompetisi & Inovasi">Kompetisi & Inovasi</option>
                        <option value="Apresiasi & Rekognisi">Apresiasi & Rekognisi</option>
                        <option value="Townhall & Perayaan">Townhall & Perayaan</option>
                      </select>

                      <select
                        value={eventDivFilter}
                        onChange={(e) => {
                          setEventDivFilter(e.target.value);
                          setAdminEventPage(1);
                        }}
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
                        {(eventTenureFilter === 'all'
                          ? divisions
                          : divisions.filter(d => d.tenureId === eventTenureFilter)
                        ).map(d => {
                          const tObj = tenures.find(t => t.id === d.tenureId);
                          const yearLabel = tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                          );
                        })}
                      </select>

                      <select
                        value={eventStatusFilter}
                        onChange={(e) => {
                          setEventStatusFilter(e.target.value);
                          setAdminEventPage(1);
                        }}
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
                        <option value="all">Semua Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {filteredAdminEvents.length === 0 ? (
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
                        Tidak ada event yang sesuai dengan pencarian / filter.
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Coba ubah kata kunci pencarian atau reset filter.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                    {paginatedAdminEvents.map((evt) => {
                      const divObj = divisions.find(d => d.id === evt.divisionId);
                      const relatedRsvps = (eventRsvps || []).filter(r => r.eventId === evt.id);

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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{
                                color: (evt.isLimited && relatedRsvps.length >= Number(evt.maxQuota || 0))
                                  ? (isDark ? '#f43f5e' : '#be123c')
                                  : (isDark ? 'var(--neon-cyan)' : '#0284c7'),
                                fontWeight: 700
                              }}>
                                👥 RSVP: {relatedRsvps.length}{evt.isLimited && Number(evt.maxQuota) > 0 ? ` / ${evt.maxQuota} ${relatedRsvps.length >= Number(evt.maxQuota) ? '(Penuh)' : '(Terbatas)'}` : ' (Bebas)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setRsvpEventFilter(evt.id);
                                  setAdminRsvpPage(1);
                                  showToast(`Filter RSVP disetel ke "${evt.title}"`);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--mandiri-gold)',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Filter RSVP ➔
                              </button>
                            </div>
                            {evt.updatedAt && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                {formatLastUpdatedWib(evt.updatedAt)}
                              </div>
                            )}
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
                        Menampilkan <strong>{(safeAdminEventPage - 1) * ADMIN_EVENTS_PER_PAGE + 1} - {Math.min(safeAdminEventPage * ADMIN_EVENTS_PER_PAGE, filteredAdminEvents.length)}</strong> dari <strong>{filteredAdminEvents.length}</strong> event
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
                )}
                </div>
              );
            })()}
          </div>

          {/* Daftar Hadir & Konfirmasi RSVP Kegiatan (public.event_rsvps) */}
          {(() => {
            const selectedRsvpTenureObj = eventTenureFilter !== 'all' ? tenures.find(t => t.id === eventTenureFilter) : null;
            const rsvpAvailableEvents = events.filter(e => {
              if (eventTenureFilter === 'all') return true;
              const evtTenure = e.tenureId || divisions.find(d => d.id === e.divisionId)?.tenureId || '';
              return evtTenure === eventTenureFilter;
            });

            const filteredAdminRsvps = eventRsvps.filter((rsvp) => {
              const evt = events.find(e => e.id === rsvp.eventId);
              if (eventTenureFilter !== 'all') {
                if (!evt) return false;
                const evtTenure = evt.tenureId || divisions.find(d => d.id === evt.divisionId)?.tenureId || '';
                if (evtTenure !== eventTenureFilter) return false;
              }
              if (rsvpEventFilter !== 'all' && rsvp.eventId !== rsvpEventFilter) {
                return false;
              }
              if (rsvpModeFilter !== 'all') {
                const mode = String(rsvp.attendanceMode || '').toLowerCase();
                if (rsvpModeFilter === 'onsite' && !mode.includes('onsite')) return false;
                if (rsvpModeFilter === 'online' && !mode.includes('online')) return false;
              }
              if (rsvpSearchQuery.trim()) {
                const q = rsvpSearchQuery.toLowerCase();
                const name = String(rsvp.attendeeName || '').toLowerCase();
                const notes = String(rsvp.notes || '').toLowerCase();
                const eventTitle = String(evt?.title || rsvp.eventTitle || '').toLowerCase();
                const deptObj = departments.find(d => d.id === rsvp.departmentId || d.id === rsvp.department || (d.name && d.name === rsvp.department));
                const deptName = String(deptObj ? deptObj.name : (rsvp.department || rsvp.squadUnit || '')).toLowerCase();
                if (!name.includes(q) && !notes.includes(q) && !eventTitle.includes(q) && !deptName.includes(q)) {
                  return false;
                }
              }
              return true;
            });

            const ADMIN_RSVPS_PER_PAGE = 10;
            const totalAdminRsvpPages = Math.ceil(filteredAdminRsvps.length / ADMIN_RSVPS_PER_PAGE) || 1;
            const safeAdminRsvpPage = Math.min(Math.max(1, adminRsvpPage), totalAdminRsvpPages);
            const paginatedAdminRsvps = filteredAdminRsvps.slice(
              (safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE,
              safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE
            );

            return (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>📋 Daftar Hadir & Konfirmasi RSVP Kegiatan ({filteredAdminRsvps.length}{eventTenureFilter !== 'all' || rsvpEventFilter !== 'all' || rsvpSearchQuery || rsvpModeFilter !== 'all' ? ` dari ${eventRsvps.length}` : ''})</span>
                      {selectedRsvpTenureObj && (
                        <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                          Periode {selectedRsvpTenureObj.code || selectedRsvpTenureObj.title}
                        </span>
                      )}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Data kehadiran pegawai yang mengisi form RSVP Cepat pada kartu Event{selectedRsvpTenureObj ? ` (Periode ${selectedRsvpTenureObj.code || selectedRsvpTenureObj.title})` : ''}.
                    </p>
                  </div>

                  {filteredAdminRsvps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                        const header = ['ID RSVP', 'ID Event', 'Nama Kegiatan', 'Nama Peserta', 'Departemen', 'Mode Kehadiran', 'Catatan', 'Waktu Konfirmasi'].map(escapeCsv).join(',');
                        const rows = filteredAdminRsvps.map(r => {
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
                        showToast(`Berhasil mengunduh ${filteredAdminRsvps.length} data RSVP ke CSV!`);
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
                      <span>Export CSV Daftar Hadir RSVP ({filteredAdminRsvps.length})</span>
                    </button>
                  )}
                </div>

                {/* RSVP Search & Dynamic Event & Attendance Mode Filters */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)'
                }}>
                  {/* Search Query */}
                  <div style={{ flex: '1 1 200px', minWidth: '180px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Cari nama peserta, catatan, dept..."
                      value={rsvpSearchQuery}
                      onChange={(e) => {
                        setRsvpSearchQuery(e.target.value);
                        setAdminRsvpPage(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        paddingLeft: '32px',
                        paddingRight: rsvpSearchQuery ? '28px' : '12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    {rsvpSearchQuery && (
                      <button
                        type="button"
                        onClick={() => { setRsvpSearchQuery(''); setAdminRsvpPage(1); }}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter by Event (Dinamis sesuai event periode yang dipilih) */}
                  <select
                    value={rsvpEventFilter}
                    onChange={(e) => {
                      setRsvpEventFilter(e.target.value);
                      setAdminRsvpPage(1);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: rsvpEventFilter !== 'all' ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      color: rsvpEventFilter !== 'all' ? 'var(--mandiri-gold)' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: rsvpEventFilter !== 'all' ? 700 : 500,
                      cursor: 'pointer',
                      maxWidth: '280px'
                    }}
                  >
                    <option value="all">🎯 Semua Kegiatan ({rsvpAvailableEvents.length} Event)</option>
                    {rsvpAvailableEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>

                  {/* Filter by Mode Kehadiran */}
                  <select
                    value={rsvpModeFilter}
                    onChange={(e) => {
                      setRsvpModeFilter(e.target.value);
                      setAdminRsvpPage(1);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: rsvpModeFilter !== 'all' ? '1.5px solid var(--neon-cyan)' : '1px solid var(--border-card)',
                      color: rsvpModeFilter !== 'all' ? 'var(--neon-cyan)' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: rsvpModeFilter !== 'all' ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">👥 Semua Mode Kehadiran</option>
                    <option value="onsite">📍 Hadir Onsite</option>
                    <option value="online">💻 Hadir Online</option>
                  </select>

                  {/* Reset Filter Button */}
                  {(rsvpSearchQuery || rsvpEventFilter !== 'all' || rsvpModeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpSearchQuery('');
                        setRsvpEventFilter('all');
                        setRsvpModeFilter('all');
                        setAdminRsvpPage(1);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid #f43f5e',
                        color: '#f43f5e',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {filteredAdminRsvps.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    {eventTenureFilter !== 'all'
                      ? `Belum ada konfirmasi kehadiran RSVP pada event di periode ${selectedRsvpTenureObj?.code || selectedRsvpTenureObj?.title || 'terpilih'}.`
                      : 'Belum ada konfirmasi kehadiran RSVP pada event.'}
                  </div>
                ) : (
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
                        Menampilkan <strong>{(safeAdminRsvpPage - 1) * ADMIN_RSVPS_PER_PAGE + 1} - {Math.min(safeAdminRsvpPage * ADMIN_RSVPS_PER_PAGE, filteredAdminRsvps.length)}</strong> dari <strong>{filteredAdminRsvps.length}</strong> data RSVP
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
                )}
              </div>
            );
          })()}
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
                    { id: 'dates', label: 'Pilih Tanggal' },
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

              {galDateMode === 'dates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Pilih dua atau lebih tanggal pelaksanaan kegiatan (otomatis diurutkan secara kronologis):
                  </div>
                  {galDates.map((dVal, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', minWidth: '65px' }}>
                        Hari ke-{dIdx + 1}:
                      </span>
                      <input
                        type="date"
                        value={dVal}
                        onChange={(e) => {
                          const next = [...galDates];
                          next[dIdx] = e.target.value;
                          setGalDates(next);
                        }}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                      />
                      {galDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setGalDates(galDates.filter((_, i) => i !== dIdx))}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px' }}
                          title="Hapus tanggal ini"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setGalDates([...galDates, new Date().toISOString().split('T')[0]])}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.08)',
                        color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                        border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(0, 61, 121, 0.25)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={13} />
                      <span>Tambah Tanggal Pelaksanaan</span>
                    </button>
                  </div>
                </div>
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

              {/* Live Preview Pill (Kontras Jelas & Nyaman di Light & Dark Mode) */}
              <div style={{ fontSize: '0.75rem', color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>👁️ Tampilan di Web:</span>
                <strong style={{
                  color: isDark ? '#ffffff' : 'var(--mandiri-blue)',
                  background: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #7dd3fc',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  display: 'inline-block'
                }}>
                  {formatWibDateTime(buildFlexibleDate(galDateMode, { date: galDateVal, dates: galDates, startDate: galStartDate, endDate: galEndDate, month: galMonth, year: galYear }))}
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
                    Divisi Penyelenggara <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    value={currentGalDivId}
                    onChange={(e) => {
                      const divId = e.target.value;
                      setGalDivisionId(divId);
                      const found = availableDivsForGal.find(d => d.id === divId);
                      setGalDivision(found ? found.name : '');
                      clearFieldError('galDivision');
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: `1.5px solid ${formErrors.galDivision ? '#f43f5e' : 'var(--border-card)'}`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {availableDivsForGal.length === 0 ? (
                      <option value="" disabled>-- Divisi masih kosong di periode ini. Silakan buat divisi baru pada tahun kepengurusan yang dipilih --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Divisi Penyelenggara (Wajib) --</option>
                        {availableDivsForGal.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {renderFieldError('galDivision')}
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
                    background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.08)',
                    color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                    border: isDark ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(0, 61, 121, 0.25)',
                    padding: '5px 12px',
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
            {(() => {
              const ADMIN_GALLERY_PER_PAGE = 8;
              const filteredAdminGalleries = galleries.filter(gal => {
                const q = gallerySearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (gal.title || '').toLowerCase().includes(q) ||
                  (gal.description || '').toLowerCase().includes(q);
                const galTenure = gal.tenureId || divisions.find(d => d.id === gal.divisionId || d.name === gal.division)?.tenureId;
                const matchesTenure = galleryTenureFilter === 'all' || galTenure === galleryTenureFilter;
                const matchesDiv = galleryDivFilter === 'all' || gal.divisionId === galleryDivFilter || gal.division === galleryDivFilter;
                return matchesSearch && matchesTenure && matchesDiv;
              });

              const totalAdminGalleryPages = Math.ceil(filteredAdminGalleries.length / ADMIN_GALLERY_PER_PAGE) || 1;
              const safeAdminGalleryPage = Math.min(Math.max(1, adminGalleryPage), totalAdminGalleryPages);
              const paginatedAdminGalleries = filteredAdminGalleries.slice(
                (safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE,
                safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE
              );

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      Arsip Galeri ({filteredAdminGalleries.length} dari {galleries.length}):
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari dokumentasi..."
                          value={gallerySearchQuery}
                          onChange={(e) => {
                            setGallerySearchQuery(e.target.value);
                            setAdminGalleryPage(1);
                          }}
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
                        value={galleryTenureFilter}
                        onChange={(e) => {
                          setGalleryTenureFilter(e.target.value);
                          setGalleryDivFilter('all');
                          setAdminGalleryPage(1);
                        }}
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
                        <option value="all">Semua Periode ({galleries.length})</option>
                        {tenures.map((t) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={galleryDivFilter}
                        onChange={(e) => {
                          setGalleryDivFilter(e.target.value);
                          setAdminGalleryPage(1);
                        }}
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
                        {(galleryTenureFilter === 'all'
                          ? divisions
                          : divisions.filter(d => d.tenureId === galleryTenureFilter)
                        ).map(d => {
                          const tObj = tenures.find(t => t.id === d.tenureId);
                          const yearLabel = tObj ? ` (${tObj.code || tObj.title})` : '';
                          return (
                            <option key={d.id} value={d.id}>{d.name}{yearLabel}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {filteredAdminGalleries.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada arsip dokumentasi yang cocok dengan pencarian / filter.
                    </div>
                  ) : (
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
                        {gal.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {formatLastUpdatedWib(gal.updatedAt)}
                          </div>
                        )}
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
                        Menampilkan <strong>{(safeAdminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE + 1} - {Math.min(safeAdminGalleryPage * ADMIN_GALLERY_PER_PAGE, filteredAdminGalleries.length)}</strong> dari <strong>{filteredAdminGalleries.length}</strong> galeri
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
        const filteredDepts = (departments || []).filter(d => {
          const matchesSearch = (d.name || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
            (d.code || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
            (d.description || '').toLowerCase().includes(deptSearchQuery.toLowerCase());
          const rsvpCount = (eventRsvps || []).filter(
            r => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
          ).length;
          const matchesRsvp = deptRsvpFilter === 'all' ||
            (deptRsvpFilter === 'with_rsvp' && rsvpCount > 0) ||
            (deptRsvpFilter === 'no_rsvp' && rsvpCount === 0);
          return matchesSearch && matchesRsvp;
        });
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 360px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
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

                <select
                  value={deptRsvpFilter}
                  onChange={(e) => {
                    setDeptRsvpFilter(e.target.value);
                    setDeptPage(1);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  <option value="all">Semua Status RSVP</option>
                  <option value="with_rsvp">Memiliki RSVP Terkait</option>
                  <option value="no_rsvp">Belum Ada RSVP (Aman Dihapus)</option>
                </select>
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
                        {d.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {formatLastUpdatedWib(d.updatedAt)}
                          </div>
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
      {activeTab === 'divisions' && (() => {
        const DIVS_PER_PAGE = 8;
        const filteredDivs = (divisions || []).filter((d) => {
          const q = divSearchQuery.toLowerCase().trim();
          const lead = getDivisionLead(d, members, tenureRoles);
          const matchesSearch = !q ||
            (d.name || '').toLowerCase().includes(q) ||
            (d.description || '').toLowerCase().includes(q) ||
            (lead.name || '').toLowerCase().includes(q) ||
            (Array.isArray(d.focusAreas) && d.focusAreas.some(fa => (fa || '').toLowerCase().includes(q)));
          const matchesTenure = divTenureFilter === 'all' || d.tenureId === divTenureFilter;
          const isRecruiting = Boolean(d.isRecruiting);
          const matchesRecruit = divRecruitFilter === 'all' ||
            (divRecruitFilter === 'open' && isRecruiting) ||
            (divRecruitFilter === 'closed' && !isRecruiting);
          return matchesSearch && matchesTenure && matchesRecruit;
        });
        const totalDivPages = Math.ceil(filteredDivs.length / DIVS_PER_PAGE) || 1;
        const safeDivPage = Math.min(Math.max(1, divPage), totalDivPages);
        const paginatedDivs = filteredDivs.slice(
          (safeDivPage - 1) * DIVS_PER_PAGE,
          safeDivPage * DIVS_PER_PAGE
        );

        return (
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
                Periode Kepengurusan *
              </label>
              <select
                value={newDivTenureId || activeTenure?.id || ''}
                onChange={(e) => setNewDivTenureId(e.target.value)}
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

          {/* Filter & Search Bar Divisi */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari nama divisi, pimpinan, fokus..."
                  value={divSearchQuery}
                  onChange={(e) => {
                    setDivSearchQuery(e.target.value);
                    setDivPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={divTenureFilter}
                onChange={(e) => {
                  setDivTenureFilter(e.target.value);
                  setDivPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <option value="all">Semua Periode ({divisions.length})</option>
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>
                    Periode {t.code || t.title}
                  </option>
                ))}
              </select>

              <select
                value={divRecruitFilter}
                onChange={(e) => {
                  setDivRecruitFilter(e.target.value);
                  setDivPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <option value="all">Semua Status Rekrutmen</option>
                <option value="open">● Rekrutmen Buka</option>
                <option value="closed">○ Rekrutmen Tutup</option>
              </select>
            </div>

            {divisions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const header = ['ID Divisi', 'Nama Divisi', 'Periode', 'Pimpinan', 'Fokus Area', 'Status Rekrutmen', 'Warna'].map(escapeCsv).join(',');
                  const rows = divisions.map(d => {
                    const tObj = tenures.find(t => t.id === d.tenureId);
                    const lead = getDivisionLead(d, members, tenureRoles);
                    const fa = Array.isArray(d.focusAreas) ? d.focusAreas.join('; ') : (d.focusAreas || '');
                    return [d.id, d.name, tObj ? tObj.code || tObj.title : d.tenureId, lead.name || '-', fa, Boolean(d.isRecruiting) ? 'Buka' : 'Tutup', d.color || ''].map(escapeCsv).join(',');
                  });
                  const csvString = '\uFEFF' + [header, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `daftar_divisi_cnt_it_apd_${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast('Berhasil mengunduh data divisi ke CSV!');
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
                <span>Export CSV Divisi</span>
              </button>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Daftar Divisi ({filteredDivs.length} dari {divisions.length}):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paginatedDivs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Tidak ada divisi yang cocok dengan pencarian "{divSearchQuery}".
                </div>
              ) : (
                paginatedDivs.map((d) => (
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
                    {(() => {
                      const { leaders } = getDivisionStructure(d, members, tenureRoles);
                      if (leaders.length > 0) {
                        return (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                            {leaders.map((l, i) => (
                              <span key={l.id || i} style={{ marginRight: '8px' }}>
                                {l.role}: <strong style={{ color: 'var(--text-main)' }}>{l.name}</strong>
                              </span>
                            ))}
                          </span>
                        );
                      }
                      const lead = getDivisionLead(d, members, tenureRoles);
                      if (lead.name) {
                        return (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                            {lead.roleName || 'Pimpinan'}: <strong style={{ color: 'var(--text-main)' }}>{lead.name}</strong>
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {d.tenureId && (
                      <span className="badge-gold" style={{ fontSize: '0.68rem', marginLeft: '8px', padding: '2px 8px' }}>
                        {tenures.find(t => t.id === d.tenureId)?.code || d.tenureId}
                      </span>
                    )}
                    {d.updatedAt && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {formatLastUpdatedWib(d.updatedAt)}
                      </div>
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
              )))}
            </div>
          </div>

          {/* Pagination Controls Divisi */}
          {totalDivPages > 1 && (
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
                Menampilkan <strong>{(safeDivPage - 1) * DIVS_PER_PAGE + 1} - {Math.min(safeDivPage * DIVS_PER_PAGE, filteredDivs.length)}</strong> dari <strong>{filteredDivs.length}</strong> divisi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={safeDivPage === 1}
                  onClick={() => setDivPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeDivPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeDivPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: safeDivPage === 1 ? 0.45 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                {Array.from({ length: totalDivPages }, (_, idx) => idx + 1).map((pg) => {
                  const isActive = pg === safeDivPage;
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setDivPage(pg)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        color: isActive ? '#040914' : 'var(--text-main)',
                        border: isActive ? 'none' : '1px solid var(--border-card)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safeDivPage === totalDivPages}
                  onClick={() => setDivPage(p => Math.min(totalDivPages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeDivPage === totalDivPages ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeDivPage === totalDivPages ? 'not-allowed' : 'pointer',
                    opacity: safeDivPage === totalDivPages ? 0.45 : 1
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    })()}

      {/* TAB CONTENT 2: TENURE */}
      {activeTab === 'tenure' && (() => {
        const TENURES_PER_PAGE = 6;
        const filteredTenures = (tenures || []).filter((t) => {
          const q = tenureSearchQuery.toLowerCase().trim();
          const matchesSearch = !q ||
            (t.code || '').toLowerCase().includes(q) ||
            (t.title || '').toLowerCase().includes(q) ||
            (t.themeTagline || '').toLowerCase().includes(q) ||
            (t.heroHeadline || '').toLowerCase().includes(q);
          const isActive = activeTenure?.id === t.id || Boolean(t.isActive);
          const matchesStatus = tenureStatusFilter === 'all' ||
            (tenureStatusFilter === 'active' && isActive) ||
            (tenureStatusFilter === 'archived' && !isActive);
          return matchesSearch && matchesStatus;
        });
        const totalTenurePages = Math.ceil(filteredTenures.length / TENURES_PER_PAGE) || 1;
        const safeTenurePage = Math.min(Math.max(1, tenurePage), totalTenurePages);
        const paginatedTenures = filteredTenures.slice(
          (safeTenurePage - 1) * TENURES_PER_PAGE,
          safeTenurePage * TENURES_PER_PAGE
        );

        return (
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
                Nama Periode <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: Kepengurusan CNT IT APD 2027"
                value={newTenureTitle}
                onChange={(e) => {
                  setNewTenureTitle(e.target.value);
                  clearFieldError('newTenureTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.newTenureTitle ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('newTenureTitle')}
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

          {/* Filter & Search Bar Tenure */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari kode tahun, nama kabinet, atau tagline..."
                  value={tenureSearchQuery}
                  onChange={(e) => {
                    setTenureSearchQuery(e.target.value);
                    setTenurePage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={tenureStatusFilter}
                onChange={(e) => {
                  setTenureStatusFilter(e.target.value);
                  setTenurePage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <option value="all">Semua Status Periode ({tenures.length})</option>
                <option value="active">Periode Aktif Utama</option>
                <option value="archived">Periode Arsip / Non-Aktif</option>
              </select>
            </div>

            {tenures.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const header = ['ID Periode', 'Kode Tahun', 'Nama Kabinet / Periode', 'Tagline', 'Headline Hero', 'Status Aktif'].map(escapeCsv).join(',');
                  const rows = tenures.map(t => {
                    const isAct = activeTenure?.id === t.id || Boolean(t.isActive);
                    return [t.id, t.code || '', t.title || '', t.themeTagline || '', t.heroHeadline || '', isAct ? 'Aktif' : 'Arsip'].map(escapeCsv).join(',');
                  });
                  const csvString = '\uFEFF' + [header, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `daftar_periode_cnt_it_apd_${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast('Berhasil mengunduh data periode ke CSV!');
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
                <span>Export CSV Periode</span>
              </button>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Daftar Periode Kepengurusan ({filteredTenures.length} dari {tenures.length}):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paginatedTenures.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Tidak ada periode kepengurusan yang cocok dengan pencarian "{tenureSearchQuery}".
                </div>
              ) : (
                paginatedTenures.map((t) => (
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
                      {t.updatedAt && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {formatLastUpdatedWib(t.updatedAt)}
                        </div>
                      )}
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
                ))
              )}
            </div>
          </div>

          {/* Pagination Controls Tenure */}
          {totalTenurePages > 1 && (
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
                Menampilkan <strong>{(safeTenurePage - 1) * TENURES_PER_PAGE + 1} - {Math.min(safeTenurePage * TENURES_PER_PAGE, filteredTenures.length)}</strong> dari <strong>{filteredTenures.length}</strong> periode
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={safeTenurePage === 1}
                  onClick={() => setTenurePage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeTenurePage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeTenurePage === 1 ? 'not-allowed' : 'pointer',
                    opacity: safeTenurePage === 1 ? 0.45 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                {Array.from({ length: totalTenurePages }, (_, idx) => idx + 1).map((pg) => {
                  const isActive = pg === safeTenurePage;
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setTenurePage(pg)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        color: isActive ? '#040914' : 'var(--text-main)',
                        border: isActive ? 'none' : '1px solid var(--border-card)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safeTenurePage === totalTenurePages}
                  onClick={() => setTenurePage(p => Math.min(totalTenurePages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeTenurePage === totalTenurePages ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeTenurePage === totalTenurePages ? 'not-allowed' : 'pointer',
                    opacity: safeTenurePage === totalTenurePages ? 0.45 : 1
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    })()}

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
              const errs = {};
              if (!newFormTitle.trim()) errs.newFormTitle = 'Judul Formulir wajib diisi';
              if (!newFormCategory.trim()) errs.newFormCategory = 'Kategori Formulir wajib dipilih';
              if (!newFormDeadline.trim()) errs.newFormDeadline = 'Batas Akhir / Deadline Pendaftaran wajib ditentukan';
              if (newFormIsLimited && (!newFormMaxQuota || parseInt(newFormMaxQuota, 10) <= 0)) {
                errs.newFormMaxQuota = 'Maksimal kuota harus lebih dari 0 jika kuota dibatasi';
              }
              if (Object.keys(errs).length > 0) {
                setFormErrors((prev) => ({ ...prev, ...errs }));
                showToast('Mohon lengkapi kolom wajib pada form Formulir', 'error');
                return;
              }

              const targetTenureId = newFormTenureId || activeTenure?.id || tenures[0]?.id || '';
              const newForm = {
                id: 'form-' + Date.now(),
                title: newFormTitle.trim(),
                subtitle: newFormSubtitle.trim() || '',
                category: newFormCategory.trim(),
                deadline: toDatetimeLocalSecondsValue(newFormDeadline.trim()) || '',
                isOpen: true,
                requiresTracking: newFormRequiresTracking,
                showAnnouncement: newFormShowAnnouncement,
                isLimited: newFormIsLimited,
                maxQuota: newFormIsLimited ? (parseInt(newFormMaxQuota, 10) || 0) : 0,
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
              setNewFormCategory('');
              setNewFormRequiresTracking(true);
              setNewFormShowAnnouncement(false);
              setNewFormIsLimited(false);
              setNewFormMaxQuota('');
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
                Kategori Formulir <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={newFormCategory}
                onChange={(e) => {
                  setNewFormCategory(e.target.value);
                  clearFieldError('newFormCategory');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormCategory ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                <option value="">-- Pilih Kategori Formulir (Wajib) --</option>
                <option value="Kegiatan & Event">Kegiatan & Event</option>
                <option value="Rekrutmen">Rekrutmen & Oprec</option>
                <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                <option value="Workshop & Sharing">Workshop & Sharing</option>
              </select>
              {renderFieldError('newFormCategory')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                📅 Batas Akhir / Deadline Pendaftaran (WIB) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="datetime-local"
                    step="1"
                    value={toDatetimeLocalSecondsValue(newFormDeadline)}
                    onChange={(e) => {
                      setNewFormDeadline(e.target.value);
                      setFormErrors(prev => ({ ...prev, newFormDeadline: undefined }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: formErrors.newFormDeadline ? '1.5px solid #f43f5e' : '1px solid var(--input-border)',
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
              {formErrors.newFormDeadline ? (
                <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ {formErrors.newFormDeadline}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', marginTop: '4px', fontWeight: 600 }}>
                  {newFormDeadline ? `Tampilan di Web: ${formatDeadlineWib(newFormDeadline)}` : 'Pilih tanggal & waktu deadline (wajib)'}
                </div>
              )}
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

            {/* Option: Show Announcement */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormShowAnnouncement ? '#10b981' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormShowAnnouncement}
                  onChange={(e) => setNewFormShowAnnouncement(e.target.checked)}
                />
                <span>🎉 Tampilkan Papan Pengumuman Peserta Terpilih (Hall of Welcome) di Halaman Web</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormShowAnnouncement
                  ? 'Aktif: Daftar peserta yang berstatus "Accepted / Diterima" akan dipublikasikan secara terbuka pada section Hall of Welcome di halaman formulir.'
                  : 'Nonaktif: Hasil seleksi tidak dipublikasikan ke publik di halaman formulir (hanya dapat dicek secara mandiri oleh responden jika tracking aktif).'}
              </span>
            </div>

            {/* Option: Batasi Kuota Responden */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: newFormIsLimited ? '#06b6d4' : 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={newFormIsLimited}
                  onChange={(e) => {
                    setNewFormIsLimited(e.target.checked);
                    if (!e.target.checked) {
                      setNewFormMaxQuota('');
                      clearFieldError('newFormMaxQuota');
                    }
                  }}
                />
                <span>🔒 Batasi Kuota Responden / Pengisian Formulir</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                {newFormIsLimited
                  ? 'Aktif: Formulir akan otomatis ditutup bila total data yang mengisi/submit telah mencapai batas kuota maksimal.'
                  : 'Nonaktif: Formulir terbuka tanpa batasan kuota responden (hanya dibatasi oleh deadline).'}
              </span>
              {newFormIsLimited && (
                <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '280px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Maksimal Kuota Responden <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={newFormMaxQuota}
                    onChange={(e) => {
                      setNewFormMaxQuota(e.target.value);
                      clearFieldError('newFormMaxQuota');
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.newFormMaxQuota ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                  {renderFieldError('newFormMaxQuota')}
                </div>
              )}
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

          {/* Existing Forms List with Search, Filter & Pagination */}
          <div>
            {(() => {
              const ADMIN_FORMS_PER_PAGE = 6;
              const filteredForms = forms.filter(f => {
                const q = formSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (f.title || '').toLowerCase().includes(q) ||
                  (f.subtitle || '').toLowerCase().includes(q) ||
                  (f.category || '').toLowerCase().includes(q);
                const fTenure = f.tenureId || f.tenure_id || (f.fields?.[0]?._tenureId) || '';
                const matchesTenure = formTenureFilter === 'all' || fTenure === formTenureFilter;
                const matchesCat = formCatFilter === 'all' || f.category === formCatFilter;
                const matchesStat = formStatusFilter === 'all' ||
                  (formStatusFilter === 'open' && Boolean(f.isOpen)) ||
                  (formStatusFilter === 'closed' && !Boolean(f.isOpen));
                return matchesSearch && matchesTenure && matchesCat && matchesStat;
              });

              const totalAdminFormPages = Math.ceil(filteredForms.length / ADMIN_FORMS_PER_PAGE) || 1;
              const safeAdminFormPage = Math.min(Math.max(1, formPage), totalAdminFormPages);
              const paginatedForms = filteredForms.slice(
                (safeAdminFormPage - 1) * ADMIN_FORMS_PER_PAGE,
                safeAdminFormPage * ADMIN_FORMS_PER_PAGE
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Daftar Formulir ({filteredForms.length} dari {forms.length}):
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari formulir..."
                          value={formSearchQuery}
                          onChange={(e) => {
                            setFormSearchQuery(e.target.value);
                            setFormPage(1);
                          }}
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
                        value={formTenureFilter}
                        onChange={(e) => {
                          setFormTenureFilter(e.target.value);
                          setFormPage(1);
                        }}
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
                        <option value="all">Semua Periode</option>
                        {tenures.map((t) => (
                          <option key={t.id} value={t.id}>
                            Periode {t.code || t.title}{t.isActive ? ' (Aktif)' : ''}
                          </option>
                        ))}
                      </select>

                      <select
                        value={formCatFilter}
                        onChange={(e) => {
                          setFormCatFilter(e.target.value);
                          setFormPage(1);
                        }}
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
                        <option value="all">Semua Kategori</option>
                        <option value="Kegiatan & Event">Kegiatan & Event</option>
                        <option value="Rekrutmen">Rekrutmen & Oprec</option>
                        <option value="Turnamen & Olahraga">Turnamen & Olahraga</option>
                        <option value="Survei & Aspirasi">Survei & Aspirasi</option>
                        <option value="Workshop & Sharing">Workshop & Sharing</option>
                      </select>

                      <select
                        value={formStatusFilter}
                        onChange={(e) => {
                          setFormStatusFilter(e.target.value);
                          setFormPage(1);
                        }}
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
                        <option value="all">Semua Status</option>
                        <option value="open">● Dibuka di Web</option>
                        <option value="closed">○ Ditutup</option>
                      </select>
                    </div>
                  </div>

                  {filteredForms.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                      Tidak ada formulir yang cocok dengan pencarian / filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paginatedForms.map((f) => {
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
                      {f.showAnnouncement ? (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                          🎉 Pengumuman Aktif
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', border: '1px solid var(--border-card)', padding: '2px 7px', borderRadius: '4px' }}>
                          🔒 Pengumuman Tertutup
                        </span>
                      )}
                      {f.isLimited && (
                        <span style={{
                          fontSize: '0.65rem',
                          background: subCount >= (f.maxQuota || 0)
                            ? (isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6')
                            : (isDark ? 'rgba(6, 182, 212, 0.15)' : '#e0f2fe'),
                          color: subCount >= (f.maxQuota || 0)
                            ? (isDark ? '#f43f5e' : '#be123c')
                            : (isDark ? '#06b6d4' : '#0369a1'),
                          border: `1px solid ${subCount >= (f.maxQuota || 0)
                            ? (isDark ? 'rgba(244, 63, 94, 0.4)' : '#fca5a5')
                            : (isDark ? 'rgba(6, 182, 212, 0.4)' : '#7dd3fc')}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {subCount >= (f.maxQuota || 0) ? `🔒 Kuota Penuh (${subCount}/${f.maxQuota})` : `👥 Kuota: ${subCount}/${f.maxQuota} Terisi`}
                        </span>
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
                    {f.updatedAt && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {formatLastUpdatedWib(f.updatedAt)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Copy Direct Link */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/?form=${encodeURIComponent(f.id)}#form`;
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
                      title="Salin link langsung ke formulir ini untuk dibagikan"
                    >
                      <Share2 size={12} />
                      <span>Salin Link</span>
                    </button>

                    {/* Share to WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/?form=${encodeURIComponent(f.id)}#form`;
                        const dl = f.deadline ? formatDeadlineWib(f.deadline) : 'Tanpa batas waktu';
                        const text = `📋 *Formulir Registrasi CNT IT APD*\n*${f.title}*\n⏳ Batas Pengisian: ${dl}\n\nSilakan isi formulir melalui tautan resmi berikut:\n${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25D366',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Bagikan formulir ini ke WhatsApp"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
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

                    {/* Toggle Pengumuman Terpilih */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateForm) {
                          const nextShow = !f.showAnnouncement;
                          onUpdateForm({ ...f, showAnnouncement: nextShow });
                          showToast(nextShow ? `Papan pengumuman terpilih untuk "${f.title}" diaktifkan!` : `Papan pengumuman terpilih untuk "${f.title}" disembunyikan.`);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: f.showAnnouncement ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: f.showAnnouncement ? '#10b981' : 'var(--text-muted)'
                      }}
                      title="Klik untuk mengubah visibilitas papan pengumuman peserta terpilih di web"
                    >
                      {f.showAnnouncement ? '🎉 Pengumuman: Tampil' : '🔒 Pengumuman: Tertutup'}
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
        )}

        {totalAdminFormPages > 1 && (
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
              Menampilkan <strong>{(safeAdminFormPage - 1) * ADMIN_FORMS_PER_PAGE + 1} - {Math.min(safeAdminFormPage * ADMIN_FORMS_PER_PAGE, filteredForms.length)}</strong> dari <strong>{filteredForms.length}</strong> formulir
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={safeAdminFormPage === 1}
                onClick={() => setFormPage(p => Math.max(1, p - 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: safeAdminFormPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: safeAdminFormPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: safeAdminFormPage === 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>
              {Array.from({ length: totalAdminFormPages }, (_, i) => i + 1).map((pg) => {
                const isActive = pg === safeAdminFormPage;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setFormPage(pg)}
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
                disabled={safeAdminFormPage === totalAdminFormPages}
                onClick={() => setFormPage(p => Math.min(totalAdminFormPages, p + 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: safeAdminFormPage === totalAdminFormPages ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: safeAdminFormPage === totalAdminFormPages ? 'not-allowed' : 'pointer',
                  opacity: safeAdminFormPage === totalAdminFormPages ? 0.45 : 1
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

        const resolveFormTenure = (sub) => {
          if (sub?.tenureId) return sub.tenureId;
          const matched = forms.find(f => f.id === sub?.formId);
          return matched?.tenureId || '';
        };

        const filteredSubmissions = submissions.filter(s => {
          const matchesTenure = subTenureFilter === 'all' || resolveFormTenure(s) === subTenureFilter;
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
          return matchesTenure && matchesForm && matchesStatus && matchesSearch;
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
                  value={subTenureFilter}
                  onChange={(e) => {
                    setSubTenureFilter(e.target.value);
                    setSelectedSubFilter('all');
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
                  <option value="all">Semua Periode ({submissions.length + applications.length})</option>
                  {tenures.map((t) => (
                    <option key={t.id} value={t.id}>
                      Periode {t.code || t.title}
                    </option>
                  ))}
                </select>

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
                  <option value="all">Semua Formulir</option>
                  {(subTenureFilter === 'all'
                    ? forms
                    : forms.filter(f => f.tenureId === subTenureFilter)
                  ).map(f => (
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
            const filteredAdminKudos = kudosList.filter(k => {
              const q = kudosSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (k.sender || '').toLowerCase().includes(q) ||
                (k.recipient || '').toLowerCase().includes(q) ||
                (k.message || '').toLowerCase().includes(q);
              const matchesCat = kudosCatFilter === 'all' || k.category === kudosCatFilter;
              return matchesSearch && matchesCat;
            });

            const totalAdminKudosPages = Math.ceil(filteredAdminKudos.length / ADMIN_KUDOS_PER_PAGE) || 1;
            const safeAdminKudosPage = Math.min(Math.max(1, adminKudosPage), totalAdminKudosPages);
            const paginatedAdminKudos = filteredAdminKudos.slice(
              (safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE,
              safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar Kiriman Kudos ({filteredAdminKudos.length} dari {kudosList.length}):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari pengirim, penerima..."
                        value={kudosSearchQuery}
                        onChange={(e) => {
                          setKudosSearchQuery(e.target.value);
                          setAdminKudosPage(1);
                        }}
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
                      value={kudosCatFilter}
                      onChange={(e) => {
                        setKudosCatFilter(e.target.value);
                        setAdminKudosPage(1);
                      }}
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
                      <option value="all">Semua Kategori Nilai</option>
                      <option value="Kolaboratif">Kolaboratif</option>
                      <option value="Inovatif">Inovatif</option>
                      <option value="Harmonis">Harmonis</option>
                      <option value="Integritas">Integritas</option>
                      <option value="Dedikasi">Dedikasi</option>
                    </select>
                  </div>
                </div>

                {filteredAdminKudos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    Tidak ada kiriman apresiasi yang cocok dengan pencarian / filter.
                  </div>
                ) : (
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
                      {kudos.updatedAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {formatLastUpdatedWib(kudos.updatedAt)}
                        </div>
                      )}
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
                      Menampilkan <strong>{(safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE + 1} - {Math.min(safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE, filteredAdminKudos.length)}</strong> dari <strong>{filteredAdminKudos.length}</strong> apresiasi
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
              )}
              </div>
            );
          })()}

          {/* Kotak Ide & Aspirasi Masuk */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px' }}>
            {(() => {
              const normalizeAdminAspStatus = (st) => st === 'Masuk Rencana Proker' ? 'Masuk Rencana Event' : (st || 'Menunggu Review');
              const filteredAdminAspirasi = aspirasiList.filter(a => {
                const q = aspirasiSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (a.title || '').toLowerCase().includes(q) ||
                  (a.description || '').toLowerCase().includes(q) ||
                  (a.sender || '').toLowerCase().includes(q) ||
                  (a.category || '').toLowerCase().includes(q) ||
                  (a.adminReply || '').toLowerCase().includes(q);
                const matchesCat = aspirasiAdminCatFilter === 'all' || (a.category || 'Usulan Budaya') === aspirasiAdminCatFilter;
                const matchesStatus = aspirasiAdminStatusFilter === 'all' || normalizeAdminAspStatus(a.status) === aspirasiAdminStatusFilter;
                return matchesSearch && matchesCat && matchesStatus;
              });

              const ADMIN_ASPIRASI_PER_PAGE = 10;
              const totalAdminAspirasiPages = Math.ceil(filteredAdminAspirasi.length / ADMIN_ASPIRASI_PER_PAGE) || 1;
              const safeAdminAspirasiPage = Math.min(Math.max(1, adminAspirasiPage), totalAdminAspirasiPages);
              const paginatedAdminAspirasi = filteredAdminAspirasi.slice(
                (safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE,
                safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE
              );

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="var(--neon-cyan)" />
                      <div>
                        <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Kotak Ide, Tindak Lanjut & Balasan Aspirasi ({filteredAdminAspirasi.length} dari {aspirasiList.length})
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Ubah status realisasi dan berikan tanggapan resmi pengurus yang akan tampil di Papan Transparansi Aspirasi publik.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '180px', maxWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                          type="text"
                          placeholder="Cari judul, isi, atau pengusul..."
                          value={aspirasiSearchQuery}
                          onChange={(e) => {
                            setAspirasiSearchQuery(e.target.value);
                            setAdminAspirasiPage(1);
                          }}
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
                        value={aspirasiAdminCatFilter}
                        onChange={(e) => {
                          setAspirasiAdminCatFilter(e.target.value);
                          setAdminAspirasiPage(1);
                        }}
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
                        <option value="all">Semua Kategori</option>
                        <option value="Kegiatan & Event">Kegiatan & Event Budaya</option>
                        <option value="Olahraga & Wellness">Olahraga, E-Sports & Wellness</option>
                        <option value="Fasilitas & Ruang Kerja">Fasilitas & Kenyamanan Kerja</option>
                        <option value="Sharing & Pengembangan">Tech Sharing & Pengembangan Diri</option>
                        <option value="Sosial & Kerohanian">Sosial, CSR & Kerohanian</option>
                      </select>

                      <select
                        value={aspirasiAdminStatusFilter}
                        onChange={(e) => {
                          setAspirasiAdminStatusFilter(e.target.value);
                          setAdminAspirasiPage(1);
                        }}
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
                        <option value="all">Semua Status</option>
                        <option value="Menunggu Review">⏳ Menunggu Review</option>
                        <option value="Masuk Rencana Event">🚀 Masuk Rencana Event</option>
                        <option value="Sudah Direalisasikan">✓ Sudah Direalisasikan</option>
                      </select>

                      {filteredAdminAspirasi.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                            const header = ['ID', 'Pengusul', 'Kategori', 'Judul Usulan', 'Deskripsi', 'Status Tindak Lanjut', 'Tanggapan Pengurus', 'Publik', 'Waktu Kirim'].map(escapeCsv).join(',');
                            const rows = filteredAdminAspirasi.map(a => [
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
                            showToast(`Berhasil mengunduh ${filteredAdminAspirasi.length} data Aspirasi ke CSV!`);
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
                  </div>

                  {filteredAdminAspirasi.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      {aspirasiList.length === 0
                        ? 'Belum ada kiriman ide atau aspirasi program budaya dari pengunjung.'
                        : 'Tidak ada aspirasi yang cocok dengan kriteria pencarian atau filter.'}
                    </div>
                  ) : (
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
                            {asp.updatedAt && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                {formatLastUpdatedWib(asp.updatedAt)}
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
                        Menampilkan <strong>{(safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE + 1} - {Math.min(safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE, filteredAdminAspirasi.length)}</strong> dari <strong>{filteredAdminAspirasi.length}</strong> aspirasi
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
                )}
                </>
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
                Kategori Katalog <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                value={assetCategory}
                onChange={(e) => {
                  setAssetCategory(e.target.value);
                  clearFieldError('assetCategory');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.assetCategory ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
              >
                <option value="">-- Pilih Kategori Asset (Wajib) --</option>
                <option value="Logo & Brand">Logo & Brand</option>
                <option value="Template Presentasi">Template Presentasi (PPT)</option>
                <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
                <option value="Media & Publikasi">Media, Twibbon & Publikasi</option>
              </select>
              {renderFieldError('assetCategory')}
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
                  Format File <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="PNG / PPTX / ZIP"
                  value={assetFileType}
                  onChange={(e) => {
                    setAssetFileType(e.target.value);
                    clearFieldError('assetFileType');
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: `1.5px solid ${formErrors.assetFileType ? '#f43f5e' : 'var(--input-border)'}`, color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
                {renderFieldError('assetFileType')}
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

          {/* Existing Brand Assets List with Search, Filter & Pagination */}
          {(() => {
            const ADMIN_ASSETS_PER_PAGE = 9;
            const filteredAssets = brandAssets.filter(item => {
              const q = assetSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (item.title || '').toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                (item.badge || '').toLowerCase().includes(q) ||
                (item.fileType || '').toLowerCase().includes(q);
              const matchesCat = assetCatFilter === 'all' || item.category === assetCatFilter;
              return matchesSearch && matchesCat;
            });

            const totalAssetPages = Math.ceil(filteredAssets.length / ADMIN_ASSETS_PER_PAGE) || 1;
            const safeAssetPage = Math.min(Math.max(1, assetPage), totalAssetPages);
            const paginatedAssets = filteredAssets.slice(
              (safeAssetPage - 1) * ADMIN_ASSETS_PER_PAGE,
              safeAssetPage * ADMIN_ASSETS_PER_PAGE
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Katalog Asset ({filteredAssets.length} dari {brandAssets.length}):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari asset atau format..."
                        value={assetSearchQuery}
                        onChange={(e) => {
                          setAssetSearchQuery(e.target.value);
                          setAssetPage(1);
                        }}
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
                      value={assetCatFilter}
                      onChange={(e) => {
                        setAssetCatFilter(e.target.value);
                        setAssetPage(1);
                      }}
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
                      <option value="all">Semua Kategori</option>
                      <option value="Logo & Brand">Logo & Brand</option>
                      <option value="Template Presentasi">Template Presentasi (PPT)</option>
                      <option value="Virtual Background">Virtual Background (Teams / Zoom)</option>
                      <option value="Media & Publikasi">Media & Publikasi</option>
                    </select>
                  </div>
                </div>

                {filteredAssets.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    Tidak ada asset yang cocok dengan pencarian / filter.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {paginatedAssets.map((item) => (
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
                          {item.updatedAt && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                              {formatLastUpdatedWib(item.updatedAt)}
                            </div>
                          )}
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
                )}

                {totalAssetPages > 1 && (
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
                      Menampilkan <strong>{(safeAssetPage - 1) * ADMIN_ASSETS_PER_PAGE + 1} - {Math.min(safeAssetPage * ADMIN_ASSETS_PER_PAGE, filteredAssets.length)}</strong> dari <strong>{filteredAssets.length}</strong> asset
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAssetPage === 1}
                        onClick={() => setAssetPage(p => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAssetPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAssetPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAssetPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAssetPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAssetPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAssetPage(pg)}
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
                        disabled={safeAssetPage === totalAssetPages}
                        onClick={() => setAssetPage(p => Math.min(totalAssetPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAssetPage === totalAssetPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAssetPage === totalAssetPages ? 'not-allowed' : 'pointer',
                          opacity: safeAssetPage === totalAssetPages ? 0.45 : 1
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
                  Kategori Topik <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  value={faqCategory}
                  onChange={(e) => {
                    setFaqCategory(e.target.value);
                    clearFieldError('faqCategory');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.faqCategory ? '#f43f5e' : 'var(--border-card)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">-- Pilih Kategori Topik (Wajib) --</option>
                  <option value="Tentang CNT">Tentang CNT</option>
                  <option value="Kegiatan & Event">Kegiatan & Event</option>
                  <option value="Operasional & Sekben">Operasional & Sekben</option>
                  <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                  <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                  <option value="Umum">Umum</option>
                </select>
                {renderFieldError('faqCategory')}
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

          {/* List of FAQs with Search, Filter & Pagination */}
          {(() => {
            const ADMIN_FAQS_PER_PAGE = 10;
            const filteredAdminFaqs = faqs.filter(f => {
              const q = faqSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (f.question || '').toLowerCase().includes(q) ||
                (f.answer || '').toLowerCase().includes(q);
              const matchesCat = faqCatFilter === 'all' || f.category === faqCatFilter;
              return matchesSearch && matchesCat;
            });

            const totalAdminFaqPages = Math.ceil(filteredAdminFaqs.length / ADMIN_FAQS_PER_PAGE) || 1;
            const safeAdminFaqPage = Math.min(Math.max(1, adminFaqPage), totalAdminFaqPages);
            const paginatedAdminFaqs = filteredAdminFaqs.slice(
              (safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE,
              safeAdminFaqPage * ADMIN_FAQS_PER_PAGE
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar Pertanyaan FAQ ({filteredAdminFaqs.length} dari {faqs.length}):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari pertanyaan/jawaban..."
                        value={faqSearchQuery}
                        onChange={(e) => {
                          setFaqSearchQuery(e.target.value);
                          setAdminFaqPage(1);
                        }}
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
                      value={faqCatFilter}
                      onChange={(e) => {
                        setFaqCatFilter(e.target.value);
                        setAdminFaqPage(1);
                      }}
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
                      <option value="all">Semua Kategori</option>
                      <option value="Tentang CNT">Tentang CNT</option>
                      <option value="Kegiatan & Event">Kegiatan & Event</option>
                      <option value="Operasional & Sekben">Operasional & Sekben</option>
                      <option value="Aspirasi & Usulan">Aspirasi & Usulan</option>
                      <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>

                {filteredAdminFaqs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                    Tidak ada pertanyaan FAQ yang cocok dengan pencarian / filter.
                  </div>
                ) : (
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
                        {f.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                            {formatLastUpdatedWib(f.updatedAt)}
                          </div>
                        )}
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
                </div>
                )}

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
                      Menampilkan <strong>{(safeAdminFaqPage - 1) * ADMIN_FAQS_PER_PAGE + 1} - {Math.min(safeAdminFaqPage * ADMIN_FAQS_PER_PAGE, filteredAdminFaqs.length)}</strong> dari <strong>{filteredAdminFaqs.length}</strong> pertanyaan FAQ
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
                    editingItem.type === 'role' ? 'Data Role & Struktur' :
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Lengkap <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input
                      type="text"
                      value={editingItem.item.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
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

                {/* ROLE & DIVISI SELECTION IN EDIT MODAL */}
                {(() => {
                  const editMemberTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                  const availableRoles = getTenureRoles(editMemberTenureId, roleQuotas, tenureRoles);
                  const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                    availableRoles.find(r => r.name.toLowerCase() === (editingItem.item.role || '').toLowerCase()) ||
                    null;
                  const requiresDiv = selectedRole ? selectedRole.requiresDivision : (editingItem.item.category === 'anggota' || editingItem.item.category === 'pimpro');
                  const editMemberDivs = divisions.filter(d => d.tenureId === editMemberTenureId);

                  return (
                    <div className="mobile-two-col" style={{ gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                        </label>
                        <select
                          value={selectedRole?.id || ''}
                          onChange={(e) => {
                            const rId = e.target.value;
                            const rObj = availableRoles.find(r => r.id === rId);
                            if (rObj) {
                              const newCat = getCategoryFromLevel(rObj.level);
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  roleId: rObj.id,
                                  role: rObj.name,
                                  category: newCat,
                                  divisionId: rObj.requiresDivision ? editingItem.item.divisionId : undefined
                                }
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                        >
                          {availableRoles.length === 0 ? (
                            <option value="" disabled>-- Role kepengurusan masih kosong di periode ini. Silakan buat role baru di menu Kelola Role & Jabatan --</option>
                          ) : (
                            <>
                              <option value="">-- Pilih Jabatan / Role --</option>
                              {availableRoles.map((r) => {
                                const levelInfo = LEVEL_OPTIONS.find(l => l.level === r.level);
                                const quotaText = r.max > 0 ? `Maks ${r.max}` : 'Unlimited';
                                const divText = r.requiresDivision ? ' • Butuh Divisi' : '';
                                return (
                                  <option key={r.id} value={r.id}>
                                    {r.name} ({levelInfo?.shortLabel || `Level ${r.level}`} • {quotaText}{divText})
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </select>
                        {availableRoles.length === 0 && (
                          <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: '6px', lineHeight: 1.4 }}>
                            ⚠️ <strong>Role kepengurusan masih kosong</strong> pada periode kepengurusan ini. Silakan buat role baru terlebih dahulu di menu <strong>Kelola Role & Jabatan</strong>.
                          </div>
                        )}
                      </div>

                      {requiresDiv ? (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Divisi Penugasan <span style={{ color: '#f43f5e' }}>*</span>
                          </label>
                          <select
                            value={editingItem.item.divisionId || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, divisionId: e.target.value || undefined } })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                          >
                            <option value="">-- Pilih Divisi / Squad --</option>
                            {editMemberDivs.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          {editMemberDivs.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '3px' }}>
                              ⚠️ Periode ini belum memiliki divisi.
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Lingkup Tugas
                          </label>
                          <div style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            Lintas Divisi / Tidak Memerlukan Divisi Khusus
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="mobile-two-col" style={{ gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor WhatsApp (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 08123456789 atau 628123456789"
                      value={editingItem.item.whatsapp || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, whatsapp: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Motto / Pesan Semangat (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Siap berkontribusi aktif memajukan budaya kolaborasi IT APD"
                      value={editingItem.item.motto || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, motto: e.target.value } })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                    />
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
                      placeholder="URL Foto (https://...)"
                      value={editingItem.item.image || ''}
                      onChange={(e) => {
                        setEditingItem({ ...editingItem, item: { ...editingItem.item, image: e.target.value } });
                        if (editModalError) setEditModalError('');
                      }}
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

                <div className="mobile-two-col" style={{ gap: '10px' }}>
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
                      const activeDates = editingItem.item._dates || currentParsed.dates || [currentParsed.date, currentParsed.date];
                      
                      const setMode = (newMode) => {
                        const newDateStr = buildFlexibleDate(newMode, {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          dates: activeDates,
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
                            _dates: activeDates,
                            date: newDateStr
                          }
                        });
                      };

                      const updateField = (key, val) => {
                        const nextDates = key === 'dates' ? val : (editingItem.item._dates || currentParsed.dates || [currentParsed.date]);
                        const stateObj = {
                          date: editingItem.item._dateVal !== undefined ? editingItem.item._dateVal : currentParsed.date,
                          dates: nextDates,
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
                                { id: 'dates', label: 'Pilih Tanggal' },
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

                          {activeMode === 'dates' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Pilih dua atau lebih tanggal pelaksanaan kegiatan (otomatis diurutkan secara kronologis):
                              </div>
                              {activeDates.map((dVal, dIdx) => (
                                <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', minWidth: '65px' }}>
                                    Hari ke-{dIdx + 1}:
                                  </span>
                                  <input
                                    type="date"
                                    value={dVal}
                                    onChange={(e) => {
                                      const next = [...activeDates];
                                      next[dIdx] = e.target.value;
                                      updateField('dates', next);
                                    }}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                  />
                                  {activeDates.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = activeDates.filter((_, i) => i !== dIdx);
                                        updateField('dates', next);
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px' }}
                                      title="Hapus tanggal ini"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...activeDates, new Date().toISOString().split('T')[0]];
                                    updateField('dates', next);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '5px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    background: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.08)',
                                    color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                                    border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(0, 61, 121, 0.25)',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Plus size={13} />
                                  <span>Tambah Tanggal Pelaksanaan</span>
                                </button>
                              </div>
                            </div>
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

                          <div style={{ fontSize: '0.75rem', color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700 }}>👁️ Tampilan di Web:</span>
                            <strong style={{
                              color: isDark ? '#ffffff' : 'var(--mandiri-blue)',
                              background: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
                              border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #7dd3fc',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              display: 'inline-block'
                            }}>
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
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.08)',
                        border: isDark ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(0, 61, 121, 0.25)',
                        color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={13} />
                      <span>Tambah Link Lain</span>
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nama Kepengurusan <span style={{ color: '#f43f5e' }}>*</span></label>
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

                {/* Option: Show Announcement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.showAnnouncement ? '#10b981' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!editingItem.item.showAnnouncement}
                      onChange={(e) => {
                        const isShow = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            showAnnouncement: isShow
                          }
                        });
                      }}
                    />
                    <span>🎉 Tampilkan Papan Pengumuman Peserta Terpilih (Hall of Welcome) di Halaman Web</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.showAnnouncement
                      ? 'Aktif: Daftar peserta yang berstatus "Accepted / Diterima" akan dipublikasikan secara terbuka pada section Hall of Welcome di halaman formulir.'
                      : 'Nonaktif: Hasil seleksi tidak dipublikasikan ke publik di halaman formulir (hanya dapat dicek secara mandiri oleh responden jika tracking aktif).'}
                  </span>
                </div>

                {/* Option: Batasi Kuota Responden */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: editingItem.item.isLimited ? '#06b6d4' : 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!editingItem.item.isLimited}
                      onChange={(e) => {
                        const isLim = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            isLimited: isLim,
                            maxQuota: isLim ? (editingItem.item.maxQuota || 50) : 0
                          }
                        });
                      }}
                    />
                    <span>🔒 Batasi Kuota Responden / Pengisian Formulir</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: '24px' }}>
                    {editingItem.item.isLimited
                      ? 'Aktif: Formulir akan otomatis ditutup bila total data yang mengisi/submit telah mencapai batas kuota maksimal.'
                      : 'Nonaktif: Formulir terbuka tanpa batasan kuota responden (hanya dibatasi oleh deadline).'}
                  </span>
                  {editingItem.item.isLimited && (
                    <div style={{ marginLeft: '24px', marginTop: '2px', maxWidth: '280px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Maksimal Kuota Responden <span style={{ color: '#f43f5e' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 100"
                        value={editingItem.item.maxQuota || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              maxQuota: val === '' ? '' : parseInt(val, 10) || 0
                            }
                          });
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
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
                      max={editingItem.item.endDate ? toDatetimeLocalValue(editingItem.item.endDate) : undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = val;
                        const eVal = editingItem.item.endDate || val;
                        const normStart = toDatetimeLocalValue(sVal);
                        const normEnd = toDatetimeLocalValue(editingItem.item.endDate);
                        if (normStart && normEnd && normStart > normEnd) {
                          setEditModalError('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
                        } else {
                          setEditModalError('');
                        }
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            startDate: sVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: `1px solid ${(editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate)) ? '#f43f5e' : 'var(--input-border)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.86rem'
                      }}
                    />
                    {editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate) && (
                      <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      📅 Tanggal & Jam Berakhir (WIB) <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editingItem.item.endDate)}
                      min={editingItem.item.startDate ? toDatetimeLocalValue(editingItem.item.startDate) : undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sVal = editingItem.item.startDate || val;
                        const eVal = val;
                        const normStart = toDatetimeLocalValue(editingItem.item.startDate);
                        const normEnd = toDatetimeLocalValue(eVal);
                        if (normStart && normEnd && normEnd < normStart) {
                          setEditModalError('Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai');
                        } else {
                          setEditModalError('');
                        }
                        setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            endDate: eVal,
                            date: formatWibEventRange(sVal, eVal)
                          }
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: `1px solid ${(editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.endDate) < toDatetimeLocalValue(editingItem.item.startDate)) ? '#f43f5e' : 'var(--input-border)'}`,
                        color: 'var(--text-main)',
                        fontSize: '0.86rem'
                      }}
                    />
                    {editingItem.item.startDate && editingItem.item.endDate && toDatetimeLocalValue(editingItem.item.endDate) < toDatetimeLocalValue(editingItem.item.startDate) && (
                      <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai
                      </div>
                    )}
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
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Peserta</label>
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
                    🏷️ Kategori Program / Kegiatan <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  {(() => {
                    const currentCat = editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '';
                    const standardCats = [
                      'Program Budaya',
                      'Workshop & Sharing Session',
                      'Social & Engagement',
                      'Olahraga & Well-being',
                      'Kompetisi & Inovasi',
                      'Apresiasi & Rekognisi',
                      'Townhall & Perayaan'
                    ];
                    const hasCustomCat = currentCat && !standardCats.includes(currentCat);
                    return (
                      <select
                        value={currentCat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              kategori: val,
                              category: val,
                              badge: val
                            }
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                      >
                        <option value="">-- Pilih Kategori Kegiatan * --</option>
                        {standardCats.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {hasCustomCat && (
                          <option value={currentCat}>{currentCat}</option>
                        )}
                      </select>
                    );
                  })()}
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

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 184, 0, 0.06)',
                  border: '1px solid rgba(255, 184, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.item.isLimited)}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        item: {
                          ...editingItem.item,
                          isLimited: e.target.checked
                        }
                      })}
                      style={{ accentColor: 'var(--mandiri-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      🔒 Batasi Kuota Pendaftaran RSVP untuk Event Ini?
                    </span>
                  </label>

                  {editingItem.item.isLimited && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Batas Maksimal Kuota Peserta (Orang) <span style={{ color: '#f43f5e' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 100"
                        value={editingItem.item.maxQuota !== undefined && editingItem.item.maxQuota !== null ? editingItem.item.maxQuota : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            item: {
                              ...editingItem.item,
                              maxQuota: v === '' ? '' : Number(v)
                            }
                          });
                        }}
                        style={{
                          maxWidth: '220px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        RSVP akan ditutup otomatis ketika jumlah peserta yang mendaftar telah mencapai angka ini.
                      </span>
                    </div>
                  )}
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

            {/* Edit Role Form */}
            {editingItem.type === 'role' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Jabatan / Role <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.item.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, name: e.target.value } })}
                    placeholder="Contoh: Sekretaris Jenderal"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Periode Kepengurusan
                  </label>
                  <select
                    value={editingItem.item.tenureId || activeTenure?.id || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, tenureId: e.target.value } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {tenures.map(t => (
                      <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tingkatan di Bagan Organigram
                  </label>
                  <select
                    value={editingItem.item.level ?? 5}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, level: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  >
                    {LEVEL_OPTIONS.map(lvl => (
                      <option key={lvl.level} value={lvl.level}>
                        {formatLevelOptionLabel(lvl, tenureRoles, editingItem.item.tenureId || activeTenure?.id || tenures[0]?.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Batas Maksimal Kuota Personel (0 = Tanpa Batas / Unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.item.max ?? editingItem.item.maxQuota ?? 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditingItem({ ...editingItem, item: { ...editingItem.item, max: val, maxQuota: val } });
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-card)'
                }}>
                  <input
                    type="checkbox"
                    id="editRoleRequireDiv"
                    checked={Boolean(editingItem.item.requiresDivision)}
                    onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, requiresDivision: e.target.checked } })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="editRoleRequireDiv" style={{ fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <strong>Memerlukan Pilihan Divisi</strong> (Personel dengan role ini wajib memilih divisi)
                  </label>
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
                  if ((editingItem.type === 'member' || editingItem.type === 'division' || editingItem.type === 'department' || editingItem.type === 'role') && !(it.name || '').trim()) {
                    setEditModalError('Nama wajib diisi sebelum menyimpan perubahan');
                    showToast('Nama wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if ((editingItem.type === 'gallery' || editingItem.type === 'tenure' || editingItem.type === 'form' || editingItem.type === 'event' || editingItem.type === 'brand_asset') && !(it.title || '').trim()) {
                    setEditModalError('Judul wajib diisi sebelum menyimpan perubahan');
                    showToast('Judul wajib diisi sebelum menyimpan perubahan', 'error');
                    return;
                  }
                  if (editingItem.type === 'tenure' && !(it.code || '').trim()) {
                    setEditModalError('Kode tahun periode wajib diisi');
                    showToast('Kode tahun periode wajib diisi', 'error');
                    return;
                  }
                  if (editingItem.type === 'faq') {
                    if (!(it.category || '').trim()) {
                      setEditModalError('Kategori topik FAQ wajib dipilih');
                      showToast('Kategori topik FAQ wajib dipilih', 'error');
                      return;
                    }
                    if (!(it.question || '').trim() || !(it.answer || '').trim()) {
                      setEditModalError('Pertanyaan dan jawaban FAQ wajib diisi');
                      showToast('Pertanyaan dan jawaban FAQ wajib diisi', 'error');
                      return;
                    }
                  }
                  if (editingItem.type === 'form') {
                    if (!(it.category || '').trim()) {
                      setEditModalError('Kategori formulir wajib dipilih');
                      showToast('Kategori formulir wajib dipilih', 'error');
                      return;
                    }
                    if (!(it.deadline || '').trim()) {
                      setEditModalError('Batas Akhir / Deadline Pendaftaran wajib ditentukan');
                      showToast('Batas Akhir / Deadline Pendaftaran wajib ditentukan', 'error');
                      return;
                    }
                    if (it.isLimited && (!it.maxQuota || parseInt(it.maxQuota, 10) <= 0)) {
                      setEditModalError('Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi');
                      showToast('Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi', 'error');
                      return;
                    }
                  }
                  if (editingItem.type === 'kudos' && (!(it.sender || '').trim() || !(it.recipient || '').trim() || !(it.message || '').trim())) {
                    setEditModalError('Pengirim, penerima, dan pesan apresiasi wajib diisi');
                    showToast('Pengirim, penerima, dan pesan apresiasi wajib diisi', 'error');
                    return;
                  }

                  if (editingItem.type === 'member' && onUpdateMember) {
                    const targetTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                    const availableRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
                    if (availableRoles.length === 0) {
                      setEditModalError('Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.');
                      showToast('Role kepengurusan masih kosong pada periode ini.', 'error');
                      return;
                    }
                    const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                      availableRoles.find(r => r.name.toLowerCase() === (editingItem.item.role || '').toLowerCase()) ||
                      null;

                    if (!selectedRole) {
                      setEditModalError('Jabatan / Role wajib dipilih');
                      showToast('Jabatan / Role wajib dipilih', 'error');
                      return;
                    }

                    if (selectedRole?.requiresDivision && !editingItem.item.divisionId) {
                      setEditModalError(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`);
                      showToast(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`, 'error');
                      return;
                    }

                    // Validasi Ketat Kuota Kepengurusan saat edit
                    const quotaCheck = validateMemberQuota(
                      {
                        tenureId: targetTenureId,
                        roleId: selectedRole?.id,
                        role: selectedRole?.name || editingItem.item.role,
                        divisionId: selectedRole?.requiresDivision ? editingItem.item.divisionId : undefined,
                        excludeMemberId: editingItem.item.id
                      },
                      members,
                      divisions,
                      roleQuotas,
                      tenureRoles
                    );

                    if (!quotaCheck.isValid) {
                      setEditModalError(quotaCheck.error);
                      showToast(quotaCheck.error, 'error');
                      return;
                    }
                    let finalImage = (editingItem.item.image || '').trim();

                    // Validasi URL foto jika diinput dalam bentuk tautan web
                    if (finalImage && !editingItem.pendingPhoto && !finalImage.startsWith('blob:')) {
                      setIsUploadingMedia(true);
                      showToast('Memverifikasi tautan foto profil...');
                      const check = await verifyImageUrl(finalImage, { requireHttps: true, allowRelative: false });
                      if (!check.valid) {
                        setIsUploadingMedia(false);
                        setEditModalError(`Tautan foto tidak valid: ${check.error}`);
                        showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                        return;
                      }
                      setIsUploadingMedia(false);
                    }

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
                    const finalCat = getCategoryFromLevel(selectedRole?.level ?? 5);
                    const divObj = selectedRole?.requiresDivision ? divisions.find(d => d.id === cleanItem.divisionId) : null;
                    const finalRoleName = selectedRole?.requiresDivision && selectedRole?.name.toLowerCase() === 'pimpro' && divObj
                      ? `Pimpro ${divObj.name}`
                      : (selectedRole?.name || cleanItem.role || '');

                    onUpdateMember({
                      ...cleanItem,
                      roleId: selectedRole?.id,
                      role: finalRoleName,
                      title: divObj?.name || '',
                      category: finalCat,
                      divisionId: selectedRole?.requiresDivision ? cleanItem.divisionId : undefined,
                      image: finalImage,
                      responsibilities: finalResp
                    });
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
                    if (!editingItem.item.divisionId && !editingItem.item.division) {
                      setEditModalError('Divisi penyelenggara wajib dipilih untuk galeri');
                      showToast('Divisi penyelenggara wajib dipilih untuk galeri', 'error');
                      return;
                    }
                    if (!(editingItem.item.description || '').trim()) {
                      setEditModalError('Deskripsi kegiatan wajib diisi untuk galeri');
                      showToast('Deskripsi kegiatan wajib diisi untuk galeri', 'error');
                      return;
                    }
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
                      const cleanDeadline = editingItem.item.deadline ? toDatetimeLocalSecondsValue(editingItem.item.deadline) : '';
                      const isLimitedVal = editingItem.item.isLimited === true;
                      const maxQuotaVal = isLimitedVal ? (parseInt(editingItem.item.maxQuota, 10) || 0) : 0;
                      onUpdateForm({
                        ...editingItem.item,
                        deadline: cleanDeadline,
                        fields: cleanFields,
                        isLimited: isLimitedVal,
                        maxQuota: maxQuotaVal
                      });
                    }
                  }
                  if (editingItem.type === 'event' && onUpdateEvent) {
                    const catVal = (editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '').trim();
                    if (!catVal) {
                      setEditModalError('Kategori program/kegiatan wajib dipilih');
                      showToast('Kategori program/kegiatan wajib dipilih', 'error');
                      return;
                    }
                    if (!editingItem.item.divisionId) {
                      setEditModalError('Divisi penyelenggara wajib dipilih untuk Event');
                      showToast('Divisi penyelenggara wajib dipilih untuk Event', 'error');
                      return;
                    }
                    if (!editingItem.item.startDate) {
                      setEditModalError('Tanggal & Jam Mulai event wajib diisi');
                      showToast('Tanggal & Jam Mulai event wajib diisi', 'error');
                      return;
                    }
                    if (!editingItem.item.endDate) {
                      setEditModalError('Tanggal & Jam Berakhir event wajib diisi');
                      showToast('Tanggal & Jam Berakhir event wajib diisi', 'error');
                      return;
                    }
                    if (toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate)) {
                      setEditModalError('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
                      showToast('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir', 'error');
                      return;
                    }
                    if (!(editingItem.item.description || '').trim()) {
                      setEditModalError('Deskripsi kegiatan event wajib diisi');
                      showToast('Deskripsi kegiatan event wajib diisi', 'error');
                      return;
                    }
                    if (editingItem.item.isLimited) {
                      const mq = Number(editingItem.item.maxQuota || 0);
                      if (!mq || mq <= 0) {
                        setEditModalError('Batas maksimal kuota wajib diisi angka lebih dari 0');
                        showToast('Batas maksimal kuota wajib diisi angka lebih dari 0', 'error');
                        return;
                      }
                    }
                    if (editingItem.item.totalRab === '' || editingItem.item.totalRab === undefined || editingItem.item.totalRab === null || isNaN(Number(editingItem.item.totalRab)) || Number(editingItem.item.totalRab) < 0) {
                      setEditModalError('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)');
                      showToast('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)', 'error');
                      return;
                    }
                    const pesertaVal = (editingItem.item.peserta || editingItem.item.kpi || '').trim();
                    const calculatedDate = formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate);
                    onUpdateEvent({
                      ...editingItem.item,
                      kategori: catVal,
                      category: catVal,
                      badge: catVal,
                      peserta: pesertaVal,
                      kpi: pesertaVal,
                      totalRab: Number(editingItem.item.totalRab),
                      isLimited: Boolean(editingItem.item.isLimited),
                      maxQuota: editingItem.item.isLimited ? Number(editingItem.item.maxQuota || 0) : 0,
                      date: calculatedDate || (editingItem.item.date || '').trim() || ''
                    });
                  }
                  if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) {
                    const assetCat = (editingItem.item.category || '').trim();
                    if (!assetCat) {
                      setEditModalError('Kategori katalog asset wajib dipilih');
                      showToast('Kategori katalog asset wajib dipilih', 'error');
                      return;
                    }
                    const assetFType = (editingItem.item.fileType || '').trim();
                    if (!assetFType) {
                      setEditModalError('Format file asset wajib diisi');
                      showToast('Format file asset wajib diisi', 'error');
                      return;
                    }
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
                    const isValidUrl = (url) => /^https?:\/\/.+/i.test(url.trim()) || url.trim().startsWith('/');
                    if (finalFileUrl && !editingItem.pendingFile && !isValidUrl(finalFileUrl)) {
                      setEditModalError('URL file harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL file harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    if (finalPreviewUrl && !editingItem.pendingPreviewFile && !isValidUrl(finalPreviewUrl)) {
                      setEditModalError('URL preview harus berupa tautan web yang valid (diawali http:// atau https://)');
                      showToast('URL preview harus berupa tautan web yang valid', 'error');
                      return;
                    }
                    const isImageFile = (url) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');
                    const effectiveFileUrl = finalFileUrl || (isImageFile(finalPreviewUrl) ? finalPreviewUrl : '');
                    const effectivePreviewUrl = finalPreviewUrl || (isImageFile(finalFileUrl) ? finalFileUrl : '');
                    if (!effectiveFileUrl) {
                      setEditModalError('File asset wajib diunggah atau memiliki tautan file aktif');
                      showToast('File asset wajib diunggah', 'error');
                      return;
                    }
                    onUpdateBrandAsset({
                      ...editingItem.item,
                      fileUrl: effectiveFileUrl,
                      previewUrl: effectivePreviewUrl
                    });
                  }
                  if (editingItem.type === 'role' && onUpdateTenureRole) onUpdateTenureRole(editingItem.item);
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

      {/* MODAL 1: PENGATURAN STRUKTUR ORGANISASI & ROLE KEPENGURUSAN */}
      {isOrgRolesOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏛️</span>
                  <span>Pengaturan Struktur Organisasi & Role</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Kelola daftar jabatan, kuota maksimal, tingkatan organigram, dan kebutuhan divisi untuk tiap periode kepengurusan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgRolesOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tenure Selector & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-card)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    Kepengurusan:
                  </label>
                  <select
                    value={selectedOrgTenureId || activeTenure?.id || ''}
                    onChange={(e) => setSelectedOrgTenureId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {tenures.map(t => (
                      <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const curTenure = selectedOrgTenureId || activeTenure?.id || tenures[0]?.id;
                      setRoleModal({
                        isOpen: true,
                        mode: 'add',
                        tenureId: curTenure,
                        role: { id: '', name: '', level: 5, max: 0, requiresDivision: true }
                      });
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Role Baru</span>
                  </button>

                </div>
              </div>

              {/* Roles Table */}
              {(() => {
                const curTenureId = selectedOrgTenureId || activeTenure?.id || tenures[0]?.id || '';
                const roles = getTenureRoles(curTenureId, roleQuotas, tenureRoles);
                const tenureMembers = members.filter(m => !curTenureId || m.tenureId === curTenureId);

                return (
                  <div style={{
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-card)' }}>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Jabatan / Role</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Tingkat Organigram</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Kuota Maks</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Perlu Divisi?</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Terisi</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => {
                          const levelInfo = LEVEL_OPTIONS.find(l => l.level === role.level);
                          const matched = tenureMembers.filter(m => {
                            if (m.roleId && m.roleId === role.id) return true;
                            const mRole = String(m.role || '').toLowerCase().trim();
                            const rName = role.name.toLowerCase().trim();
                            return mRole === rName || (role.requiresDivision && mRole.startsWith(rName));
                          });
                          const isFull = role.max > 0 && matched.length >= role.max;
                          const occNames = matched.map(m => m.name).join(', ');

                          return (
                            <tr key={role.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                {role.name}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: role.level <= 1 ? 'rgba(255, 184, 0, 0.15)' : (role.level <= 3 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                                  color: role.level <= 1 ? 'var(--mandiri-gold)' : (role.level <= 3 ? 'var(--neon-cyan)' : 'var(--text-muted)'),
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  {levelInfo?.shortLabel || `Level ${role.level}`}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>
                                {role.max > 0 ? (
                                  <span style={{ fontWeight: 700 }}>{role.max} orang</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Unlimited</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                {role.requiresDivision ? (
                                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>
                                    ✓ Ya (Per Divisi)
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    — Tidak (Global)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span
                                  title={occNames ? `Terisi oleh: ${occNames}` : 'Belum ada anggota'}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: isFull ? 'rgba(255, 184, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isFull ? 'var(--mandiri-gold)' : '#10b981',
                                    fontWeight: 700,
                                    fontSize: '0.72rem'
                                  }}
                                >
                                  {matched.length}{role.max > 0 ? `/${role.max}` : ''} {isFull && '(Penuh)'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoleModal({
                                        isOpen: true,
                                        mode: 'edit',
                                        tenureId: curTenureId,
                                        role: { ...role }
                                      });
                                    }}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      color: 'var(--neon-cyan)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600
                                    }}
                                    title="Edit Role ini"
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(curTenureId, role)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(244, 63, 94, 0.1)',
                                      border: '1px solid rgba(244, 63, 94, 0.3)',
                                      color: '#f43f5e',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600
                                    }}
                                    title="Hapus Role ini"
                                  >
                                    <Trash2 size={12} />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {roles.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Belum ada role/jabatan terdaftar untuk periode ini. Silakan klik tombol <strong>Tambah Role Baru</strong> di atas untuk membuat role.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-card)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <button
                type="button"
                onClick={() => setIsOrgRolesOpen(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT ROLE */}
      {roleModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {roleModal.mode === 'add' ? '➕ Tambah Role / Jabatan Baru' : '✏️ Edit Role / Jabatan'}
              </h4>
              <button
                type="button"
                onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nama Jabatan / Role *
              </label>
              <input
                type="text"
                placeholder="Contoh: Sekretaris Jenderal, Wakil Pimpro, Dewan Penasehat"
                value={roleModal.role.name}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, name: e.target.value } })}
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
                Tingkatan di Bagan Organigram *
              </label>
              <select
                value={roleModal.role.level ?? 5}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, level: Number(e.target.value) } })}
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
                {LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl.level} value={lvl.level}>
                    {formatLevelOptionLabel(lvl, tenureRoles, roleModal.tenureId || selectedOrgTenureId || activeTenure?.id || tenures[0]?.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Batas Maksimal Kuota Personel
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 = Unlimited"
                  value={roleModal.role.max ?? 0}
                  onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, max: parseInt(e.target.value) || 0 } })}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {Number(roleModal.role.max) > 0 ? 'orang (dibatasi)' : 'orang (Tanpa Batas / Unlimited)'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Isi 0 jika tidak ada kuota maksimal (misal untuk Anggota Divisi).
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)'
            }}>
              <input
                type="checkbox"
                id="modalRequireDiv"
                checked={Boolean(roleModal.role.requiresDivision)}
                onChange={(e) => setRoleModal({ ...roleModal, role: { ...roleModal.role, requiresDivision: e.target.checked } })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="modalRequireDiv" style={{ fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.4 }}>
                <strong>Memerlukan Pilihan Divisi</strong>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Centang jika personel dengan role ini wajib ditempatkan di divisi tertentu (contoh: Pimpro, Anggota Divisi).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveRole(roleModal.tenureId, roleModal.role)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Simpan Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ROLE DELETE DEPENDENCY WARNING */}
      {roleDeleteWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 25px 50px -12px rgba(244, 63, 94, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
                flexShrink: 0
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f43f5e' }}>
                  Tidak Dapat Menghapus Role
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Role "{roleDeleteWarning.role.name}" masih memiliki ketergantungan personel
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Role ini tidak dapat dihapus karena masih digunakan oleh <strong>{roleDeleteWarning.members.length} anggota</strong> pada kepengurusan ini:
            </p>

            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {roleDeleteWarning.members.map((m, idx) => (
                <div key={m.id || idx} style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--mandiri-gold)', fontWeight: 700 }}>•</span>
                  <span><strong>{m.name}</strong> ({m.role})</span>
                </div>
              ))}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              💡 <em>Silakan ubah terlebih dahulu jabatan personel di atas ke role lain melalui tombol edit di tabel personel sebelum menghapus role ini.</em>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setRoleDeleteWarning(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Mengerti & Tutup
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
                            : (deleteConfirm.type === 'role'
                                ? 'Role Masih Digunakan Personel'
                                : (deleteConfirm.type === 'department'
                                ? 'Departemen Masih Digunakan RSVP'
                                : (deleteConfirm.type === 'member'
                                    ? 'Pimpro Masih Memimpin Anggota'
                                    : (deleteConfirm.type === 'event'
                                        ? 'Event Memiliki Data RSVP'
                                        : (deleteConfirm.type === 'form'
                                            ? 'Formulir Memiliki Data Pengisian'
                                            : 'Data Masih Memiliki Ketergantungan')))))))
                    : (deleteConfirm.type === 'gallery_photo'
                        ? 'Konfirmasi Hapus Foto'
                        : (deleteConfirm.type === 'tenure'
                            ? 'Konfirmasi Hapus Periode'
                            : (deleteConfirm.type === 'division'
                                ? 'Konfirmasi Hapus Divisi'
                                : (deleteConfirm.type === 'role'
                                    ? 'Konfirmasi Hapus Role'
                                    : (deleteConfirm.type === 'department'
                                    ? 'Konfirmasi Hapus Departemen'
                                    : (deleteConfirm.type === 'member'
                                        ? 'Konfirmasi Hapus Personel'
                                        : (deleteConfirm.type === 'event'
                                            ? 'Konfirmasi Hapus Event'
                                            : (deleteConfirm.type === 'form'
                                                ? 'Konfirmasi Hapus Formulir'
                                                : 'Konfirmasi Penghapusan Data')))))))))}
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
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.divCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.divCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                      background: deleteConfirm.galCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.galCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                      background: deleteConfirm.formCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.formCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: deleteConfirm.galCount > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
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
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
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
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
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
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
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

            {/* ROLE BODY */}
            {deleteConfirm.type === 'role' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Role <strong>"{deleteConfirm.name}"</strong> tidak dapat dihapus karena masih digunakan oleh <strong>{deleteConfirm.dependentCount} personel</strong> pada periode ini.
                  </p>
                  <div style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    lineHeight: 1.45,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {(deleteConfirm.dependentMembers || []).map((m, i) => (
                      <div key={m.id || i}>• <strong>{m.name}</strong> ({m.role})</div>
                    ))}
                  </div>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left'
                  }}>
                    💡 <strong>Petunjuk:</strong> Ubah jabatan personel di atas ke role lain pada tab <strong>Pengurus & Anggota</strong> sebelum menghapus role ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus role <strong>"{deleteConfirm.name}"</strong> dari periode kepengurusan ini?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left'
                  }}>
                    🛡️ <strong>Aman:</strong> Tidak ada personel yang sedang menggunakan role ini pada periode yang dipilih.
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
                      if (deleteConfirm.type === 'role' && onDeleteTenureRole) onDeleteTenureRole(deleteConfirm.id);
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
                                    : (deleteConfirm.type === 'role'
                                        ? `Role "${deleteConfirm.name}" berhasil dihapus!`
                                        : (deleteConfirm.type === 'department'
                                        ? `Departemen "${deleteConfirm.name}" berhasil dihapus!`
                                        : (deleteConfirm.type === 'event'
                                            ? `Event "${deleteConfirm.name}" berhasil dihapus!`
                                            : (deleteConfirm.type === 'form'
                                                ? `Formulir "${deleteConfirm.name}" berhasil dihapus!`
                                                : 'Data berhasil dihapus & disinkronkan!'))))))));

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
                                      : (deleteConfirm.type === 'role'
                                          ? 'Ya, Hapus Role'
                                          : (deleteConfirm.type === 'department'
                                          ? 'Ya, Hapus Departemen'
                                          : (deleteConfirm.type === 'event'
                                              ? 'Ya, Hapus Event'
                                              : (deleteConfirm.type === 'form'
                                                  ? 'Ya, Hapus Formulir'
                                                  : 'Ya, Hapus Data'))))))))}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      {showExecutiveReportModal && (() => {
        const selectedReportTenureId = reportTenureId || activeTenure?.id || tenures[0]?.id || '';
        const selectedReportTenure = tenures.find(t => t.id === selectedReportTenureId) || activeTenure || tenures[0];

        const reportEvents = events.filter(e => e.tenureId === selectedReportTenureId || (!e.tenureId && divisions.find(d => d.id === e.divisionId)?.tenureId === selectedReportTenureId));
        const reportMembers = members.filter(m => m.tenureId === selectedReportTenureId);
        const reportGalleries = galleries.filter(g => g.tenureId === selectedReportTenureId || (!g.tenureId && divisions.find(d => d.id === g.divisionId || d.name === g.division)?.tenureId === selectedReportTenureId));

        const completedEvents = reportEvents.filter(e => e.status === 'Completed').length;
        const eventPercent = reportEvents.length > 0 ? Math.round((completedEvents / reportEvents.length) * 100) : 0;
        const totalRab = reportEvents.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);
        const coreLeaders = reportMembers.filter(m => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro');
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
                    Periode: <strong>{selectedReportTenure?.title || selectedReportTenure?.code || 'Kepengurusan'}</strong>{selectedReportTenure?.themeTagline ? ` • Tema: "${selectedReportTenure.themeTagline}"` : ''}
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={selectedReportTenureId}
                    onChange={(e) => setReportTenureId(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1.5px solid var(--mandiri-gold)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {tenures.map((t) => (
                      <option key={t.id} value={t.id}>
                        Periode {t.code || t.title}
                      </option>
                    ))}
                  </select>

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
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{reportMembers.length} Orang</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{reportMembers.filter(m => m.category === 'pembina').length} Pembina • 4 Divisi & BPH Inti</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>REALISASI KEGIATAN</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{completedEvents}/{reportEvents.length} ({eventPercent}%)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{reportGalleries.length} Dokumentasi Galeri</div>
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
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Peserta</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Status</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)', textAlign: 'right' }}>Total RAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Belum ada kegiatan yang terdaftar di database untuk periode ini.
                          </td>
                        </tr>
                      ) : (
                        reportEvents.map((evt) => (
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
                  {coreLeaders.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                      Belum ada susunan pengurus/pimpinan yang terdaftar pada periode ini.
                    </div>
                  ) : (
                    coreLeaders.map((ldr) => (
                      <div key={ldr.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase' }}>{ldr.role}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{ldr.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{ldr.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
