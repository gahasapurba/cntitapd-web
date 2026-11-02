import React from 'react';
import { Heart, Sparkles, Shield, Mail } from 'lucide-react';

export default function Footer({ onOpenAdminModal }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-glass)',
      background: 'rgba(10, 17, 40, 0.95)',
      padding: '48px 0 32px 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          {/* Left Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/assets/apd-logo-white.png" 
              alt="CNT IT APD Logo"
              style={{ height: '36px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                Culture Network Team (CNT) IT APD
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Group IT Application Delivery • Direktorat IT Bank Mandiri
              </div>
            </div>
          </div>

          {/* Partner Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.85 }}>
            <img 
              src="/assets/mandiri-logo.png" 
              alt="Bank Mandiri" 
              style={{ height: '22px', objectFit: 'contain' }}
            />
            <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <img 
              src="/assets/danantara-logo.png" 
              alt="Danantara Indonesia" 
              style={{ height: '20px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            © {new Date().getFullYear()} Culture Network Team Group IT APD. Berlandaskan Nilai Budaya <strong>AKHLAK</strong> BUMN.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Didesain dengan <Heart size={13} color="#f43f5e" fill="#f43f5e" /> untuk Insan APD
            </span>
            <button
              onClick={onOpenAdminModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                textDecoration: 'underline'
              }}
            >
              Portal Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
