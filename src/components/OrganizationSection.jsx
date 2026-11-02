import React, { useState } from 'react';
import { 
  Sparkles, 
  Crown, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import CrewMemberCard from './CrewMemberCard';
import { soundFx } from '../utils/audio';

export default function OrganizationSection({ activeTenure, divisions, members }) {
  const [selectedMember, setSelectedMember] = useState(null);

  const pembina = members.find(m => m.category === 'pembina');
  const inti = members.filter(m => m.category === 'inti');
  const pimpro = members.filter(m => m.category === 'pimpro');

  const handleMemberClick = (member) => {
    soundFx.playClick();
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    soundFx.playClick();
    setSelectedMember(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', color: 'var(--neon-emerald)', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
          <Sparkles size={14} />
          <span>Struktur Hirarki Organigram • {activeTenure.title}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
          ORGANIGRAM <span style={{
            background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>CNT IT APD</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Struktur organisasi Culture Network Team Group IT APD Direktorat IT Bank Mandiri. Klik pada setiap personel untuk melihat detail tanggung jawab & profil lengkap.
        </p>
      </div>

      {/* HIERARCHICAL TREE CONTAINER WITH SEAMLESS CONNECTING NEON LINES (IDENTIK DENGAN PRESENTASI) */}
      <div style={{ position: 'relative', maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* LEVEL 1: PEMBINA (Top Center) */}
        {pembina && (
          <div style={{ width: '100%', maxWidth: '440px', zIndex: 10 }}>
            <CrewMemberCard member={pembina} onClick={() => handleMemberClick(pembina)} />
          </div>
        )}

        {/* CONNECTING LINE 1 (Pembina down to Level 2) */}
        <div style={{
          width: '5px',
          height: '28px',
          background: 'linear-gradient(to bottom, #FFB800, #34d399)',
          boxShadow: '0 0 15px #34d399',
          zIndex: 1
        }} />

        {/* LEVEL 2: KETUA & WAKIL (Side by Side) */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '820px' }}>
          {/* Horizontal Bridge between Ketua & Wakil */}
          <div className="org-tree-line" style={{
            position: 'absolute',
            top: 0,
            left: '25%',
            right: '25%',
            height: '5px',
            background: '#34d399',
            boxShadow: '0 0 15px #34d399',
            zIndex: 1
          }} />

          <div className="org-level-2">
            {inti.slice(0, 2).map((person) => (
              <div key={person.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="org-tree-line" style={{ width: '5px', height: '16px', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                <div style={{ width: '100%' }}>
                  <CrewMemberCard member={person} onClick={() => handleMemberClick(person)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONNECTING LINE 2 (Ketua & Wakil down to Sekben) */}
        <div className="org-tree-line" style={{ position: 'relative', width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '5px', height: '24px', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '5px', height: '24px', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
            </div>
          </div>
          {/* Horizontal Bridge between Sekben 1 & 2 */}
          <div style={{ width: '50%', height: '5px', background: '#c084fc', boxShadow: '0 0 15px #c084fc', marginTop: '-5px' }} />
        </div>

        {/* LEVEL 3: SEKBEN 1 & SEKBEN 2 */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '820px', zIndex: 10 }}>
          <div className="org-level-3">
            {inti.slice(2, 4).map((person) => (
              <div key={person.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="org-tree-line" style={{ width: '5px', height: '16px', background: '#c084fc', boxShadow: '0 0 10px #c084fc' }} />
                <div style={{ width: '100%' }}>
                  <CrewMemberCard member={person} onClick={() => handleMemberClick(person)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-WAY DISTRIBUTOR TREE LINE (Sekben down to 4 Pimpro) */}
        <div className="org-tree-line" style={{ width: '100%', maxWidth: '1040px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <div style={{ width: '75%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '5px', height: '24px', background: '#c084fc', boxShadow: '0 0 10px #c084fc' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '5px', height: '24px', background: '#c084fc', boxShadow: '0 0 10px #c084fc' }} />
            </div>
          </div>
          {/* Continuous Horizontal bar spanning 4 columns */}
          <div style={{
            width: '75%',
            height: '5px',
            background: 'linear-gradient(to right, #38bdf8, #c084fc, #FFB800)',
            boxShadow: '0 0 15px #38bdf8',
            marginTop: '-5px'
          }} />
        </div>

        {/* LEVEL 4: PIMPRO 1 - 4 (Ketua Divisi) & ANGGOTA DIVISI */}
        <div style={{ width: '100%', maxWidth: '1180px', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {pimpro.map((lead, idx) => {
              const lineColor = idx === 0 ? '#38bdf8' : idx === 1 ? '#f87171' : idx === 2 ? '#c084fc' : '#FFB800';
              // Find all squad members in this division
              const divisionMembers = members.filter(m => m.category === 'anggota' && m.divisionId === lead.divisionId);

              return (
                <div key={lead.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="org-tree-line" style={{ width: '5px', height: '20px', background: lineColor, boxShadow: `0 0 10px ${lineColor}` }} />
                  
                  {/* Ketua Divisi Card */}
                  <div style={{ width: '100%' }}>
                    <CrewMemberCard member={lead} onClick={() => handleMemberClick(lead)} />
                  </div>

                  {/* Connecting Line from Ketua Divisi down to Anggota */}
                  {divisionMembers.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
                      <div className="org-tree-line" style={{ width: '2px', height: '14px', background: lineColor, opacity: 0.6 }} />
                      
                      {/* Anggota Divisi Box */}
                      <div style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed var(--border-card)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '4px',
                          borderBottom: '1px solid var(--border-card)'
                        }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.04em'
                          }}>
                            Anggota Divisi ({divisionMembers.length})
                          </span>
                        </div>

                        {divisionMembers.map((member) => (
                          <div
                            key={member.id}
                            onClick={() => handleMemberClick(member)}
                            className="glass-panel-hover"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-card)',
                              cursor: 'pointer',
                              gap: '8px'
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.role}
                              </div>
                            </div>

                            {member.whatsapp && (
                              <a
                                href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Chat WhatsApp"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'rgba(37, 211, 102, 0.15)',
                                  border: '1px solid rgba(37, 211, 102, 0.4)',
                                  color: '#25d366',
                                  fontSize: '0.85rem',
                                  flexShrink: 0,
                                  textDecoration: 'none'
                                }}
                              >
                                💬
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MEMBER DETAIL MODAL */}
      {selectedMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '32px',
            position: 'relative',
            border: `1px solid ${selectedMember.color || 'var(--mandiri-gold)'}`,
            boxShadow: '0 0 40px rgba(0,0,0,0.8)'
          }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'var(--text-main)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#040914',
                border: `3px solid ${selectedMember.color || 'var(--mandiri-gold)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {selectedMember.image ? (
                  <img 
                    src={selectedMember.image} 
                    alt={selectedMember.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '2.4rem' }}>👤</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="badge-gold" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                  {selectedMember.role}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {selectedMember.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                  {selectedMember.title}
                </div>

                {/* Direct WhatsApp Action in Modal */}
                {selectedMember.whatsapp && (
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={`https://wa.me/${selectedMember.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#25d366',
                        color: '#040914',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 2px 10px rgba(37, 211, 102, 0.4)'
                      }}
                    >
                      <span>💬 Chat WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderLeft: `3px solid ${selectedMember.color || 'var(--mandiri-gold)'}`,
              padding: '12px 16px',
              borderRadius: '0 8px 8px 0',
              fontStyle: 'italic',
              fontSize: '0.88rem',
              color: 'var(--text-main)',
              marginBottom: '20px'
            }}>
              "{selectedMember.motto || 'Berdedikasi untuk Kemajuan Insan IT APD'}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Tanggung Jawab Utama:
              </div>
              {selectedMember.responsibilities?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={16} color={selectedMember.color || 'var(--mandiri-gold)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
