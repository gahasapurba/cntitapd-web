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
  RECRUITMENT_INFO,
  INITIAL_GALLERIES
} from './data/initialData';

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
  const [recruitmentInfo, setRecruitmentInfo] = useState(RECRUITMENT_INFO);
  const [applications, setApplications] = useState([]);

  // Dynamic Add Handlers
  const handleAddDivision = (newDiv) => {
    setDivisions((prev) => [...prev, newDiv]);
  };

  const handleAddTenure = (newTenure) => {
    setTenures((prev) => [...prev, newTenure]);
  };

  const handleAddGallery = (newGal) => {
    setGalleries((prev) => [newGal, ...prev]);
  };

  const handleUpdateRecruitment = (updatedInfo) => {
    setRecruitmentInfo(updatedInfo);
  };

  const handleAddKudos = (newKudos) => {
    setKudosList((prev) => [newKudos, ...prev]);
  };

  const handleSubmitApplication = (newApp) => {
    setApplications((prev) => [newApp, ...prev]);
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
            recruitmentInfo={recruitmentInfo}
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
          <RecruitmentSection
            recruitmentInfo={recruitmentInfo}
            divisions={divisions}
            onSubmitApplication={handleSubmitApplication}
            theme={theme}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortal
            onBack={() => setCurrentTab('home')}
            tenures={tenures}
            onAddTenure={handleAddTenure}
            divisions={divisions}
            onAddDivision={handleAddDivision}
            recruitmentInfo={recruitmentInfo}
            onUpdateRecruitment={handleUpdateRecruitment}
            applications={applications}
            galleries={galleries}
            onAddGallery={handleAddGallery}
          />
        )}
      </main>

      {/* Clean Footer */}
      <Footer onNavigateAdmin={() => setCurrentTab('admin')} theme={theme} />
    </div>
  );
}
