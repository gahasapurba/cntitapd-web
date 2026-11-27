import React from 'react';
import { ChevronLeft, ChevronRight, Download, Edit2, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function TenureTab() {
  const {
    activeTab,
    activeTenure,
    clearFieldError,
    formErrors,
    handleCreateTenure,
    handleDeleteTenureClick,
    newTenureCode,
    newTenureHeadline,
    newTenureHighlight,
    newTenureMisi,
    newTenureTagline,
    newTenureTitle,
    newTenureVisi,
    onSelectTenure,
    onUpdateTenure,
    renderFieldError,
    setEditingItem,
    setNewTenureCode,
    setNewTenureHeadline,
    setNewTenureHighlight,
    setNewTenureMisi,
    setNewTenureTagline,
    setNewTenureTitle,
    setNewTenureVisi,
    setTenurePage,
    setTenureSearchQuery,
    setTenureStatusFilter,
    showToast,
    tenurePage,
    tenureSearchQuery,
    tenureStatusFilter,
    tenures
  } = useAdminPortal();

  return (
    <>
      {activeTab === 'tenure' && (() => {
        const TENURES_PER_PAGE = 6;
        const filteredTenures = (tenures || []).filter((t: any) => {
          const q = tenureSearchQuery.toLowerCase().trim();
          const matchesSearch = !q ||
            (t.code || '').toLowerCase().includes(q) ||
            (t.title || '').toLowerCase().includes(q) ||
            (t.themeTagline || '').toLowerCase().includes(q) ||
            (t.heroHeadline || '').toLowerCase().includes(q);
          const isActive = activeTenure?.id === t.id || Boolean(t.isActive);
          const matchesStatus = tenureStatusFilter === 'all' ||
            (tenureStatusFilter === 'active' && isActive) ||
            (tenureStatusFilter === 'archived' && !isActive);
          return matchesSearch && matchesStatus;
        });
        const totalTenurePages = Math.ceil(filteredTenures.length / TENURES_PER_PAGE) || 1;
        const safeTenurePage = Math.min(Math.max(1, tenurePage), totalTenurePages);
        const paginatedTenures = filteredTenures.slice(
          (safeTenurePage - 1) * TENURES_PER_PAGE,
          safeTenurePage * TENURES_PER_PAGE
        );

        return (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Manajemen Periode Kepengurusan
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Memungkinkan pergantian tahun kepengurusan tanpa menghapus sejarah pengurus lama.
            </p>
          </div>

          <form onSubmit={handleCreateTenure} noValidate className="admin-form-two-col" style={{
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Kode Tahun <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: 2027"
                value={newTenureCode}
                onChange={(e) => {
                  setNewTenureCode(e.target.value);
                  clearFieldError('newTenureCode');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.newTenureCode ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('newTenureCode')}
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Nama Periode <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="misal: Kepengurusan CNT IT APD 2027"
                value={newTenureTitle}
                onChange={(e) => {
                  setNewTenureTitle(e.target.value);
                  clearFieldError('newTenureTitle');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${formErrors.newTenureTitle ? '#f43f5e' : 'var(--input-border)'}`,
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
              {renderFieldError('newTenureTitle')}
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Motto / Tagline Tema Budaya
              </label>
              <input
                type="text"
                placeholder="misal: Elevating Culture, Tech Synergy & Human Excellence"
                value={newTenureTagline}
                onChange={(e) => setNewTenureTagline(e.target.value)}
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

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Headline Beranda
              </label>
              <input
                type="text"
                placeholder="misal: COMMITTED TO CULTIVATE"
                value={newTenureHeadline}
                onChange={(e) => setNewTenureHeadline(e.target.value)}
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

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Highlight Berwarna Neon
              </label>
              <input
                type="text"
                placeholder="misal: EXCELLENCE & SYNERGY"
                value={newTenureHighlight}
                onChange={(e) => setNewTenureHighlight(e.target.value)}
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
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Visi Budaya Periode Ini
              </label>
              <textarea
                rows={2}
                placeholder="Menjadi akselerator budaya kerja kolaboratif, agile, dan profesional..."
                value={newTenureVisi}
                onChange={(e) => setNewTenureVisi(e.target.value)}
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
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Misi Budaya (Pisahkan baris per butir misi)
              </label>
              <textarea
                rows={3}
                placeholder="Memperkuat sinergi dan komunikasi terbuka&#10;Menumbuhkan wellbeing jasmani dan rohani&#10;Menyediakan panggung apresiasi prestasi"
                value={newTenureMisi}
                onChange={(e) => setNewTenureMisi(e.target.value)}
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
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Simpan & Tambah Periode
              </button>
            </div>
          </form>

          {/* Filter & Search Bar Tenure */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari kode tahun, nama kabinet, atau tagline..."
                  value={tenureSearchQuery}
                  onChange={(e) => {
                    setTenureSearchQuery(e.target.value);
                    setTenurePage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={tenureStatusFilter}
                onChange={(e) => {
                  setTenureStatusFilter(e.target.value);
                  setTenurePage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <option value="all">Semua Status Periode ({tenures.length})</option>
                <option value="active">Periode Aktif Utama</option>
                <option value="archived">Periode Arsip / Non-Aktif</option>
              </select>
            </div>

            {tenures.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                  const header = ['ID Periode', 'Kode Tahun', 'Nama Kabinet / Periode', 'Tagline', 'Headline Hero', 'Status Aktif'].map(escapeCsv).join(',');
                  const rows = tenures.map((t: any) => {
                    const isAct = activeTenure?.id === t.id || Boolean(t.isActive);
                    return [t.id, t.code || '', t.title || '', t.themeTagline || '', t.heroHeadline || '', isAct ? 'Aktif' : 'Arsip'].map(escapeCsv).join(',');
                  });
                  const csvString = '\uFEFF' + [header, ...rows].join('\n');
                  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `daftar_periode_cnt_it_apd_${Date.now()}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  showToast('Berhasil mengunduh data periode ke CSV!');
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
                <span>Export CSV Periode</span>
              </button>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Daftar Periode Kepengurusan ({filteredTenures.length} dari {tenures.length}):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paginatedTenures.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  Tidak ada periode kepengurusan yang cocok dengan pencarian "{tenureSearchQuery}".
                </div>
              ) : (
                paginatedTenures.map((t: any) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-card)'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{t.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>"{t.themeTagline}"</div>
                      {t.updatedAt && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {formatLastUpdatedWib(t.updatedAt)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={activeTenure?.id === t.id ? "badge-gold" : "badge-cyan"}>
                        {activeTenure?.id === t.id ? 'Periode Aktif' : 'Arsip'}
                      </span>

                      {activeTenure?.id !== t.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTenure) onSelectTenure(t);
                            if (onUpdateTenure) onUpdateTenure({ ...t, isActive: true });
                            showToast(`Periode "${t.title}" dijadikan periode aktif!`);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(16, 185, 129, 0.14)',
                            border: '1px solid #10b981',
                            color: '#10b981',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Jadikan Aktif
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingItem({
                          type: 'tenure',
                          item: {
                            ...t,
                            rawMisi: Array.isArray(t.misi) ? t.misi.join('\n') : (t.misi || '')
                          }
                        })}
                        title="Edit Periode Kepengurusan"
                        style={{
                          padding: '6px',
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
                        onClick={() => handleDeleteTenureClick(t)}
                        title="Hapus Periode"
                        style={{
                          padding: '6px',
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid #f43f5e',
                          color: '#f43f5e',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination Controls Tenure */}
          {totalTenurePages > 1 && (
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
                Menampilkan <strong>{(safeTenurePage - 1) * TENURES_PER_PAGE + 1} - {Math.min(safeTenurePage * TENURES_PER_PAGE, filteredTenures.length)}</strong> dari <strong>{filteredTenures.length}</strong> periode
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={safeTenurePage === 1}
                  onClick={() => setTenurePage((p: any) => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeTenurePage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeTenurePage === 1 ? 'not-allowed' : 'pointer',
                    opacity: safeTenurePage === 1 ? 0.45 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                {Array.from({ length: totalTenurePages }, (_, idx) => idx + 1).map((pg) => {
                  const isActive = pg === safeTenurePage;
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setTenurePage(pg)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        color: isActive ? '#040914' : 'var(--text-main)',
                        border: isActive ? 'none' : '1px solid var(--border-card)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safeTenurePage === totalTenurePages}
                  onClick={() => setTenurePage((p: any) => Math.min(totalTenurePages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: safeTenurePage === totalTenurePages ? 'var(--text-dim)' : 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: safeTenurePage === totalTenurePages ? 'not-allowed' : 'pointer',
                    opacity: safeTenurePage === totalTenurePages ? 0.45 : 1
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
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
