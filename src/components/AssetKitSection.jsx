import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export default function AssetKitSection({ theme }) {
  const isDark = theme === 'dark';

  // State for Logo Morph Evolution Animation
  // 0: Initial Ribbon Logo, 1: Morphing phase, 2: New APD Modern Logo
  const [logoPhase, setLogoPhase] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setLogoPhase(prev => (prev === 0 ? 1 : 0));
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Official Brand Guidelines & Evolusi
        </span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '16px' }}>
          Asset Logo CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          Paket logo resmi Culture Network Team Group IT Application Delivery untuk materi presentasi, banner kegiatan squad, dan dokumen resmi.
        </p>
      </div>

      {/* INTERACTIVE LOGO EVOLUTION ANIMATION SHOWCASE */}
      <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '30px',
          border: '1.5px solid var(--border-card)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--mandiri-gold)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Evolusi Identitas Brand CNT IT APD
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setLogoPhase(0)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: logoPhase === 0 ? '1px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                  background: logoPhase === 0 ? 'rgba(255,184,0,0.15)' : 'transparent',
                  color: logoPhase === 0 ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                1. Logo Ribbon (Legacy)
              </button>
              <button
                onClick={() => setLogoPhase(1)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: logoPhase === 1 ? '1px solid var(--neon-cyan)' : '1px solid var(--border-card)',
                  background: logoPhase === 1 ? 'rgba(14,165,233,0.15)' : 'transparent',
                  color: logoPhase === 1 ? '#0284c7' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                2. Modern APD (Current)
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Jeda animasi" : "Putar animasi otomatis"}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-card)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isPlaying ? <RotateCcw size={12} /> : <Play size={12} />}
                <span>{isPlaying ? 'Auto Loop' : 'Manual'}</span>
              </button>
            </div>
          </div>

          {/* Morphing Arena */}
          <div style={{
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
            border: '1px solid var(--border-card)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glow */}
            <div style={{
              position: 'absolute',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: logoPhase === 0 ? 'rgba(255, 184, 0, 0.15)' : 'rgba(14, 165, 233, 0.15)',
              filter: 'blur(45px)',
              transition: 'all 0.8s ease'
            }} />

            {/* Legacy Ribbon Logo View */}
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              opacity: logoPhase === 0 ? 1 : 0,
              transform: logoPhase === 0 ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(-14px)',
              transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: logoPhase === 0 ? 'auto' : 'none'
            }}>
              <img
                src="/images/cnt-logo.png"
                alt="Logo CNT Ribbon Legacy"
                style={{
                  maxHeight: '120px',
                  objectFit: 'contain'
                }}
              />
              <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                Logo Pita Infinity (Legacy Version)
              </span>
            </div>

            {/* Current Modern APD Delivery Logo View */}
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              opacity: logoPhase === 1 ? 1 : 0,
              transform: logoPhase === 1 ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(14px)',
              transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: logoPhase === 1 ? 'auto' : 'none'
            }}>
              <img
                src={isDark ? "/assets/apd-logo-white.png" : "/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png"}
                alt="Logo Modern CNT IT APD"
                style={{
                  maxHeight: '90px',
                  maxWidth: '320px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png";
                }}
              />
              <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                Logo IT APD (Since 2026)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {logoPhase === 0 ? (
              <span>Logo sebelumnya mengusung pita infinity melingkar biru-emas.</span>
            ) : (
              <span>Transformasi ke logo horizontal tipografi modern Mandiri IT APD dengan ketegasan visual delivery.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Single Download Card */}
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          border: '1.5px solid var(--border-card)',
          textAlign: 'center'
        }}>
          {/* Logo Showcase Preview */}
          <div style={{
            width: '100%',
            height: '160px',
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
            textAlign: 'left',
            width: '100%'
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
              textDecoration: 'none',
              width: '100%',
              maxWidth: '320px'
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
