import React from 'react';
import { 
  Download, 
  FileCode, 
  Image, 
  Sparkles,
  Archive,
  CheckCircle2,
  FileArchive
} from 'lucide-react';

export default function AssetKitSection({ theme }) {
  const isDark = theme === 'dark';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Official Brand Guidelines
        </span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '16px' }}>
          Asset Logo CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          Paket logo resmi Culture Network Team Group IT Application Delivery untuk materi presentasi, banner kegiatan squad, dan dokumen resmi.
        </p>
      </div>

      {/* Main Single Download Card */}
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          border: '1px solid var(--border-card-hover)',
          textAlign: 'center'
        }}>
          {/* Logo Showcase Preview - Centered with proper padding and background contrast */}
          <div style={{
            width: '100%',
            height: '180px',
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
            border: '1px solid var(--border-card)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px',
            margin: '0 auto'
          }}>
            <img 
              src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"} 
              alt="Logo CNT IT APD"
              style={{
                maxHeight: '80px',
                maxWidth: '280px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block'
              }}
              onError={(e) => {
                e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-cyan">Master Package</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>515 KB • ZIP Archive</span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              CNTITAPD.zip
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
              Paket komplit seluruh varian logo CNT IT APD (Horizontal, Vertical, Logomark, Transparent PNG, dan Vektor SVG).
            </p>
          </div>

          {/* Included Files Checklist */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--neon-emerald)" />
              <span>APD Master Brand (PNG/SVG)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--neon-emerald)" />
              <span>Transparent PNG Version</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--neon-emerald)" />
              <span>Monokrom & Inverse Logo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--neon-emerald)" />
              <span>Logomark / Favicon Icon</span>
            </div>
          </div>

          {/* Download Action */}
          <a
            href="/assets/CNTITAPD.zip"
            download="CNTITAPD.zip"
            className="pulse-glow"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              padding: '14px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.98rem',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            <Download size={18} />
            <span>Download CNTITAPD.zip</span>
          </a>
        </div>
      </div>

    </div>
  );
}
