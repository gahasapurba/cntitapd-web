import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  FolderDown,
  ExternalLink
} from 'lucide-react';

export default function GallerySection({ galleries = [] }) {
  const [selectedGallery, setSelectedGallery] = useState(0);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const activeEvent = galleries[selectedGallery] || {
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
            src={activeEvent.photos[currentPhotoIdx] || activeEvent.photos[0]} 
            alt={activeEvent.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease'
            }}
          />

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
                  color: 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.2)',
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
                  color: 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.2)',
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
            background: 'rgba(0,0,0,0.7)',
            color: 'var(--text-main)',
            fontSize: '0.78rem',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'monospace',
            fontWeight: 700
          }}>
            {currentPhotoIdx + 1} / {activeEvent.photos.length} Foto
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
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Daftar Arsip Dokumentasi Kegiatan:
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {galleries.map((item, gIdx) => (
            <div 
              key={item.id || gIdx}
              onClick={() => {
                setSelectedGallery(gIdx);
                setCurrentPhotoIdx(0);
              }}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderLeft: selectedGallery === gIdx ? '4px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                background: selectedGallery === gIdx ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--mandiri-gold)', fontWeight: 700, marginBottom: '4px' }}>
                {item.date}
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
          ))}
        </div>
      </div>

    </div>
  );
}
