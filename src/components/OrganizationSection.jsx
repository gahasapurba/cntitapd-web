import React, { useState } from 'react';
import { 
  Sparkles, 
  Crown, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Info,
  Search,
  Users,
  Download,
  Copy,
  Calendar
} from 'lucide-react';
import CrewMemberCard from './CrewMemberCard';
import { soundFx } from '../utils/audio';
import { exportPresentationToPdf } from '../utils/exportPdf';
import { getTenureRoles, getMemberLevel, findMatchingRole } from '../utils/memberQuotaUtils';

function formatWaNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

export default function OrganizationSection({ activeTenure, divisions, members, events = [], roleQuotas = {}, tenureRoles = [], onNavigateProgram }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    soundFx.playClick();
    setIsExporting(true);
    try {
      await exportPresentationToPdf('org-tree-export-container', null, activeTenure);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVCard = (member) => {
    if (!member) return;
    const phone = formatWaNumber(member.whatsapp || '');
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${member.name || 'Pengurus CNT IT APD'}`,
      'ORG:Bank Mandiri - Culture Network Team (CNT) IT Application Delivery',
      `TITLE:${member.role || ''} (${member.title || 'CNT IT APD'})`,
      phone ? `TEL;TYPE=CELL,VOICE:+${phone}` : '',
      `NOTE:${member.motto || 'Pengurus Culture Network Team (CNT) Group IT APD'}`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcardLines], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = String(member.name || 'cnt-apd').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `kontak-${safeName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleCopyPhone = (rawPhone) => {
    if (!rawPhone) return;
    try {
      navigator.clipboard.writeText(rawPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    } catch (e) {}
  };

  const activeDivisions = (divisions || []).filter(d => d.tenureId === activeTenure?.id);
  const activeMembers = (members || []).filter(m => m.tenureId === activeTenure?.id);

  const currentTenureRoles = getTenureRoles(activeTenure?.id, roleQuotas, tenureRoles);

  // Dewan Penasehat (Level 0 - Tingkat tertinggi bila ada)
  const penasehats = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 0);

  // Pembina (Level 1)
  const pembinas = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 1);

  // Level 2: Ketua & Wakil Ketua
  const level2Members = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 2);
  const displayLevel2 = [...level2Members].sort((a, b) => {
    const aIsWakil = (a.role || '').toLowerCase().includes('wakil');
    const bIsWakil = (b.role || '').toLowerCase().includes('wakil');
    return (aIsWakil ? 1 : 0) - (bIsWakil ? 1 : 0);
  });

  // Level 3: Pengurus Harian / BPH (Sekretaris, Bendahara, Sekben, Sekjen, dll.)
  const displayLevel3 = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 3);

  // Level 4: Pimpinan Divisi / Pimpro
  const pimpro = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 4 || m.category === 'pimpro');

  const isFiltering = searchQuery.trim() !== '' || roleFilter !== 'all' || divisionFilter !== 'all';

  const filteredDirectoryMembers = activeMembers.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q) ||
      (Array.isArray(m.responsibilities) && m.responsibilities.some(r => r.toLowerCase().includes(q)));
    
    const memberRole = findMatchingRole(m, currentTenureRoles);
    const matchesRole = roleFilter === 'all' ||
      m.roleId === roleFilter ||
      memberRole?.id === roleFilter ||
      (memberRole?.name && memberRole.name.toLowerCase() === roleFilter.toLowerCase());

    const matchesDiv = divisionFilter === 'all' || m.divisionId === divisionFilter;
    return matchesSearch && matchesRole && matchesDiv;
  });

  const handleMemberClick = (member) => {
    soundFx.playClick();
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    soundFx.playClick();
    setSelectedMember(null);
  };

  return (
    <div className="org-section-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
      
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto', padding: '0 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', color: 'var(--neon-emerald)', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
          <Sparkles size={14} />
          <span>Struktur Hirarki Organigram {activeTenure?.title || activeTenure?.code ? `• ${activeTenure.title || activeTenure.code}` : ''}</span>
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

        {/* Prominent Action Button: Download Bagan Organisasi PDF (Hanya tampil jika ada minimal 1 anggota) */}
        {activeMembers.length > 0 && (
          <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center', width: '100%', padding: '0 10px' }}>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              style={{
                padding: '11px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: isExporting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px',
                maxWidth: '100%',
                boxShadow: '0 4px 20px rgba(2, 132, 199, 0.45)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                transition: 'all 0.2s ease'
              }}
              title="Download Presentasi Bagan Struktur Organisasi ke File PDF"
            >
              <Download size={16} />
              <span>{isExporting ? 'Sedang Menyiapkan PDF...' : 'Download Bagan Organisasi (PDF)'}</span>
            </button>
          </div>
        )}

        {/* Search & Filter Directory Bar */}
        <div className="glass-panel" style={{
          marginTop: '24px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--border-card)'
        }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Cari nama pengurus, jabatan, atau keahlian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              flex: '0 1 auto'
            }}
          >
            <option value="all">Semua Posisi / Role ({activeMembers.length})</option>
            {currentTenureRoles.map(r => {
              const count = activeMembers.filter(m => {
                const mr = findMatchingRole(m, currentTenureRoles);
                return m.roleId === r.id || mr?.id === r.id;
              }).length;
              return (
                <option key={r.id} value={r.id}>
                  {r.name} ({count})
                </option>
              );
            })}
          </select>

          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              flex: '0 1 auto'
            }}
          >
            <option value="all">Semua Divisi</option>
            {(activeDivisions || []).map(div => (
              <option key={div.id} value={div.id}>{div.name}</option>
            ))}
          </select>

          {isFiltering && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setDivisionFilter('all');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.14)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#f43f5e',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Filtered Directory Results when searching/filtering */}
      {isFiltering && (
        <div style={{ maxWidth: '1140px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span className="badge-cyan">
              Hasil Pencarian Personel: {filteredDirectoryMembers.length} Orang Ditemukan
            </span>
          </div>

          {filteredDirectoryMembers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ditemukan personel yang cocok dengan kata kunci atau filter yang dipilih.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
              gap: '20px'
            }}>
              {filteredDirectoryMembers.map(person => (
                <CrewMemberCard key={person.id} member={person} onClick={() => handleMemberClick(person)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* HIERARCHICAL TREE CONTAINER WITH SEAMLESS CONNECTING NEON LINES (IDENTIK DENGAN PRESENTASI) */}
      {activeMembers.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-card)',
          maxWidth: '700px',
          margin: '0 auto',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Belum Ada Struktur Organigram
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Belum ada anggota atau pengurus yang terdaftar pada periode kepengurusan ini ({activeTenure?.title || activeTenure?.code || 'Tenure Aktif'}). Silakan tambahkan anggota baru melalui Admin Portal.
          </p>
        </div>
      ) : (
        <div id="org-tree-export-container" className="org-tree-wrapper" style={{ position: 'relative', maxWidth: '1240px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* LEVEL 0: DEWAN PENASEHAT (Puncak Tertinggi bila ada) */}
        {penasehats.length > 0 && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: penasehats.length > 1 ? '900px' : '440px',
              zIndex: 10
            }}>
              {penasehats.map(p => (
                <div key={p.id} style={{ flex: penasehats.length > 1 ? '1 1 360px' : '1 1 auto', maxWidth: '440px', width: '100%' }}>
                  <CrewMemberCard member={p} onClick={() => handleMemberClick(p)} />
                </div>
              ))}
            </div>

            {/* Connecting line from Penasehat down to Pembina / Ketua */}
            <div className="org-tree-line" style={{
              width: '5px',
              height: '24px',
              background: 'linear-gradient(to bottom, #38bdf8, #FFB800)',
              boxShadow: '0 0 15px #38bdf8',
              zIndex: 1
            }} />
          </>
        )}

        {/* LEVEL 1: PEMBINA (Top Center - Mendukung 1 atau Banyak Pembina) */}
        {pembinas.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: pembinas.length > 1 ? '900px' : '440px',
            zIndex: 10
          }}>
            {pembinas.map(p => (
              <div key={p.id} style={{ flex: pembinas.length > 1 ? '1 1 360px' : '1 1 auto', maxWidth: '440px', width: '100%' }}>
                <CrewMemberCard member={p} onClick={() => handleMemberClick(p)} />
              </div>
            ))}
          </div>
        )}

        {/* CONNECTING LINE 1 (Pembina down to Level 2) */}
        {pembinas.length > 0 && (
          pembinas.length > 1 ? (
            <div className="org-tree-line" style={{ position: 'relative', width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: `repeat(${pembinas.length}, 1fr)`, gap: '24px' }}>
                {pembinas.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '5px', height: '16px', background: '#FFB800', boxShadow: '0 0 10px #FFB800' }} />
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative', width: '100%', height: '5px' }}>
                <div style={{
                  position: 'absolute',
                  left: `calc(100% / (${pembinas.length} * 2))`,
                  right: `calc(100% / (${pembinas.length} * 2))`,
                  height: '5px',
                  background: '#FFB800',
                  boxShadow: '0 0 15px #FFB800',
                  borderRadius: '3px'
                }} />
              </div>
              <div style={{ width: '5px', height: '18px', background: 'linear-gradient(to bottom, #FFB800, #34d399)', boxShadow: '0 0 15px #34d399' }} />
            </div>
          ) : (
            <div className="org-tree-line" style={{
              width: '5px',
              height: '28px',
              background: 'linear-gradient(to bottom, #FFB800, #34d399)',
              boxShadow: '0 0 15px #34d399',
              zIndex: 1
            }} />
          )
        )}

        {/* LEVEL 2: KETUA & WAKIL (Side by Side) */}
        {displayLevel2.length > 0 && (
          <div style={{ position: 'relative', width: '100%', maxWidth: displayLevel2.length === 1 ? '440px' : '820px' }}>
            {/* Horizontal Bridge between Ketua & Wakil */}
            {displayLevel2.length > 1 && (
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
            )}

            <div className={displayLevel2.length === 1 ? '' : 'org-level-2'}>
              {displayLevel2.map((person) => (
                <div key={person.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="org-tree-line" style={{ width: '5px', height: '16px', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                  <div style={{ width: '100%' }}>
                    <CrewMemberCard member={person} onClick={() => handleMemberClick(person)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONNECTING LINE 2 (Ketua & Wakil down to Sekretaris & Bendahara) */}
        {displayLevel3.length > 0 && (
          <div className="org-tree-line" style={{ position: 'relative', width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: `repeat(${Math.max(displayLevel2.length, 1)}, 1fr)`, gap: '24px' }}>
              {displayLevel2.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '5px', height: '24px', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                </div>
              ))}
            </div>
            {/* Horizontal Bridge between Level 3 cards */}
            {displayLevel3.length > 1 && (
              <div style={{ position: 'relative', width: '100%', height: '5px' }}>
                <div style={{
                  position: 'absolute',
                  left: `calc(100% / (${displayLevel3.length} * 2))`,
                  right: `calc(100% / (${displayLevel3.length} * 2))`,
                  height: '5px',
                  background: '#c084fc',
                  boxShadow: '0 0 15px #c084fc',
                  borderRadius: '3px'
                }} />
              </div>
            )}
          </div>
        )}

        {/* LEVEL 3: SEKRETARIS & BENDAHARA */}
        {displayLevel3.length > 0 && (
          <div style={{ position: 'relative', width: '100%', maxWidth: displayLevel3.length === 1 ? '440px' : '820px', zIndex: 10 }}>
            <div 
              className={displayLevel3.length === 1 ? '' : 'org-level-3'}
              style={{
                '--level3-cols': displayLevel3.length > 0 ? displayLevel3.length : 2
              }}
            >
              {displayLevel3.map((person) => (
                <div key={person.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="org-tree-line" style={{ width: '5px', height: '16px', background: '#c084fc', boxShadow: '0 0 10px #c084fc' }} />
                  <div style={{ width: '100%' }}>
                    <CrewMemberCard member={person} onClick={() => handleMemberClick(person)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4-WAY DISTRIBUTOR TREE LINE (Sekretaris & Bendahara down to Pimpro) */}
        <div className="org-tree-line" style={{ width: '100%', maxWidth: '1240px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          {/* Incoming vertical lines from Level 3 */}
          <div style={{ width: '100%', maxWidth: displayLevel3.length === 1 ? '440px' : '820px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(displayLevel3.length, 1)}, 1fr)`, gap: '24px' }}>
            {(displayLevel3.length > 0 ? displayLevel3 : [1]).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '5px', height: '24px', background: '#c084fc', boxShadow: '0 0 10px #c084fc' }} />
              </div>
            ))}
          </div>
          {/* Continuous Horizontal bar spanning across columns */}
          {(() => {
            const displayDivs = activeDivisions.length > 0
              ? activeDivisions
              : pimpro.map((p, idx) => ({ id: p.divisionId || `div-${idx}`, name: p.role?.replace(/^Pimpro\s+/i, '') || `Divisi ${idx + 1}`, color: p.color }));
            if (displayDivs.length <= 1) return null;
            const spanFactor = displayDivs.length * 2;
            return (
              <div style={{ position: 'relative', width: '100%', height: '5px' }}>
                <div style={{
                  position: 'absolute',
                  left: `calc(100% / ${spanFactor})`,
                  right: `calc(100% / ${spanFactor})`,
                  height: '5px',
                  background: 'linear-gradient(to right, #38bdf8 0%, #f87171 33%, #c084fc 66%, #FFB800 100%)',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                  borderRadius: '3px'
                }} />
              </div>
            );
          })()}
        </div>

        {/* LEVEL 4: PIMPRO (Ketua Divisi) & ANGGOTA DIVISI - DINAMIS MENYESUAIKAN JUMLAH DIVISI */}
        {(() => {
          const displayDivs = activeDivisions.length > 0
            ? activeDivisions
            : pimpro.map((p, idx) => ({ id: p.divisionId || `div-${idx}`, name: p.role?.replace(/^Pimpro\s+/i, '') || `Divisi ${idx + 1}`, color: p.color }));

          if (displayDivs.length === 0 && pimpro.length === 0) return null;

          return (
            <div style={{ width: '100%', maxWidth: '1240px', zIndex: 10 }}>
              <div 
                className="org-pimpro-grid"
                style={{
                  '--pimpro-cols': displayDivs.length > 0 ? displayDivs.length : 4
                }}
              >
                {displayDivs.map((div, idx) => {
                  const lead = activeMembers.find(m => m.divisionId === div.id && (getMemberLevel(m, currentTenureRoles) === 4 || m.category === 'pimpro' || (m.role || '').toLowerCase().startsWith('pimpro') || String(m.roleId || '').includes('pimpro')))
                    || activeMembers.find(m => div.leadName && m.name === div.leadName)
                    || (pimpro[idx] || null);
                  const lineColor = div.color || (idx === 0 ? '#38bdf8' : idx === 1 ? '#f87171' : idx === 2 ? '#c084fc' : '#FFB800');
                  const divisionMembers = activeMembers.filter(m => m.id !== lead?.id && m.divisionId === div.id && (m.category === 'anggota' || getMemberLevel(m, currentTenureRoles) === 5));

                  return (
                    <div key={div.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="org-tree-line" style={{ width: '5px', height: '20px', background: lineColor, boxShadow: `0 0 10px ${lineColor}` }} />
                      
                      {/* Ketua Divisi Card */}
                      <div style={{ width: '100%' }}>
                        {lead ? (
                          <CrewMemberCard member={lead} onClick={() => handleMemberClick(lead)} compact={true} />
                        ) : (
                          <div className="glass-panel" style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-md)',
                            border: `1px dashed ${lineColor}`,
                            background: 'rgba(255, 255, 255, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '0.72rem', color: lineColor, fontWeight: 800 }}>Pimpro {div.name}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Belum Ditentukan</span>
                          </div>
                        )}
                      </div>

                      {/* Connecting Line from Ketua Divisi down to Anggota */}
                      {divisionMembers.length > 0 && (
                        <div className="org-anggota-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
                          <div className="org-tree-line" style={{ width: '2px', height: '14px', background: lineColor, opacity: 0.6 }} />
                          
                          {/* Anggota Divisi Box */}
                          <div className="org-anggota-box" style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px dashed var(--border-card)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
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
                                  flexDirection: 'column',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-card)',
                                  cursor: 'pointer',
                                  gap: '6px'
                                }}
                              >
                                {/* 1. Atas: Badge Role */}
                                <div>
                                  <span style={{
                                    fontSize: '0.64rem',
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border-card)'
                                  }}>
                                    {member.role || 'Anggota Divisi'}
                                  </span>
                                </div>

                                {/* 2. Dibawahnya: Nama */}
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {member.name}
                                </div>

                                {/* 3. Dibawahnya: Motto */}
                                {member.motto && (
                                  <div style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-dim)',
                                    fontStyle: 'italic',
                                    lineHeight: 1.35,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    "{member.motto}"
                                  </div>
                                )}

                                {/* 4. Dibawahnya: Tombol WA */}
                                {member.whatsapp && (
                                  <div style={{ marginTop: '2px' }}>
                                    <a
                                      href={`https://wa.me/${formatWaNumber(member.whatsapp)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: 'rgba(37, 211, 102, 0.15)',
                                        border: '1px solid rgba(37, 211, 102, 0.4)',
                                        color: '#25d366',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <span>💬</span>
                                      <span>Hubungi WA</span>
                                    </a>
                                  </div>
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
          );
        })()}

      </div>
      )}

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
          zIndex: 99999,
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

                {/* Direct WhatsApp, vCard & Copy Actions in Modal */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedMember.whatsapp && (
                    <a
                      href={`https://wa.me/${formatWaNumber(selectedMember.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#25d366',
                        color: '#040914',
                        padding: '6px 13px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 2px 10px rgba(37, 211, 102, 0.35)'
                      }}
                    >
                      <span>💬 Chat WA</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownloadVCard(selectedMember)}
                    title="Simpan kontak pengurus ke buku telepon HP / Outlook (.vcf)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 184, 0, 0.14)',
                      border: '1px solid rgba(255, 184, 0, 0.45)',
                      color: 'var(--mandiri-gold)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} />
                    <span>Simpan Kontak (.vcf)</span>
                  </button>

                  {selectedMember.whatsapp && (
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selectedMember.whatsapp)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: copiedPhone ? '#10b981' : 'var(--text-muted)',
                        padding: '6px 11px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={12} />
                      <span>{copiedPhone ? '✓ Nomor Tersalin' : 'Salin Nomor'}</span>
                    </button>
                  )}
                </div>
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

            {/* Related Division Programs in Member Detail Modal */}
            {(() => {
              const relatedEvents = (events || []).filter(e =>
                e.tenureId === activeTenure?.id &&
                (selectedMember.divisionId ? e.divisionId === selectedMember.divisionId : true)
              ).slice(0, 3);
              if (relatedEvents.length === 0) return null;
              return (
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--neon-cyan)', fontWeight: 800 }}>
                      📅 Event & Agenda Terkait ({relatedEvents.length}):
                    </span>
                    {onNavigateProgram && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          onNavigateProgram();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--mandiri-gold)',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Lihat Kalender →
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {relatedEvents.map(ev => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          fontSize: '0.78rem'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ev.title}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flexShrink: 0 }}>{ev.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
