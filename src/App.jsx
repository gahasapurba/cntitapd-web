import React, { useState, useEffect, useCallback } from 'react';
import { Lock, EyeOff, Sun, Moon } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import OrganizationSection from './components/OrganizationSection';
import ProgramSection from './components/ProgramSection';
import GallerySection from './components/GallerySection';
import KudosSection from './components/KudosSection';
import AssetKitSection from './components/AssetKitSection';
import RecruitmentSection from './components/RecruitmentSection';
import AdminPortal from './components/AdminPortal';
import Footer from './components/Footer';

import { 
  INITIAL_TENURES, 
  INITIAL_DIVISIONS, 
  INITIAL_MEMBERS, 
  INITIAL_EVENTS, 
  INITIAL_KUDOS, 
  INITIAL_GALLERIES,
  INITIAL_FORMS,
  INITIAL_SUBMISSIONS
} from './data/initialData';
import DynamicFormSection from './components/DynamicFormSection';
import {
  supabase,
  loadLocalCache,
  saveLocalCache,
  fetchAllCloudState,
  pushCloudState,
  mergeAndPushCloudList
} from './lib/supabase';

const PUBLIC_PAGE_IDS = ['home', 'organisasi', 'program', 'galeri', 'kudos', 'assets', 'oprec'];

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

export default function App() {
  // Navigation: 'home' | 'organisasi' | 'program' | 'galeri' | 'kudos' | 'assets' | 'oprec' | 'admin'
  const [currentTab, setCurrentTab] = useState(() => {
    if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'home';
  });

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
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setCurrentTab('admin');
      }
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
  const [tenures, setTenures] = useState(() => loadLocalCache('tenures', INITIAL_TENURES));
  const [activeTenure, setActiveTenure] = useState(() => {
    const savedTenures = loadLocalCache('tenures', INITIAL_TENURES);
    const savedActiveId = loadLocalCache('activeTenureId', null);
    if (savedActiveId) {
      const found = savedTenures.find(t => t.id === savedActiveId);
      if (found) return found;
    }
    return savedTenures.find(t => t.isActive) || savedTenures[0] || INITIAL_TENURES[0];
  });
  const [divisions, setDivisions] = useState(() => loadLocalCache('divisions', INITIAL_DIVISIONS));
  const [members, setMembers] = useState(() => loadLocalCache('members', INITIAL_MEMBERS));
  const [events, setEvents] = useState(() => loadLocalCache('events', INITIAL_EVENTS));
  const [galleries, setGalleries] = useState(() => loadLocalCache('galleries', INITIAL_GALLERIES));
  const [kudosList, setKudosList] = useState(() => loadLocalCache('kudosList', INITIAL_KUDOS));
  const [forms, setForms] = useState(() => loadLocalCache('forms', INITIAL_FORMS));
  const [submissions, setSubmissions] = useState(() => loadLocalCache('submissions', INITIAL_SUBMISSIONS));
  const [aspirasiList, setAspirasiList] = useState(() => loadLocalCache('aspirasiList', []));
  const [syncStatus, setSyncStatus] = useState('synced');

  // Pull & Reconcile Cloud State across devices
  const syncFromCloud = useCallback(async () => {
    setSyncStatus('syncing');
    const cloud = await fetchAllCloudState();
    if (cloud) {
      if (Array.isArray(cloud.tenures) && cloud.tenures.length > 0) {
        setTenures(cloud.tenures);
        const targetId = cloud.activeTenureId || loadLocalCache('activeTenureId', null);
        const found = cloud.tenures.find(t => t.id === targetId) || cloud.tenures.find(t => t.isActive) || cloud.tenures[0];
        if (found) setActiveTenure(found);
      }
      if (Array.isArray(cloud.divisions) && cloud.divisions.length > 0) setDivisions(cloud.divisions);
      if (Array.isArray(cloud.members) && cloud.members.length > 0) setMembers(cloud.members);
      if (Array.isArray(cloud.events) && cloud.events.length > 0) setEvents(cloud.events);
      if (Array.isArray(cloud.galleries) && cloud.galleries.length > 0) setGalleries(cloud.galleries);
      if (Array.isArray(cloud.kudosList)) setKudosList(cloud.kudosList);
      if (Array.isArray(cloud.forms) && cloud.forms.length > 0) setForms(cloud.forms);
      if (Array.isArray(cloud.submissions)) setSubmissions(cloud.submissions);
      if (Array.isArray(cloud.aspirasiList)) setAspirasiList(cloud.aspirasiList);
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

  const handleSelectTenure = (tenureObj) => {
    setActiveTenure(tenureObj);
    pushCloudState('activeTenureId', tenureObj.id);
  };

  // Dynamic Add, Edit & Delete Handlers (Persisted to LocalStorage + Supabase Cloud)
  const handleAddDivision = (newDiv) => {
    setDivisions((prev) => {
      const next = [...prev, newDiv];
      pushCloudState('divisions', next);
      return next;
    });
  };
  const handleUpdateDivision = (updatedDiv) => {
    setDivisions((prev) => {
      const next = prev.map(d => d.id === updatedDiv.id ? updatedDiv : d);
      pushCloudState('divisions', next);
      return next;
    });
  };
  const handleDeleteDivision = (divId) => {
    setDivisions((prev) => {
      const next = prev.filter(d => d.id !== divId);
      pushCloudState('divisions', next);
      return next;
    });
    setEvents((prev) => {
      const next = prev.filter(e => e.divisionId !== divId);
      pushCloudState('events', next);
      return next;
    });
  };

  const handleAddTenure = (newTenure) => {
    setTenures((prev) => {
      const next = [...prev, newTenure];
      pushCloudState('tenures', next);
      return next;
    });
  };
  const handleUpdateTenure = (updatedTenure) => {
    setTenures((prev) => {
      const next = prev.map(t => t.id === updatedTenure.id ? updatedTenure : t);
      pushCloudState('tenures', next);
      return next;
    });
    if (activeTenure.id === updatedTenure.id) {
      setActiveTenure(updatedTenure);
    }
  };
  const handleDeleteTenure = (tenureId) => {
    setTenures((prev) => {
      const next = prev.filter(t => t.id !== tenureId);
      pushCloudState('tenures', next);
      if (activeTenure.id === tenureId && next.length > 0) {
        setActiveTenure(next[0]);
        pushCloudState('activeTenureId', next[0].id);
      }
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
    setGalleries((prev) => {
      const next = prev.map(g => g.id === updatedGal.id ? updatedGal : g);
      pushCloudState('galleries', next);
      return next;
    });
  };
  const handleDeleteGallery = (galId) => {
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
  };
  const handleUpdateMember = (updatedMem) => {
    setMembers((prev) => {
      const next = prev.map(m => m.id === updatedMem.id ? updatedMem : m);
      pushCloudState('members', next);
      return next;
    });
  };
  const handleDeleteMember = (memId) => {
    setMembers((prev) => {
      const next = prev.filter(m => m.id !== memId);
      pushCloudState('members', next);
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
        const next = prev.filter(s => s.formId !== formId);
        pushCloudState('submissions', next);
        return next;
      });
    }
  };

  // Submissions Lifecycle Handlers (Atomic merge across devices)
  const handleSubmitSubmission = async (newSub) => {
    setSubmissions((prev) => {
      const next = [newSub, ...prev];
      saveLocalCache('submissions', next);
      return next;
    });
    const merged = await mergeAndPushCloudList('submissions', newSub, submissions);
    if (Array.isArray(merged)) setSubmissions(merged);
  };
  const handleDeleteSubmission = (subId) => {
    setSubmissions((prev) => {
      const next = prev.filter(s => s.id !== subId);
      pushCloudState('submissions', next);
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
  const handleDeleteAspirasi = (aspId) => {
    setAspirasiList((prev) => {
      const next = prev.filter(a => a.id !== aspId);
      pushCloudState('aspirasiList', next);
      return next;
    });
  };

  // Reset all collections back to initial defaults
  const handleResetDefault = async () => {
    setTenures(INITIAL_TENURES);
    setActiveTenure(INITIAL_TENURES[0]);
    setDivisions(INITIAL_DIVISIONS);
    setMembers(INITIAL_MEMBERS);
    setEvents(INITIAL_EVENTS);
    setGalleries(INITIAL_GALLERIES);
    setKudosList(INITIAL_KUDOS);
    setForms(INITIAL_FORMS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setAspirasiList([]);
    setPageVisibilityState(DEFAULT_PAGE_VISIBILITY);
    try { localStorage.setItem('cnt_page_visibility', JSON.stringify(DEFAULT_PAGE_VISIBILITY)); } catch (e) {}

    await Promise.all([
      pushCloudState('tenures', INITIAL_TENURES),
      pushCloudState('activeTenureId', INITIAL_TENURES[0].id),
      pushCloudState('divisions', INITIAL_DIVISIONS),
      pushCloudState('members', INITIAL_MEMBERS),
      pushCloudState('events', INITIAL_EVENTS),
      pushCloudState('galleries', INITIAL_GALLERIES),
      pushCloudState('kudosList', INITIAL_KUDOS),
      pushCloudState('forms', INITIAL_FORMS),
      pushCloudState('submissions', INITIAL_SUBMISSIONS),
      pushCloudState('aspirasiList', []),
      pushCloudState('pageVisibility', DEFAULT_PAGE_VISIBILITY)
    ]);
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
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
        />
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
          padding: '6px 10px',
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
              width: '30px',
              height: '30px',
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
          <button
            type="button"
            onClick={() => setCurrentTab('admin')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Lock size={12} />
            <span>Portal Admin</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, paddingTop: '32px', position: 'relative', zIndex: 10 }}>
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
                Saat ini seluruh halaman publik portal <strong>Culture Network Team (CNT) IT APD</strong> sedang dinonaktifkan sementara oleh pengurus. Jika Anda adalah pengurus/admin, silakan masuk ke Portal Pengurus untuk mengaktifkan kembali visibilitas halaman.
              </p>

              <button
                type="button"
                onClick={() => setCurrentTab('admin')}
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(255, 184, 0, 0.35)'
                }}
              >
                <Lock size={16} />
                <span>Buka Portal Pengurus (Admin)</span>
              </button>
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
            theme={theme}
            pageVisibility={pageVisibility}
          />
        )}

        {effectiveTab === 'organisasi' && (
          <OrganizationSection
            activeTenure={activeTenure}
            divisions={divisions}
            members={members}
            theme={theme}
          />
        )}

        {effectiveTab === 'program' && (
          <ProgramSection
            events={events}
            divisions={divisions}
            theme={theme}
            onNavigateOprec={pageVisibility.oprec !== false ? () => setCurrentTab('oprec') : undefined}
          />
        )}

        {effectiveTab === 'galeri' && (
          <GallerySection
            galleries={galleries}
            divisions={divisions}
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
          <AssetKitSection theme={theme} />
        )}

        {effectiveTab === 'oprec' && (
          <DynamicFormSection
            forms={forms}
            divisions={divisions}
            events={events}
            onSubmitSubmission={handleSubmitSubmission}
            theme={theme}
          />
        )}

        {effectiveTab === 'admin' && (
          <AdminPortal
            onBack={() => setCurrentTab(visiblePublicPages[0] || 'home')}
            tenures={tenures}
            activeTenure={activeTenure}
            onAddTenure={handleAddTenure}
            onUpdateTenure={handleUpdateTenure}
            onDeleteTenure={handleDeleteTenure}
            divisions={divisions}
            onAddDivision={handleAddDivision}
            onUpdateDivision={handleUpdateDivision}
            onDeleteDivision={handleDeleteDivision}
            forms={forms}
            onAddForm={handleAddForm}
            onUpdateForm={handleUpdateForm}
            onDeleteForm={handleDeleteForm}
            submissions={submissions}
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
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            kudosList={kudosList}
            onUpdateKudos={handleUpdateKudos}
            onDeleteKudos={handleDeleteKudos}
            aspirasiList={aspirasiList}
            onDeleteAspirasi={handleDeleteAspirasi}
            pageVisibility={pageVisibility}
            onUpdatePageVisibility={setPageVisibility}
            syncStatus={syncStatus}
            onForceSync={syncFromCloud}
            onResetDefault={handleResetDefault}
          />
        )}
      </main>

      {/* Clean Footer */}
      <Footer onNavigateAdmin={() => setCurrentTab('admin')} theme={theme} />
    </div>
  );
}
