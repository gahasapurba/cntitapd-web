import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Settings, 
  Users, 
  FolderPlus, 
  FileCheck2,
  Calendar,
  Layers,
  Database
} from 'lucide-react';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  tenures, 
  onAddTenure, 
  divisions, 
  onAddDivision,
  recruitmentInfo,
  onUpdateRecruitment,
  applications = []
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('divisions'); // 'divisions' | 'tenure' | 'recruitment' | 'applicants'
  
  // State for new division
  const [newDivName, setNewDivName] = useState('');
  const [newDivLead, setNewDivLead] = useState('');
  const [newDivColor, setNewDivColor] = useState('#00529B');
  const [newDivDesc, setNewDivDesc] = useState('');
  const [newDivFocus, setNewDivFocus] = useState('');

  // State for new tenure
  const [newTenureCode, setNewTenureCode] = useState('');
  const [newTenureTitle, setNewTenureTitle] = useState('');
  const [newTenureTagline, setNewTenureTagline] = useState('');

  // State for recruitment toggle
  const [isRecruitOpen, setIsRecruitOpen] = useState(recruitmentInfo.isOpen);
  const [recruitDeadline, setRecruitDeadline] = useState(recruitmentInfo.deadline);

  const handleCreateDivision = (e) => {
    e.preventDefault();
    if (!newDivName.trim()) return;

    onAddDivision({
      id: 'div-' + Date.now(),
      name: newDivName,
      slug: newDivName.toLowerCase().replace(/\s+/g, '-'),
      leadName: newDivLead || 'TBD',
      leadRole: `Pimpro ${newDivName}`,
      badge: `${newDivName} Lead`,
      color: newDivColor,
      motto: 'Mendorong Transformasi Budaya Berkelanjutan',
      description: newDivDesc || 'Divisi pengembangan inisiatif budaya di Group IT APD.',
      focusAreas: newDivFocus ? newDivFocus.split(',').map(s => s.trim()) : ['Program Kerja Baru'],
      isRecruiting: true,
      requirements: ['Memiliki komitmen tinggi', 'Aktif dan kolaboratif']
    });

    setNewDivName('');
    setNewDivLead('');
    setNewDivDesc('');
    setNewDivFocus('');
    alert(`Divisi "${newDivName}" berhasil ditambahkan secara dinamis!`);
  };

  const handleCreateTenure = (e) => {
    e.preventDefault();
    if (!newTenureCode.trim()) return;

    onAddTenure({
      id: 'tenure-' + newTenureCode,
      code: newTenureCode,
      title: newTenureTitle || `Kepengurusan CNT IT APD ${newTenureCode}`,
      themeTagline: newTenureTagline || 'Sinergi, Inovasi & Cultural Excellence',
      isActive: false
    });

    setNewTenureCode('');
    setNewTenureTitle('');
    setNewTenureTagline('');
    alert(`Periode Kepengurusan "${newTenureCode}" berhasil dibuat! Anda dapat mengarsipkannya kapan saja.`);
  };

  const handleSaveRecruitment = () => {
    onUpdateRecruitment({
      ...recruitmentInfo,
      isOpen: isRecruitOpen,
      deadline: recruitDeadline
    });
    alert('Pengaturan Open Recruitment berhasil diperbarui!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '880px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0a1128',
        border: '1px solid rgba(255, 184, 0, 0.4)',
        boxShadow: 'var(--shadow-gold)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Admin Panel — Kelola Dinamis CNT IT APD
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          {[
            { id: 'divisions', label: 'Kelola Divisi', icon: Layers },
            { id: 'tenure', label: 'Periode Kepengurusan', icon: Calendar },
            { id: 'recruitment', label: 'Setting Oprec', icon: Settings },
            { id: 'applicants', label: `Pendaftar Oprec (${applications.length})`, icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--accent-gold)' : 'transparent',
                  color: isActive ? '#0a1128' : 'var(--text-muted)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: KELOLA DIVISI */}
          {activeTab === 'divisions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Tambah Divisi / Bidang Baru
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Jika struktur organisasi berkembang atau ada divisi baru di kepengurusan berikutnya, Anda dapat menambahkannya di sini tanpa menyentuh kode.
                </p>
              </div>

              <form onSubmit={handleCreateDivision} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: 'rgba(255,255,255,0.03)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Divisi Baru *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Social Impact & Sustainability"
                    value={newDivName}
                    onChange={(e) => setNewDivName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Nama Pimpro / Koordinator
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC Divisi"
                    value={newDivLead}
                    onChange={(e) => setNewDivLead(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Deskripsi Tugas Divisi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Jelaskan peran divisi ini..."
                    value={newDivDesc}
                    onChange={(e) => setNewDivDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Fokus Program (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Program Penghijauan, CSR IT APD, Pilah Sampah Kantor"
                    value={newDivFocus}
                    onChange={(e) => setNewDivFocus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--accent-gold)',
                      color: '#0a1128',
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                    <span>Tambahkan Divisi Baru</span>
                  </button>
                </div>
              </form>

              {/* Existing Divisions List */}
              <div>
                <h5 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>
                  Daftar Divisi Saat Ini ({divisions.length}):
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {divisions.map((d) => (
                    <div key={d.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `4px solid ${d.color}`
                    }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{d.name}</strong>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginLeft: '10px' }}>
                          PIC: {d.leadName}
                        </span>
                      </div>
                      <span className="badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {d.isRecruiting ? 'Oprec Aktif' : 'Oprec Tutup'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERIODE KEPENGURUSAN */}
          {activeTab === 'tenure' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Manajemen Periode / Arsip Kepengurusan
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Memungkinkan pergantian pengurus tahun berikutnya (misal: 2027) tanpa menghapus jejak sejarah kepengurusan sebelumnya.
                </p>
              </div>

              <form onSubmit={handleCreateTenure} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '12px',
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: 'var(--radius-md)'
              }}>
                <input
                  type="text"
                  required
                  placeholder="Kode Tahun (misal: 2027)"
                  value={newTenureCode}
                  onChange={(e) => setNewTenureCode(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="Tagline Tema Budaya Periode Ini"
                  value={newTenureTagline}
                  onChange={(e) => setNewTenureTagline(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    gridColumn: 'span 2',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-gold)',
                    color: '#0a1128',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Tambah Periode Baru
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tenures.map((t) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{t.title}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>"{t.themeTagline}"</div>
                    </div>
                    <span className={t.isActive ? "badge-gold" : "badge-cyan"}>
                      {t.isActive ? 'Periode Aktif' : 'Arsip'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTING RECRUITMENT */}
          {activeTab === 'recruitment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Pengaturan Pendaftaran Open Recruitment
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Buka atau tutup akses pendaftaran form bagi karyawan IT APD
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="recruitStatus"
                    checked={isRecruitOpen}
                    onChange={(e) => setIsRecruitOpen(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="recruitStatus" style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>
                    Buka Pendaftaran Open Recruitment di Website
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Batas Akhir / Tanggal Deadline
                  </label>
                  <input
                    type="text"
                    value={recruitDeadline}
                    onChange={(e) => setRecruitDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <button
                  onClick={handleSaveRecruitment}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-gold)',
                    color: '#0a1128',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Simpan Konfigurasi Oprec
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: APPLICANTS */}
          {activeTab === 'applicants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Daftar Pendaftar Masuk ({applications.length})
                </h4>
              </div>

              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  Belum ada formulir pendaftaran baru yang masuk.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {applications.map((app) => (
                    <div key={app.id} style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{app.fullName}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                            (NIP: {app.nip} • {app.unitSquad})
                          </span>
                        </div>
                        <span className="badge-gold" style={{ fontSize: '0.68rem' }}>
                          {app.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                        Pilihan 1: <strong>{app.div1}</strong> | Pilihan 2: <strong>{app.div2}</strong>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{app.motivation}"
                      </p>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Kontak: {app.whatsapp} | {app.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
