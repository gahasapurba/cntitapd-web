import React from 'react';
import { getDeadlineStatus } from '../utils/dateUtils';
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
  ChevronDown,
  Menu,
  X,
  Search
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  tenures, 
  activeTenure, 
  onSelectTenure,
  theme,
  onToggleTheme,
  forms = [],
  pageVisibility = {},
  onOpenQuickSearch
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isDark = theme === 'dark';
  const activeFormsCount = forms.filter(f => f.isOpen !== false && !getDeadlineStatus(f.deadline).isExpired).length;

  const allNavItems = [
    { id: 'home', label: 'Beranda', icon: Building2 },
    { id: 'organisasi', label: 'Organisasi', icon: Users },
    { id: 'program', label: 'Events', icon: Calendar },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'kudos', label: 'Kudos & Aspirasi', icon: MessageSquareHeart },
    { id: 'assets', label: 'Asset', icon: Download },
  ];

  const navItems = allNavItems.filter(tab => pageVisibility[tab.id] !== false);
  const isOprecVisible = pageVisibility.oprec !== false;

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (pageVisibility.home !== false) {
      setCurrentTab('home');
    } else if (navItems.length > 0) {
      setCurrentTab(navItems[0].id);
    } else if (isOprecVisible) {
      setCurrentTab('oprec');
    }
    setIsMobileMenuOpen(false);
  };

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
      transition: 'background 0.3s ease, border-color 0.3s ease',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        gap: '8px',
        width: '100%',
        maxWidth: '1260px',
        boxSizing: 'border-box'
      }}>
        {/* 1. Left: Brand Logo & Title */}
        <div 
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            flexShrink: 0,
            minWidth: 0,
            marginRight: '18px'
          }}
        >
          <img 
            className="navbar-brand-logo"
            src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"} 
            alt="CNT IT APD Logo"
            onError={(e) => {
              e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
            }}
          />
          <div className="desktop-nav" style={{ height: '22px', width: '1px', background: 'var(--border-card)', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="navbar-brand-title">
              CNT IT APD
            </span>
            <span className="desktop-nav" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Direktorat IT Bank Mandiri
            </span>
          </div>
        </div>

        {/* 2. Middle: Navigation Menu Tabs (Desktop only) */}
        <nav className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          padding: '2px 4px'
        }}>
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 9px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.09)') : 'transparent',
                  color: isActive ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-muted)',
                  border: 'none',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.81rem',
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

          {/* Highlighted Dynamic Registration / Forms Button */}
          {isOprecVisible && (
            <button
              onClick={() => handleSelectTab('oprec')}
              className={currentTab === 'oprec' ? '' : (activeFormsCount > 0 ? 'pulse-glow' : '')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: currentTab === 'oprec' 
                  ? 'var(--mandiri-gold)' 
                  : (activeFormsCount > 0 
                      ? (isDark ? 'rgba(255, 184, 0, 0.18)' : '#fef3c7')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9')),
                color: currentTab === 'oprec' 
                  ? '#040914' 
                  : (activeFormsCount > 0 ? '#b45309' : 'var(--text-muted)'),
                border: `1px solid ${activeFormsCount > 0 ? 'var(--mandiri-gold)' : 'var(--border-card)'}`,
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                margin: '0 4px 0 16px',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={13} />
              <span>Registrasi & Form</span>
              {activeFormsCount > 0 ? (
                <span style={{
                  fontSize: '0.58rem',
                  background: '#b45309',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  {activeFormsCount} AKTIF
                </span>
              ) : (
                <span style={{
                  fontSize: '0.58rem',
                  background: 'var(--border-card)',
                  color: 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  CLOSED
                </span>
              )}
            </button>
          )}
        </nav>

        {/* 3. Right: Tenure Selector, Theme Toggle & Mobile Burger Button */}
        <div className="navbar-right-actions">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={activeTenure?.id || ''}
              onChange={(e) => {
                const selected = tenures.find(t => t.id === e.target.value);
                if (selected) onSelectTenure(selected);
              }}
              className="navbar-tenure-select"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
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
                right: '7px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }} 
            />
          </div>

          {/* Quick Search Button (Ctrl+K / Mobile Tap) */}
          {onOpenQuickSearch && (
            <button
              type="button"
              onClick={onOpenQuickSearch}
              title="Pencarian Cepat Lintas Halaman (Ctrl+K)"
              style={{
                height: '34px',
                padding: '0 8px',
                borderRadius: 'var(--radius-full)',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <Search size={14} color={isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)'} />
              <span className="desktop-nav" style={{ fontSize: '0.74rem' }}>Cari</span>
            </button>
          )}

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
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Mobile Burger Toggle (Hidden on desktop) */}
          <button
            className="mobile-burger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Buka Menu"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: isMobileMenuOpen 
                ? (isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 61, 121, 0.12)')
                : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '2px solid var(--mandiri-gold)',
          boxShadow: '0 20px 30px rgba(0, 0, 0, 0.25)',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto'
        }}>
          {/* Active Tenure Selector inside Mobile Drawer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: '1px solid var(--border-card)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Periode Kepengurusan:
            </span>
            <select
              value={activeTenure?.id || ''}
              onChange={(e) => {
                const selected = tenures.find(t => t.id === e.target.value);
                if (selected) onSelectTenure(selected);
              }}
              style={{
                background: isDark ? '#070d1e' : '#ffffff',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tenures.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.code} {t.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? (isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 61, 121, 0.1)') : 'transparent',
                  color: isActive ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-main)',
                  border: isActive ? '1px solid var(--border-card-hover)' : '1px solid transparent',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={18} color={isActive ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-muted)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Dynamic Registration in Mobile Menu */}
          {isOprecVisible && (
            <button
              onClick={() => handleSelectTab('oprec')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '13px 16px',
                borderRadius: 'var(--radius-md)',
                background: currentTab === 'oprec' 
                  ? 'var(--mandiri-gold)' 
                  : (activeFormsCount > 0 
                      ? (isDark ? 'rgba(255, 184, 0, 0.2)' : '#fef3c7')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9')),
                color: currentTab === 'oprec' 
                  ? '#040914' 
                  : (activeFormsCount > 0 ? '#b45309' : 'var(--text-muted)'),
                border: `1.5px solid ${activeFormsCount > 0 ? 'var(--mandiri-gold)' : 'var(--border-card)'}`,
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                marginTop: '4px',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={18} />
                <span>Registrasi & Formulir</span>
              </div>
              {activeFormsCount > 0 ? (
                <span style={{
                  fontSize: '0.68rem',
                  background: '#b45309',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 800
                }}>
                  {activeFormsCount} AKTIF
                </span>
              ) : (
                <span style={{
                  fontSize: '0.68rem',
                  background: 'var(--border-card)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  CLOSED
                </span>
              )}
            </button>
          )}

          {navItems.length === 0 && !isOprecVisible && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Semua menu navigasi halaman sedang disembunyikan oleh Admin.
            </div>
          )}
        </div>
      )}
    </header>
  );
}
