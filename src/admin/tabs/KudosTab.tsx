import React from 'react';
import { AKHLAK_VALUES } from '../../utils/akhlak';
import { ChevronLeft, ChevronRight, Download, Edit2, Eye, EyeOff, MessageSquare, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib, formatWibTimestamp } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function KudosTab() {
  const {
    activeTab,
    adminAspirasiPage,
    adminKudosPage,
    aspirasiAdminCatFilter,
    aspirasiAdminStatusFilter,
    aspirasiList,
    aspirasiSearchQuery,
    kudosCatFilter,
    kudosList,
    kudosSearchQuery,
    onDeleteAspirasi,
    onUpdateAspirasi,
    setAdminAspirasiPage,
    setAdminKudosPage,
    setAspirasiAdminCatFilter,
    setAspirasiAdminStatusFilter,
    setAspirasiSearchQuery,
    setDeleteConfirm,
    setEditingItem,
    setKudosCatFilter,
    setKudosSearchQuery,
    showToast
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'kudos' && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Kelola Kiriman Apresiasi Kudos ({kudosList.length}) & Kotak Aspirasi ({aspirasiList.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Seluruh apresiasi dari Wall of Kudos dan ide dari Kotak Aspirasi tersimpan di Cloud dan dapat diunduh sebagai laporan CSV.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (kudosList.length === 0) {
                    showToast('Belum ada data Kudos untuk diexport.', 'error');
                    return;
                  }
                  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const header = ['ID', 'Kategori Nilai Budaya', 'Pengirim', 'Penerima', 'Pesan Apresiasi', 'Likes', 'Waktu Kirim'].map(escapeCsv).join(',');
                  const rows = kudosList.map((k: any) => [
                    k.id,
                    k.category,
                    k.sender,
                    k.recipient,
                    k.message,
                    k.likes || 1,
                    formatWibTimestamp(k.createdAt || k.created_at || k.exactTimestamp).full
                  ].map(escapeCsv).join(','));
                  const csvString = '\uFEFF' + [header, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `laporan_kudos_cnt_it_apd_${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast(`Berhasil mengunduh ${kudosList.length} kiriman Kudos ke CSV!`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  border: '1px solid #0ea5e9',
                  color: '#0ea5e9',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Export CSV Kudos</span>
              </button>
              <span className="badge-gold" style={{ fontSize: '0.75rem' }}>
                Moderasi Konten Aktif
              </span>
            </div>
          </div>

          {(() => {
            const ADMIN_KUDOS_PER_PAGE = 10;
            const filteredAdminKudos = kudosList.filter((k: any) => {
              const q = kudosSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (k.sender || '').toLowerCase().includes(q) ||
                (k.recipient || '').toLowerCase().includes(q) ||
                (k.message || '').toLowerCase().includes(q);
              const matchesCat = kudosCatFilter === 'all' || k.category === kudosCatFilter;
              return matchesSearch && matchesCat;
            });

            const totalAdminKudosPages = Math.ceil(filteredAdminKudos.length / ADMIN_KUDOS_PER_PAGE) || 1;
            const safeAdminKudosPage = Math.min(Math.max(1, adminKudosPage), totalAdminKudosPages);
            const paginatedAdminKudos = filteredAdminKudos.slice(
              (safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE,
              safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar Kiriman Kudos ({filteredAdminKudos.length} dari {kudosList.length}):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '240px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari pengirim, penerima..."
                        value={kudosSearchQuery}
                        onChange={(e) => {
                          setKudosSearchQuery(e.target.value);
                          setAdminKudosPage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem'
                        }}
                      />
                    </div>

                    {/* Filter grouped right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={kudosCatFilter}
                        onChange={(e) => {
                          setKudosCatFilter(e.target.value);
                          setAdminKudosPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          minWidth: 0,
                          maxWidth: 'min(100%, 220px)',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Kategori Nilai</option>
                        {AKHLAK_VALUES.map(v => (
                          <option key={v.value} value={v.value}>{v.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {filteredAdminKudos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    Tidak ada kiriman apresiasi yang cocok dengan pencarian / filter.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {paginatedAdminKudos.map((kudos: any) => (
                  <div key={kudos.id} style={{
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span className="badge-gold" style={{ fontSize: '0.68rem' }}>{kudos.category}</span>
                        <strong style={{ color: 'var(--neon-cyan)', fontSize: '0.92rem' }}>{kudos.sender}</strong>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>kepada</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{kudos.recipient}</strong>
                      </div>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{kudos.message}"
                      </p>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                        <span>⏱️ {formatWibTimestamp(kudos.createdAt || kudos.created_at || kudos.exactTimestamp).full}</span>
                        <span>•</span>
                        <span>❤️ {kudos.likes || 1} Apresiasi</span>
                      </div>
                      {kudos.updatedAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {formatLastUpdatedWib(kudos.updatedAt)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setEditingItem({ type: 'kudos', item: { ...kudos } })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(255,184,0,0.12)',
                          border: '1px solid var(--mandiri-gold)',
                          color: 'var(--mandiri-gold)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Edit kiriman apresiasi"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'kudos', id: kudos.id, name: `Apresiasi dari ${kudos.sender} untuk ${kudos.recipient}` })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(244,63,94,0.12)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Hapus kiriman apresiasi"
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}

                {totalAdminKudosPages > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    marginTop: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Menampilkan <strong>{(safeAdminKudosPage - 1) * ADMIN_KUDOS_PER_PAGE + 1} - {Math.min(safeAdminKudosPage * ADMIN_KUDOS_PER_PAGE, filteredAdminKudos.length)}</strong> dari <strong>{filteredAdminKudos.length}</strong> apresiasi
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeAdminKudosPage === 1}
                        onClick={() => setAdminKudosPage((p: any) => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminKudosPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminKudosPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: safeAdminKudosPage === 1 ? 0.45 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      {Array.from({ length: totalAdminKudosPages }, (_, i) => i + 1).map((pg) => {
                        const isActive = pg === safeAdminKudosPage;
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminKudosPage(pg)}
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
                        disabled={safeAdminKudosPage === totalAdminKudosPages}
                        onClick={() => setAdminKudosPage((p: any) => Math.min(totalAdminKudosPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: safeAdminKudosPage === totalAdminKudosPages ? 'var(--text-dim)' : 'var(--text-main)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: safeAdminKudosPage === totalAdminKudosPages ? 'not-allowed' : 'pointer',
                          opacity: safeAdminKudosPage === totalAdminKudosPages ? 0.45 : 1
                        }}
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}
              </div>
            );
          })()}

          {/* Kotak Ide & Aspirasi Masuk */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px' }}>
            {(() => {
              const normalizeAdminAspStatus = (st: any) => st === 'Masuk Rencana Proker' ? 'Masuk Rencana Event' : (st || 'Menunggu Review');
              const filteredAdminAspirasi = aspirasiList.filter((a: any) => {
                const q = aspirasiSearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (a.title || '').toLowerCase().includes(q) ||
                  (a.description || '').toLowerCase().includes(q) ||
                  (a.sender || '').toLowerCase().includes(q) ||
                  (a.category || '').toLowerCase().includes(q) ||
                  (a.adminReply || '').toLowerCase().includes(q);
                const matchesCat = aspirasiAdminCatFilter === 'all' || (a.category || 'Usulan Budaya') === aspirasiAdminCatFilter;
                const matchesStatus = aspirasiAdminStatusFilter === 'all' || normalizeAdminAspStatus(a.status) === aspirasiAdminStatusFilter;
                return matchesSearch && matchesCat && matchesStatus;
              });

              const ADMIN_ASPIRASI_PER_PAGE = 10;
              const totalAdminAspirasiPages = Math.ceil(filteredAdminAspirasi.length / ADMIN_ASPIRASI_PER_PAGE) || 1;
              const safeAdminAspirasiPage = Math.min(Math.max(1, adminAspirasiPage), totalAdminAspirasiPages);
              const paginatedAdminAspirasi = filteredAdminAspirasi.slice(
                (safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE,
                safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE
              );

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="var(--neon-cyan)" />
                      <div>
                        <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Kotak Ide, Tindak Lanjut & Balasan Aspirasi ({filteredAdminAspirasi.length} dari {aspirasiList.length})
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Ubah status realisasi dan berikan tanggapan resmi pengurus yang akan tampil di Papan Transparansi Aspirasi publik.
                        </p>
                      </div>
                    </div>

                    {filteredAdminAspirasi.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                          const header = ['ID', 'Pengusul', 'Kategori', 'Judul Usulan', 'Deskripsi', 'Status Tindak Lanjut', 'Tanggapan Pengurus', 'Publik', 'Waktu Kirim'].map(escapeCsv).join(',');
                          const rows = filteredAdminAspirasi.map((a: any) => [
                            a.id,
                            a.sender || 'Anonim',
                            a.category || 'Usulan Budaya',
                            a.title || a.text || '',
                            a.description || a.text || '',
                            a.status || 'Menunggu Review',
                            a.adminReply || '',
                            a.isPublic !== false ? 'Ya' : 'Tidak',
                            formatWibTimestamp(a.createdAt || a.submittedAt).exact || a.submittedAt || a.createdAt || ''
                          ].map(escapeCsv).join(','));
                          const csvString = '\uFEFF' + [header, ...rows].join('\n');
                          const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `laporan_aspirasi_cnt_it_apd_${Date.now()}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          showToast(`Berhasil mengunduh ${filteredAdminAspirasi.length} data Aspirasi ke CSV!`);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.14)',
                          border: '1px solid #10b981',
                          color: '#10b981',
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <Download size={13} />
                        <span>Export CSV Aspirasi</span>
                      </button>
                    )}
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '14px'
                  }}>
                    <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        placeholder="Cari judul, isi, atau pengusul..."
                        value={aspirasiSearchQuery}
                        onChange={(e) => {
                          setAspirasiSearchQuery(e.target.value);
                          setAdminAspirasiPage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 30px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                      <select
                        value={aspirasiAdminCatFilter}
                        onChange={(e) => {
                          setAspirasiAdminCatFilter(e.target.value);
                          setAdminAspirasiPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          maxWidth: '180px',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Kategori</option>
                        <option value="Kegiatan & Event">Kegiatan & Event Budaya</option>
                        <option value="Olahraga & Wellness">Olahraga, E-Sports & Wellness</option>
                        <option value="Fasilitas & Ruang Kerja">Fasilitas & Kenyamanan Kerja</option>
                        <option value="Sharing & Pengembangan">Tech Sharing & Pengembangan Diri</option>
                        <option value="Sosial & Kerohanian">Sosial, CSR & Kerohanian</option>
                      </select>

                      <select
                        value={aspirasiAdminStatusFilter}
                        onChange={(e) => {
                          setAspirasiAdminStatusFilter(e.target.value);
                          setAdminAspirasiPage(1);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          maxWidth: '170px',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <option value="all">Semua Status</option>
                        <option value="Menunggu Review">⏳ Menunggu Review</option>
                        <option value="Masuk Rencana Event">🚀 Masuk Rencana Event</option>
                        <option value="Sudah Direalisasikan">✓ Sudah Direalisasikan</option>
                      </select>
                    </div>
                  </div>

                  {filteredAdminAspirasi.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      {aspirasiList.length === 0
                        ? 'Belum ada kiriman ide atau aspirasi program budaya dari pengunjung.'
                        : 'Tidak ada aspirasi yang cocok dengan kriteria pencarian atau filter.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {paginatedAdminAspirasi.map((asp: any) => {
                    const curStatus = asp.status || 'Menunggu Review';
                    const isPub = asp.isPublic !== false;
                    const statusColor = curStatus === 'Sudah Direalisasikan'
                      ? '#10b981'
                      : (curStatus === 'Masuk Rencana Event' || curStatus === 'Masuk Rencana Proker')
                        ? 'var(--mandiri-gold)'
                        : 'var(--neon-cyan)';

                    return (
                      <div
                        key={asp.id}
                        style={{
                          padding: '16px 18px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(56, 189, 248, 0.04)',
                          border: '1px solid var(--border-card)',
                          borderLeft: `4px solid ${statusColor}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                                {asp.category || 'Usulan Budaya'}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Pengusul: {asp.sender || 'Anonim'}
                              </span>
                              <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                                • 📅 {formatWibTimestamp(asp.submittedAt || asp.createdAt).exact || asp.submittedAt}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.96rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
                              {asp.title || asp.description}
                            </div>
                            {asp.description && asp.description !== asp.title && (
                              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {asp.description}
                              </div>
                            )}
                            {asp.updatedAt && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                {formatLastUpdatedWib(asp.updatedAt)}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <select
                              value={curStatus === 'Masuk Rencana Proker' ? 'Masuk Rencana Event' : curStatus}
                              onChange={(e) => {
                                const nextSt = e.target.value;
                                if (onUpdateAspirasi) {
                                  onUpdateAspirasi({ ...asp, status: nextSt });
                                  showToast(`Status aspirasi diubah menjadi "${nextSt}"`);
                                }
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--input-bg)',
                                border: `1px solid ${statusColor}`,
                                color: 'var(--text-main)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Menunggu Review">⏳ Menunggu Review</option>
                              <option value="Masuk Rencana Event">🚀 Masuk Rencana Event</option>
                              <option value="Sudah Direalisasikan">✓ Sudah Direalisasikan</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateAspirasi) {
                                  onUpdateAspirasi({ ...asp, isPublic: !isPub });
                                  showToast(!isPub ? 'Aspirasi ditampilkan di Papan Publik' : 'Aspirasi disembunyikan dari publik');
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-full)',
                                background: isPub ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${isPub ? '#10b981' : 'var(--border-card)'}`,
                                color: isPub ? '#10b981' : 'var(--text-dim)',
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Tampilkan atau sembunyikan di halaman publik Wall of Kudos & Aspirasi"
                            >
                              {isPub ? <Eye size={13} /> : <EyeOff size={13} />}
                              <span>{isPub ? 'Publik' : 'Privat'}</span>
                            </button>

                            {onDeleteAspirasi && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({
                                  type: 'aspirasi',
                                  id: asp.id,
                                  name: `Aspirasi "${asp.title || asp.description || 'Kotak Saran'}" dari ${asp.sender || 'Anonim'}`
                                })}
                                style={{
                                  padding: '6px 10px',
                                  background: 'rgba(244,63,94,0.12)',
                                  border: '1px solid #f43f5e',
                                  color: '#f43f5e',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Hapus aspirasi ini secara permanen"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Official Admin Reply Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Tulis tanggapan resmi / tindak lanjut pengurus CNT IT APD (otomatis tersimpan saat klik di luar)..."
                            defaultValue={asp.adminReply || ''}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (asp.adminReply || '') && onUpdateAspirasi) {
                                onUpdateAspirasi({ ...asp, adminReply: val });
                                showToast('Tanggapan pengurus untuk aspirasi berhasil disimpan!');
                              }
                            }}
                            style={{
                              flex: 1,
                              minWidth: '220px',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {totalAdminAspirasiPages > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      marginTop: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Menampilkan <strong>{(safeAdminAspirasiPage - 1) * ADMIN_ASPIRASI_PER_PAGE + 1} - {Math.min(safeAdminAspirasiPage * ADMIN_ASPIRASI_PER_PAGE, filteredAdminAspirasi.length)}</strong> dari <strong>{filteredAdminAspirasi.length}</strong> aspirasi
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={safeAdminAspirasiPage === 1}
                          onClick={() => setAdminAspirasiPage((p: any) => Math.max(1, p - 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminAspirasiPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminAspirasiPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: safeAdminAspirasiPage === 1 ? 0.45 : 1
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Sebelumnya</span>
                        </button>
                        {Array.from({ length: totalAdminAspirasiPages }, (_, i) => i + 1).map((pg) => {
                          const isActive = pg === safeAdminAspirasiPage;
                          return (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setAdminAspirasiPage(pg)}
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
                          disabled={safeAdminAspirasiPage === totalAdminAspirasiPages}
                          onClick={() => setAdminAspirasiPage((p: any) => Math.min(totalAdminAspirasiPages, p + 1))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: safeAdminAspirasiPage === totalAdminAspirasiPages ? 'var(--text-dim)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: safeAdminAspirasiPage === totalAdminAspirasiPages ? 'not-allowed' : 'pointer',
                            opacity: safeAdminAspirasiPage === totalAdminAspirasiPages ? 0.45 : 1
                          }}
                        >
                          <span>Selanjutnya</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
