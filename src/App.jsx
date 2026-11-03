import React, { useState, useEffect } from 'react';
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
  const [pageVisibility, setPageVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('cnt_page_visibility');
      if (saved) {
        return { ...DEFAULT_PAGE_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_PAGE_VISIBILITY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cnt_page_visibility', JSON.stringify(pageVisibility));
    } catch (e) {}
  }, [pageVisibility]);

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

  // Master Dynamic States
  const [tenures, setTenures] = useState(INITIAL_TENURES);
  const [activeTenure, setActiveTenure] = useState(INITIAL_TENURES[0]);
  const [divisions, setDivisions] = useState(INITIAL_DIVISIONS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [galleries, setGalleries] = useState(INITIAL_GALLERIES);
  const [kudosList, setKudosList] = useState(INITIAL_KUDOS);
  const [forms, setForms] = useState(INITIAL_FORMS);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);

  // Dynamic Add, Edit & Delete Handlers
  const handleAddDivision = (newDiv) => {
    setDivisions((prev) => [...prev, newDiv]);
  };
  const handleUpdateDivision = (updatedDiv) => {
    setDivisions((prev) => prev.map(d => d.id === updatedDiv.id ? updatedDiv : d));
  };
  const handleDeleteDivision = (divId) => {
    setDivisions((prev) => prev.filter(d => d.id !== divId));
    setEvents((prev) => prev.filter(e => e.divisionId !== divId));
  };

  const handleAddTenure = (newTenure) => {
    setTenures((prev) => [...prev, newTenure]);
  };
  const handleUpdateTenure = (updatedTenure) => {
    setTenures((prev) => prev.map(t => t.id === updatedTenure.id ? updatedTenure : t));
    if (activeTenure.id === updatedTenure.id) setActiveTenure(updatedTenure);
  };
  const handleDeleteTenure = (tenureId) => {
    setTenures((prev) => prev.filter(t => t.id !== tenureId));
    if (activeTenure.id === tenureId && tenures.length > 1) {
      setActiveTenure(tenures.find(t => t.id !== tenureId));
    }
  };

  const handleAddGallery = (newGal) => {
    setGalleries((prev) => [newGal, ...prev]);
  };
  const handleUpdateGallery = (updatedGal) => {
    setGalleries((prev) => prev.map(g => g.id === updatedGal.id ? updatedGal : g));
  };
  const handleDeleteGallery = (galId) => {
    setGalleries((prev) => prev.filter(g => g.id !== galId));
  };

  const handleAddMember = (newMem) => {
    setMembers((prev) => [...prev, newMem]);
  };
  const handleUpdateMember = (updatedMem) => {
    setMembers((prev) => prev.map(m => m.id === updatedMem.id ? updatedMem : m));
  };
  const handleDeleteMember = (memId) => {
    setMembers((prev) => prev.filter(m => m.id !== memId));
  };

  const handleAddEvent = (newEvt) => {
    setEvents((prev) => [...prev, newEvt]);
  };
  const handleUpdateEvent = (updatedEvt) => {
    setEvents((prev) => prev.map(e => e.id === updatedEvt.id ? updatedEvt : e));
  };
  const handleDeleteEvent = (evtId) => {
    setEvents((prev) => prev.filter(e => e.id !== evtId));
  };

  // Dynamic Forms Lifecycle Handlers
  const handleAddForm = (newForm) => {
    setForms((prev) => [newForm, ...prev]);
  };
  const handleUpdateForm = (updatedForm) => {
    setForms((prev) => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
  };
  const handleDeleteForm = (formId, deleteSubmissions = false) => {
    setForms((prev) => prev.filter(f => f.id !== formId));
    if (deleteSubmissions) {
      setSubmissions((prev) => prev.filter(s => s.formId !== formId));
    }
  };

  // Submissions Lifecycle Handlers
  const handleSubmitSubmission = (newSub) => {
    setSubmissions((prev) => [newSub, ...prev]);
  };
  const handleDeleteSubmission = (subId) => {
    setSubmissions((prev) => prev.filter(s => s.id !== subId));
  };

  const handleAddKudos = (newKudos) => {
    setKudosList((prev) => [newKudos, ...prev]);
  };
  const handleUpdateKudos = (updatedKudos) => {
    setKudosList((prev) => prev.map(k => k.id === updatedKudos.id ? updatedKudos : k));
  };
  const handleDeleteKudos = (kudosId) => {
    setKudosList((prev) => prev.filter(k => k.id !== kudosId));
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
          onSelectTenure={setActiveTenure}
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
          />
        )}

        {effectiveTab === 'galeri' && (
          <GallerySection
            galleries={galleries}
            theme={theme}
          />
        )}

        {effectiveTab === 'kudos' && (
          <KudosSection
            kudosList={kudosList}
            onAddKudos={handleAddKudos}
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
            pageVisibility={pageVisibility}
            onUpdatePageVisibility={setPageVisibility}
          />
        )}
      </main>

      {/* Clean Footer */}
      <Footer onNavigateAdmin={() => setCurrentTab('admin')} theme={theme} />
    </div>
  );
}
