import React from 'react';
import { Download, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function DepartmentsTab() {
  const {
    activeTab,
    clearFieldError,
    departments,
    deptPage,
    deptRsvpFilter,
    deptSearchQuery,
    eventRsvps,
    formErrors,
    handleCreateDepartment,
    handleDeleteDepartmentClick,
    newDeptCode,
    newDeptDesc,
    newDeptName,
    renderFieldError,
    setDeptPage,
    setDeptRsvpFilter,
    setDeptSearchQuery,
    setEditingItem,
    setNewDeptCode,
    setNewDeptDesc,
    setNewDeptName,
    showToast
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'departments' && (() => {
        const DEPTS_PER_PAGE = 10;
        const filteredDepts = (departments || []).filter((d: any) => {
          const matchesSearch = (d.name || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
            (d.code || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
            (d.description || '').toLowerCase().includes(deptSearchQuery.toLowerCase());
          const rsvpCount = (eventRsvps || []).filter(
            (r: any) => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
          ).length;
          const matchesRsvp = deptRsvpFilter === 'all' ||
            (deptRsvpFilter === 'with_rsvp' && rsvpCount > 0) ||
            (deptRsvpFilter === 'no_rsvp' && rsvpCount === 0);
          return matchesSearch && matchesRsvp;
        });
        const totalDeptPages = Math.ceil(filteredDepts.length / DEPTS_PER_PAGE) || 1;
        const safeDeptPage = Math.min(Math.max(1, deptPage), totalDeptPages);
        const paginatedDepts = filteredDepts.slice(
          (safeDeptPage - 1) * DEPTS_PER_PAGE,
          safeDeptPage * DEPTS_PER_PAGE
        );

        return (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Manajemen Departemen IT APD ({departments.length})
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Kelola daftar departemen/unit kerja di lingkungan IT Application Delivery sebagai pilihan resmi saat pendaftaran RSVP kegiatan.
              </p>
            </div>

            {/* Form Tambah Departemen Baru */}
            <form onSubmit={handleCreateDepartment} noValidate className="admin-form-two-col" style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nama Departemen <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Core Banking Delivery"
                  value={newDeptName}
                  onChange={(e) => {
                    setNewDeptName(e.target.value);
                    clearFieldError('newDeptName');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${formErrors.newDeptName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                {renderFieldError('newDeptName')}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kode / Singkatan Departemen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: CBD"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Deskripsi / Tanggung Jawab Departemen
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan peran departemen..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
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
                    background: 'var(--mandiri-gold)',
                    color: '#040914',
                    padding: '9px 20px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Tambahkan Departemen Baru</span>
                </button>
              </div>
            </form>

            {/* Search, Filter & Export CSV Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              borderTop: '1px solid var(--border-card)',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 360px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama atau kode departemen..."
                    value={deptSearchQuery}
                    onChange={(e) => {
                      setDeptSearchQuery(e.target.value);
                      setDeptPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>

                <select
                  value={deptRsvpFilter}
                  onChange={(e) => {
                    setDeptRsvpFilter(e.target.value);
                    setDeptPage(1);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  <option value="all">Semua Status RSVP</option>
                  <option value="with_rsvp">Memiliki RSVP Terkait</option>
                  <option value="no_rsvp">Belum Ada RSVP (Aman Dihapus)</option>
                </select>
              </div>

              {departments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                    const header = ['ID Departemen', 'Nama Departemen', 'Kode', 'Deskripsi', 'Jumlah RSVP Terkait'].map(escapeCsv).join(',');
                    const rows = departments.map((d: any) => {
                      const rsvpCount = (eventRsvps || []).filter(
                        (r: any) => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
                      ).length;
                      return [d.id, d.name, d.code || '', d.description || '', rsvpCount].map(escapeCsv).join(',');
                    });
                    const csvString = '\uFEFF' + [header, ...rows].join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `daftar_departemen_cnt_it_apd_${Date.now()}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showToast(`Berhasil mengunduh data departemen ke CSV!`);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Export CSV Departemen</span>
                </button>
              )}
            </div>

            {/* List Departemen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paginatedDepts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Tidak ada departemen yang cocok dengan pencarian "{deptSearchQuery}".
                </div>
              ) : (
                paginatedDepts.map((d: any) => {
                  const rsvpCount = (eventRsvps || []).filter(
                    (r: any) => r.departmentId === d.id || r.department === d.id || (d.name && r.department === d.name)
                  ).length;
                  const isSafeToDelete = rsvpCount === 0;

                  return (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-card)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.name}</strong>
                          {d.code && (
                            <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              {d.code}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: rsvpCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.05)',
                              color: rsvpCount > 0 ? 'var(--neon-cyan)' : 'var(--text-dim)',
                              border: rsvpCount > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-card)',
                              fontWeight: 700
                            }}
                          >
                            👥 {rsvpCount} RSVP Terkait
                          </span>
                        </div>
                        {d.description && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {d.description}
                          </p>
                        )}
                        {d.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {formatLastUpdatedWib(d.updatedAt)}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            type: 'department',
                            item: { ...d }
                          })}
                          title="Edit Data Departemen"
                          style={{
                            padding: '7px',
                            background: 'rgba(14, 165, 233, 0.1)',
                            border: '1px solid #0284c7',
                            color: '#0284c7',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isSafeToDelete) {
                              showToast(
                                `Departemen "${d.name}" tidak dapat dihapus karena masih digunakan oleh ${rsvpCount} data RSVP. Hapus data RSVP terkait terlebih dahulu.`,
                                'error'
                              );
                              return;
                            }
                            handleDeleteDepartmentClick(d);
                          }}
                          title={isSafeToDelete ? 'Hapus Departemen' : `Tidak dapat dihapus: masih memiliki ${rsvpCount} RSVP`}
                          style={{
                            padding: '7px',
                            background: isSafeToDelete ? 'rgba(244, 63, 94, 0.1)' : 'rgba(148, 163, 184, 0.08)',
                            border: isSafeToDelete ? '1px solid #f43f5e' : '1px solid var(--border-card)',
                            color: isSafeToDelete ? '#f43f5e' : 'var(--text-dim)',
                            borderRadius: '6px',
                            cursor: isSafeToDelete ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isSafeToDelete ? 1 : 0.45
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalDeptPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-card)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Menampilkan <strong>{(safeDeptPage - 1) * DEPTS_PER_PAGE + 1} - {Math.min(safeDeptPage * DEPTS_PER_PAGE, filteredDepts.length)}</strong> dari <strong>{filteredDepts.length}</strong> departemen
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={safeDeptPage === 1}
                    onClick={() => setDeptPage((p: any) => Math.max(1, p - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeDeptPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: safeDeptPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: safeDeptPage === 1 ? 0.45 : 1
                    }}
                  >
                    <span>Sebelumnya</span>
                  </button>

                  {Array.from({ length: totalDeptPages }, (_, i) => i + 1).map((pg) => {
                    const isActive = pg === safeDeptPage;
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setDeptPage(pg)}
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
                    disabled={safeDeptPage === totalDeptPages}
                    onClick={() => setDeptPage((p: any) => Math.min(totalDeptPages, p + 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: safeDeptPage === totalDeptPages ? 'var(--text-dim)' : 'var(--text-main)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: safeDeptPage === totalDeptPages ? 'not-allowed' : 'pointer',
                      opacity: safeDeptPage === totalDeptPages ? 0.45 : 1
                    }}
                  >
                    <span>Selanjutnya</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
