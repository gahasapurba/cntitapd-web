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
  Camera,
  X,
  Share2,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { formatWibDateTime } from '../utils/dateUtils';
import { getPublicBaseUrl } from '../utils/urlUtils';

export default function GallerySection({ 
  galleries = [], 
  divisions = [], 
  events = [],
  activeTenure = null, 
  theme, 
  tenures = [],
  initialGalleryId = null,
  onSelectGalleryUrl,
  onNavigateEvent
}) {
  const isDark = theme === 'dark';
  const [selectedGalleryId, setSelectedGalleryId] = useState(null);
  const [copiedGalleryId, setCopiedGalleryId] = useState(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [divFilter, setDivFilter] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);

  const scopedGalleries = (tenureFilter === 'active' && activeTenure?.id)
    ? galleries.filter(g => g.tenureId === activeTenure.id)
    : galleries;

  const scopedDivisions = (tenureFilter === 'active' && activeTenure?.id)
    ? divisions.filter(d => d.tenureId === activeTenure.id)
    : divisions;

  const uniqueDivisions = Array.from(
    new Set([
      ...scopedDivisions.map(d => d.name),
      ...scopedGalleries.map(g => g.divisionName || g.division).filter(Boolean)
    ])
  );

  useEffect(() => {
    if (divFilter === 'all') return;
    const isValid = scopedDivisions.some(d => d.id === divFilter) ||
      divisions.some(d => d.id === divFilter) ||
      uniqueDivisions.includes(divFilter);
    if (!isValid) {
      setDivFilter('all');
    }
  }, [tenureFilter, activeTenure?.id, divisions]);

  const selectedDivObj = divisions.find(d => d.id === divFilter);
  const selectedDivName = selectedDivObj ? selectedDivObj.name : divFilter;

  const filteredGalleries = scopedGalleries.filter(g => {
    const matchesDiv = divFilter === 'all' || 
      g.divisionId === divFilter || 
      (selectedDivObj && g.divisionId === selectedDivObj.id) ||
      g.division === selectedDivName || 
      g.divisionName === selectedDivName;
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
    null;

  const eventPhotos = Array.isArray(activeEvent?.photos) ? activeEvent.photos : [];

  const nextPhoto = () => {
    if (eventPhotos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % eventPhotos.length);
  };

  const prevPhoto = () => {
    if (eventPhotos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev - 1 + eventPhotos.length) % eventPhotos.length);
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
  }, [isLightboxOpen, activeEvent, eventPhotos.length]);

  const safePhotoIdx = eventPhotos.length > 0 && currentPhotoIdx < eventPhotos.length ? currentPhotoIdx : 0;
  const currentPhotoUrl = eventPhotos[safePhotoIdx] || eventPhotos[0] || '/assets/CNT_IT_APD_LOGO_SUITE/01-APD Master Brand Logo.png';

  const getDownloadPhotoUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('supabase.co/storage/v1/')) {
      return url.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/v1\//, '/storage-proxy/');
    }
    return url;
  };

  useEffect(() => {
    if (initialGalleryId && galleries.some(g => g.id === initialGalleryId)) {
      setSelectedGalleryId(initialGalleryId);
      setDivFilter('all');
      setSearchQuery('');
      const targetGal = galleries.find(g => g.id === initialGalleryId);
      if (targetGal && activeTenure && targetGal.tenureId !== activeTenure.id) {
        setTenureFilter('all');
      }
      const targetIdx = galleries.findIndex(g => g.id === initialGalleryId);
      if (targetIdx !== -1) {
        setGalleryPage(Math.floor(targetIdx / 6) + 1);
      }
    }
  }, [initialGalleryId, galleries, activeTenure]);

  const getGalleryShareUrl = (galId) => {
    const origin = getPublicBaseUrl();
    return `${origin}/?gallery=${encodeURIComponent(galId)}#galeri`;
  };

  const handleCopyGalleryLink = (gal, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!gal) return;
    try {
      navigator.clipboard.writeText(getGalleryShareUrl(gal.id));
      setCopiedGalleryId(gal.id);
      setTimeout(() => setCopiedGalleryId(null), 2500);
    } catch (err) {}
  };

  const handleShareGalleryWa = (gal, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!gal) return;
    const url = getGalleryShareUrl(gal.id);
    const dateText = formatWibDateTime(gal.date) || '';
    const divText = gal.divisionName || gal.division || 'CNT IT APD';
    const descText = gal.description ? (gal.description.length > 150 ? gal.description.slice(0, 147) + '...' : gal.description) : '';

    const text = `📸 *Dokumentasi Kegiatan CNT IT APD*\n*${gal.title}*\n${dateText ? `📅 ${dateText} • ${divText}\n` : ''}${descText ? `\n"${descText}"\n` : ''}\nLihat foto dokumentasi selengkapnya di web:\n${url}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSelectGallery = (gId) => {
    setSelectedGalleryId(gId);
    setCurrentPhotoIdx(0);
    if (onSelectGalleryUrl) {
      onSelectGalleryUrl(gId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '48px', paddingBottom: '80px' }}>
      
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
      {!activeEvent || filteredGalleries.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '48px 24px',
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.12)',
            color: 'var(--neon-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={26} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Belum Ada Dokumentasi Kegiatan
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '480px', margin: 0, lineHeight: 1.6 }}>
            {scopedGalleries.length === 0
              ? `Belum ada arsip dokumentasi atau foto kegiatan yang diunggah untuk periode kepengurusan ini (${activeTenure?.title || activeTenure?.code || 'Tenure Aktif'}).`
              : 'Tidak ada dokumentasi kegiatan yang cocok dengan filter atau kata kunci pencarian Anda.'}
          </p>
          {scopedGalleries.length > 0 && (divFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setDivFilter('all');
                setSearchQuery('');
                setGalleryPage(1);
              }}
              style={{
                marginTop: '6px',
                padding: '7px 18px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid var(--mandiri-blue)',
                color: 'var(--neon-cyan)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Filter Galeri
            </button>
          )}
        </div>
      ) : (
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

            <button
              type="button"
              onClick={(e) => handleCopyGalleryLink(activeEvent, e)}
              title="Salin Link Galeri Kegiatan Ini"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: copiedGalleryId === activeEvent.id ? 'rgba(16, 185, 129, 0.85)' : 'rgba(0,0,0,0.68)',
                color: '#ffffff',
                border: copiedGalleryId === activeEvent.id ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.25)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
            >
              {copiedGalleryId === activeEvent.id ? <CheckCircle2 size={13} /> : <Link2 size={13} />}
              <span>{copiedGalleryId === activeEvent.id ? 'Tersalin!' : 'Salin'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleShareGalleryWa(activeEvent, e)}
              title="Bagikan Dokumentasi Galeri ke WhatsApp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(37, 211, 102, 0.28)',
                color: '#25D366',
                border: '1px solid rgba(37, 211, 102, 0.65)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Navigation Arrows */}
          {eventPhotos.length > 1 && (
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
            {safePhotoIdx + 1} / {eventPhotos.length} Foto
          </div>
        </div>

        {/* Event Detail Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
                <Calendar size={13} /> {formatWibDateTime(activeEvent.date) || '-'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Divisi: {activeEvent.divisionName || activeEvent.division || 'CNT IT APD'}
              </span>
              {activeEvent.eventId && (() => {
                const connectedEvt = (events || []).find(e => String(e.id) === String(activeEvent.eventId));
                if (!connectedEvt) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateEvent) {
                        onNavigateEvent(connectedEvt.id);
                      } else {
                        window.location.href = `/?event=${encodeURIComponent(connectedEvt.id)}#event`;
                      }
                    }}
                    title="Buka detail acara ini di Program Kerja"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: 'var(--neon-cyan)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      maxWidth: '100%'
                    }}
                  >
                    <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📅 Acara: {connectedEvt.title}
                    </span>
                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                  </button>
                );
              })()}
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={(e) => handleCopyGalleryLink(activeEvent, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: copiedGalleryId === activeEvent.id ? 'rgba(16, 185, 129, 0.16)' : 'var(--input-bg)',
                  border: `1px solid ${copiedGalleryId === activeEvent.id ? '#10b981' : 'var(--border-card)'}`,
                  color: copiedGalleryId === activeEvent.id ? '#10b981' : 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedGalleryId === activeEvent.id ? <CheckCircle2 size={13} /> : <Link2 size={13} />}
                <span>{copiedGalleryId === activeEvent.id ? '✓ Link Tersalin!' : 'Salin Link'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleShareGalleryWa(activeEvent, e)}
                title="Bagikan Dokumentasi ke WhatsApp"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(37, 211, 102, 0.14)',
                  border: '1px solid rgba(37, 211, 102, 0.55)',
                  color: '#25D366',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Share2 size={13} />
                <span>Bagikan ke WhatsApp</span>
              </button>
            </div>
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
              gap: '8px',
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
                    background: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 61, 121, 0.08)',
                    border: isDark ? '1.5px solid rgba(56, 189, 248, 0.55)' : '1.5px solid var(--mandiri-blue)',
                    color: isDark ? 'var(--neon-cyan)' : 'var(--mandiri-blue)',
                    padding: '8px 15px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'clamp(0.76rem, 2.4vw, 0.84rem)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    minHeight: '38px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.3)';
                    } else {
                      e.currentTarget.style.background = 'rgba(0, 61, 121, 0.14)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                      e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.15)';
                    } else {
                      e.currentTarget.style.background = 'rgba(0, 61, 121, 0.08)';
                    }
                  }}
                >
                  <FolderDown size={15} style={{ flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.3 }}>{doc.text}</span>
                  <ExternalLink size={13} style={{ opacity: isDark ? 0.95 : 0.7, flexShrink: 0 }} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {eventPhotos.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-card)'
          }}>
            {eventPhotos.map((photo, pIdx) => (
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
      )}

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
                    setGalleryPage(1);
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
                    setGalleryPage(1);
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
                  setGalleryPage(1);
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
                  setGalleryPage(1);
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
                <option value="all">Semua Divisi {scopedDivisions.length > 0 ? `(${scopedDivisions.length})` : (uniqueDivisions.length > 0 ? `(${uniqueDivisions.length})` : '')}</option>
                {(() => {
                  if (tenureFilter === 'active') {
                    if (scopedDivisions.length > 0) {
                      return scopedDivisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ));
                    }
                    return uniqueDivisions.map((dName) => (
                      <option key={dName} value={dName}>{dName}</option>
                    ));
                  }

                  // Lintas tahun (Semua Periode): kelompokkan divisi per tahun/tenure
                  const renderedDivIds = new Set();
                  const groups = (tenures || []).map((t) => {
                    const divsInTenure = divisions.filter(d => d.tenureId === t.id);
                    divsInTenure.forEach(d => renderedDivIds.add(d.id));
                    if (divsInTenure.length === 0) return null;
                    return (
                      <optgroup key={t.id} label={`Periode ${t.code} (${t.title || 'Kepengurusan'})`}>
                        {divsInTenure.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({t.code})
                          </option>
                        ))}
                      </optgroup>
                    );
                  }).filter(Boolean);

                  const remainingDivs = divisions.filter(d => !renderedDivIds.has(d.id));
                  return (
                    <>
                      {groups}
                      {remainingDivs.length > 0 && (
                        <optgroup label="Divisi Lainnya">
                          {remainingDivs.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>
        </div>

        {(() => {
          const GALLERIES_PER_PAGE = 6;
          const totalGalleryPages = Math.ceil(filteredGalleries.length / GALLERIES_PER_PAGE) || 1;
          const safeGalleryPage = Math.min(Math.max(1, galleryPage), totalGalleryPages);
          const paginatedGalleries = filteredGalleries.slice(
            (safeGalleryPage - 1) * GALLERIES_PER_PAGE,
            safeGalleryPage * GALLERIES_PER_PAGE
          );

          if (filteredGalleries.length === 0) {
            return (
              <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Tidak ada dokumentasi kegiatan yang cocok dengan filter pencarian.
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {paginatedGalleries.map((item, gIdx) => {
                  const isSelected = activeEvent.id === item.id;
                  return (
                    <div 
                      key={item.id || gIdx}
                      onClick={() => handleSelectGallery(item.id)}
                      className="glass-panel glass-panel-hover"
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderLeft: isSelected ? '4px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                          {formatWibDateTime(item.date) || '-'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {item.eventId && (() => {
                            const connectedEvt = (events || []).find(e => String(e.id) === String(item.eventId));
                            if (!connectedEvt) return null;
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNavigateEvent) {
                                    onNavigateEvent(connectedEvt.id);
                                  } else {
                                    window.location.href = `/?event=${encodeURIComponent(connectedEvt.id)}#event`;
                                  }
                                }}
                                className="badge-cyan"
                                title={`Lihat Agenda Acara: ${connectedEvt.title}`}
                                style={{
                                  fontSize: '0.62rem',
                                  padding: '2px 8px',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  color: 'var(--neon-cyan)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                📅 {connectedEvt.title}
                              </button>
                            );
                          })()}
                          {(item.divisionName || item.division) && (
                            <span className="badge-cyan" style={{ fontSize: '0.64rem', padding: '2px 8px' }}>
                              {item.divisionName || item.division}
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-card)'
                      }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          📷 {item.photos?.length || 0} Foto
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleCopyGalleryLink(item, e)}
                            title="Salin Link Dokumentasi Ini"
                            style={{
                              background: copiedGalleryId === item.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${copiedGalleryId === item.id ? '#10b981' : 'var(--border-card)'}`,
                              color: copiedGalleryId === item.id ? '#10b981' : 'var(--text-muted)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {copiedGalleryId === item.id ? <CheckCircle2 size={11} /> : <Link2 size={11} />}
                            <span>{copiedGalleryId === item.id ? 'Tersalin' : 'Salin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleShareGalleryWa(item, e)}
                            title="Bagikan ke WhatsApp"
                            style={{
                              background: 'rgba(37, 211, 102, 0.14)',
                              border: '1px solid rgba(37, 211, 102, 0.45)',
                              color: '#25D366',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Share2 size={11} />
                            <span>WA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalGalleryPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Menampilkan <strong>{(safeGalleryPage - 1) * GALLERIES_PER_PAGE + 1} - {Math.min(safeGalleryPage * GALLERIES_PER_PAGE, filteredGalleries.length)}</strong> dari <strong>{filteredGalleries.length}</strong> arsip kegiatan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={safeGalleryPage === 1}
                      onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeGalleryPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: safeGalleryPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: safeGalleryPage === 1 ? 0.45 : 1
                      }}
                    >
                      <ChevronLeft size={14} />
                      <span>Sebelumnya</span>
                    </button>
                    {Array.from({ length: totalGalleryPages }, (_, i) => i + 1).map((pg) => {
                      if (totalGalleryPages > 7 && Math.abs(pg - safeGalleryPage) > 2 && pg !== 1 && pg !== totalGalleryPages) {
                        if (pg === 2 || pg === totalGalleryPages - 1) {
                          return <span key={pg} style={{ color: 'var(--text-dim)', padding: '0 4px', fontSize: '0.75rem' }}>...</span>;
                        }
                        return null;
                      }
                      const isActive = pg === safeGalleryPage;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setGalleryPage(pg)}
                          style={{
                            minWidth: '28px',
                            height: '28px',
                            padding: '0 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                            color: isActive ? '#040914' : 'var(--text-main)',
                            border: isActive ? 'none' : '1px solid var(--border-card)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {pg}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={safeGalleryPage === totalGalleryPages}
                      onClick={() => setGalleryPage(p => Math.min(totalGalleryPages, p + 1))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeGalleryPage === totalGalleryPages ? 'var(--text-dim)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: safeGalleryPage === totalGalleryPages ? 'not-allowed' : 'pointer',
                        opacity: safeGalleryPage === totalGalleryPages ? 0.45 : 1
                      }}
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR HD PHOTO VIEWING & DOWNLOAD */}
      {isLightboxOpen && activeEvent && (
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
                Foto {currentPhotoIdx + 1} dari {eventPhotos.length} • {formatWibDateTime(activeEvent.date)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={(e) => handleCopyGalleryLink(activeEvent, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: copiedGalleryId === activeEvent.id ? 'rgba(16, 185, 129, 0.85)' : 'rgba(255, 255, 255, 0.14)',
                  border: copiedGalleryId === activeEvent.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copiedGalleryId === activeEvent.id ? <CheckCircle2 size={13} /> : <Link2 size={13} />}
                <span>{copiedGalleryId === activeEvent.id ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleShareGalleryWa(activeEvent, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(37, 211, 102, 0.28)',
                  border: '1px solid rgba(37, 211, 102, 0.65)',
                  color: '#25D366',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </button>

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
            {eventPhotos.length > 1 && (
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

            {eventPhotos.length > 1 && (
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
