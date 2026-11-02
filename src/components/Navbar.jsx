import React from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  UserPlus, 
  MessageSquareHeart, 
  Download,
  Image as ImageIcon,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  tenures, 
  activeTenure, 
  onSelectTenure,
  theme,
  onToggleTheme
}) {
  const isDark = theme === 'dark';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      transition: 'background 0.3s ease, border-color 0.3s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        gap: '12px'
      }}>
        {/* 1. Left: Brand Logo & Title */}
        <div 
          onClick={() => setCurrentTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <img 
            src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"} 
            alt="CNT IT APD Logo"
            style={{ height: '34px', maxWidth: '120px', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
            }}
          />
          <div style={{ height: '22px', width: '1px', background: 'var(--border-card)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800, 
              fontSize: '0.96rem',
              color: 'var(--text-main)',
              lineHeight: 1.15
            }}>
              CNT IT APD
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Direktorat IT Bank Mandiri
            </span>
          </div>
        </div>

        {/* 2. Middle: Navigation Menu Tabs (with Galeri & Compact Spacing) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'home', label: 'Beranda', icon: Building2 },
            { id: 'organisasi', label: 'Organisasi', icon: Users },
            { id: 'program', label: 'Program', icon: Calendar },
            { id: 'galeri', label: 'Galeri', icon: ImageIcon },
            { id: 'kudos', label: 'Kudos', icon: MessageSquareHeart },
            { id: 'assets', label: 'Asset Logo', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 11px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? (isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(0, 61, 121, 0.08)') : 'transparent',
                  color: isActive ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-muted)',
                  border: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Highlighted Oprec Button */}
          <button
            onClick={() => setCurrentTab('oprec')}
            className={currentTab === 'oprec' ? '' : 'pulse-glow'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: currentTab === 'oprec' 
                ? 'var(--mandiri-gold)' 
                : (isDark ? 'rgba(255, 184, 0, 0.18)' : '#fef3c7'),
              color: currentTab === 'oprec' ? '#040914' : '#b45309',
              border: '1px solid var(--mandiri-gold)',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: '4px',
              flexShrink: 0
            }}
          >
            <UserPlus size={14} />
            <span>Open Recruitment</span>
            <span style={{
              fontSize: '0.6rem',
              background: '#b45309',
              color: 'var(--text-main)',
              padding: '1px 5px',
              borderRadius: '5px',
              fontWeight: 800
            }}>OPEN</span>
          </button>
        </nav>

        {/* 3. Right: Tenure Selector & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <select
              value={activeTenure?.id || ''}
              onChange={(e) => {
                const selected = tenures.find(t => t.id === e.target.value);
                if (selected) onSelectTenure(selected);
              }}
              style={{
                appearance: 'none',
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                padding: '6px 26px 6px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {tenures.map((t) => (
                <option key={t.id} value={t.id} style={{ background: isDark ? '#070d1e' : '#fff', color: isDark ? '#fff' : '#000' }}>
                  {t.code} {t.isActive ? '●' : ''}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={12} 
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }} 
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-card)',
              color: isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
