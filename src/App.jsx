import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Lock, EyeOff, Sun, Moon, Search, X, Users, Calendar, Image as ImageIcon, ClipboardList, Download, ChevronRight } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import Footer from './components/Footer';

const OrganizationSection = lazy(() => import('./components/OrganizationSection'));
const ProgramSection = lazy(() => import('./components/ProgramSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const KudosSection = lazy(() => import('./components/KudosSection'));
const AssetKitSection = lazy(() => import('./components/AssetKitSection'));
const DynamicFormSection = lazy(() => import('./components/DynamicFormSection'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));

const DEFAULT_ANNOUNCEMENT_BAR = {
  badge: '',
  message: '',
  ctaText: '',
  ctaTab: 'home',
  isActive: false,
};
import {
  supabase,
  loadLocalCache,
  saveLocalCache,
  fetchAllCloudState,
  pushCloudState,
  mergeAndPushCloudList,
  deleteMediaFromCloud
} from './lib/supabase';
import { formatDeadlineWib } from './utils/dateUtils';

const PUBLIC_PAGE_IDS = ['home', 'organisasi', 'program', 'galeri', 'kudos', 'assets', 'oprec'];
const VALID_TABS = [...PUBLIC_PAGE_IDS, 'admin'];

function parseLocationRoute() {
  const rawHash = (window.location.hash || '').replace(/^#/, '');
  const [hashTab, hashQuery] = rawHash.split('?');
  const params = new URLSearchParams(hashQuery || window.location.search || '');
  const formId = params.get('form') || null;
  const eventId = params.get('eventId') || params.get('event') || null;
  const pathname = (window.location.pathname || '').replace(/\/+$/, '');

  if (pathname === '/admin' || hashTab === 'admin') {
    return { tab: 'admin', formId, eventId };
  }
  if (hashTab && VALID_TABS.includes(hashTab)) {
    return { tab: hashTab, formId, eventId };
  }
  if (formId) {
    return { tab: 'oprec', formId, eventId: null };
  }
  if (eventId) {
    return { tab: 'program', formId: null, eventId };
  }
  return { tab: 'home', formId: null, eventId: null };
}

const DEFAULT_PAGE_VISIBILITY = {
  navbar: true,
  home: true,
  organisasi: true,
  program: true,
  galeri: true,
  kudos: true,
  assets: true,
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
  // Navigation: 'home' | 'organisasi' | 'program' | 'galeri' | 'kudos' | 'assets' | 'oprec' | 'admin'
  const [currentTab, setCurrentTabState] = useState(() => parseLocationRoute().tab);
  const [activeFormIdFromUrl, setActiveFormIdFromUrl] = useState(() => parseLocationRoute().formId);
  const [activeEventIdFromUrl, setActiveEventIdFromUrl] = useState(() => parseLocationRoute().eventId);

  const setCurrentTab = useCallback((nextTab, formIdParam = null, eventIdParam = null, shouldScroll = true) => {
    const targetTab = VALID_TABS.includes(nextTab) ? nextTab : 'home';
    setCurrentTabState(targetTab);
    const isPathAdmin = (window.location.pathname || '').replace(/\/+$/, '') === '/admin';
    const basePrefix = isPathAdmin ? '/' : '';

    if (formIdParam) {
      setActiveFormIdFromUrl(formIdParam);
      setActiveEventIdFromUrl(null);
      window.history.replaceState(null, '', `${basePrefix}#${targetTab}?form=${encodeURIComponent(formIdParam)}`);
    } else if (eventIdParam) {
      setActiveEventIdFromUrl(eventIdParam);
      setActiveFormIdFromUrl(null);
      window.history.replaceState(null, '', `${basePrefix}#${targetTab}?event=${encodeURIComponent(eventIdParam)}`);
    } else {
      setActiveFormIdFromUrl(null);
      setActiveEventIdFromUrl(null);
      if (targetTab === 'admin') {
        window.history.replaceState(null, '', isPathAdmin ? '/admin' : '#admin');
      } else {
        window.history.replaceState(null, '', `${basePrefix}#${targetTab}`);
      }
    }
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Page & Navbar Visibility State (View / Hide per page & navbar)
  const [pageVisibility, setPageVisibilityState] = useState(() => {
    const cached = loadLocalCache('pageVisibility', null);
    if (cached && typeof cached === 'object') {
      return { ...DEFAULT_PAGE_VISIBILITY, ...cached };
    }
    try {
      const legacy = localStorage.getItem('cnt_page_visibility');
      if (legacy) {
        return { ...DEFAULT_PAGE_VISIBILITY, ...JSON.parse(legacy) };
      }
    } catch (e) {}
    return DEFAULT_PAGE_VISIBILITY;
  });

  // Default Departments in Bank Mandiri IT APD
  const DEFAULT_DEPARTMENTS = [
    { id: 'dept-core', name: 'Core Banking Delivery', code: 'CBD', description: 'Pengembangan dan pemeliharaan sistem inti perbankan (Core Banking).' },
    { id: 'dept-digital', name: 'Digital Banking Delivery', code: 'DBD', description: 'Pengembangan channel digital Livin & Kopra by Mandiri.' },
    { id: 'dept-wealth', name: 'Wealth & Retail Delivery', code: 'WRD', description: 'Solusi teknologi untuk nasabah wealth management dan segmen retail.' },
    { id: 'dept-corporate', name: 'Corporate & Commercial Delivery', code: 'CCD', description: 'Solusi teknologi untuk nasabah korporat, komersial, dan wholesale.' },
    { id: 'dept-cards', name: 'Cards & Payments Delivery', code: 'CPD', description: 'Pengembangan sistem kartu kredit, debit, dan pemrosesan pembayaran.' },
    { id: 'dept-integration', name: 'Integration & API Delivery', code: 'IAD', description: 'Arsitektur integrasi sistem, middleware, dan Open API perbankan.' },
    { id: 'dept-data', name: 'Data & Analytics Delivery', code: 'DAD', description: 'Pengembangan data warehouse, business intelligence, dan analitik AI.' },
    { id: 'dept-governance', name: 'IT Architecture & Governance', code: 'IAG', description: 'Tata kelola arsitektur IT, kepatuhan teknologi, dan standar kualitas.' }
  ];

  // Default theme is LIGHT THEME as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cnt_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cnt_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleHash = () => {
      const parsed = parseLocationRoute();
      setCurrentTabState(parsed.tab);
      setActiveFormIdFromUrl(parsed.formId);
      setActiveEventIdFromUrl(parsed.eventId);
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Master Dynamic States (Loaded from LocalCache immediately + Synced with Supabase Cloud)
  const [tenures, setTenures] = useState(() => sortTenuresDesc(loadLocalCache('tenures', [])));
  const [activeTenure, setActiveTenure] = useState(() => {
    const savedTenures = sortTenuresDesc(loadLocalCache('tenures', []));
    const savedActiveId = loadLocalCache('activeTenureId', null);
    if (savedActiveId && Array.isArray(savedTenures)) {
      const found = savedTenures.find(t => t.id === savedActiveId);
      if (found) return found;
    }
    return (Array.isArray(savedTenures) ? savedTenures.find(t => t.isActive) || savedTenures[0] : null) || null;
  });
  const [divisions, setDivisions] = useState(() => {
    const cachedDivs = loadLocalCache('divisions', []);
    const cachedMems = loadLocalCache('members', []);
    return (cachedDivs || []).map(d => {
      if (d.memberId) return d;
      const pimpro = (cachedMems || []).find(m =>
        (m.category || '').toLowerCase() === 'pimpro' &&
        (m.divisionId === d.id || (d.leadName && m.name?.toLowerCase() === d.leadName?.toLowerCase()))
      );
      return pimpro ? { ...d, memberId: pimpro.id, leadName: pimpro.name } : d;
    });
  });
  const [departments, setDepartments] = useState(() => loadLocalCache('departments', DEFAULT_DEPARTMENTS));
  const [members, setMembers] = useState(() => loadLocalCache('members', []));
  const [events, setEvents] = useState(() => loadLocalCache('events', []));
  const [galleries, setGalleries] = useState(() => loadLocalCache('galleries', []));
  const [kudosList, setKudosList] = useState(() => loadLocalCache('kudosList', []));
  const [forms, setForms] = useState(() => loadLocalCache('forms', []));
  const [submissions, setSubmissions] = useState(() => loadLocalCache('submissions', []));
  const [aspirasiList, setAspirasiList] = useState(() => loadLocalCache('aspirasiList', []));
  const [brandAssets, setBrandAssets] = useState(() => loadLocalCache('brandAssets', []));
  const [eventRsvps, setEventRsvps] = useState(() => loadLocalCache('eventRsvps', []));
  const [faqs, setFaqs] = useState(() => loadLocalCache('faqs', []));
  const [announcementBar, setAnnouncementBar] = useState(() => loadLocalCache('announcementBar', DEFAULT_ANNOUNCEMENT_BAR));
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
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

  // Pull & Reconcile Cloud State across devices
  const syncFromCloud = useCallback(async () => {
    setSyncStatus('syncing');
    const cloud = await fetchAllCloudState();
    if (cloud) {
      if (Array.isArray(cloud.tenures) && cloud.tenures.length > 0) {
        const sortedTenures = sortTenuresDesc(cloud.tenures);
        const targetId = cloud.activeTenureId || loadLocalCache('activeTenureId', null);
        const defaultActive = sortedTenures.find(t => t.id === targetId) || sortedTenures.find(t => t.isActive) || sortedTenures[0];
        // Enforce strict single active tenure exclusivity
        const normalizedTenures = sortedTenures.map(t => ({
          ...t,
          isActive: t.id === defaultActive.id
        }));
        setTenures(normalizedTenures);
        // Preserve user's current session browsing selection if still valid, otherwise fallback to official active tenure
        setActiveTenure(curr => {
          if (!curr) return { ...defaultActive, isActive: true };
          const stillExists = normalizedTenures.find(t => t.id === curr.id);
          return stillExists || { ...defaultActive, isActive: true };
        });
      }
      const currentMembers = (Array.isArray(cloud.members) && cloud.members.length > 0) ? cloud.members : members;
      if (Array.isArray(cloud.members) && cloud.members.length > 0) setMembers(cloud.members);
      if (Array.isArray(cloud.divisions) && cloud.divisions.length > 0) {
        const resolvedDivs = cloud.divisions.map(d => {
          if (d.memberId) return d;
          const pimpro = currentMembers.find(m =>
            (m.category || '').toLowerCase() === 'pimpro' &&
            (m.divisionId === d.id || (d.leadName && m.name?.toLowerCase() === d.leadName?.toLowerCase()))
          );
          return pimpro ? { ...d, memberId: pimpro.id, leadName: pimpro.name } : d;
        });
        setDivisions(resolvedDivs);
      }
      if (Array.isArray(cloud.events)) {
        const currentDivs = (Array.isArray(cloud.divisions) && cloud.divisions.length > 0) ? cloud.divisions : divisions;
        const reconciledEvts = cloud.events.map(e => {
          const divObj = currentDivs.find(d => d.id === e.divisionId) || currentDivs.find(d => d.name === e.divisionName);
          return {
            ...e,
            divisionId: e.divisionId || divObj?.id,
            divisionName: divObj?.name || e.divisionName || 'CNT IT APD'
          };
        });
        setEvents(reconciledEvts);
      }
      if (Array.isArray(cloud.galleries)) {
        const currentDivs = (Array.isArray(cloud.divisions) && cloud.divisions.length > 0) ? cloud.divisions : divisions;
        const reconciledGals = cloud.galleries.map(g => {
          const matchedDiv = currentDivs.find(d => d.id === g.divisionId) || currentDivs.find(d => d.name === g.division);
          const resolvedName = matchedDiv?.name || g.divisionName || g.division || 'CNT IT APD';
          return {
            ...g,
            divisionId: g.divisionId || matchedDiv?.id,
            division: resolvedName,
            divisionName: resolvedName
          };
        });
        setGalleries(reconciledGals);
      }
      if (Array.isArray(cloud.kudosList)) setKudosList(cloud.kudosList);
      if (Array.isArray(cloud.forms)) setForms(cloud.forms);
      if (Array.isArray(cloud.submissions)) setSubmissions(cloud.submissions);
      if (Array.isArray(cloud.aspirasiList)) setAspirasiList(cloud.aspirasiList);
      if (Array.isArray(cloud.brandAssets)) setBrandAssets(cloud.brandAssets);
      if (Array.isArray(cloud.eventRsvps)) setEventRsvps(cloud.eventRsvps);
      if (Array.isArray(cloud.departments) && cloud.departments.length > 0) setDepartments(cloud.departments);
      if (Array.isArray(cloud.faqs)) setFaqs(cloud.faqs);
      if (cloud.announcementBar && typeof cloud.announcementBar === 'object') {
        setAnnouncementBar({ ...DEFAULT_ANNOUNCEMENT_BAR, ...cloud.announcementBar });
      }
      if (cloud.pageVisibility && typeof cloud.pageVisibility === 'object') {
        const mergedVis = { ...DEFAULT_PAGE_VISIBILITY, ...cloud.pageVisibility };
        setPageVisibilityState(mergedVis);
        try { localStorage.setItem('cnt_page_visibility', JSON.stringify(mergedVis)); } catch (e) {}
      }
    }
    setSyncStatus('synced');
  }, []);

  useEffect(() => {
    syncFromCloud();

    const onFocus = () => syncFromCloud();
    window.addEventListener('focus', onFocus);

    const intervalId = setInterval(() => {
      syncFromCloud();
    }, 12000);

    let channel;
    try {
      channel = supabase
        .channel('cnt-cloud-sync-live')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          syncFromCloud();
        })
        .subscribe();
    } catch (e) {}

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(intervalId);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    };
  }, [syncFromCloud]);

  const setPageVisibility = (nextVis) => {
    const resolved = typeof nextVis === 'function' ? nextVis(pageVisibility) : nextVis;
    const merged = { ...DEFAULT_PAGE_VISIBILITY, ...resolved };
    setPageVisibilityState(merged);
    try { localStorage.setItem('cnt_page_visibility', JSON.stringify(merged)); } catch (e) {}
    pushCloudState('pageVisibility', merged);
  };

  // Visitor / Admin local view mode (filters the page display without mutating the official active tenure in database)
  const handleSelectTenure = (tenureObj) => {
    setActiveTenure(tenureObj);
  };

  // Dynamic Add, Edit & Delete Handlers (Persisted to LocalStorage + Supabase Cloud)
  const handleAddDivision = (newDiv) => {
    let leadName = newDiv.leadName;
    if (newDiv.memberId) {
      const pimpro = members.find(m => m.id === newDiv.memberId);
      if (pimpro) leadName = pimpro.name;
    }
    const finalDiv = { ...newDiv, leadName };

    setDivisions((prev) => {
      const next = [...prev, finalDiv];
      pushCloudState('divisions', next);
      return next;
    });

    if (finalDiv.memberId) {
      setMembers((prev) => {
        const targetMem = prev.find(m => m.id === finalDiv.memberId);
        if (!targetMem || targetMem.divisionId === finalDiv.id) return prev;
        const next = prev.map(m => m.id === finalDiv.memberId ? { ...m, divisionId: finalDiv.id } : m);
        pushCloudState('members', next);
        return next;
      });
    }
  };
  const handleUpdateDivision = (updatedDiv) => {
    let leadName = updatedDiv.leadName;
    if (updatedDiv.memberId) {
      const pimpro = members.find(m => m.id === updatedDiv.memberId);
      if (pimpro) leadName = pimpro.name;
    }
    const finalDiv = { ...updatedDiv, leadName };

    setDivisions((prev) => {
      const next = prev.map(d => d.id === finalDiv.id ? finalDiv : d);
      pushCloudState('divisions', next);
      return next;
    });

    // If division's memberId is set, ensure that member's divisionId points to this division
    if (finalDiv.memberId) {
      setMembers((prev) => {
        const targetMem = prev.find(m => m.id === finalDiv.memberId);
        if (!targetMem || targetMem.divisionId === finalDiv.id) return prev;
        const next = prev.map(m => m.id === finalDiv.memberId ? { ...m, divisionId: finalDiv.id } : m);
        pushCloudState('members', next);
        return next;
      });
    }
    // Auto-sync Pimpro name if leadName changed on Division
    else if (finalDiv.leadName) {
      setMembers((prev) => {
        const hasPimpro = prev.some(m => m.category === 'pimpro' && m.divisionId === finalDiv.id);
        if (!hasPimpro) return prev;
        const next = prev.map(m =>
          (m.category === 'pimpro' && m.divisionId === finalDiv.id)
            ? { ...m, name: finalDiv.leadName }
            : m
        );
        pushCloudState('members', next);
        return next;
      });
    }
    // Auto-sync divisionName onto Events belonging to this division
    if (updatedDiv.name) {
      setEvents((prev) => {
        const hasMatch = prev.some(e => e.divisionId === updatedDiv.id && e.divisionName !== updatedDiv.name);
        if (!hasMatch) return prev;
        const next = prev.map(e =>
          e.divisionId === updatedDiv.id
            ? { ...e, divisionName: updatedDiv.name }
            : e
        );
        pushCloudState('events', next);
        return next;
      });

      // Auto-sync division / divisionName onto Galleries belonging to this division
      const targetDiv = divisions.find(d => d.id === updatedDiv.id);
      setGalleries((prev) => {
        const hasMatch = prev.some(g =>
          (g.divisionId === updatedDiv.id || (targetDiv && g.division === targetDiv.name)) &&
          (g.division !== updatedDiv.name || g.divisionId !== updatedDiv.id)
        );
        if (!hasMatch) return prev;
        const next = prev.map(g =>
          (g.divisionId === updatedDiv.id || (targetDiv && g.division === targetDiv.name))
            ? { ...g, divisionId: updatedDiv.id, division: updatedDiv.name, divisionName: updatedDiv.name }
            : g
        );
        pushCloudState('galleries', next);
        return next;
      });
    }
  };
  const handleDeleteDivision = (divId) => {
    const targetDiv = divisions.find(d => d.id === divId);
    // Defense-in-depth safety checks: do not delete division if members, events, or galleries still depend on it
    const hasMem = members.some(m => m.divisionId === divId);
    const hasEvt = events.some(e => e.divisionId === divId);
    const hasGal = galleries.some(g => g.divisionId === divId || (targetDiv && g.division === targetDiv.name));
    if (hasMem || hasEvt || hasGal) return;

    setDivisions((prev) => {
      const next = prev.filter(d => d.id !== divId);
      pushCloudState('divisions', next);
      return next;
    });
  };

  const handleAddTenure = (newTenure) => {
    setTenures((prev) => {
      const isActivating = Boolean(newTenure.isActive);
      const sanitizedPrev = isActivating ? prev.map(t => ({ ...t, isActive: false })) : prev;
      const next = sortTenuresDesc([...sanitizedPrev, newTenure]);
      pushCloudState('tenures', next);
      if (isActivating) {
        setActiveTenure(newTenure);
        pushCloudState('activeTenureId', newTenure.id);
      }
      return next;
    });
  };
  const handleUpdateTenure = (updatedTenure) => {
    setTenures((prev) => {
      const isActivating = Boolean(updatedTenure.isActive);
      const next = sortTenuresDesc(prev.map(t => {
        if (t.id === updatedTenure.id) {
          return updatedTenure;
        }
        // Strict exclusivity: when a tenure becomes active, all other tenures must become inactive
        if (isActivating) {
          return { ...t, isActive: false };
        }
        return t;
      }));
      pushCloudState('tenures', next);
      return next;
    });
    if (updatedTenure.isActive || activeTenure?.id === updatedTenure.id) {
      setActiveTenure(updatedTenure);
      pushCloudState('activeTenureId', updatedTenure.id);
    }
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

    setTenures((prev) => {
      const next = prev.filter(t => t.id !== tenureId);
      pushCloudState('tenures', next);
      return next;
    });
  };

  const handleAddGallery = (newGal) => {
    setGalleries((prev) => {
      const next = [newGal, ...prev];
      pushCloudState('galleries', next);
      return next;
    });
  };
  const handleUpdateGallery = (updatedGal) => {
    const oldGal = galleries.find(g => g.id === updatedGal.id);
    if (oldGal && Array.isArray(oldGal.photos)) {
      const currentPhotos = Array.isArray(updatedGal.photos) ? updatedGal.photos : [];
      const removedPhotos = oldGal.photos.filter(p => !currentPhotos.includes(p));
      removedPhotos.forEach(p => deleteMediaFromCloud(p));
    }
    setGalleries((prev) => {
      const next = prev.map(g => g.id === updatedGal.id ? updatedGal : g);
      pushCloudState('galleries', next);
      return next;
    });
  };
  const handleDeleteGallery = (galId) => {
    const target = galleries.find(g => g.id === galId);
    if (target && Array.isArray(target.photos)) {
      target.photos.forEach(url => deleteMediaFromCloud(url));
    }
    setGalleries((prev) => {
      const next = prev.filter(g => g.id !== galId);
      pushCloudState('galleries', next);
      return next;
    });
  };

  const handleAddMember = (newMem) => {
    setMembers((prev) => {
      const next = [...prev, newMem];
      pushCloudState('members', next);
      return next;
    });
    // Auto-sync Division memberId when adding a Pimpro
    if (newMem.category === 'pimpro' && newMem.divisionId) {
      setDivisions((prev) => {
        const next = prev.map(d => d.id === newMem.divisionId ? { ...d, memberId: newMem.id, leadName: newMem.name || d.leadName } : d);
        pushCloudState('divisions', next);
        return next;
      });
    }
  };
  const handleUpdateMember = (updatedMem) => {
    const oldMem = members.find(m => m.id === updatedMem.id);
    if (oldMem?.image && oldMem.image !== updatedMem.image) {
      deleteMediaFromCloud(oldMem.image);
    }
    setMembers((prev) => {
      const next = prev.map(m => m.id === updatedMem.id ? updatedMem : m);
      pushCloudState('members', next);
      return next;
    });
    // Auto-sync Division memberId when updating a Pimpro
    if (updatedMem.category === 'pimpro' && updatedMem.divisionId) {
      setDivisions((prev) => {
        const next = prev.map(d => d.id === updatedMem.divisionId ? { ...d, memberId: updatedMem.id, leadName: updatedMem.name || d.leadName } : d);
        pushCloudState('divisions', next);
        return next;
      });
    }
  };
  const handleDeleteMember = (memId) => {
    const target = members.find(m => m.id === memId);
    if (!target) return;
    // Defense-in-depth safety check: do not delete a Pimpro if their division still has active squad members
    if (target.category === 'pimpro' && target.divisionId) {
      const hasSquad = members.some(m => m.category === 'anggota' && m.divisionId === target.divisionId);
      if (hasSquad) return;
    }
    if (target.image) deleteMediaFromCloud(target.image);
    setMembers((prev) => {
      const next = prev.filter(m => m.id !== memId);
      pushCloudState('members', next);
      return next;
    });
    // Unlink memberId on Division if deleted member was a Pimpro
    setDivisions((prev) => {
      const hasLink = prev.some(d => d.memberId === memId);
      if (!hasLink) return prev;
      const next = prev.map(d => d.memberId === memId ? { ...d, memberId: null, leadName: '' } : d);
      pushCloudState('divisions', next);
      return next;
    });
  };

  const handleAddEvent = (newEvt) => {
    setEvents((prev) => {
      const next = [...prev, newEvt];
      pushCloudState('events', next);
      return next;
    });
  };
  const handleUpdateEvent = (updatedEvt) => {
    setEvents((prev) => {
      const next = prev.map(e => e.id === updatedEvt.id ? updatedEvt : e);
      pushCloudState('events', next);
      return next;
    });
  };
  const handleDeleteEvent = (evtId) => {
    // Defense-in-depth safety check: do not delete event if RSVP records still exist
    const hasRsvps = eventRsvps.some(r => r.eventId === evtId);
    if (hasRsvps) return;

    setEvents((prev) => {
      const next = prev.filter(e => e.id !== evtId);
      pushCloudState('events', next);
      return next;
    });
  };

  // Dynamic Forms Lifecycle Handlers
  const handleAddForm = (newForm) => {
    setForms((prev) => {
      const next = [newForm, ...prev];
      pushCloudState('forms', next);
      return next;
    });
  };
  const handleUpdateForm = (updatedForm) => {
    setForms((prev) => {
      const next = prev.map(f => f.id === updatedForm.id ? updatedForm : f);
      pushCloudState('forms', next);
      return next;
    });
  };
  const handleDeleteForm = (formId, deleteSubmissions = false) => {
    setForms((prev) => {
      const next = prev.filter(f => f.id !== formId);
      pushCloudState('forms', next);
      return next;
    });
    if (deleteSubmissions) {
      setSubmissions((prev) => {
        const removed = prev.filter(s => s.formId === formId);
        removed.forEach(sub => {
          if (sub.files && typeof sub.files === 'object') {
            Object.values(sub.files).forEach(f => {
              const fileUrl = typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl || '');
              if (fileUrl) deleteMediaFromCloud(fileUrl);
            });
          }
        });
        const next = prev.filter(s => s.formId !== formId);
        pushCloudState('submissions', next);
        return next;
      });
    }
  };

  // Submissions Lifecycle Handlers (Atomic merge across devices)
  const handleSubmitSubmission = async (newSub) => {
    const withStatus = { status: 'Submitted', adminNotes: '', ...newSub };
    setSubmissions((prev) => {
      const next = [withStatus, ...prev];
      saveLocalCache('submissions', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('submissions', withStatus, submissions);
    if (Array.isArray(merged)) setSubmissions(merged);
  };
  const handleUpdateSubmission = (updatedSub) => {
    const oldSub = submissions.find(s => s.id === updatedSub.id);
    if (oldSub?.files && typeof oldSub.files === 'object') {
      const newUrls = updatedSub.files && typeof updatedSub.files === 'object'
        ? Object.values(updatedSub.files).map(f => typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl)).filter(Boolean)
        : [];
      Object.values(oldSub.files).forEach(f => {
        const oldUrl = typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl);
        if (oldUrl && !newUrls.includes(oldUrl)) {
          deleteMediaFromCloud(oldUrl);
        }
      });
    }
    setSubmissions((prev) => {
      const next = prev.map(s => s.id === updatedSub.id ? updatedSub : s);
      pushCloudState('submissions', next);
      return next;
    });
  };
  const handleDeleteSubmission = (subId) => {
    const target = submissions.find(s => s.id === subId);
    if (target?.files && typeof target.files === 'object') {
      Object.values(target.files).forEach(f => {
        const fileUrl = typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl || '');
        if (fileUrl) deleteMediaFromCloud(fileUrl);
      });
    }
    setSubmissions((prev) => {
      const next = prev.filter(s => s.id !== subId);
      pushCloudState('submissions', next);
      return next;
    });
  };

  // Brand Assets Lifecycle Handlers
  const handleAddBrandAsset = (newAsset) => {
    setBrandAssets((prev) => {
      const next = [...prev, newAsset];
      pushCloudState('brandAssets', next);
      return next;
    });
  };
  const handleUpdateBrandAsset = (updatedAsset) => {
    const oldAsset = brandAssets.find(a => a.id === updatedAsset.id);
    if (oldAsset) {
      // Hapus file asset lama hanya jika berubah DAN berkas lama tersebut tidak masih dipakai sebagai preview
      if (oldAsset.fileUrl && oldAsset.fileUrl !== updatedAsset.fileUrl && oldAsset.fileUrl !== updatedAsset.previewUrl) {
        deleteMediaFromCloud(oldAsset.fileUrl);
      }
      // Hapus preview lama hanya jika previewnya memang diganti DAN tidak dipakai sebagai file asset
      if (
        oldAsset.previewUrl &&
        oldAsset.previewUrl !== updatedAsset.previewUrl &&
        oldAsset.previewUrl !== updatedAsset.fileUrl &&
        oldAsset.previewUrl !== oldAsset.fileUrl
      ) {
        deleteMediaFromCloud(oldAsset.previewUrl);
      }
    }
    setBrandAssets((prev) => {
      const next = prev.map(a => a.id === updatedAsset.id ? updatedAsset : a);
      pushCloudState('brandAssets', next);
      return next;
    });
  };
  const handleDeleteBrandAsset = (assetId) => {
    const targetAsset = brandAssets.find(a => a.id === assetId);
    if (targetAsset) {
      if (targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.fileUrl);
      if (targetAsset.previewUrl && targetAsset.previewUrl !== targetAsset.fileUrl) {
        deleteMediaFromCloud(targetAsset.previewUrl);
      }
    }
    setBrandAssets((prev) => {
      const next = prev.filter(a => a.id !== assetId);
      pushCloudState('brandAssets', next);
      return next;
    });
  };

  const handleAddKudos = async (newKudos) => {
    setKudosList((prev) => {
      const next = [newKudos, ...prev];
      saveLocalCache('kudosList', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('kudosList', newKudos, kudosList);
    if (Array.isArray(merged)) setKudosList(merged);
  };
  const handleUpdateKudos = (updatedKudos) => {
    setKudosList((prev) => {
      const next = prev.map(k => k.id === updatedKudos.id ? updatedKudos : k);
      pushCloudState('kudosList', next);
      return next;
    });
  };
  const handleDeleteKudos = (kudosId) => {
    setKudosList((prev) => {
      const next = prev.filter(k => k.id !== kudosId);
      pushCloudState('kudosList', next);
      return next;
    });
  };

  // Aspirasi Lifecycle Handlers
  const handleAddAspirasi = async (newAsp) => {
    setAspirasiList((prev) => {
      const next = [newAsp, ...prev];
      saveLocalCache('aspirasiList', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('aspirasiList', newAsp, aspirasiList);
    if (Array.isArray(merged)) setAspirasiList(merged);
  };
  const handleUpdateAspirasi = (updatedAsp) => {
    setAspirasiList((prev) => {
      const next = prev.map(a => a.id === updatedAsp.id ? updatedAsp : a);
      pushCloudState('aspirasiList', next);
      return next;
    });
  };
  const handleDeleteAspirasi = (aspId) => {
    setAspirasiList((prev) => {
      const next = prev.filter(a => a.id !== aspId);
      pushCloudState('aspirasiList', next);
      return next;
    });
  };

  // Event RSVP Lifecycle Handlers (Atomic merge across devices)
  const handleAddEventRsvp = async (newRsvp) => {
    setEventRsvps((prev) => {
      const next = [newRsvp, ...prev];
      saveLocalCache('eventRsvps', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('eventRsvps', newRsvp, eventRsvps);
    if (Array.isArray(merged)) setEventRsvps(merged);
  };
  const handleDeleteEventRsvp = (rsvpId) => {
    setEventRsvps((prev) => {
      const next = prev.filter(r => r.id !== rsvpId);
      pushCloudState('eventRsvps', next);
      return next;
    });
  };

  // Announcement Bar Handler
  const handleUpdateAnnouncementBar = (nextBar) => {
    const resolved = typeof nextBar === 'function' ? nextBar(announcementBar) : nextBar;
    const merged = { ...DEFAULT_ANNOUNCEMENT_BAR, ...resolved };
    setAnnouncementBar(merged);
    setIsBannerDismissed(false);
    pushCloudState('announcementBar', merged);
  };

  // FAQs Lifecycle Handlers
  const handleAddFaq = (newFaq) => {
    setFaqs((prev) => {
      const next = [...prev, newFaq];
      pushCloudState('faqs', next);
      return next;
    });
  };
  const handleSubmitPublicFaq = async (newFaq) => {
    setFaqs((prev) => {
      const next = [newFaq, ...prev];
      saveLocalCache('faqs', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('faqs', newFaq, faqs);
    if (Array.isArray(merged)) setFaqs(merged);
  };
  const handleUpdateFaq = (updatedFaq) => {
    setFaqs((prev) => {
      const next = prev.map(f => f.id === updatedFaq.id ? updatedFaq : f);
      pushCloudState('faqs', next);
      return next;
    });
  };
  const handleDeleteFaq = (faqId) => {
    setFaqs((prev) => {
      const next = prev.filter(f => f.id !== faqId);
      pushCloudState('faqs', next);
      return next;
    });
  };

  // Departments Lifecycle Handlers
  const handleAddDepartment = (newDept) => {
    setDepartments((prev) => {
      const next = [...prev, newDept];
      pushCloudState('departments', next);
      return next;
    });
  };
  const handleUpdateDepartment = (updatedDept) => {
    setDepartments((prev) => {
      const next = prev.map(d => d.id === updatedDept.id ? updatedDept : d);
      pushCloudState('departments', next);
      return next;
    });
  };
  const handleDeleteDepartment = (deptId) => {
    const isUsed = eventRsvps.some(r => r.departmentId === deptId || r.department === deptId);
    if (isUsed) return false;
    setDepartments((prev) => {
      const next = prev.filter(d => d.id !== deptId);
      pushCloudState('departments', next);
      return next;
    });
    return true;
  };

  // Restore full backup snapshot (.json) across all 13 tables
  const handleRestoreBackup = async (backupData) => {
    if (!backupData || typeof backupData !== 'object') return;
    const tasks = [];

    if (Array.isArray(backupData.tenures) && backupData.tenures.length > 0) {
      setTenures(backupData.tenures);
      tasks.push(pushCloudState('tenures', backupData.tenures));
      const targetTenureId = backupData.meta?.activeTenureId || backupData.tenures[0].id;
      const foundTenure = backupData.tenures.find(t => t.id === targetTenureId) || backupData.tenures[0];
      setActiveTenure(foundTenure);
      tasks.push(pushCloudState('activeTenureId', foundTenure.id));
    }
    if (Array.isArray(backupData.divisions)) {
      setDivisions(backupData.divisions);
      tasks.push(pushCloudState('divisions', backupData.divisions));
    }
    if (Array.isArray(backupData.members)) {
      setMembers(backupData.members);
      tasks.push(pushCloudState('members', backupData.members));
    }
    if (Array.isArray(backupData.events)) {
      setEvents(backupData.events);
      tasks.push(pushCloudState('events', backupData.events));
    }
    if (Array.isArray(backupData.galleries)) {
      setGalleries(backupData.galleries);
      tasks.push(pushCloudState('galleries', backupData.galleries));
    }
    if (Array.isArray(backupData.kudosList)) {
      setKudosList(backupData.kudosList);
      tasks.push(pushCloudState('kudosList', backupData.kudosList));
    }
    if (Array.isArray(backupData.aspirasiList)) {
      setAspirasiList(backupData.aspirasiList);
      tasks.push(pushCloudState('aspirasiList', backupData.aspirasiList));
    }
    if (Array.isArray(backupData.forms)) {
      setForms(backupData.forms);
      tasks.push(pushCloudState('forms', backupData.forms));
    }
    if (Array.isArray(backupData.submissions)) {
      setSubmissions(backupData.submissions);
      tasks.push(pushCloudState('submissions', backupData.submissions));
    }
    if (Array.isArray(backupData.brandAssets)) {
      setBrandAssets(backupData.brandAssets);
      tasks.push(pushCloudState('brandAssets', backupData.brandAssets));
    }
    if (Array.isArray(backupData.eventRsvps)) {
      setEventRsvps(backupData.eventRsvps);
      tasks.push(pushCloudState('eventRsvps', backupData.eventRsvps));
    }
    if (Array.isArray(backupData.departments)) {
      setDepartments(backupData.departments);
      tasks.push(pushCloudState('departments', backupData.departments));
    }
    if (Array.isArray(backupData.faqs)) {
      setFaqs(backupData.faqs);
      tasks.push(pushCloudState('faqs', backupData.faqs));
    }
    if (backupData.announcementBar && typeof backupData.announcementBar === 'object') {
      const mergedBar = { ...DEFAULT_ANNOUNCEMENT_BAR, ...backupData.announcementBar };
      setAnnouncementBar(mergedBar);
      tasks.push(pushCloudState('announcementBar', mergedBar));
    }
    if (backupData.pageVisibility && typeof backupData.pageVisibility === 'object') {
      const mergedVis = { ...DEFAULT_PAGE_VISIBILITY, ...backupData.pageVisibility };
      setPageVisibilityState(mergedVis);
      try { localStorage.setItem('cnt_page_visibility', JSON.stringify(mergedVis)); } catch (e) {}
      tasks.push(pushCloudState('pageVisibility', mergedVis));
    }

    await Promise.all(tasks);
  };

  // Clear cache and reload all collections directly from database
  const handleResetDefault = async () => {
    localStorage.clear();
    await syncFromCloud();
  };

  // Determine visible public pages and effective active tab
  const visiblePublicPages = PUBLIC_PAGE_IDS.filter(id => pageVisibility[id] !== false);
  const allPagesHidden = visiblePublicPages.length === 0;
  const isNavbarVisible = pageVisibility.navbar !== false;
  const isDark = theme === 'dark';

  // If currentTab is a public page that has been hidden, automatically fall back to the first visible page
  const effectiveTab = currentTab === 'admin'
    ? 'admin'
    : (allPagesHidden
        ? 'all-hidden'
        : (pageVisibility[currentTab] !== false ? currentTab : visiblePublicPages[0]));

  return (
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
      <main className="container" style={{ flex: 1, paddingTop: '32px', position: 'relative' }}>
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

        {effectiveTab === 'home' && (
          <HomeSection
            activeTenure={activeTenure}
            divisions={divisions}
            events={events}
            members={members}
            setCurrentTab={setCurrentTab}
            forms={forms}
            eventRsvps={eventRsvps}
            kudosList={kudosList}
            faqs={faqs}
            onSubmitFaqQuestion={handleSubmitPublicFaq}
            theme={theme}
            pageVisibility={pageVisibility}
          />
        )}

        <Suspense
          fallback={
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Memuat halaman CNT IT APD...
            </div>
          }
        >
          {effectiveTab === 'organisasi' && (
            <OrganizationSection
              activeTenure={activeTenure}
              divisions={divisions}
              members={members}
              events={events}
              onNavigateProgram={pageVisibility.program !== false ? () => setCurrentTab('program') : undefined}
              theme={theme}
            />
          )}

          {effectiveTab === 'program' && (
            <ProgramSection
              events={events}
              divisions={divisions}
              departments={departments}
              activeTenure={activeTenure}
              theme={theme}
              onNavigateOprec={pageVisibility.oprec !== false ? () => setCurrentTab('oprec') : undefined}
              eventRsvps={eventRsvps}
              onAddEventRsvp={handleAddEventRsvp}
              initialEventId={activeEventIdFromUrl}
              onSelectEventUrl={(eId) => setCurrentTab('program', null, eId, false)}
            />
          )}

          {effectiveTab === 'galeri' && (
            <GallerySection
              galleries={galleries}
              divisions={divisions}
              activeTenure={activeTenure}
              theme={theme}
            />
          )}

          {effectiveTab === 'kudos' && (
            <KudosSection
              kudosList={kudosList}
              onAddKudos={handleAddKudos}
              onUpdateKudos={handleUpdateKudos}
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

          {effectiveTab === 'oprec' && (
            <DynamicFormSection
              forms={forms}
              divisions={divisions}
              events={events}
              submissions={submissions}
              onSubmitSubmission={handleSubmitSubmission}
              theme={theme}
              initialFormId={activeFormIdFromUrl}
              onSelectFormUrl={(fId) => setCurrentTab('oprec', fId)}
            />
          )}

          {effectiveTab === 'admin' && (
            <AdminPortal
              onBack={() => {
                if ((window.location.pathname || '').replace(/\/+$/, '') === '/admin') {
                  window.history.pushState(null, '', '/');
                }
                setCurrentTab(visiblePublicPages[0] || 'home');
              }}
              tenures={tenures}
              activeTenure={activeTenure}
              onSelectTenure={handleSelectTenure}
              onAddTenure={handleAddTenure}
              onUpdateTenure={handleUpdateTenure}
              onDeleteTenure={handleDeleteTenure}
              divisions={divisions}
              onAddDivision={handleAddDivision}
              onUpdateDivision={handleUpdateDivision}
              onDeleteDivision={handleDeleteDivision}
              departments={departments}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              forms={forms}
              onAddForm={handleAddForm}
              onUpdateForm={handleUpdateForm}
              onDeleteForm={handleDeleteForm}
              submissions={submissions}
              onUpdateSubmission={handleUpdateSubmission}
              onDeleteSubmission={handleDeleteSubmission}
              galleries={galleries}
              onAddGallery={handleAddGallery}
              onUpdateGallery={handleUpdateGallery}
              onDeleteGallery={handleUpdateGallery ? handleDeleteGallery : undefined}
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleAddEvent ? handleUpdateEvent : undefined}
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
              onForceSync={syncFromCloud}
              onResetDefault={handleResetDefault}
              onRestoreBackup={handleRestoreBackup}
              theme={theme}
            />
          )}
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
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.role} • {m.title}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Results */}
                  {matchedEvents.length > 0 && pageVisibility.program !== false && (
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
                              setCurrentTab('program', null, evt.id);
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
                  {matchedForms.length > 0 && pageVisibility.oprec !== false && (
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
                              setCurrentTab('oprec', f.id);
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
  );
}
