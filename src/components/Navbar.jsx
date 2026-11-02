import React from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  UserPlus, 
  MessageSquareHeart, 
  Download,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  tenures, 
  activeTenure, 
  onSelectTenure,
  onOpenAdminModal
}) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 17, 40, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px',
      }}>
        {/* Logo Section */}
        <div 
          onClick={() => setCurrentTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/assets/apd-logo-white.png" 
            alt="CNT IT APD Logo"
            style={{ height: '38px', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
            }}
          />
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
              color: '#fff'
            }}>
              CNT IT APD
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Direktorat IT Bank Mandiri
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {[
            { id: 'home', label: 'Beranda', icon: Building2 },
            { id: 'organisasi', label: 'Organisasi & Divisi', icon: Users },
            { id: 'program', label: 'Program & Event', icon: Calendar },
            { id: 'kudos', label: 'Kudos & Aspirasi', icon: MessageSquareHeart },
            { id: 'assets', label: 'Asset Kit', icon: Download },
            { id: 'oprec', label: 'Open Recruitment', icon: UserPlus, isHighlighted: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            if (tab.isHighlighted) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className="pulse-glow"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--accent-gold)' : 'rgba(255, 184, 0, 0.15)',
                    color: isActive ? '#0a1128' : 'var(--accent-gold)',
                    border: '1px solid var(--accent-gold)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    marginLeft: '8px'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    background: isActive ? '#0a1128' : 'var(--accent-gold)',
                    color: isActive ? 'var(--accent-gold)' : '#0a1128',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 800
                  }}>OPEN</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  border: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tenure Switcher & Admin trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Dynamic Tenure Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={activeTenure?.id || ''}
              onChange={(e) => {
                const selected = tenures.find(t => t.id === e.target.value);
                if (selected) onSelectTenure(selected);
              }}
              style={{
                appearance: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '6px 30px 6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {tenures.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#0f1c3f', color: '#fff' }}>
                  Periode {t.code} {t.isActive ? '● (Aktif)' : '(Arsip)'}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={14} 
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }} 
            />
          </div>

          {/* Admin Management Button */}
          <button
            onClick={onOpenAdminModal}
            title="Kelola Data Organisasi Dinamis (Admin)"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-muted)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-gold)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
