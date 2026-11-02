import React from 'react';
import { 
  Download, 
  FileCode, 
  Image, 
  ExternalLink, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function AssetKitSection() {
  const assets = [
    {
      title: 'APD Master Brand Logo Suite',
      category: 'Brand Guidelines',
      desc: 'Paket logo resmi APD (Horizontal, Vertical, Logomark, Negative & Monokrom) dalam format PNG & SVG resolusi tinggi.',
      previewImg: '/assets/CNT_IT_APD_LOGO_SUITE/main-apd-delivery-horizontal-logo.png',
      downloadPath: '/assets/CNT_IT_APD_LOGO_SUITE/04-APD White Color Alternative Logo (Transparent).png',
      type: 'PNG & SVG Suite'
    },
    {
      title: 'Mandiri Master Brand Logo Suite',
      category: 'Corporate Identity',
      desc: 'Logo resmi Bank Mandiri (Master Brand, Inverse, Monokrom Navy & White) sesuai standar korporat.',
      previewImg: '/assets/Mandiri/01-Mandiri Master Brand Logo.png',
      downloadPath: '/assets/Mandiri/01-Mandiri Master Brand Logo.png',
      type: 'PNG Suite'
    },
    {
      title: 'Danantara Indonesia Logo Suite',
      category: 'Strategic Partner',
      desc: 'Logo resmi Daya Anagata Nusantara (Danantara Indonesia) untuk branding sinergi BUMN.',
      previewImg: '/assets/Danantara/main-danantara-indonesia-horizontal-logo.png',
      downloadPath: '/assets/Danantara/main-danantara-indonesia-horizontal-logo.png',
      type: 'PNG Suite'
    },
    {
      title: 'Template Virtual Background MS Teams',
      category: 'Work Essentials',
      desc: 'Paket background resmi meeting online Microsoft Teams dengan tema modern Mandiri & CNT IT APD.',
      previewImg: '/assets/CNT_IT_APD_LOGO_SUITE/05-APD Navy Color Alternative Logo.png',
      downloadPath: '/assets/CNT_IT_APD_LOGO_SUITE/05-APD Navy Color Alternative Logo.png',
      type: '1920x1080 FHD'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <span className="badge-gold" style={{ marginBottom: '12px' }}>
          Media & Creative Resources
        </span>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
          CNT IT APD Asset & Brand Kit
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Koleksi logo resmi, virtual background, dan aset visual siap unduh untuk menunjang materi presentasi, banner event squad, dan dokumen resmi IT APD.
        </p>
      </div>

      {/* Assets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
      }}>
        {assets.map((item, idx) => (
          <div 
            key={idx}
            className="glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Preview Box */}
            <div style={{
              height: '140px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflow: 'hidden'
            }}>
              <img 
                src={item.previewImg} 
                alt={item.title}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>
                {item.category}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                {item.type}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>

            <a
              href={item.downloadPath}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(255, 184, 0, 0.15)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(255, 184, 0, 0.3)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <Download size={16} />
              <span>Download Asset File</span>
            </a>
          </div>
        ))}
      </div>

    </div>
  );
}
