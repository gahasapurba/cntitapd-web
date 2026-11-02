import React, { useState } from 'react';
import StarfieldBackground from './components/StarfieldBackground';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import OrganizationSection from './components/OrganizationSection';
import ProgramSection from './components/ProgramSection';
import KudosSection from './components/KudosSection';
import AssetKitSection from './components/AssetKitSection';
import RecruitmentSection from './components/RecruitmentSection';
import AdminModal from './components/AdminModal';
import Footer from './components/Footer';

import { 
  INITIAL_TENURES, 
  INITIAL_DIVISIONS, 
  INITIAL_MEMBERS, 
  INITIAL_EVENTS, 
  INITIAL_KUDOS, 
  RECRUITMENT_INFO 
} from './data/initialData';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [warpSpeed, setWarpSpeed] = useState(false);

  // Dynamic States
  const [tenures, setTenures] = useState(INITIAL_TENURES);
  const [activeTenure, setActiveTenure] = useState(INITIAL_TENURES[0]);
  const [divisions, setDivisions] = useState(INITIAL_DIVISIONS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [kudosList, setKudosList] = useState(INITIAL_KUDOS);
  const [recruitmentInfo, setRecruitmentInfo] = useState(RECRUITMENT_INFO);
  const [applications, setApplications] = useState([]);

  // Handlers for dynamic admin updates
  const handleAddDivision = (newDiv) => {
    setDivisions((prev) => [...prev, newDiv]);
  };

  const handleAddTenure = (newTenure) => {
    setTenures((prev) => [...prev, newTenure]);
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
      {/* 3D Cosmic Starfield & Nebula Canvas Background */}
      <StarfieldBackground warpSpeed={warpSpeed} />

      {/* Sticky Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        tenures={tenures}
        activeTenure={activeTenure}
        onSelectTenure={setActiveTenure}
        onOpenAdminModal={() => setIsAdminOpen(true)}
      />

      {/* Main Page Content */}
      <main className="container" style={{ flex: 1, paddingTop: '32px', position: 'relative', zIndex: 10 }}>
        {currentTab === 'home' && (
          <HomeSection
            activeTenure={activeTenure}
            divisions={divisions}
            events={events}
            members={members}
            setCurrentTab={setCurrentTab}
            recruitmentInfo={recruitmentInfo}
          />
        )}

        {currentTab === 'organisasi' && (
          <OrganizationSection
            activeTenure={activeTenure}
            divisions={divisions}
            members={members}
          />
        )}

        {currentTab === 'program' && (
          <ProgramSection
            events={events}
            divisions={divisions}
          />
        )}

        {currentTab === 'kudos' && (
          <KudosSection
            kudosList={kudosList}
            onAddKudos={handleAddKudos}
          />
        )}

        {currentTab === 'assets' && (
          <AssetKitSection />
        )}

        {currentTab === 'oprec' && (
          <RecruitmentSection
            recruitmentInfo={recruitmentInfo}
            divisions={divisions}
            onSubmitApplication={handleSubmitApplication}
          />
        )}
      </main>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        tenures={tenures}
        onAddTenure={handleAddTenure}
        divisions={divisions}
        onAddDivision={handleAddDivision}
        recruitmentInfo={recruitmentInfo}
        onUpdateRecruitment={handleUpdateRecruitment}
        applications={applications}
      />

      {/* Footer */}
      <Footer onOpenAdminModal={() => setIsAdminOpen(true)} />
    </div>
  );
}
