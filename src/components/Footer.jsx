import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer({ theme }) {
  const isDark = theme === 'dark';

  return (
    <footer style={{
      borderTop: '1px solid var(--border-card)',
      background: 'var(--bg-nav)',
      padding: '40px 0 28px 0',
      marginTop: 'auto',
      position: 'relative',
      zIndex: 5
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Left Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"} 
              alt="CNT IT APD Logo"
              style={{ height: '36px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Culture Network Team (CNT) IT APD
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Group IT Application Delivery • Direktorat IT Bank Mandiri
              </div>
            </div>
          </div>

          {/* Partner Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.95 }}>
            <img 
              src={isDark ? "/assets/Mandiri/04-Mandiri White Color Alternative Logo.png" : "/assets/mandiri-logo.png"} 
              alt="Bank Mandiri" 
              style={{ height: '22px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/mandiri-logo.png";
              }}
            />
            <div style={{ height: '20px', width: '1px', background: 'var(--border-card)' }} />
            <img 
              src={isDark ? "/assets/Danantara/negative-danantara-indonesia-horizontal-logo.png" : "/assets/danantara-logo.png"} 
              alt="Danantara Indonesia" 
              style={{ height: '22px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/danantara-logo.png";
              }}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-card)',
          paddingTop: '18px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            © 2027 Culture Network Team Group IT APD. Satu Hati, Satu Mandiri.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Didesain dengan <Heart size={13} color="#f43f5e" fill="#f43f5e" /> untuk Insan IT APD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
