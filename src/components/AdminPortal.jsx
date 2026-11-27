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
  ChevronRight,
  Copy,
  Sparkles,
  Camera,
  Grid
} from 'lucide-react';
import EventCalendarView from './EventCalendarView';
import AdminAccountsPanel from './AdminAccountsPanel';
import { AKHLAK_VALUES, DEFAULT_AKHLAK_VALUE } from '../utils/akhlak';
import { uploadMediaToCloud } from '../lib/supabase';
import { soundFx } from '../utils/audio';
import { getPublicBaseUrl } from '../utils/urlUtils';
import { getUnifiedEventAttendees } from '../utils/quotaUtils';
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
import { AdminPortalContext } from '../admin/AdminPortalContext';
import { DIVISION_ADMIN_TABS, SYNC_BADGE, formatWaPhone } from '../admin/adminShared';
import AdminHeaderBar from './../admin/AdminHeaderBar';
import AdminSummaryBar from './../admin/AdminSummaryBar';
import AdminTabNavigation from './../admin/AdminTabNavigation';
import VisibilityTab from './../admin/tabs/VisibilityTab';
import MembersTab from './../admin/tabs/MembersTab';
import RolesTab from './../admin/tabs/RolesTab';
import EventsTab from './../admin/tabs/EventsTab';
import GalleryTab from './../admin/tabs/GalleryTab';
import DepartmentsTab from './../admin/tabs/DepartmentsTab';
import DivisionsTab from './../admin/tabs/DivisionsTab';
import TenureTab from './../admin/tabs/TenureTab';
import FormsTab from './../admin/tabs/FormsTab';
import SubmissionsTab from './../admin/tabs/SubmissionsTab';
import KudosTab from './../admin/tabs/KudosTab';
import AssetsTab from './../admin/tabs/AssetsTab';
import FaqsTab from './../admin/tabs/FaqsTab';
import EditItemModal from './../admin/modals/EditItemModal';
import OrgRolesModal from './../admin/modals/OrgRolesModal';
import RoleFormModal from './../admin/modals/RoleFormModal';
import RoleDeleteWarningModal from './../admin/modals/RoleDeleteWarningModal';
import DeleteConfirmModal from './../admin/modals/DeleteConfirmModal';
import ExecutiveReportModal from './../admin/modals/ExecutiveReportModal';


// Tabs a division admin may open; super admins see every tab plus account management.
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
  theme = 'dark',
  luckyDraws = [],
  registrationCounts,
  adminSession = { status: 'loading', profile: null },
  onAdminLogin,
  onAdminLogout
}) {
  const isDark = theme === 'dark';
  const isAuthenticated = adminSession.status === 'admin';
  const adminProfile = adminSession.profile;
  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const [loginEmail, setLoginEmail] = useState('');
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

  // Division admins are kept on the tabs their role can manage.
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && !DIVISION_ADMIN_TABS.includes(activeTab)) {
      setActiveTab(DIVISION_ADMIN_TABS[0]);
    }
  }, [isAuthenticated, isSuperAdmin, activeTab]);

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
  const [eventPublicFilter, setEventPublicFilter] = useState('all'); // 'all' | 'public' | 'draft'
  const [adminEventViewMode, setAdminEventViewMode] = useState('list'); // 'list' | 'calendar'
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
  const [newFormNotes, setNewFormNotes] = useState('');
  const [newFormRequiresTracking, setNewFormRequiresTracking] = useState(true);
  const [newFormShowAnnouncement, setNewFormShowAnnouncement] = useState(false);
  const [newFormIsLimited, setNewFormIsLimited] = useState(false);
  const [newFormMaxQuota, setNewFormMaxQuota] = useState('');
  const [newFormIsEventConnected, setNewFormIsEventConnected] = useState(false);
  const [newFormEventId, setNewFormEventId] = useState('');
  const [newFormIsLuckyDraw, setNewFormIsLuckyDraw] = useState(false);
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

  // Helper to initiate event deletion with RSVP, Form, Submission, Lucky Draw, and Gallery dependency checks
  const handleDeleteEventClick = (evt) => {
    const relatedRsvps = (eventRsvps || []).filter(r => r.eventId === evt.id);
    const rsvpCount = relatedRsvps.length;

    // Check connected forms (both direct eventId, isEventConnected, or evt.formId)
    const connectedForms = (forms || []).filter(f => 
      (f.eventId && String(f.eventId) === String(evt.id)) ||
      (f.fields?.[0]?._eventId && String(f.fields?.[0]?._eventId) === String(evt.id)) ||
      (evt.formId && String(evt.formId) === String(f.id)) ||
      ((f.isEventConnected || f.fields?.[0]?._isEventConnected) && (String(f.eventId) === String(evt.id) || String(f.fields?.[0]?._eventId) === String(evt.id)))
    );
    const formCount = connectedForms.length;
    const connectedFormIds = connectedForms.map(f => f.id);

    // Check connected form submissions
    const relatedSubs = (submissions || []).filter(s => connectedFormIds.includes(s.formId));
    const formSubCount = relatedSubs.length;

    // Check lucky draw winners for this event
    const relatedLuckyDraws = (luckyDraws || []).filter(ld => ld.eventId === evt.id);
    const luckyDrawCount = relatedLuckyDraws.length;

    // Check connected gallery albums
    const connectedGals = (galleries || []).filter(g => 
      (g.eventId && String(g.eventId) === String(evt.id)) ||
      (evt.galleryId && String(evt.galleryId) === String(g.id))
    );
    const galCount = connectedGals.length;

    const isBlocked = rsvpCount > 0 || formCount > 0 || formSubCount > 0 || luckyDrawCount > 0 || galCount > 0;

    setDeleteConfirm({
      type: 'event',
      id: evt.id,
      name: evt.title,
      rsvpCount,
      formCount,
      formSubCount,
      luckyDrawCount,
      galCount,
      connectedFormNames: connectedForms.map(f => f.title).join(', '),
      connectedGalTitles: connectedGals.map(g => g.title).join(', '),
      isBlocked
    });
  };

  // Helper to initiate dynamic form deletion with submission and connected event dependency checks
  const handleDeleteFormClick = (f) => {
    const subCount = (submissions || []).filter(s => s.formId === f.id).length;
    
    // Check if connected to any event
    const connectedEvents = (events || []).filter(e => 
      (e.formId && String(e.formId) === String(f.id)) ||
      (f.eventId && String(f.eventId) === String(e.id)) ||
      (f.fields?.[0]?._eventId && String(f.fields?.[0]?._eventId) === String(e.id)) ||
      ((f.isEventConnected || f.fields?.[0]?._isEventConnected) && (String(f.eventId) === String(e.id) || String(f.fields?.[0]?._eventId) === String(e.id)))
    );
    const eventCount = connectedEvents.length;
    const connectedEventTitles = connectedEvents.map(e => e.title).join(', ');

    const isBlocked = subCount > 0 || eventCount > 0;

    setDeleteConfirm({
      type: 'form',
      id: f.id,
      name: f.title,
      submissionCount: subCount,
      eventCount,
      connectedEventTitle: connectedEventTitles,
      isBlocked
    });
  };

  // Helper to initiate gallery album deletion with connected event dependency checks
  const handleDeleteGalleryClick = (gal) => {
    // Check if connected to an event
    const connectedEvents = (events || []).filter(e => 
      (gal.eventId && String(e.id) === String(gal.eventId)) ||
      (e.galleryId && String(e.galleryId) === String(gal.id))
    );
    const eventCount = connectedEvents.length;
    const connectedEventTitles = connectedEvents.map(e => e.title).join(', ');
    const isBlocked = eventCount > 0;

    setDeleteConfirm({
      type: 'gallery',
      id: gal.id,
      name: gal.title,
      eventCount,
      connectedEventTitle: connectedEventTitles,
      isBlocked
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
  const [galEventId, setGalEventId] = useState('');
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
  const [eventIsPublic, setEventIsPublic] = useState(false);
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
        isPublic: eventIsPublic,
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
    setEventIsPublic(false);
    setEventIsLimited(false);
    setEventMaxQuota('');
    showToast(`Event "${savedTitle}" berhasil ditambahkan & disinkronkan!`);
  };

  // Supabase Auth sign-in; access is granted only to accounts listed in admin_profiles
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;
    const errs = {};
    if (!/\S+@\S+\.\S+/.test(loginEmail.trim())) errs.loginEmail = 'Email admin wajib diisi dengan format yang valid';
    if (!password) errs.loginPassword = 'Password wajib diisi';
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await onAdminLogin(loginEmail, password);
      setPassword('');
      setFormErrors({});
      showToast('Berhasil masuk! Selamat datang di Admin Portal', 'success');
    } catch (err) {
      setLoginError(err.message || 'Gagal memverifikasi kredensial');
      showToast(err.message || 'Gagal memverifikasi kredensial', 'error');
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
      eventId: galEventId || null,
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
    setGalEventId('');
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
                Email Admin <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="nama@bankmandiri.co.id"
                value={loginEmail}
                disabled={isLoggingIn}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  clearFieldError('loginEmail');
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.loginEmail ? '#f43f5e' : 'var(--border-card)'}`,
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  opacity: isLoggingIn ? 0.7 : 1
                }}
              />
              {renderFieldError('loginEmail')}
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
  const adminPortalContextValue = {
    activeTab,
    activeTenure,
    addDocLinkField,
    adminAspirasiPage,
    adminEventPage,
    adminEventViewMode,
    adminFaqPage,
    adminGalleryPage,
    adminKudosPage,
    adminMemCatFilter,
    adminMemDivFilter,
    adminMemPage,
    adminMemSearch,
    adminMemTenureFilter,
    adminRsvpPage,
    announcementBar,
    applications,
    aspirasiAdminCatFilter,
    aspirasiAdminStatusFilter,
    aspirasiList,
    aspirasiSearchQuery,
    assetBadge,
    assetCatFilter,
    assetCategory,
    assetDesc,
    assetFileSize,
    assetFileType,
    assetFileUrl,
    assetPage,
    assetPreviewUrl,
    assetSearchQuery,
    assetTitle,
    brandAssets,
    clearFieldError,
    deleteConfirm,
    departments,
    deptPage,
    deptRsvpFilter,
    deptSearchQuery,
    divPage,
    divRecruitFilter,
    divSearchQuery,
    divTenureFilter,
    divisions,
    dragOverFieldIndex,
    draggedFieldIndex,
    editModalError,
    editingItem,
    eventCatFilter,
    eventCategory,
    eventDesc,
    eventDivFilter,
    eventDivId,
    eventEndDate,
    eventIsLimited,
    eventIsPublic,
    eventKpi,
    eventLocation,
    eventMaxQuota,
    eventPublicFilter,
    eventRab,
    eventRsvps,
    eventSearchQuery,
    eventStartDate,
    eventStatus,
    eventStatusFilter,
    eventTenureFilter,
    eventTenureId,
    eventTitle,
    events,
    faqAnswer,
    faqCatFilter,
    faqQuestion,
    faqSearchQuery,
    faqs,
    formCatFilter,
    formErrors,
    formPage,
    formSearchQuery,
    formStatusFilter,
    formTenureFilter,
    forms,
    galDateMode,
    galDateVal,
    galDates,
    galDesc,
    galDivision,
    galDivisionId,
    galDocLinks,
    galEndDate,
    galEventId,
    galMonth,
    galPhotos,
    galStartDate,
    galTenureId,
    galTitle,
    galYear,
    galleries,
    galleryDivFilter,
    gallerySearchQuery,
    galleryTenureFilter,
    handleAddPhotoLinkToEditModal,
    handleBrandAssetUpload,
    handleCreateBrandAsset,
    handleCreateDepartment,
    handleCreateDivision,
    handleCreateEvent,
    handleCreateFaq,
    handleCreateGallery,
    handleCreateMember,
    handleCreateRole,
    handleCreateTenure,
    handleDeleteDepartmentClick,
    handleDeleteDivisionClick,
    handleDeleteEventClick,
    handleDeleteFormClick,
    handleDeleteGalleryClick,
    handleDeleteMemberClick,
    handleDeleteRole,
    handleDeleteTenureClick,
    handleMemberPhotoUpload,
    handleMoveField,
    handlePhotoUpload,
    handleSaveRole,
    isDark,
    isOrgRolesOpen,
    isSuperAdmin,
    isUploadingMedia,
    kudosCatFilter,
    kudosList,
    kudosSearchQuery,
    luckyDraws,
    memDivisionId,
    memImage,
    memMotto,
    memName,
    memRole,
    memRoleId,
    memTenureId,
    memWhatsapp,
    members,
    newDeptCode,
    newDeptDesc,
    newDeptName,
    newDivDesc,
    newDivFocus,
    newDivName,
    newDivTenureId,
    newFormCategory,
    newFormDeadline,
    newFormEventId,
    newFormIsEventConnected,
    newFormIsLimited,
    newFormIsLuckyDraw,
    newFormMaxQuota,
    newFormNotes,
    newFormRequiresTracking,
    newFormShowAnnouncement,
    newFormSubtitle,
    newFormTenureId,
    newFormTitle,
    newRoleLevel,
    newRoleMax,
    newRoleName,
    newRoleRequiresDivision,
    newRoleTenureId,
    newTenureCode,
    newTenureHeadline,
    newTenureHighlight,
    newTenureMisi,
    newTenureTagline,
    newTenureTitle,
    newTenureVisi,
    onAddForm,
    onAdminLogout,
    onBack,
    onDeleteAspirasi,
    onDeleteBrandAsset,
    onDeleteDepartment,
    onDeleteDivision,
    onDeleteEvent,
    onDeleteEventRsvp,
    onDeleteFaq,
    onDeleteForm,
    onDeleteGallery,
    onDeleteKudos,
    onDeleteMember,
    onDeleteSubmission,
    onDeleteTenure,
    onDeleteTenureRole,
    onResetDefault,
    onRestoreBackup,
    onSelectTenure,
    onUpdateAnnouncementBar,
    onUpdateAspirasi,
    onUpdateBrandAsset,
    onUpdateDepartment,
    onUpdateDivision,
    onUpdateEvent,
    onUpdateFaq,
    onUpdateForm,
    onUpdateGallery,
    onUpdateKudos,
    onUpdateMember,
    onUpdatePageVisibility,
    onUpdateSubmission,
    onUpdateTenure,
    onUpdateTenureRole,
    pageVisibility,
    pendingAssetFile,
    pendingGalFiles,
    pendingPreviewFile,
    registrationCounts,
    removeDocLinkField,
    removeUploadedPhoto,
    renderFieldError,
    reportTenureId,
    roleDeleteWarning,
    roleLevelFilter,
    roleModal,
    rolePage,
    roleQuotas,
    roleSearchQuery,
    roleTenureFilter,
    rsvpEventFilter,
    rsvpModeFilter,
    rsvpSearchQuery,
    selectedOrgTenureId,
    selectedSubFilter,
    setActiveTab,
    setAdminAspirasiPage,
    setAdminEventPage,
    setAdminEventViewMode,
    setAdminFaqPage,
    setAdminGalleryPage,
    setAdminKudosPage,
    setAdminMemCatFilter,
    setAdminMemDivFilter,
    setAdminMemPage,
    setAdminMemSearch,
    setAdminMemTenureFilter,
    setAdminRsvpPage,
    setAspirasiAdminCatFilter,
    setAspirasiAdminStatusFilter,
    setAspirasiSearchQuery,
    setAssetBadge,
    setAssetCatFilter,
    setAssetCategory,
    setAssetDesc,
    setAssetFileSize,
    setAssetFileType,
    setAssetFileUrl,
    setAssetPage,
    setAssetPreviewUrl,
    setAssetSearchQuery,
    setAssetTitle,
    setDeleteConfirm,
    setDeptPage,
    setDeptRsvpFilter,
    setDeptSearchQuery,
    setDivPage,
    setDivRecruitFilter,
    setDivSearchQuery,
    setDivTenureFilter,
    setDragOverFieldIndex,
    setDraggedFieldIndex,
    setEditModalError,
    setEditingItem,
    setEventCatFilter,
    setEventCategory,
    setEventDesc,
    setEventDivFilter,
    setEventDivId,
    setEventEndDate,
    setEventIsLimited,
    setEventIsPublic,
    setEventKpi,
    setEventLocation,
    setEventMaxQuota,
    setEventPublicFilter,
    setEventRab,
    setEventSearchQuery,
    setEventStartDate,
    setEventStatus,
    setEventStatusFilter,
    setEventTenureFilter,
    setEventTenureId,
    setEventTitle,
    setFaqAnswer,
    setFaqCatFilter,
    setFaqQuestion,
    setFaqSearchQuery,
    setFormCatFilter,
    setFormErrors,
    setFormPage,
    setFormSearchQuery,
    setFormStatusFilter,
    setFormTenureFilter,
    setGalDateMode,
    setGalDateVal,
    setGalDates,
    setGalDesc,
    setGalDivision,
    setGalDivisionId,
    setGalEndDate,
    setGalEventId,
    setGalMonth,
    setGalPhotos,
    setGalStartDate,
    setGalTenureId,
    setGalTitle,
    setGalYear,
    setGalleryDivFilter,
    setGallerySearchQuery,
    setGalleryTenureFilter,
    setIsOrgRolesOpen,
    setIsUploadingMedia,
    setKudosCatFilter,
    setKudosSearchQuery,
    setMemCategory,
    setMemDivisionId,
    setMemImage,
    setMemMotto,
    setMemName,
    setMemRole,
    setMemRoleId,
    setMemTenureId,
    setMemWhatsapp,
    setNewDeptCode,
    setNewDeptDesc,
    setNewDeptName,
    setNewDivDesc,
    setNewDivFocus,
    setNewDivName,
    setNewDivTenureId,
    setNewFormCategory,
    setNewFormDeadline,
    setNewFormEventId,
    setNewFormIsEventConnected,
    setNewFormIsLimited,
    setNewFormIsLuckyDraw,
    setNewFormMaxQuota,
    setNewFormNotes,
    setNewFormRequiresTracking,
    setNewFormShowAnnouncement,
    setNewFormSubtitle,
    setNewFormTenureId,
    setNewFormTitle,
    setNewRoleLevel,
    setNewRoleMax,
    setNewRoleName,
    setNewRoleRequiresDivision,
    setNewRoleTenureId,
    setNewTenureCode,
    setNewTenureHeadline,
    setNewTenureHighlight,
    setNewTenureMisi,
    setNewTenureTagline,
    setNewTenureTitle,
    setNewTenureVisi,
    setPendingAssetFile,
    setPendingMemberPhoto,
    setPendingPreviewFile,
    setReportTenureId,
    setRoleDeleteWarning,
    setRoleLevelFilter,
    setRoleModal,
    setRolePage,
    setRoleSearchQuery,
    setRoleTenureFilter,
    setRsvpEventFilter,
    setRsvpModeFilter,
    setRsvpSearchQuery,
    setSelectedOrgTenureId,
    setSelectedSubFilter,
    setShowExecutiveReportModal,
    setSubCurrentPage,
    setSubSearchQuery,
    setSubStatusFilter,
    setSubTenureFilter,
    setTenurePage,
    setTenureSearchQuery,
    setTenureStatusFilter,
    showExecutiveReportModal,
    showToast,
    subCurrentPage,
    subSearchQuery,
    subStatusFilter,
    subTenureFilter,
    submissions,
    syncStatus,
    tenurePage,
    tenureRoles,
    tenureSearchQuery,
    tenureStatusFilter,
    tenures,
    theme,
    updateDocLinkField,
    uploadedPhotos,
    verifyImageUrl
  };

  return (
    <AdminPortalContext.Provider value={adminPortalContextValue}>
    <div className="admin-portal-wrapper" style={{ maxWidth: '1000px', margin: '0 auto 80px auto', paddingTop: '36px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
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
      <AdminHeaderBar />

      {/* Executive Summary Analytics Bar */}
      <AdminSummaryBar />

      {/* Tabs */}
      <AdminTabNavigation />

      {activeTab === 'admins' && isSuperAdmin && (
        <AdminAccountsPanel divisions={divisions} currentUserId={adminProfile?.userId} showToast={showToast} />
      )}

      {/* TAB CONTENT: VISIBILITAS HALAMAN & NAVBAR (VIEW / HIDE) */}
      <VisibilityTab />

      {/* TAB CONTENT: PENGURUS & ANGGOTA (DENGAN NOMOR WA OPSIONAL) */}
      <MembersTab />

      {/* TAB CONTENT: STRUKTUR ROLE & JABATAN */}
      <RolesTab />

      {/* TAB CONTENT: EVENT (DENGAN TANGGAL MULAI & BERAKHIR) */}
      <EventsTab />

      {/* TAB CONTENT 0: GALERI KEGIATAN DINAMIS */}
      <GalleryTab />

      {/* TAB CONTENT: MANAJEMEN DEPARTEMEN IT APD */}
      <DepartmentsTab />

      {/* TAB CONTENT 1: DIVISI */}
      <DivisionsTab />

      {/* TAB CONTENT 2: TENURE */}
      <TenureTab />

      {/* TAB CONTENT: DYNAMIC FORM ENGINE */}
      <FormsTab />

      {/* TAB CONTENT: SUBMISSIONS (DATA PENGISIAN FORM DINAMIS PER FORM + SELEKSI STATUS & 1-CLICK WA) */}
      <SubmissionsTab />

      {/* TAB CONTENT: KUDOS & ASPIRASI MANAGEMENT */}
      <KudosTab />

      {/* TAB CONTENT: BRAND ASSETS & TEMPLATES MANAGEMENT */}
      <AssetsTab />

      {/* TAB CONTENT: PUSAT PANDUAN & TANYA JAWAB (FAQ) */}
      <FaqsTab />

      {/* EDIT MODAL DIALOG */}
      <EditItemModal />

      {/* MODAL 1: PENGATURAN STRUKTUR ORGANISASI & ROLE KEPENGURUSAN */}
      <OrgRolesModal />

      {/* MODAL 2: ADD / EDIT ROLE */}
      <RoleFormModal />

      {/* MODAL 3: ROLE DELETE DEPENDENCY WARNING */}
      <RoleDeleteWarningModal />

      {/* CONFIRMATION DELETE DIALOG */}
      <DeleteConfirmModal />

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      <ExecutiveReportModal />

    </div>
    </AdminPortalContext.Provider>
  );
}
