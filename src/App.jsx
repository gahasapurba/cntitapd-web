import React, { useState, useEffect } from 'react';
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

export default function App() {
  // Navigation: 'home' | 'organisasi' | 'program' | 'galeri' | 'kudos' | 'assets' | 'oprec' | 'admin'
  const [currentTab, setCurrentTab] = useState(() => {
    if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'home';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Background Canvas */}
      <StarfieldBackground theme={theme} />

      {/* Responsive Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        tenures={tenures}
        activeTenure={activeTenure}
        onSelectTenure={setActiveTenure}
        theme={theme}
        onToggleTheme={toggleTheme}
        forms={forms}
      />

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, paddingTop: '32px', position: 'relative', zIndex: 10 }}>
        {currentTab === 'home' && (
          <HomeSection
            activeTenure={activeTenure}
            divisions={divisions}
            events={events}
            members={members}
            setCurrentTab={setCurrentTab}
            forms={forms}
            theme={theme}
          />
        )}

        {currentTab === 'organisasi' && (
          <OrganizationSection
            activeTenure={activeTenure}
            divisions={divisions}
            members={members}
            theme={theme}
          />
        )}

        {currentTab === 'program' && (
          <ProgramSection
            events={events}
            divisions={divisions}
            theme={theme}
          />
        )}

        {currentTab === 'galeri' && (
          <GallerySection
            galleries={galleries}
            theme={theme}
          />
        )}

        {currentTab === 'kudos' && (
          <KudosSection
            kudosList={kudosList}
            onAddKudos={handleAddKudos}
            theme={theme}
          />
        )}

        {currentTab === 'assets' && (
          <AssetKitSection theme={theme} />
        )}

        {currentTab === 'oprec' && (
          <DynamicFormSection
            forms={forms}
            divisions={divisions}
            events={events}
            onSubmitSubmission={handleSubmitSubmission}
            theme={theme}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortal
            onBack={() => setCurrentTab('home')}
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
            onDeleteGallery={handleDeleteGallery}
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
          />
        )}
      </main>

      {/* Clean Footer */}
      <Footer onNavigateAdmin={() => setCurrentTab('admin')} theme={theme} />
    </div>
  );
}
