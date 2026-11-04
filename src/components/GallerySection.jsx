import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  FolderDown,
  ExternalLink,
  Search,
  Filter,
  Download,
  X
} from 'lucide-react';

export default function GallerySection({ galleries = [], divisions = [], activeTenure = null }) {
  const [selectedGalleryId, setSelectedGalleryId] = useState(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [divFilter, setDivFilter] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const uniqueDivisions = Array.from(
    new Set([
      ...divisions.map(d => d.name),
      ...galleries.map(g => g.division).filter(Boolean)
    ])
  );

  const hasTenureGalleries = activeTenure?.id
    ? galleries.some(g => !g.tenureId || g.tenureId === activeTenure?.id)
    : false;

  const scopedGalleries = (tenureFilter === 'active' && activeTenure?.id && hasTenureGalleries)
    ? galleries.filter(g => !g.tenureId || g.tenureId === activeTenure?.id)
    : galleries;

  const filteredGalleries = scopedGalleries.filter(g => {
    const matchesDiv = divFilter === 'all' || g.division === divFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (g.title || '').toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      (g.date || '').toLowerCase().includes(q);
    return matchesDiv && matchesSearch;
  });

  const activeEvent =
    filteredGalleries.find(g => g.id === selectedGalleryId) ||
    filteredGalleries[0] ||
    galleries[0] || {
      title: 'Belum Ada Dokumentasi Kegiatan',
      date: '-',
      description: 'Dokumentasi kegiatan dapat ditambahkan oleh admin melalui portal pengurus.',
      photos: ['/images/pimpro-adjie.jpg']
    };

  const nextPhoto = () => {
    if (!activeEvent.photos || activeEvent.photos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % activeEvent.photos.length);
  };

  const prevPhoto = () => {
    if (!activeEvent.photos || activeEvent.photos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev - 1 + activeEvent.photos.length) % activeEvent.photos.length);
  };

  useEffect(() => {
    setCurrentPhotoIdx(0);
  }, [activeEvent?.id, divFilter, tenureFilter, searchQuery]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, activeEvent]);

  const safePhotoIdx = activeEvent.photos && currentPhotoIdx < activeEvent.photos.length ? currentPhotoIdx : 0;
  const currentPhotoUrl = activeEvent.photos[safePhotoIdx] || activeEvent.photos[0];

  const getDownloadPhotoUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('supabase.co/storage/v1/')) {
      return url.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/v1\//, '/storage-proxy/');
    }
    return url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto' }}>
        <span className="badge-cyan" style={{ marginBottom: '12px' }}>
          Creative Media & Documentation
        </span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '12px' }}>
          Galeri Kegiatan CNT IT APD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Merekam momen kebersamaan, semangat kolaborasi, dan keceriaan seluruh insan Group IT Application Delivery di setiap program budaya.
        </p>
      </div>

      {/* Main Interactive Carousel Showcase */}
      <div className="glass-panel" style={{
        padding: '24px',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Photo Display Window */}
        <div className="gallery-window">
          <img 
            src={currentPhotoUrl} 
            alt={activeEvent.title}
            onClick={() => setIsLightboxOpen(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease',
              cursor: 'zoom-in'
            }}
          />

          {/* Top-Right Fullscreen & Download Action Pill */}
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 5
          }}>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              title="Perbesar Layar Penuh (Lightbox)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0,0,0,0.68)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Maximize2 size={13} />
              <span>Layar Penuh</span>
            </button>

            <a
              href={getDownloadPhotoUrl(currentPhotoUrl)}
              download={`${(activeEvent.title || 'dokumentasi').replace(/\s+/g, '_')}_${currentPhotoIdx + 1}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              title="Unduh Foto Resolusi Penuh"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0,0,0,0.68)',
                color: 'var(--mandiri-gold)',
                border: '1px solid rgba(255,184,0,0.45)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Download size={13} />
              <span>Unduh</span>
            </a>
          </div>

          {/* Navigation Arrows */}
          {activeEvent.photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Photo Counter Pill */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.72)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.25)',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'monospace',
            fontWeight: 700,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            {safePhotoIdx + 1} / {activeEvent.photos.length} Foto
          </div>
        </div>

        {/* Event Detail Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
              <Calendar size={13} /> {activeEvent.date}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Divisi: {activeEvent.division || 'CNT IT APD'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeEvent.title}
          </h2>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {activeEvent.description}
          </p>

          {/* Full Documentation Links (Link Text, not raw URL) */}
          {activeEvent.docLinks && activeEvent.docLinks.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '8px',
              marginTop: '4px'
            }}>
              {activeEvent.docLinks.map((doc, dIdx) => (
                <a
                  key={dIdx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 61, 121, 0.08)',
                    border: '1px solid var(--mandiri-blue)',
                    color: 'var(--mandiri-blue)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FolderDown size={15} />
                  <span>{doc.text}</span>
                  <ExternalLink size={13} style={{ opacity: 0.7 }} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {activeEvent.photos.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-card)'
          }}>
            {activeEvent.photos.map((photo, pIdx) => (
              <img 
                key={pIdx}
                src={photo}
                alt=""
                onClick={() => setCurrentPhotoIdx(pIdx)}
                style={{
                  width: '76px',
                  height: '52px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: currentPhotoIdx === pIdx ? '2px solid var(--mandiri-gold)' : '2px solid transparent',
                  opacity: currentPhotoIdx === pIdx ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event List Tabs (Choose which event documentation to view) */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Daftar Arsip Dokumentasi Kegiatan ({filteredGalleries.length}):
          </h3>

          {/* Search, Tenure & Division Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {activeTenure && (
              <div style={{
                display: 'inline-flex',
                background: 'var(--input-bg)',
                padding: '3px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-card)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setTenureFilter('active');
                    setCurrentPhotoIdx(0);
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: 'none',
                    background: tenureFilter === 'active' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                    color: tenureFilter === 'active' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Periode {activeTenure?.code || activeTenure?.title || ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenureFilter('all');
                    setCurrentPhotoIdx(0);
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: 'none',
                    background: tenureFilter === 'all' ? 'rgba(255, 184, 0, 0.2)' : 'transparent',
                    color: tenureFilter === 'all' ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Semua ({galleries.length})
                </button>
              </div>
            )}

            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0, width: '100%' }}>
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari judul atau deskripsi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPhotoIdx(0);
                }}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--text-dim)" />
              <select
                value={divFilter}
                onChange={(e) => {
                  setDivFilter(e.target.value);
                  setCurrentPhotoIdx(0);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Semua Divisi</option>
                {uniqueDivisions.map((dName) => (
                  <option key={dName} value={dName}>{dName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredGalleries.length === 0 ? (
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tidak ada dokumentasi kegiatan yang cocok dengan filter pencarian.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredGalleries.map((item, gIdx) => {
              const isSelected = activeEvent.id === item.id;
              return (
                <div 
                  key={item.id || gIdx}
                  onClick={() => {
                    setSelectedGalleryId(item.id);
                    setCurrentPhotoIdx(0);
                  }}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '4px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                      {item.date}
                    </span>
                    {item.division && (
                      <span className="badge-cyan" style={{ fontSize: '0.64rem', padding: '2px 8px' }}>
                        {item.division}
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                    📷 {item.photos?.length || 0} Dokumentasi Foto
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR HD PHOTO VIEWING & DOWNLOAD */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(2, 6, 20, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Top Lightbox Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '18px',
              left: '20px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              zIndex: 10
            }}
          >
            <div style={{ color: '#ffffff' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                {activeEvent.title}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)' }}>
                Foto {currentPhotoIdx + 1} dari {activeEvent.photos.length} • {activeEvent.date}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href={getDownloadPhotoUrl(currentPhotoUrl)}
                download={`${(activeEvent.title || 'dokumentasi').replace(/\s+/g, '_')}_${currentPhotoIdx + 1}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <Download size={14} />
                <span>Download Foto HD</span>
              </a>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Lightbox Image & Prev/Next Arrows */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '94vw',
              maxHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {activeEvent.photos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                style={{
                  position: 'fixed',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={currentPhotoUrl}
              alt={activeEvent.title}
              style={{
                maxWidth: '90vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.75)'
              }}
            />

            {activeEvent.photos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                style={{
                  position: 'fixed',
                  right: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
