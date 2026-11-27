import React from 'react';
import { AlertCircle, AlertTriangle, CalendarDays, Camera, ClipboardList, FileCheck2, FileText, Image as ImageIcon, Layers, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useAdminPortal } from '../AdminPortalContext';

export default function DeleteConfirmModal() {
  const {
    deleteConfirm,
    editingItem,
    onDeleteAspirasi,
    onDeleteBrandAsset,
    onDeleteDepartment,
    onDeleteDivision,
    onDeleteEvent,
    onDeleteEventRsvp,
    onDeleteFaq,
    onDeleteForm,
    onDeleteGallery,
    onDeleteKudos,
    onDeleteMember,
    onDeleteSubmission,
    onDeleteTenure,
    onDeleteTenureRole,
    onResetDefault,
    setDeleteConfirm,
    setEditingItem,
    showToast
  } = useAdminPortal();

  return (
    <>
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100005,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel modal-container" style={{
            maxWidth: (deleteConfirm.type === 'tenure' || deleteConfirm.type === 'division') && deleteConfirm.totalDependentCount > 0 ? '480px' : '440px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
            border: deleteConfirm.type === 'reset_all' 
              ? '1.5px solid rgba(56, 189, 248, 0.55)' 
              : (deleteConfirm.isBlocked
                  ? '1.5px solid rgba(255, 184, 0, 0.55)'
                  : '1.5px solid #f43f5e'),
            boxShadow: deleteConfirm.type === 'reset_all' 
              ? '0 10px 40px rgba(56, 189, 248, 0.25)' 
              : (deleteConfirm.isBlocked
                  ? '0 10px 40px rgba(255, 184, 0, 0.25)'
                  : '0 10px 40px rgba(244, 63, 94, 0.3)'),
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: deleteConfirm.type === 'reset_all' 
                ? 'rgba(56, 189, 248, 0.15)' 
                : (deleteConfirm.isBlocked
                    ? 'rgba(255, 184, 0, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)'),
              color: deleteConfirm.type === 'reset_all' 
                ? 'var(--neon-cyan)' 
                : (deleteConfirm.isBlocked
                    ? 'var(--mandiri-gold)'
                    : '#f43f5e'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              {deleteConfirm.type === 'reset_all' ? <RefreshCw size={26} /> : (deleteConfirm.isBlocked ? <AlertCircle size={28} /> : <AlertTriangle size={28} />)}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {deleteConfirm.type === 'reset_all' 
                ? 'Konfirmasi Sync Data' 
                : (deleteConfirm.isBlocked
                    ? (deleteConfirm.type === 'tenure'
                        ? (deleteConfirm.isOnlyTenure
                            ? 'Tidak Dapat Menghapus Periode'
                            : (deleteConfirm.isActiveTenure
                                ? 'Periode Sedang Aktif'
                                : 'Periode Masih Memiliki Data Terkait'))
                        : (deleteConfirm.type === 'division'
                            ? 'Divisi Masih Memiliki Data Terkait'
                            : (deleteConfirm.type === 'role'
                                ? 'Role Masih Digunakan Personel'
                                : (deleteConfirm.type === 'department'
                                ? 'Departemen Masih Digunakan RSVP'
                                : (deleteConfirm.type === 'member'
                                    ? 'Pimpro Masih Memimpin Anggota'
                                    : (deleteConfirm.type === 'event'
                                        ? 'Event Memiliki Relasi Data Aktif'
                                        : (deleteConfirm.type === 'form'
                                            ? 'Formulir Memiliki Data Pengisian'
                                            : (deleteConfirm.type === 'submission'
                                                ? 'Peserta Adalah Pemenang Undian'
                                                : 'Data Masih Memiliki Ketergantungan'))))))))
                    : (deleteConfirm.type === 'gallery_photo'
                        ? 'Konfirmasi Hapus Foto'
                        : (deleteConfirm.type === 'tenure'
                            ? 'Konfirmasi Hapus Periode'
                            : (deleteConfirm.type === 'division'
                                ? 'Konfirmasi Hapus Divisi'
                                : (deleteConfirm.type === 'role'
                                    ? 'Konfirmasi Hapus Role'
                                    : (deleteConfirm.type === 'department'
                                    ? 'Konfirmasi Hapus Departemen'
                                    : (deleteConfirm.type === 'member'
                                        ? 'Konfirmasi Hapus Personel'
                                        : (deleteConfirm.type === 'event'
                                            ? 'Konfirmasi Hapus Event'
                                            : (deleteConfirm.type === 'form'
                                                ? 'Konfirmasi Hapus Formulir'
                                                : (deleteConfirm.type === 'submission'
                                                    ? 'Konfirmasi Hapus Berkas'
                                                    : 'Konfirmasi Penghapusan Data'))))))))))}
            </h3>

            {/* TENURE BODY */}
            {deleteConfirm.type === 'tenure' && (
              deleteConfirm.isOnlyTenure ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> adalah satu-satunya periode kepengurusan yang tersisa di sistem.
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1px solid rgba(255, 184, 0, 0.35)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ⚠️ <strong>Proteksi Sistem:</strong> Website mewajibkan minimal <strong>1 periode kepengurusan</strong> tetap ada agar struktur organisasi, event, dan informasi kabinet dapat beroperasi dengan normal.
                  </div>
                </>
              ) : deleteConfirm.isActiveTenure ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> saat ini berstatus sebagai <strong>Periode Aktif Utama</strong> (Default Website).
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1px solid rgba(255, 184, 0, 0.35)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ⚠️ <strong>Proteksi Periode Aktif:</strong> Anda tidak dapat menghapus periode yang sedang aktif. Silakan klik tombol <strong>"Jadikan Aktif"</strong> pada periode lain terlebih dahulu sebelum menghapus periode ini.
                  </div>
                </>
              ) : deleteConfirm.totalDependentCount > 0 ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Periode <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih menaungi <strong>{deleteConfirm.totalDependentCount} data kepengurusan</strong>. Harap hapus atau pindahkan data berikut terlebih dahulu:
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.divCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.divCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Layers size={18} color={deleteConfirm.divCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Divisi Terkait</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.divCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.divCount} Divisi
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users size={18} color={deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Anggota / Pengurus</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.memCount} Orang
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CalendarDays size={18} color={deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Event</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.evtCount} Event
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.galCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.galCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <ImageIcon size={18} color={deleteConfirm.galCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Galeri Kegiatan</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.galCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.galCount} Album
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.formCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.formCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FileText size={18} color={deleteConfirm.formCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formulir Terkait</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.formCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.formCount} Formulir
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab data terkait di menu navigasi atas untuk menghapus atau mengalihkan periode data-data di atas sebelum menghapus periode ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus periode <strong>"{deleteConfirm.name}"</strong>? Data periode ini akan dihapus permanen dari sistem.
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Periode ini tidak aktif dan tidak memiliki dependensi data (0 Divisi, 0 Anggota, 0 Event, 0 Galeri, 0 Formulir).
                  </div>
                </>
              )
            )}

            {/* DIVISION BODY */}
            {deleteConfirm.type === 'division' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Divisi <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih menaungi <strong>{deleteConfirm.totalDependentCount} data kepengurusan</strong>. Harap alihkan atau hapus data berikut terlebih dahulu:
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: deleteConfirm.galCount > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                    gap: '8px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: deleteConfirm.memCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.memCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users size={18} color={deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Anggota Divisi</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.memCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.memCount} Orang
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: deleteConfirm.evtCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-card)',
                      border: deleteConfirm.evtCount > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CalendarDays size={18} color={deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Event</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: deleteConfirm.evtCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {deleteConfirm.evtCount} Event
                        </div>
                      </div>
                    </div>

                    {deleteConfirm.galCount > 0 && (
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <ImageIcon size={18} color="#f43f5e" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Galeri Terkait</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f43f5e' }}>
                            {deleteConfirm.galCount} Album
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab <strong>Anggota</strong> dan <strong>Event</strong> untuk memindahkan divisi personel/event atau menghapusnya terlebih dahulu sebelum menghapus divisi ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus divisi <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Divisi ini tidak menaungi anggota maupun event (0 Anggota, 0 Event).
                  </div>
                </>
              )
            )}

            {/* MEMBER BODY */}
            {deleteConfirm.type === 'member' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Personel <strong>"{deleteConfirm.name}"</strong> merupakan <strong>Pemimpin Proyek (Pimpro / Ketua)</strong> dari divisi <strong>"{deleteConfirm.divName}"</strong>.
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <Users size={20} color="#f43f5e" />
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Anggota Aktif di Bawah Divisi Ini</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                          {deleteConfirm.squadCount} Anggota Divisi
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Menghapus ketua divisi akan menyebabkan anggota squad di bawahnya kehilangan garis komando di bagan struktur organisasi. Silakan tunjuk Pimpro pengganti atau alihkan anggota divisi terlebih dahulu.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus personel <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.4
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Personel tidak memimpin anggota divisi aktif. Berkas foto akan dibersihkan dari storage cloud.
                  </div>
                </>
              )
            )}

            {/* EVENT BODY */}
            {deleteConfirm.type === 'event' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Event <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih memiliki relasi data aktif:
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {deleteConfirm.rsvpCount > 0 && (
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <ClipboardList size={18} color="#f43f5e" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Data RSVP Terdaftar</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f43f5e' }}>
                            {deleteConfirm.rsvpCount} Pegawai / Pendaftar
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm.formCount > 0 && (
                      <div style={{
                        background: 'rgba(255, 184, 0, 0.12)',
                        border: '1px solid rgba(255, 184, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FileText size={18} color="var(--mandiri-gold)" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formulir Pendaftaran Terhubung</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                            {deleteConfirm.formCount} Form: {deleteConfirm.connectedFormNames}
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm.formSubCount > 0 && (
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <Users size={18} color="var(--neon-cyan)" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Berkas Responden Formulir Terdaftar</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                            {deleteConfirm.formSubCount} Pengisian Berkas Peserta
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm.luckyDrawCount > 0 && (
                      <div style={{
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <Sparkles size={18} color="#c084fc" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pemenang Undian Doorprize</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c084fc' }}>
                            {deleteConfirm.luckyDrawCount} Pemenang Tercatat
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm.galCount > 0 && (
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <Camera size={18} color="#60a5fa" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dokumentasi Galeri Terhubung</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#60a5fa' }}>
                            {deleteConfirm.galCount} Album: {deleteConfirm.connectedGalTitles}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Harap putuskan koneksi form/galeri ke event ini, atau bersihkan riwayat RSVP dan hasil undian doorprize terlebih dahulu demi menjaga konsistensi database.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus event <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Event ini tidak memiliki riwayat RSVP, formulir terhubung, dokumentasi galeri, maupun pemenang undian.
                  </div>
                </>
              )
            )}

            {/* SUBMISSION BODY */}
            {deleteConfirm.type === 'submission' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    <strong>{deleteConfirm.name}</strong> tidak dapat dihapus karena peserta telah tercatat sebagai <strong>Pemenang Undian Doorprize</strong>!
                  </p>
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Sparkles size={20} color="#c084fc" />
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Hadiah Doorprize Dimenangkan</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#c084fc' }}>
                        🎁 {deleteConfirm.drawPrize || 'Hadiah Doorprize Event'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka halaman <strong>Statistik & Undian Event</strong> untuk membatalkan/menghapus nama pemenang dari daftar undian terlebih dahulu sebelum menghapus berkas pendaftaran ini.
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Apakah Anda yakin ingin menghapus berkas pendaftaran <strong>"{deleteConfirm.name}"</strong>? Berkas dan dokumen lampiran akan dibersihkan.
                </p>
              )
            )}

            {/* FORM BODY */}
            {deleteConfirm.type === 'form' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Formulir <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih memiliki ketergantungan aktif dalam sistem:
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {deleteConfirm.submissionCount > 0 && (
                      <div style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FileCheck2 size={20} color="#f43f5e" />
                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Data Pengisian Peserta</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f43f5e' }}>
                            {deleteConfirm.submissionCount} Respon Terkirim
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm.eventCount > 0 && (
                      <div style={{
                        background: 'rgba(255, 184, 0, 0.12)',
                        border: '1px solid rgba(255, 184, 0, 0.35)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <CalendarDays size={20} color="var(--mandiri-gold)" />
                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Terkoneksi ke Agenda Kegiatan / Event</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                            {deleteConfirm.connectedEventTitle}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> {deleteConfirm.eventCount > 0 ? 'Harap putuskan koneksi acara ke formulir ini melalui menu Edit Acara atau Edit Formulir terlebih dahulu. ' : ''}{deleteConfirm.submissionCount > 0 ? 'Buka tab Data Pengisian Form untuk meninjau atau mengekspor respon sebelum membersihkan data pendaftar.' : ''}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus formulir dinamis <strong>"{deleteConfirm.name}"</strong>?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Formulir ini tidak memiliki kiriman berkas peserta dan tidak terhubung ke agenda kegiatan manapun.
                  </div>
                </>
              )
            )}

            {/* ROLE BODY */}
            {deleteConfirm.type === 'role' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Role <strong>"{deleteConfirm.name}"</strong> tidak dapat dihapus karena masih digunakan oleh <strong>{deleteConfirm.dependentCount} personel</strong> pada periode ini.
                  </p>
                  <div style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    lineHeight: 1.45,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {(deleteConfirm.dependentMembers || []).map((m: any, i: any) => (
                      <div key={m.id || i}>• <strong>{m.name}</strong> ({m.role})</div>
                    ))}
                  </div>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left'
                  }}>
                    💡 <strong>Petunjuk:</strong> Ubah jabatan personel di atas ke role lain pada tab <strong>Pengurus & Anggota</strong> sebelum menghapus role ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus role <strong>"{deleteConfirm.name}"</strong> dari periode kepengurusan ini?
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left'
                  }}>
                    🛡️ <strong>Aman:</strong> Tidak ada personel yang sedang menggunakan role ini pada periode yang dipilih.
                  </div>
                </>
              )
            )}

            {/* DEPARTMENT BODY */}
            {deleteConfirm.type === 'department' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Departemen <strong>"{deleteConfirm.name}"</strong> tidak dapat dihapus karena masih digunakan oleh <strong>{deleteConfirm.rsvpCount} pendaftaran RSVP event</strong>.
                  </p>
                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Buka tab RSVP Event untuk menghapus atau menyesuaikan data pendaftaran terkait sebelum menghapus departemen ini demi konsistensi data.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus departemen <strong>"{deleteConfirm.name}"</strong>? Departemen ini tidak akan lagi muncul pada opsi pilihan RSVP event.
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Tidak ada riwayat RSVP event yang terhubung dengan departemen ini.
                  </div>
                </>
              )
            )}

            {/* GALLERY ALBUM BODY */}
            {deleteConfirm.type === 'gallery' && (
              deleteConfirm.isBlocked ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Dokumentasi galeri <strong>"{deleteConfirm.name}"</strong> belum dapat dihapus karena masih terhubung ke agenda kegiatan / event:
                  </p>

                  <div style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: 'rgba(255, 184, 0, 0.12)',
                      border: '1px solid rgba(255, 184, 0, 0.35)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <CalendarDays size={20} color="var(--mandiri-gold)" />
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Terkoneksi ke Agenda Kegiatan / Event</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                          {deleteConfirm.connectedEventTitle}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 184, 0, 0.1)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--mandiri-gold)',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Petunjuk:</strong> Harap putuskan tautan agenda acara pada galeri ini melalui tombol <strong>Edit Galeri</strong> (pilih opsi <em>-- Tanpa Hubungan Event --</em>) terlebih dahulu sebelum menghapus album ini.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Apakah Anda yakin ingin menghapus album galeri kegiatan <strong>"{deleteConfirm.name}"</strong>? Dokumentasi foto di dalamnya akan dibersihkan.
                  </p>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#10b981',
                    textAlign: 'left',
                    lineHeight: 1.45
                  }}>
                    ✓ <strong>Aman Dihapus:</strong> Galeri ini tidak terhubung ke agenda event manapun.
                  </div>
                </>
              )
            )}

            {/* GALLERY PHOTO BODY */}
            {deleteConfirm.type === 'gallery_photo' && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong> dari daftar dokumentasi kegiatan? Foto di cloud storage akan otomatis dibersihkan saat Anda klik <strong>Simpan Perubahan</strong>.
              </p>
            )}

            {/* DEFAULT BODY FOR OTHER TYPES */}
            {deleteConfirm.type !== 'tenure' && deleteConfirm.type !== 'division' && deleteConfirm.type !== 'department' && deleteConfirm.type !== 'member' && deleteConfirm.type !== 'event' && deleteConfirm.type !== 'form' && deleteConfirm.type !== 'gallery' && deleteConfirm.type !== 'gallery_photo' && deleteConfirm.type !== 'submission' && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {deleteConfirm.type === 'reset_all' ? (
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    Clear Cache dan Reload Data? Data tidak akan terhapus melainkan akan dimuat ulang
                  </span>
                ) : (
                  <>Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong>?</>
                )}
              </p>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {deleteConfirm.isBlocked ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    padding: '9px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-blue)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 82, 155, 0.35)'
                  }}
                >
                  Mengerti & Tutup
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'transparent',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Batalkan
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (deleteConfirm.type === 'member' && onDeleteMember) onDeleteMember(deleteConfirm.id);
                      if (deleteConfirm.type === 'division' && onDeleteDivision) onDeleteDivision(deleteConfirm.id);
                      if (deleteConfirm.type === 'role' && onDeleteTenureRole) onDeleteTenureRole(deleteConfirm.id);
                      if (deleteConfirm.type === 'department' && onDeleteDepartment) onDeleteDepartment(deleteConfirm.id);
                      if (deleteConfirm.type === 'gallery' && onDeleteGallery) onDeleteGallery(deleteConfirm.id);
                      if (deleteConfirm.type === 'tenure' && onDeleteTenure) onDeleteTenure(deleteConfirm.id);
                      if (deleteConfirm.type === 'kudos' && onDeleteKudos) onDeleteKudos(deleteConfirm.id);
                      if (deleteConfirm.type === 'aspirasi' && onDeleteAspirasi) onDeleteAspirasi(deleteConfirm.id);
                      if (deleteConfirm.type === 'event_rsvp' && onDeleteEventRsvp) onDeleteEventRsvp(deleteConfirm.id);
                      if (deleteConfirm.type === 'form' && onDeleteForm) onDeleteForm(deleteConfirm.id, true);
                      if (deleteConfirm.type === 'event' && onDeleteEvent) onDeleteEvent(deleteConfirm.id);
                      if (deleteConfirm.type === 'submission' && onDeleteSubmission) onDeleteSubmission(deleteConfirm.id);
                      if (deleteConfirm.type === 'brand_asset' && onDeleteBrandAsset) onDeleteBrandAsset(deleteConfirm.id);
                      if (deleteConfirm.type === 'faq' && onDeleteFaq) onDeleteFaq(deleteConfirm.id);
                      if (deleteConfirm.type === 'reset_all' && onResetDefault) onResetDefault();
                      if (deleteConfirm.type === 'gallery_photo') {
                        if (editingItem && editingItem.item) {
                          const nextPhotos = (editingItem.item.photos || []).filter((_: any, i: any) => i !== deleteConfirm.photoIdx);
                          setEditingItem({ ...editingItem, item: { ...editingItem.item, photos: nextPhotos } });
                        }
                      }

                      const toastMsg = deleteConfirm.type === 'reset_all' 
                        ? 'Cache berhasil dibersihkan & data berhasil dimuat ulang!' 
                        : (deleteConfirm.type === 'gallery_photo'
                            ? `${deleteConfirm.name} berhasil dihapus dari daftar!`
                            : (deleteConfirm.type === 'tenure'
                            ? `Periode "${deleteConfirm.name}" berhasil dihapus!`
                            : (deleteConfirm.type === 'division'
                                ? `Divisi "${deleteConfirm.name}" berhasil dihapus!`
                                : (deleteConfirm.type === 'member'
                                    ? `Personel "${deleteConfirm.name}" berhasil dihapus!`
                                    : (deleteConfirm.type === 'role'
                                        ? `Role "${deleteConfirm.name}" berhasil dihapus!`
                                        : (deleteConfirm.type === 'department'
                                        ? `Departemen "${deleteConfirm.name}" berhasil dihapus!`
                                        : (deleteConfirm.type === 'event'
                                            ? `Event "${deleteConfirm.name}" berhasil dihapus!`
                                            : (deleteConfirm.type === 'form'
                                                ? `Formulir "${deleteConfirm.name}" berhasil dihapus!`
                                                : 'Data berhasil dihapus & disinkronkan!'))))))));

                      setDeleteConfirm(null);
                      showToast(toastMsg);
                    }}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 'var(--radius-full)',
                      background: deleteConfirm.type === 'reset_all' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f43f5e',
                      border: deleteConfirm.type === 'reset_all' ? '1px solid rgba(56, 189, 248, 0.45)' : 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: deleteConfirm.type === 'reset_all' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none'
                    }}
                  >
                    {deleteConfirm.type === 'reset_all' 
                      ? 'Ya, Sync Data' 
                      : (deleteConfirm.type === 'gallery_photo'
                          ? 'Hapus Foto'
                          : (deleteConfirm.type === 'tenure' 
                              ? 'Ya, Hapus Periode' 
                              : (deleteConfirm.type === 'division'
                                  ? 'Ya, Hapus Divisi'
                                  : (deleteConfirm.type === 'member'
                                      ? 'Ya, Hapus Personel'
                                      : (deleteConfirm.type === 'role'
                                          ? 'Ya, Hapus Role'
                                          : (deleteConfirm.type === 'department'
                                          ? 'Ya, Hapus Departemen'
                                          : (deleteConfirm.type === 'event'
                                              ? 'Ya, Hapus Event'
                                              : (deleteConfirm.type === 'form'
                                                  ? 'Ya, Hapus Formulir'
                                                  : (deleteConfirm.type === 'submission'
                                                      ? 'Ya, Hapus Berkas'
                                                      : 'Ya, Hapus Data')))))))))}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
