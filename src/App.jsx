import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { Lock, EyeOff, Sun, Moon, Search, X, Users, Calendar, Image as ImageIcon, ClipboardList, Download, ChevronRight } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import AdminOnlyNotice from './components/AdminOnlyNotice';

const OrganizationSection = lazy(() => import('./components/OrganizationSection'));
const ProgramSection = lazy(() => import('./components/ProgramSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const KudosSection = lazy(() => import('./components/KudosSection'));
const AssetKitSection = lazy(() => import('./components/AssetKitSection'));
const DynamicFormSection = lazy(() => import('./components/DynamicFormSection'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const EventRegistrationStats = lazy(() => import('./components/EventRegistrationStats'));

const DEFAULT_ANNOUNCEMENT_BAR = {
  badge: '',
  message: '',
  ctaText: '',
  ctaTab: 'home',
  isActive: false,
};
import {
  supabase,
  nextSortOrder,
  deriveMembers,
  saveRow,
  saveRows,
  deleteRow,
  deleteRowsWhere,
  saveSetting,
  submitFormRegistration,
  submitEventRsvp,
  submitKudos,
  toggleKudosLike,
  submitAspirasi,
  submitPublicFaqQuestion,
  fetchAdminProfile,
  signInAdmin,
  signOutAdmin,
  deleteMediaFromCloud
} from './lib/supabase';
import { useLocation } from 'react-router';
import {
  AppNavigationContext,
  PUBLIC_PAGE_IDS,
  buildTabUrl,
  parseLocationRoute,
  useQueuedNavigation
} from './lib/appNavigation';
import {
  refreshAllData,
  removePrivateTableData,
  usePageSettings,
  usePublicAspirasi,
  useRealtimeInvalidation,
  useRegistrationCounts,
  useSyncStatus,
  useTableData
} from './lib/queries';
import { formatDeadlineWib, isEventPassed } from './utils/dateUtils';
import { getDivisionLead } from './utils/memberQuotaUtils';
import { deriveRegistrationCounts } from './utils/quotaUtils';

const EMPTY_ROLE_QUOTAS = {};

// Parents are restored before children so foreign keys always resolve.
const RESTORE_ORDER = [
  'tenures', 'tenureRoles', 'departments', 'divisions', 'members', 'events', 'forms',
  'submissions', 'eventRsvps', 'luckyDraws', 'galleries', 'kudosList', 'aspirasiList', 'brandAssets', 'faqs'
];

function replaceById(list, updates) {
  if (updates.length === 0) return list;
  const byId = new Map(updates.map(item => [item.id, item]));
  return list.map(item => byId.get(item.id) || item);
}

function withDerivedEventStatus(event) {
  return event.status !== 'Completed' && isEventPassed(event.startDate, event.endDate)
    ? { ...event, status: 'Completed' }
    : event;
}

function getSubmissionFileUrls(files) {
  if (!files || typeof files !== 'object') return [];
  return Object.values(files)
    .map(f => (typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl || '')))
    .filter(Boolean);
}

// Returns the other forms currently connected to an event, disconnected from it.
function detachFormsFromEvent(forms, eventId, exceptFormId, updatedAt) {
  return forms
    .filter(f => {
      if (f.id === exceptFormId) return false;
      const isSameEvent = String(f.eventId || f.fields?.[0]?._eventId) === String(eventId);
      const isConnected = f.isEventConnected || f.fields?.[0]?._isEventConnected;
      return isSameEvent && isConnected;
    })
    .map(f => ({
      ...f,
      isEventConnected: false,
      eventId: '',
      isLuckyDraw: false,
      fields: Array.isArray(f.fields)
        ? f.fields.map((fld, idx) => (idx === 0 ? { ...fld, _isEventConnected: false, _eventId: '', _isLuckyDraw: false } : fld))
        : f.fields,
      updatedAt
    }));
}

const DEFAULT_PAGE_VISIBILITY = {
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
};

// Helper to consistently sort tenures descending by year (e.g. 2028 -> 2027 -> 2026)
const sortTenuresDesc = (list = []) => {
  return [...list].sort((a, b) => {
    const numA = parseInt(a.code || a.id?.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.code || b.id?.replace(/\D/g, '') || '0', 10);
    if (numB !== numA) return numB - numA;
    return (b.title || '').localeCompare(a.title || '');
  });
};

export default function App() {
  // Navigation state lives in the URL (React Router); see src/lib/appNavigation.tsx for the scheme.
  const location = useLocation();
  const navigateTo = useQueuedNavigation();
  const route = useMemo(
    () => parseLocationRoute(location),
    [location.pathname, location.search, location.hash]
  );
  const currentTab = route.tab;
  const activeFormIdFromUrl = route.formId;
  const activeEventIdFromUrl = route.eventId;
  const activeGalleryIdFromUrl = route.galleryId;

  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const setCurrentTab = useCallback((nextTab, formIdParam = null, eventIdParam = null, shouldScroll = true, galleryIdParam = null) => {
    const url = buildTabUrl(
      { tab: nextTab, formId: formIdParam, eventId: eventIdParam, galleryId: galleryIdParam },
      pathnameRef.current
    );
    navigateTo(url, { scroll: shouldScroll });
  }, [navigateTo]);

  // Page & Navbar Visibility State (View / Hide per page & navbar), stored in page_settings
  const [pageSettings, updatePageSettings] = usePageSettings();
  const [legacyPageVisibility] = useState(() => {
    try {
      const legacy = localStorage.getItem('cnt_page_visibility');
      return legacy ? JSON.parse(legacy) : null;
    } catch (e) {
      return null;
    }
  });
  const pageVisibility = useMemo(() => {
    const stored = pageSettings?.pageVisibility;
    if (stored && typeof stored === 'object') return { ...DEFAULT_PAGE_VISIBILITY, ...stored };
    if (legacyPageVisibility) return { ...DEFAULT_PAGE_VISIBILITY, ...legacyPageVisibility };
    return DEFAULT_PAGE_VISIBILITY;
  }, [pageSettings?.pageVisibility, legacyPageVisibility]);
  const setPageVisibilityState = (nextVisibility) => updatePageSettings({ pageVisibility: nextVisibility });

  // Default theme is LIGHT THEME as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cnt_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cnt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Supabase Auth session of an admin: 'loading' | 'signedOut' | 'admin'
  const [adminSession, setAdminSession] = useState({ status: 'loading', profile: null });
  const isAdmin = adminSession.status === 'admin';
  const isSuperAdmin = isAdmin && adminSession.profile?.role === 'super_admin';

  // Server data lives in the TanStack Query cache (src/lib/queries.ts). Each table is used like
  // useState: handlers apply optimistic `setX(prev => ...)` edits, and realtime events, polling and
  // window focus refetch only what changed.
  const [rawTenures, setTenures] = useTableData('tenures');
  const [tenureRoles, setTenureRoles] = useTableData('tenureRoles');
  const [rawMembers, setMembers] = useTableData('members');
  const [rawDivisions, setDivisions] = useTableData('divisions');
  const [departments, setDepartments] = useTableData('departments');
  const [rawEvents, setEvents, eventsUpdatedAt] = useTableData('events');
  const [rawGalleries, setGalleries] = useTableData('galleries');
  const [kudosList, setKudosList] = useTableData('kudosList');
  const [forms, setForms] = useTableData('forms');
  const [brandAssets, setBrandAssets] = useTableData('brandAssets');
  const [faqs, setFaqs] = useTableData('faqs');
  // Registrants' personal data is loaded for signed-in admins only...
  const [submissions, setSubmissions] = useTableData('submissions', { enabled: isAdmin });
  const [eventRsvps, setEventRsvps] = useTableData('eventRsvps', { enabled: isAdmin });
  const [luckyDraws, setLuckyDraws] = useTableData('luckyDraws', { enabled: isAdmin });
  // ...visitors receive aggregated registration counts instead.
  const [publicRegistrationCounts, setPublicRegistrationCounts] = useRegistrationCounts({
    enabled: adminSession.status === 'signedOut'
  });
  // Aspirasi: super admins read the table, everyone else the public items (RPC).
  const [aspirasiTable, setAspirasiTable] = useTableData('aspirasiList', { enabled: isSuperAdmin });
  const [publicAspirasi, setPublicAspirasi] = usePublicAspirasi({
    enabled: adminSession.status !== 'loading' && !isSuperAdmin
  });
  const aspirasiList = isSuperAdmin ? aspirasiTable : publicAspirasi;
  const setAspirasiList = isSuperAdmin ? setAspirasiTable : setPublicAspirasi;
  const syncStatus = useSyncStatus();
  useRealtimeInvalidation();

  // Derived views: cross-table fields are recomputed whenever their source tables change.
  const members = useMemo(() => deriveMembers(rawMembers, tenureRoles, rawDivisions), [rawMembers, tenureRoles, rawDivisions]);
  const divisions = useMemo(() => rawDivisions.map(d => {
    const lead = getDivisionLead(d, members, tenureRoles);
    return {
      ...d,
      memberId: lead.member ? lead.member.id : (d.memberId || null),
      leadName: lead.name || (d.leadName || '')
    };
  }), [rawDivisions, members, tenureRoles]);
  // eventsUpdatedAt re-evaluates the "Completed" display status on every refresh, even when the
  // rows themselves did not change.
  const events = useMemo(() => rawEvents.map(e => {
    const divObj = rawDivisions.find(d => d.id === e.divisionId) || rawDivisions.find(d => d.name === e.divisionName);
    return {
      ...withDerivedEventStatus(e),
      divisionId: e.divisionId || divObj?.id,
      divisionName: divObj?.name || e.divisionName || 'Culture Network Team'
    };
  }), [rawEvents, rawDivisions, eventsUpdatedAt]);
  const galleries = useMemo(() => rawGalleries.map(g => {
    const matchedDiv = rawDivisions.find(d => d.id === g.divisionId) || rawDivisions.find(d => d.name === g.division);
    const resolvedName = matchedDiv?.name || g.divisionName || g.division || 'Culture Network Team';
    return { ...g, divisionId: g.divisionId || matchedDiv?.id, division: resolvedName, divisionName: resolvedName };
  }), [rawGalleries, rawDivisions]);

  // Tenures: exactly one is active, the one named by page_settings.active_tenure_id.
  const officialTenureId = pageSettings?.activeTenureId || null;
  const tenures = useMemo(() => {
    const sorted = sortTenuresDesc(rawTenures);
    const official = sorted.find(t => t.id === officialTenureId) || sorted.find(t => t.isActive) || sorted[0] || null;
    return sorted.map(t => ({ ...t, isActive: Boolean(official) && t.id === official.id }));
  }, [rawTenures, officialTenureId]);
  // The tenure being browsed (a view filter that never changes the official one).
  const [activeTenure, setActiveTenure] = useState(() => tenures.find(t => t.isActive) || null);
  useEffect(() => {
    // Keep the browsing selection when it still exists, otherwise fall back to the official tenure.
    setActiveTenure(curr => {
      const official = tenures.find(t => t.isActive) || null;
      if (!official) return null;
      return (curr && tenures.find(t => t.id === curr.id)) || official;
    });
  }, [tenures]);

  const announcementBar = useMemo(
    () => ({ ...DEFAULT_ANNOUNCEMENT_BAR, ...(pageSettings?.announcementBar || {}) }),
    [pageSettings?.announcementBar]
  );
  const roleQuotas = pageSettings?.roleQuotas && typeof pageSettings.roleQuotas === 'object'
    ? pageSettings.roleQuotas
    : EMPTY_ROLE_QUOTAS;
  const setAnnouncementBar = (bar) => updatePageSettings({ announcementBar: bar });
  const setRoleQuotas = (quotas) => updatePageSettings({ roleQuotas: quotas });

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Global keyboard shortcut Ctrl+K / Cmd+K for Quick Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [persistError, setPersistError] = useState(null);

  // Runs a database write for an optimistic UI change. On failure the user is informed
  // and local state is reloaded from the server so the screen never shows unsaved data.
  const persist = useCallback(async (label, task) => {
    try {
      await task();
      return true;
    } catch (err) {
      console.error(err);
      setPersistError(`${label} gagal disimpan ke server (${err.message}). Data dimuat ulang dari server.`);
      refreshAllData();
      return false;
    }
  }, []);

  // Track the Supabase Auth session and the admin role attached to it.
  useEffect(() => {
    let cancelled = false;
    const resolveSession = async (session) => {
      if (!session) {
        if (!cancelled) setAdminSession({ status: 'signedOut', profile: null });
        return;
      }
      try {
        const profile = await fetchAdminProfile(session.user.id);
        if (!cancelled) setAdminSession(profile ? { status: 'admin', profile } : { status: 'signedOut', profile: null });
      } catch (err) {
        console.error(err);
        if (!cancelled) setAdminSession({ status: 'signedOut', profile: null });
      }
    };
    supabase.auth.getSession().then(({ data }) => resolveSession(data.session));
    // Deferred: Supabase must not be queried synchronously inside the auth callback.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => resolveSession(session), 0);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Private data is dropped as soon as the admin signs out. Switching between visitor and admin
  // reloads everything, since which rows are visible (drafts, unpublished FAQs) depends on the role.
  const previousAuthStatusRef = useRef(adminSession.status);
  useEffect(() => {
    const previous = previousAuthStatusRef.current;
    previousAuthStatusRef.current = adminSession.status;
    if (adminSession.status === 'loading') return;
    if (!isAdmin) removePrivateTableData();
    if (previous !== 'loading' && previous !== adminSession.status) refreshAllData();
  }, [isAdmin, adminSession.status]);

  const registrationCounts = useMemo(
    () => (isAdmin ? deriveRegistrationCounts(submissions, eventRsvps) : publicRegistrationCounts),
    [isAdmin, submissions, eventRsvps, publicRegistrationCounts]
  );

  // Division admins see only their own division's data in the Admin Portal, so every division
  // picker offers just that division. The database (RLS) enforces the same scope on writes.
  const adminDivisionId = adminSession.profile?.role === 'division_admin' ? adminSession.profile.divisionId : null;
  const adminScope = useMemo(() => {
    if (!adminDivisionId) return { divisions, forms, galleries, members, events };
    const scopedEvents = events.filter(e => e.divisionId === adminDivisionId);
    const eventIds = new Set(scopedEvents.map(e => e.id));
    return {
      divisions: divisions.filter(d => d.id === adminDivisionId),
      members: members.filter(m => m.divisionId === adminDivisionId),
      events: scopedEvents,
      galleries: galleries.filter(g => g.divisionId === adminDivisionId || eventIds.has(g.eventId)),
      forms: forms.filter(f => eventIds.has(f.eventId))
    };
  }, [adminDivisionId, divisions, forms, galleries, members, events]);

  const handleAdminLogin = async (email, password) => {
    const profile = await signInAdmin(email, password);
    setAdminSession({ status: 'admin', profile });
    return profile;
  };
  const handleAdminLogout = async () => {
    await signOutAdmin();
    setAdminSession({ status: 'signedOut', profile: null });
  };

  const bumpPublicCount = (kind, id) => {
    setPublicRegistrationCounts(prev => ({
      ...prev,
      [kind]: { ...prev[kind], [id]: (prev[kind][id] || 0) + 1 }
    }));
  };

  const handleUpdateRoleQuotas = async (updatedQuotas) => {
    setRoleQuotas(updatedQuotas);
    await persist('Kuota jabatan', () => saveSetting('roleQuotas', updatedQuotas));
  };

  const setPageVisibility = (nextVis) => {
    const resolved = typeof nextVis === 'function' ? nextVis(pageVisibility) : nextVis;
    const now = new Date().toISOString();

    // Check what was toggled to reliably sync dual keys (event/program, form/oprec)
    let targetEvent = pageVisibility.event !== false && pageVisibility.program !== false;
    if (resolved.event !== undefined && resolved.event !== pageVisibility.event) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined && resolved.program !== pageVisibility.program) {
      targetEvent = resolved.program;
    } else if (resolved.event !== undefined) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined) {
      targetEvent = resolved.program;
    }

    let targetForm = pageVisibility.form !== false && pageVisibility.oprec !== false;
    if (resolved.form !== undefined && resolved.form !== pageVisibility.form) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined && resolved.oprec !== pageVisibility.oprec) {
      targetForm = resolved.oprec;
    } else if (resolved.form !== undefined) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined) {
      targetForm = resolved.oprec;
    }

    const merged = {
      ...DEFAULT_PAGE_VISIBILITY,
      ...resolved,
      event: targetEvent,
      program: targetEvent,
      form: targetForm,
      oprec: targetForm,
      _updatedAt: now
    };

    setPageVisibilityState(merged);
    try { localStorage.setItem('cnt_page_visibility', JSON.stringify(merged)); } catch (e) { /* storage unavailable */ }
    persist('Pengaturan tampilan halaman', () => saveSetting('pageVisibility', merged));
  };

  // Visitor / Admin local view mode (filters the page display without mutating the official active tenure in database)
  const handleSelectTenure = (tenureObj) => {
    setActiveTenure(tenureObj);
  };

  // Divisions
  const handleAddDivision = (newDiv) => {
    const pimpro = newDiv.memberId ? members.find(m => m.id === newDiv.memberId) : null;
    const now = new Date().toISOString();
    const finalDiv = {
      ...newDiv,
      leadName: pimpro ? pimpro.name : newDiv.leadName,
      sortOrder: newDiv.sortOrder ?? nextSortOrder(divisions),
      createdAt: newDiv.createdAt || now,
      updatedAt: newDiv.updatedAt || now
    };
    const relinkedMember = pimpro && pimpro.divisionId !== finalDiv.id ? { ...pimpro, divisionId: finalDiv.id } : null;

    setDivisions(prev => [...prev, finalDiv]);
    if (relinkedMember) setMembers(prev => replaceById(prev, [relinkedMember]));
    persist('Divisi', async () => {
      await saveRow('divisions', finalDiv);
      if (relinkedMember) await saveRow('members', relinkedMember);
    });
  };
  const handleUpdateDivision = (updatedDiv) => {
    const pimpro = updatedDiv.memberId ? members.find(m => m.id === updatedDiv.memberId) : null;
    const finalDiv = {
      ...updatedDiv,
      leadName: pimpro ? pimpro.name : updatedDiv.leadName,
      updatedAt: new Date().toISOString()
    };

    // Keep the linked Pimpro pointing at this division, or sync the Pimpro name from the division lead name.
    let memberUpdates = [];
    if (finalDiv.memberId) {
      if (pimpro && pimpro.divisionId !== finalDiv.id) memberUpdates = [{ ...pimpro, divisionId: finalDiv.id }];
    } else if (finalDiv.leadName) {
      memberUpdates = members
        .filter(m => m.category === 'pimpro' && m.divisionId === finalDiv.id && m.name !== finalDiv.leadName)
        .map(m => ({ ...m, name: finalDiv.leadName }));
    }

    // Galleries matched only by the old division name get linked by id.
    let galleryUpdates = [];
    if (updatedDiv.name) {
      const previousDiv = divisions.find(d => d.id === updatedDiv.id);
      galleryUpdates = galleries
        .filter(g => g.divisionId === updatedDiv.id || (previousDiv && g.division === previousDiv.name))
        .map(g => ({ ...g, divisionId: updatedDiv.id, division: updatedDiv.name, divisionName: updatedDiv.name }));
    }
    const galleriesToSave = galleryUpdates.filter(g => galleries.find(old => old.id === g.id)?.divisionId !== updatedDiv.id);

    setDivisions(prev => replaceById(prev, [finalDiv]));
    if (memberUpdates.length > 0) setMembers(prev => replaceById(prev, memberUpdates));
    if (galleryUpdates.length > 0) setGalleries(prev => replaceById(prev, galleryUpdates));
    if (updatedDiv.name) {
      setEvents(prev => prev.map(e => (e.divisionId === updatedDiv.id ? { ...e, divisionName: updatedDiv.name } : e)));
    }
    persist('Divisi', async () => {
      await saveRow('divisions', finalDiv);
      await saveRows('members', memberUpdates);
      await saveRows('galleries', galleriesToSave);
    });
  };
  const handleDeleteDivision = (divId) => {
    const targetDiv = divisions.find(d => d.id === divId);
    // Defense-in-depth safety checks: do not delete division if members, events, or galleries still depend on it
    const hasMem = members.some(m => m.divisionId === divId);
    const hasEvt = events.some(e => e.divisionId === divId);
    const hasGal = galleries.some(g => g.divisionId === divId || (targetDiv && g.division === targetDiv.name));
    if (hasMem || hasEvt || hasGal) return;

    setDivisions(prev => prev.filter(d => d.id !== divId));
    persist('Penghapusan divisi', () => deleteRow('divisions', divId));
  };

  // Tenures
  const handleAddTenure = (newTenure) => {
    const now = new Date().toISOString();
    const stampedTenure = {
      ...newTenure,
      sortOrder: newTenure.sortOrder ?? nextSortOrder(tenures),
      createdAt: newTenure.createdAt || now,
      updatedAt: newTenure.updatedAt || now
    };
    const isActivating = Boolean(stampedTenure.isActive);
    const deactivated = isActivating ? tenures.filter(t => t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now })) : [];

    setTenures(prev => sortTenuresDesc([...replaceById(prev, deactivated), stampedTenure]));
    if (isActivating) {
      updatePageSettings({ activeTenureId: stampedTenure.id });
      setActiveTenure(stampedTenure);
    }
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleUpdateTenure = (updatedTenure) => {
    const now = new Date().toISOString();
    const stampedTenure = { ...updatedTenure, updatedAt: now };
    const isActivating = Boolean(stampedTenure.isActive);
    // Strict exclusivity: when a tenure becomes active, all other tenures must become inactive
    const deactivated = isActivating
      ? tenures.filter(t => t.id !== stampedTenure.id && t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now }))
      : [];

    setTenures(prev => sortTenuresDesc(replaceById(prev, [stampedTenure, ...deactivated])));
    if (isActivating) updatePageSettings({ activeTenureId: stampedTenure.id });
    if (isActivating || activeTenure?.id === stampedTenure.id) setActiveTenure(stampedTenure);
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleDeleteTenure = (tenureId) => {
    // Defense-in-depth safety checks: do not delete if only 1 tenure, active, or has dependencies
    if (tenures.length <= 1) return;
    if (activeTenure?.id === tenureId) return;
    const hasDiv = divisions.some(d => d.tenureId === tenureId);
    const hasMem = members.some(m => m.tenureId === tenureId);
    const hasEvt = events.some(e => e.tenureId === tenureId);
    const hasGal = galleries.some(g => g.tenureId === tenureId);
    if (hasDiv || hasMem || hasEvt || hasGal) return;

    setTenures(prev => prev.filter(t => t.id !== tenureId));
    persist('Penghapusan periode kepengurusan', () => deleteRow('tenures', tenureId));
  };

  // Galleries
  const handleAddGallery = (newGal) => {
    const now = new Date().toISOString();
    const stampedGal = {
      ...newGal,
      sortOrder: newGal.sortOrder ?? nextSortOrder(galleries, 'start'),
      createdAt: newGal.createdAt || now,
      updatedAt: newGal.updatedAt || now
    };
    setGalleries(prev => [stampedGal, ...prev]);
    persist('Galeri', () => saveRow('galleries', stampedGal));
  };
  const handleUpdateGallery = async (updatedGal) => {
    const oldGal = galleries.find(g => g.id === updatedGal.id);
    const currentPhotos = Array.isArray(updatedGal.photos) ? updatedGal.photos : [];
    const removedPhotos = (oldGal?.photos || []).filter(p => !currentPhotos.includes(p));
    const stampedGal = { ...updatedGal, updatedAt: new Date().toISOString() };

    setGalleries(prev => replaceById(prev, [stampedGal]));
    if (await persist('Galeri', () => saveRow('galleries', stampedGal))) {
      removedPhotos.forEach(p => deleteMediaFromCloud(p));
    }
  };
  const handleDeleteGallery = async (galId) => {
    const target = galleries.find(g => g.id === galId);
    setGalleries(prev => prev.filter(g => g.id !== galId));
    if (await persist('Penghapusan galeri', () => deleteRow('galleries', galId))) {
      (target?.photos || []).forEach(p => deleteMediaFromCloud(p));
    }
  };

  // Members. Division lead links (memberId / leadName) are derived locally and not stored on divisions.
  const linkPimproToDivision = (member) => {
    if (member.category !== 'pimpro' || !member.divisionId) return;
    setDivisions(prev => prev.map(d => (
      d.id === member.divisionId ? { ...d, memberId: member.id, leadName: member.name || d.leadName } : d
    )));
  };
  const handleAddMember = (newMem) => {
    const now = new Date().toISOString();
    const stampedMem = {
      ...newMem,
      sortOrder: newMem.sortOrder ?? nextSortOrder(members),
      createdAt: newMem.createdAt || now,
      updatedAt: newMem.updatedAt || now
    };
    setMembers(prev => [...prev, stampedMem]);
    linkPimproToDivision(stampedMem);
    persist('Pengurus', () => saveRow('members', stampedMem));
  };
  const handleUpdateMember = async (updatedMem) => {
    const oldImage = members.find(m => m.id === updatedMem.id)?.image;
    const stampedMem = { ...updatedMem, updatedAt: new Date().toISOString() };
    setMembers(prev => replaceById(prev, [stampedMem]));
    linkPimproToDivision(stampedMem);
    if (await persist('Pengurus', () => saveRow('members', stampedMem))) {
      if (oldImage && oldImage !== stampedMem.image) deleteMediaFromCloud(oldImage);
    }
  };
  const handleDeleteMember = async (memId) => {
    const target = members.find(m => m.id === memId);
    if (!target) return;
    // Defense-in-depth safety check: do not delete a Pimpro if their division still has active squad members
    if (target.category === 'pimpro' && target.divisionId) {
      const hasSquad = members.some(m => m.category === 'anggota' && m.divisionId === target.divisionId);
      if (hasSquad) return;
    }
    setMembers(prev => prev.filter(m => m.id !== memId));
    setDivisions(prev => prev.map(d => (d.memberId === memId ? { ...d, memberId: null, leadName: '' } : d)));
    if (await persist('Penghapusan pengurus', () => deleteRow('members', memId))) {
      if (target.image) deleteMediaFromCloud(target.image);
    }
  };

  // Events
  const handleAddEvent = (newEvt) => {
    const now = new Date().toISOString();
    const stampedEvt = {
      ...newEvt,
      sortOrder: newEvt.sortOrder ?? nextSortOrder(events),
      createdAt: newEvt.createdAt || now,
      updatedAt: newEvt.updatedAt || now
    };
    setEvents(prev => [...prev, stampedEvt]);
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleUpdateEvent = (updatedEvt) => {
    const stampedEvt = { ...updatedEvt, updatedAt: new Date().toISOString() };
    setEvents(prev => replaceById(prev, [stampedEvt]));
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleDeleteEvent = (evtId) => {
    // Defense-in-depth safety check: do not delete event if RSVP records still exist
    if (eventRsvps.some(r => r.eventId === evtId) || Number(registrationCounts.events?.[evtId] || 0) > 0) return;
    setEvents(prev => prev.filter(e => e.id !== evtId));
    persist('Penghapusan acara', () => deleteRow('events', evtId));
  };

  // Dynamic Forms. A form connected to an event takes over that event from any previously connected form (one-to-one).
  const saveFormWithEventTakeover = (stampedForm, isNew) => {
    const detached = stampedForm.isEventConnected && stampedForm.eventId
      ? detachFormsFromEvent(forms, stampedForm.eventId, stampedForm.id, stampedForm.updatedAt)
      : [];
    setForms(prev => {
      const updated = replaceById(prev, isNew ? detached : [stampedForm, ...detached]);
      return isNew ? [stampedForm, ...updated] : updated;
    });
    persist('Formulir', () => saveRows('forms', [stampedForm, ...detached]));
  };
  const handleAddForm = (newForm) => {
    const now = new Date().toISOString();
    saveFormWithEventTakeover({
      ...newForm,
      sortOrder: newForm.sortOrder ?? nextSortOrder(forms, 'start'),
      createdAt: newForm.createdAt || now,
      updatedAt: newForm.updatedAt || now
    }, true);
  };
  const handleUpdateForm = (updatedForm) => {
    saveFormWithEventTakeover({ ...updatedForm, updatedAt: new Date().toISOString() }, false);
  };
  // Deleting a form removes its submissions as well (database cascade), including their uploaded files.
  const handleDeleteForm = async (formId) => {
    const removedSubs = submissions.filter(s => s.formId === formId);
    setForms(prev => prev.filter(f => f.id !== formId));
    setSubmissions(prev => prev.filter(s => s.formId !== formId));
    if (await persist('Penghapusan formulir', () => deleteRow('forms', formId))) {
      removedSubs.flatMap(s => getSubmissionFileUrls(s.files)).forEach(url => deleteMediaFromCloud(url));
    }
  };

  // Submissions. Public registrations go through the submit_form RPC, which enforces deadline, quota
  // and unique fields atomically. Returns the registration id generated by the database.
  const handleSubmitSubmission = async ({ formId, data, files }) => {
    const id = await submitFormRegistration(formId, data, files);
    if (isAdmin) {
      const now = new Date().toISOString();
      setSubmissions(prev => [
        { id, formId, data, files, status: 'Submitted', adminNotes: '', createdAt: now, submittedAt: now, updatedAt: now },
        ...prev
      ]);
    } else {
      bumpPublicCount('forms', formId);
    }
    return id;
  };
  const handleUpdateSubmission = async (updatedSub) => {
    const oldUrls = getSubmissionFileUrls(submissions.find(s => s.id === updatedSub.id)?.files);
    const newUrls = getSubmissionFileUrls(updatedSub.files);
    const stampedSub = { ...updatedSub, updatedAt: new Date().toISOString() };
    setSubmissions(prev => replaceById(prev, [stampedSub]));
    if (await persist('Data pendaftaran', () => saveRow('submissions', stampedSub))) {
      oldUrls.filter(url => !newUrls.includes(url)).forEach(url => deleteMediaFromCloud(url));
    }
  };
  const handleDeleteSubmission = async (subId) => {
    const fileUrls = getSubmissionFileUrls(submissions.find(s => s.id === subId)?.files);
    setSubmissions(prev => prev.filter(s => s.id !== subId));
    if (await persist('Penghapusan data pendaftaran', () => deleteRow('submissions', subId))) {
      fileUrls.forEach(url => deleteMediaFromCloud(url));
    }
  };

  // Lucky Draw (one win per submission per event is enforced by a unique index)
  const handleAddLuckyDraw = useCallback((newDraws) => {
    const draws = Array.isArray(newDraws) ? newDraws : [newDraws];
    setLuckyDraws(prev => [...draws, ...prev]);
    persist('Hasil undian', () => saveRows('luckyDraws', draws));
  }, [persist]);
  const handleDeleteLuckyDraw = useCallback((id) => {
    setLuckyDraws(prev => prev.filter(ld => ld.id !== id));
    persist('Penghapusan pemenang undian', () => deleteRow('luckyDraws', id));
  }, [persist]);
  const handleResetLuckyDraw = useCallback((eventId) => {
    setLuckyDraws(prev => prev.filter(ld => ld.eventId !== eventId));
    persist('Reset undian', () => deleteRowsWhere('luckyDraws', 'event_id', eventId));
  }, [persist]);

  // Brand Assets
  const handleAddBrandAsset = (newAsset) => {
    const now = new Date().toISOString();
    const stampedAsset = {
      ...newAsset,
      sortOrder: newAsset.sortOrder ?? nextSortOrder(brandAssets),
      createdAt: newAsset.createdAt || now,
      updatedAt: newAsset.updatedAt || now
    };
    setBrandAssets(prev => [...prev, stampedAsset]);
    persist('Aset brand', () => saveRow('brandAssets', stampedAsset));
  };
  const handleUpdateBrandAsset = async (updatedAsset) => {
    const oldAsset = brandAssets.find(a => a.id === updatedAsset.id);
    const stampedAsset = { ...updatedAsset, updatedAt: new Date().toISOString() };
    setBrandAssets(prev => replaceById(prev, [stampedAsset]));
    if (!(await persist('Aset brand', () => saveRow('brandAssets', stampedAsset))) || !oldAsset) return;
    // Remove replaced files only when they are no longer referenced by either field
    const stillUsed = [updatedAsset.fileUrl, updatedAsset.previewUrl];
    if (oldAsset.fileUrl && !stillUsed.includes(oldAsset.fileUrl)) deleteMediaFromCloud(oldAsset.fileUrl);
    if (oldAsset.previewUrl && oldAsset.previewUrl !== oldAsset.fileUrl && !stillUsed.includes(oldAsset.previewUrl)) {
      deleteMediaFromCloud(oldAsset.previewUrl);
    }
  };
  const handleDeleteBrandAsset = async (assetId) => {
    const targetAsset = brandAssets.find(a => a.id === assetId);
    setBrandAssets(prev => prev.filter(a => a.id !== assetId));
    if (!(await persist('Penghapusan aset brand', () => deleteRow('brandAssets', assetId))) || !targetAsset) return;
    if (targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.fileUrl);
    if (targetAsset.previewUrl && targetAsset.previewUrl !== targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.previewUrl);
  };

  // Kudos. Visitors post through submit_kudos (6 AKHLAK values) and like through toggle_kudos_like
  // (one like per device); edits and deletions are for super admins.
  const handleAddKudos = async ({ sender, recipient, category, message }) => {
    const id = await submitKudos({ sender, recipient, category, message });
    const now = new Date().toISOString();
    const stored = {
      id,
      sender: (sender || '').trim() || 'Anonim',
      recipient: recipient.trim(),
      category,
      message: message.trim(),
      likes: 1,
      createdAt: now,
      updatedAt: now
    };
    setKudosList(prev => [stored, ...prev.filter(k => k.id !== id)]);
    return stored;
  };
  const handleToggleKudosLike = async (kudosId) => {
    const result = await toggleKudosLike(kudosId);
    setKudosList(prev => prev.map(k => (k.id === kudosId ? { ...k, likes: result.likes } : k)));
    return result;
  };
  const handleUpdateKudos = (updatedKudos) => {
    const stampedKudos = { ...updatedKudos, updatedAt: new Date().toISOString() };
    setKudosList(prev => replaceById(prev, [stampedKudos]));
    persist('Kudos', () => saveRow('kudosList', stampedKudos));
  };
  const handleDeleteKudos = (kudosId) => {
    setKudosList(prev => prev.filter(k => k.id !== kudosId));
    persist('Penghapusan kudos', () => deleteRow('kudosList', kudosId));
  };

  // Aspirasi. Visitors submit through submit_aspirasi; only public items are shown to visitors.
  const handleAddAspirasi = async ({ sender, title, category, description, isPublic }) => {
    const id = await submitAspirasi({ sender, title, category, description, isPublic });
    const now = new Date().toISOString();
    const stored = {
      id,
      sender: (sender || '').trim() || 'Anonim',
      title: (title || '').trim() || description.trim().slice(0, 200),
      category: category || 'Kegiatan & Event',
      description: description.trim(),
      status: 'Menunggu Review',
      adminReply: '',
      isPublic: isPublic !== false,
      createdAt: now,
      submittedAt: now,
      updatedAt: now
    };
    if (isAdmin || stored.isPublic) {
      setAspirasiList(prev => [stored, ...prev.filter(a => a.id !== id)]);
    }
    return stored;
  };
  const handleUpdateAspirasi = (updatedAsp) => {
    const stampedAsp = { ...updatedAsp, updatedAt: new Date().toISOString() };
    setAspirasiList(prev => replaceById(prev, [stampedAsp]));
    persist('Aspirasi', () => saveRow('aspirasiList', stampedAsp));
  };
  const handleDeleteAspirasi = (aspId) => {
    setAspirasiList(prev => prev.filter(a => a.id !== aspId));
    persist('Penghapusan aspirasi', () => deleteRow('aspirasiList', aspId));
  };

  // Event RSVP via the submit_rsvp RPC (event quota enforced in the database). Returns the stored RSVP.
  const handleAddEventRsvp = async ({ eventId, attendeeName, attendanceMode, notes, departmentId }) => {
    const id = await submitEventRsvp(eventId, attendeeName, attendanceMode, notes, departmentId);
    const now = new Date().toISOString();
    const stored = {
      id,
      eventId,
      attendeeName,
      departmentId: departmentId || '',
      department: departmentId || '',
      attendanceMode,
      notes,
      createdAt: now,
      submittedAt: now,
      updatedAt: now
    };
    if (isAdmin) {
      setEventRsvps(prev => [stored, ...prev]);
    } else {
      bumpPublicCount('events', eventId);
    }
    return stored;
  };
  const handleDeleteEventRsvp = (rsvpId) => {
    setEventRsvps(prev => prev.filter(r => r.id !== rsvpId));
    persist('Penghapusan RSVP', () => deleteRow('eventRsvps', rsvpId));
  };

  // Announcement Bar
  const handleUpdateAnnouncementBar = (nextBar) => {
    const resolved = typeof nextBar === 'function' ? nextBar(announcementBar) : nextBar;
    const merged = { ...DEFAULT_ANNOUNCEMENT_BAR, ...resolved, _updatedAt: new Date().toISOString() };
    setAnnouncementBar(merged);
    setIsBannerDismissed(false);
    persist('Pengumuman', () => saveSetting('announcementBar', merged));
  };

  // FAQs
  const handleAddFaq = (newFaq) => {
    const now = new Date().toISOString();
    const stampedFaq = {
      ...newFaq,
      sortOrder: newFaq.sortOrder ?? nextSortOrder(faqs),
      createdAt: newFaq.createdAt || now,
      updatedAt: newFaq.updatedAt || now
    };
    setFaqs(prev => [...prev, stampedFaq]);
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  // Visitors' questions are stored unpublished; they appear only after an admin answers and publishes them.
  const handleSubmitPublicFaq = async (newFaq) => {
    const now = new Date().toISOString();
    const stampedFaq = {
      ...newFaq,
      isPublished: false,
      sortOrder: nextSortOrder(faqs),
      createdAt: newFaq.createdAt || now,
      updatedAt: newFaq.updatedAt || now
    };
    await submitPublicFaqQuestion(stampedFaq);
    if (isAdmin) setFaqs(prev => [...prev.filter(f => f.id !== stampedFaq.id), stampedFaq]);
  };
  const handleUpdateFaq = (updatedFaq) => {
    const stampedFaq = { ...updatedFaq, updatedAt: new Date().toISOString() };
    setFaqs(prev => replaceById(prev, [stampedFaq]));
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  const handleDeleteFaq = (faqId) => {
    setFaqs(prev => prev.filter(f => f.id !== faqId));
    persist('Penghapusan FAQ', () => deleteRow('faqs', faqId));
  };

  // Departments
  const handleAddDepartment = (newDept) => {
    const now = new Date().toISOString();
    const stampedDept = {
      ...newDept,
      sortOrder: newDept.sortOrder ?? nextSortOrder(departments),
      createdAt: newDept.createdAt || now,
      updatedAt: newDept.updatedAt || now
    };
    setDepartments(prev => [...prev, stampedDept]);
    persist('Departemen', () => saveRow('departments', stampedDept));
  };
  const handleUpdateDepartment = (updatedDept) => {
    const stampedDept = { ...updatedDept, updatedAt: new Date().toISOString() };
    setDepartments(prev => replaceById(prev, [stampedDept]));
    persist('Departemen', () => saveRow('departments', stampedDept));
  };
  const handleDeleteDepartment = (deptId) => {
    const isUsed = eventRsvps.some(r => r.departmentId === deptId || r.department === deptId);
    if (isUsed) return false;
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    persist('Penghapusan departemen', () => deleteRow('departments', deptId));
    return true;
  };

  // Tenure Roles
  const handleAddTenureRole = (newRole) => {
    const now = new Date().toISOString();
    const stampedRole = {
      ...newRole,
      sortOrder: newRole.sortOrder ?? nextSortOrder(tenureRoles),
      createdAt: newRole.createdAt || now,
      updatedAt: newRole.updatedAt || now
    };
    setTenureRoles(prev => [...prev, stampedRole]);
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleUpdateTenureRole = (updatedRole) => {
    const existing = tenureRoles.find(r => r.id === updatedRole.id);
    if (!existing) return;
    const stampedRole = { ...existing, ...updatedRole, updatedAt: new Date().toISOString() };
    setTenureRoles(prev => replaceById(prev, [stampedRole]));
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleDeleteTenureRole = (roleId) => {
    setTenureRoles(prev => prev.filter(r => r.id !== roleId));
    persist('Penghapusan jabatan', () => deleteRow('tenureRoles', roleId));
  };

  // Restore a backup snapshot (.json). Rows are upserted table by table in foreign-key order;
  // rows created after the backup are kept. Throws on the first failure so the caller can report it.
  const handleRestoreBackup = async (backupData) => {
    if (!backupData || typeof backupData !== 'object') return;
    try {
      for (const key of RESTORE_ORDER) {
        if (Array.isArray(backupData[key])) await saveRows(key, backupData[key]);
      }
      if (Array.isArray(backupData.tenures) && backupData.tenures.length > 0) {
        const targetId = backupData.meta?.activeTenureId || backupData.tenures[0].id;
        const restoredActive = backupData.tenures.find(t => t.id === targetId) || backupData.tenures[0];
        await saveSetting('activeTenureId', restoredActive.id);
      }
      if (backupData.announcementBar && typeof backupData.announcementBar === 'object') {
        await saveSetting('announcementBar', { ...DEFAULT_ANNOUNCEMENT_BAR, ...backupData.announcementBar });
      }
      if (backupData.pageVisibility && typeof backupData.pageVisibility === 'object') {
        await saveSetting('pageVisibility', { ...DEFAULT_PAGE_VISIBILITY, ...backupData.pageVisibility });
      }
      if (backupData.roleQuotas && typeof backupData.roleQuotas === 'object') {
        await saveSetting('roleQuotas', backupData.roleQuotas);
      }
    } finally {
      await refreshAllData();
    }
  };

  // Clear cache and reload all collections directly from database
  const handleResetDefault = async () => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('cnt_it_apd_v2_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) { /* storage unavailable */ }
    await refreshAllData();
  };

  // Helper to check page visibility with alias support
  const isPageVisible = (id) => {
    if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };

  // Determine visible public pages and effective active tab
  const visiblePublicPages = PUBLIC_PAGE_IDS.filter(id => isPageVisible(id));
  const allPagesHidden = visiblePublicPages.length === 0;
  const isNavbarVisible = pageVisibility.navbar !== false;
  const isDark = theme === 'dark';

  // If currentTab is a public page that has been hidden, automatically fall back to the first visible page
  const effectiveTab = currentTab === 'admin'
    ? 'admin'
    : currentTab === 'event-stats'
      ? 'event-stats'
      : (allPagesHidden
          ? 'all-hidden'
          : (isPageVisible(currentTab)
              ? (currentTab === 'program' ? 'event' : currentTab === 'oprec' ? 'form' : currentTab)
              : visiblePublicPages[0]));

  return (
    <AppNavigationContext.Provider value={navigateTo}>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Background Canvas */}
      <StarfieldBackground theme={theme} />

      {/* Responsive Navbar (Can be toggled View / Hide) */}
      {isNavbarVisible && (
        <Navbar
          currentTab={effectiveTab}
          setCurrentTab={setCurrentTab}
          tenures={tenures}
          activeTenure={activeTenure}
          onSelectTenure={handleSelectTenure}
          theme={theme}
          onToggleTheme={toggleTheme}
          forms={forms}
          pageVisibility={pageVisibility}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        />
      )}

      {/* LIVE ANNOUNCEMENT / TOP RUNNING BANNER */}
      {announcementBar?.isActive && !isBannerDismissed && effectiveTab !== 'admin' && effectiveTab !== 'all-hidden' && (
        <div
          style={{
            position: 'relative',
            zIndex: 45,
            background: isDark
              ? 'linear-gradient(90deg, rgba(0, 61, 121, 0.92), rgba(255, 184, 0, 0.18), rgba(0, 61, 121, 0.92))'
              : 'linear-gradient(90deg, #003D79, #00529C, #003D79)',
            borderBottom: '1px solid rgba(255, 184, 0, 0.4)',
            color: '#ffffff',
            padding: '10px 16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px', minWidth: 0 }}>
              {announcementBar.badge && (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-gold)',
                    color: '#040914',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    flexShrink: 0
                  }}
                >
                  {announcementBar.badge}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  lineHeight: 1.45
                }}
              >
                {announcementBar.message || announcementBar.text}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {(announcementBar.ctaText || announcementBar.ctaLabel) && announcementBar.ctaTab && (
                <button
                  type="button"
                  onClick={() => setCurrentTab(announcementBar.ctaTab)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 184, 0, 0.2)',
                    border: '1px solid var(--mandiri-gold)',
                    color: 'var(--mandiri-gold)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <span>{announcementBar.ctaText || announcementBar.ctaLabel}</span>
                  <ChevronRight size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                title="Sembunyikan pengumuman sementara"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {persistError && (
        <div
          role="alert"
          style={{
            position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: 10000,
            width: 'min(560px, calc(100vw - 32px))', display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 16px', borderRadius: 'var(--radius-md)', background: '#fef2f2',
            border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.88rem', lineHeight: 1.5,
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ flex: 1 }}>{persistError}</span>
          <button
            type="button"
            onClick={() => setPersistError(null)}
            aria-label="Tutup pesan kesalahan"
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Floating Quick Utility Pill when Navbar is Hidden */}
      {!isNavbarVisible && currentTab !== 'admin' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          backdropFilter: 'blur(12px)'
        }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              color: isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, position: 'relative' }}>
        {effectiveTab === 'all-hidden' && (
          <div style={{ maxWidth: '620px', margin: '60px auto 80px auto', textAlign: 'center', padding: '0 16px' }}>
            <div className="glass-panel" style={{
              padding: '48px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              border: '1.5px solid var(--border-card)'
            }}>
              <img 
                src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"} 
                alt="CNT IT APD Logo"
                style={{ height: '48px', objectFit: 'contain', marginBottom: '4px' }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
                }}
              />

              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 184, 0, 0.14)',
                border: '1px solid rgba(255, 184, 0, 0.4)',
                color: 'var(--mandiri-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <EyeOff size={28} />
              </div>

              <span className="badge-gold">
                Mode Standby • Halaman Disembunyikan
              </span>

              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Seluruh Halaman Sedang Disembunyikan
              </h2>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '480px', margin: 0 }}>
                Saat ini seluruh halaman publik portal <strong>Culture Network Team (CNT) IT APD</strong> sedang dinonaktifkan sementara. Silakan kembali lagi nanti.
              </p>
            </div>
          </div>
        )}

        <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
          {effectiveTab === 'home' && (
            <HomeSection
              activeTenure={activeTenure}
              divisions={divisions}
              events={events}
              members={members}
              setCurrentTab={setCurrentTab}
              forms={forms}
              registrationCounts={registrationCounts}
              kudosList={kudosList}
              faqs={faqs}
              onSubmitFaqQuestion={handleSubmitPublicFaq}
              theme={theme}
              pageVisibility={pageVisibility}
              tenureRoles={tenureRoles}
            />
          )}
        </ErrorBoundary>

        <Suspense
          fallback={
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Memuat halaman CNT IT APD...
            </div>
          }
        >
          <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
            {effectiveTab === 'organisasi' && (
            <OrganizationSection
              activeTenure={activeTenure}
              tenures={tenures}
              divisions={divisions}
              members={members}
              events={events}
              roleQuotas={roleQuotas}
              tenureRoles={tenureRoles}
              isEventPageVisible={isPageVisible('event')}
              onNavigateProgram={isPageVisible('event') ? () => setCurrentTab('event') : undefined}
              theme={theme}
              onSelectTenure={handleSelectTenure}
            />
          )}

          {(effectiveTab === 'event' || effectiveTab === 'program') && (
            <ProgramSection
              events={events}
              divisions={divisions}
              departments={departments}
              activeTenure={activeTenure}
              tenures={tenures}
              theme={theme}
              onNavigateOprec={isPageVisible('form') ? () => setCurrentTab('form') : undefined}
              registrationCounts={registrationCounts}
              onAddEventRsvp={handleAddEventRsvp}
              initialEventId={activeEventIdFromUrl}
              onSelectEventUrl={(eId) => setCurrentTab('event', null, eId, false)}
              forms={forms}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
              onNavigateEventStats={(eId) => setCurrentTab('event-stats', null, eId)}
              galleries={galleries}
              onNavigateGallery={(gId) => setCurrentTab('galeri', null, null, true, gId)}
            />
          )}

          {effectiveTab === 'event-stats' && !isAdmin && (
            <AdminOnlyNotice
              isLoading={adminSession.status === 'loading'}
              onLogin={() => setCurrentTab('admin')}
              onBack={() => setCurrentTab('event')}
            />
          )}

          {effectiveTab === 'event-stats' && isAdmin && (
            <EventRegistrationStats
              eventId={activeEventIdFromUrl}
              events={events}
              forms={forms}
              submissions={submissions}
              eventRsvps={eventRsvps}
              luckyDraws={luckyDraws}
              departments={departments}
              divisions={divisions}
              onAddLuckyDraw={handleAddLuckyDraw}
              onDeleteLuckyDraw={handleDeleteLuckyDraw}
              onResetLuckyDraw={handleResetLuckyDraw}
              onBack={() => setCurrentTab('event')}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
              theme={theme}
            />
          )}

          {effectiveTab === 'galeri' && (
            <GallerySection
              galleries={galleries}
              divisions={divisions}
              events={events}
              activeTenure={activeTenure}
              tenures={tenures}
              theme={theme}
              initialGalleryId={activeGalleryIdFromUrl}
              onSelectGalleryUrl={(gId) => setCurrentTab('galeri', null, null, false, gId)}
              onNavigateEvent={(eId) => setCurrentTab('event', null, eId)}
            />
          )}

          {effectiveTab === 'kudos' && (
            <KudosSection
              kudosList={kudosList}
              onAddKudos={handleAddKudos}
              onToggleKudosLike={handleToggleKudosLike}
              aspirasiList={aspirasiList}
              onAddAspirasi={handleAddAspirasi}
              theme={theme}
            />
          )}

          {effectiveTab === 'assets' && (
            <AssetKitSection
              theme={theme}
              brandAssets={brandAssets}
            />
          )}

          {(effectiveTab === 'form' || effectiveTab === 'oprec') && (
            <DynamicFormSection
              forms={forms}
              divisions={divisions}
              departments={departments}
              events={events}
              registrationCounts={registrationCounts}
              onSubmitSubmission={handleSubmitSubmission}
              theme={theme}
              initialFormId={activeFormIdFromUrl}
              onSelectFormUrl={(fId) => setCurrentTab('form', fId)}
              activeTenure={activeTenure}
              tenures={tenures}
            />
          )}

          {effectiveTab === 'admin' && (
            <AdminPortal
              onBack={() => setCurrentTab(visiblePublicPages[0] || 'home')}
              tenures={tenures}
              activeTenure={activeTenure}
              roleQuotas={roleQuotas}
              onUpdateRoleQuotas={handleUpdateRoleQuotas}
              tenureRoles={tenureRoles}
              onAddTenureRole={handleAddTenureRole}
              onUpdateTenureRole={handleUpdateTenureRole}
              onDeleteTenureRole={handleDeleteTenureRole}
              onSelectTenure={handleSelectTenure}
              onAddTenure={handleAddTenure}
              onUpdateTenure={handleUpdateTenure}
              onDeleteTenure={handleDeleteTenure}
              divisions={adminScope.divisions}
              onAddDivision={handleAddDivision}
              onUpdateDivision={handleUpdateDivision}
              onDeleteDivision={handleDeleteDivision}
              departments={departments}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              forms={adminScope.forms}
              onAddForm={handleAddForm}
              onUpdateForm={handleUpdateForm}
              onDeleteForm={handleDeleteForm}
              submissions={submissions}
              onUpdateSubmission={handleUpdateSubmission}
              onDeleteSubmission={handleDeleteSubmission}
              galleries={adminScope.galleries}
              onAddGallery={handleAddGallery}
              onUpdateGallery={handleUpdateGallery}
              onDeleteGallery={handleDeleteGallery}
              members={adminScope.members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              events={adminScope.events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              kudosList={kudosList}
              onUpdateKudos={handleUpdateKudos}
              onDeleteKudos={handleDeleteKudos}
              aspirasiList={aspirasiList}
              onUpdateAspirasi={handleUpdateAspirasi}
              onDeleteAspirasi={handleDeleteAspirasi}
              brandAssets={brandAssets}
              onAddBrandAsset={handleAddBrandAsset}
              onUpdateBrandAsset={handleUpdateBrandAsset}
              onDeleteBrandAsset={handleDeleteBrandAsset}
              eventRsvps={eventRsvps}
              onDeleteEventRsvp={handleDeleteEventRsvp}
              faqs={faqs}
              onAddFaq={handleAddFaq}
              onUpdateFaq={handleUpdateFaq}
              onDeleteFaq={handleDeleteFaq}
              announcementBar={announcementBar}
              onUpdateAnnouncementBar={handleUpdateAnnouncementBar}
              pageVisibility={pageVisibility}
              onUpdatePageVisibility={setPageVisibility}
              syncStatus={syncStatus}
              onForceSync={refreshAllData}
              onResetDefault={handleResetDefault}
              onRestoreBackup={handleRestoreBackup}
              theme={theme}
              luckyDraws={luckyDraws}
              registrationCounts={registrationCounts}
              adminSession={adminSession}
              onAdminLogin={handleAdminLogin}
              onAdminLogout={handleAdminLogout}
            />
          )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* GLOBAL QUICK SEARCH MODAL (Ctrl+K / Tombol Cari di Navbar) */}
      {isQuickSearchOpen && (() => {
        const q = quickSearchQuery.trim().toLowerCase();
        const matchedMembers = q
          ? members.filter(m =>
              (m.name || '').toLowerCase().includes(q) ||
              (m.role || '').toLowerCase().includes(q) ||
              (m.title || '').toLowerCase().includes(q)
            ).slice(0, 5)
          : members.slice(0, 3);

        const matchedEvents = q
          ? events.filter(e =>
              (e.title || '').toLowerCase().includes(q) ||
              (e.divisionName || '').toLowerCase().includes(q) ||
              (e.location || '').toLowerCase().includes(q)
            ).slice(0, 4)
          : events.slice(0, 2);

        const matchedForms = q
          ? forms.filter(f =>
              f.isOpen !== false && (
                (f.title || '').toLowerCase().includes(q) ||
                (f.category || '').toLowerCase().includes(q)
              )
            ).slice(0, 3)
          : forms.filter(f => f.isOpen !== false).slice(0, 2);

        const matchedGalleries = q
          ? galleries.filter(g =>
              (g.title || '').toLowerCase().includes(q) ||
              (g.division || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedAssets = q
          ? brandAssets.filter(a =>
              (a.title || '').toLowerCase().includes(q) ||
              (a.category || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedKudos = q
          ? kudosList.filter(k =>
              (k.recipient || '').toLowerCase().includes(q) ||
              (k.sender || '').toLowerCase().includes(q) ||
              (k.message || '').toLowerCase().includes(q) ||
              (k.category || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedAspirasi = q
          ? aspirasiList.filter(asp =>
              asp.isPublic !== false && (
                (asp.title || '').toLowerCase().includes(q) ||
                (asp.description || '').toLowerCase().includes(q) ||
                (asp.adminReply || '').toLowerCase().includes(q)
              )
            ).slice(0, 3)
          : [];

        const matchedFaqs = q
          ? faqs.filter(fq =>
              fq.isPublished !== false && (
                (fq.question || '').toLowerCase().includes(q) ||
                (fq.answer || '').toLowerCase().includes(q) ||
                (fq.category || '').toLowerCase().includes(q)
              )
            ).slice(0, 3)
          : [];

        const totalResults = matchedMembers.length + matchedEvents.length + matchedForms.length + matchedGalleries.length + matchedAssets.length + matchedKudos.length + matchedAspirasi.length + matchedFaqs.length;

        return (
          <div
            onClick={() => setIsQuickSearchOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '64px 16px 24px 16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-panel modal-container"
              style={{
                maxWidth: '640px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '20px',
                border: '1.5px solid var(--mandiri-gold)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Search Bar Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="var(--mandiri-gold)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cari nama personel, event, formulir registrasi, galeri, atau asset logo..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 40px 13px 42px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1.5px solid var(--input-border)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsQuickSearchOpen(false)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {totalResults === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Tidak ditemukan hasil untuk <strong>"{quickSearchQuery}"</strong>. Coba kata kunci lain seperti nama pengurus, turnamen, atau logo.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Members Results */}
                  {matchedMembers.length > 0 && pageVisibility.organisasi !== false && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="var(--mandiri-gold)" />
                        <span>Personel & Struktur Organisasi</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedMembers.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('organisasi');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{m.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {(() => {
                                  const roleObj = (tenureRoles || []).find(r => r.id === m.roleId) ||
                                    (tenureRoles || []).find(r => String(r.name || '').toLowerCase().trim() === String(m.role || '').toLowerCase().trim());
                                  const roleName = roleObj?.name || m.role || 'Anggota';
                                  const divObj = (divisions || []).find(d => d.id === m.divisionId);
                                  if (divObj && !roleName.toLowerCase().includes(divObj.name.toLowerCase())) {
                                    return `${roleName} • ${divObj.name}`;
                                  }
                                  return roleName;
                                })()}
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Results */}
                  {matchedEvents.length > 0 && isPageVisible('event') && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="var(--neon-cyan)" />
                        <span>Event Budaya</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedEvents.map(evt => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('event', null, evt.id);
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{evt.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date} • {evt.divisionName}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Forms Results */}
                  {matchedForms.length > 0 && isPageVisible('form') && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClipboardList size={13} color="#10b981" />
                        <span>Formulir & Pendaftaran Aktif</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedForms.map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('form', f.id);
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{f.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.category} • Deadline: {formatDeadlineWib(f.deadline)}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Galleries & Brand Assets Results */}
                  {(matchedGalleries.length > 0 || matchedAssets.length > 0) && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={13} color="#a855f7" />
                        <span>Galeri Dokumentasi & Asset Brand</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedGalleries.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('galeri');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>📷 {g.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.date} • {g.division}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                        {matchedAssets.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('assets');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>📦 {a.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.category} • {a.fileType}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kudos, Aspirasi & FAQ Results */}
                  {(matchedKudos.length > 0 || matchedAspirasi.length > 0 || matchedFaqs.length > 0) && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Search size={13} color="var(--mandiri-gold)" />
                        <span>Apresiasi Kudos, Aspirasi & Panduan FAQ</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedKudos.map(k => (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('kudos');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>🏆 Kudos untuk {k.recipient} (dari {k.sender})</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>"{(k.message || '').slice(0, 75)}..."</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                        {matchedAspirasi.map(asp => (
                          <button
                            key={asp.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('kudos');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>💡 Aspirasi: {asp.title || asp.description}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Status: {asp.status} • {asp.category}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                        {matchedFaqs.map(fq => (
                          <button
                            key={fq.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('home');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>❓ FAQ: {fq.question}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{(fq.answer || '').slice(0, 80)}...</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                <span>💡 Pintasan Keyboard: <strong>Ctrl + K</strong> atau <strong>⌘ + K</strong></span>
                <span>Tekan <strong>ESC</strong> untuk menutup</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Clean Footer */}
      <Footer theme={theme} />
    </div>
    </AppNavigationContext.Provider>
  );
}
