import React from 'react';
import { Building2, Calendar, CalendarDays, ClipboardList, Download, Eye, FileCheck2, Heart, Image as ImageIcon, Layers, MessageSquare, Shield, Users } from 'lucide-react';
import { DIVISION_ADMIN_TABS } from './adminShared';
import { useAdminPortal } from './AdminPortalContext';

export default function AdminTabNavigation() {
  const {
    activeTab,
    applications,
    aspirasiList,
    brandAssets,
    departments,
    divisions,
    events,
    faqs,
    forms,
    galleries,
    isSuperAdmin,
    kudosList,
    members,
    setActiveTab,
    submissions,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
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
          { id: 'admins', label: 'Kelola Admin', icon: Shield },
        ].filter(tab => (isSuperAdmin ? true : DIVISION_ADMIN_TABS.includes(tab.id))).map((tab) => {
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
    </>
  );
}
