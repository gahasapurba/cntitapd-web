import React from 'react';
import { ArrowLeft, ClipboardList, Download, Globe, LogOut, RefreshCw, Upload } from 'lucide-react';
import { SYNC_BADGE } from './adminShared';
import { useAdminPortal } from './AdminPortalContext';

export default function AdminHeaderBar() {
  const {
    activeTenure,
    announcementBar,
    aspirasiList,
    brandAssets,
    divisions,
    eventRsvps,
    events,
    faqs,
    forms,
    galleries,
    kudosList,
    luckyDraws,
    members,
    onAdminLogout,
    onBack,
    onResetDefault,
    onRestoreBackup,
    pageVisibility,
    roleQuotas,
    setDeleteConfirm,
    setShowExecutiveReportModal,
    showToast,
    submissions,
    syncStatus,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Web</span>
          </button>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-card)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Admin Dashboard CNT IT APD
          </h2>
          {/* Cloud Sync Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.73rem',
              fontWeight: 800,
              background: SYNC_BADGE[syncStatus].background,
              border: `1px solid ${SYNC_BADGE[syncStatus].color}`,
              color: SYNC_BADGE[syncStatus].color
            }}
            title="Seluruh perubahan otomatis disimpan di Cloud Database agar tersinkronisasi di semua perangkat"
          >
            <Globe size={13} />
            <span>{SYNC_BADGE[syncStatus].label}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowExecutiveReportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
            title="Buka & Cetak Laporan Eksekutif / LPJ Periode Kepengurusan"
          >
            <ClipboardList size={14} />
            <span>📄 Laporan Eksekutif / LPJ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const snapshot = {
                meta: {
                  app: 'CNT IT APD Portal',
                  exportedAt: new Date().toISOString(),
                  activeTenureId: activeTenure?.id || ''
                },
                tenures,
                divisions,
                members,
                events,
                galleries,
                kudosList,
                aspirasiList,
                forms,
                submissions,
                brandAssets,
                eventRsvps,
                luckyDraws,
                tenureRoles,
                roleQuotas,
                faqs,
                pageVisibility,
                announcementBar
              };
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Backup_CNT_IT_APD_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              showToast('Snapshot Backup Penuh (.json) seluruh 13 tabel berhasil diunduh!');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(168, 85, 247, 0.14)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              padding: '7px 13px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
            title="Unduh Backup Penuh (.json) seluruh data 13 tabel database CNT IT APD"
          >
            <Download size={13} />
            <span>💾 Backup (.json)</span>
          </button>

          {onRestoreBackup && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Pulihkan (Restore) seluruh data dari file Backup (.json)"
            >
              <Upload size={13} />
              <span>📂 Restore (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const parsed = JSON.parse(String(evt.target?.result || '{}'));
                      if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.members) && !Array.isArray(parsed.events))) {
                        showToast('Format file Backup (.json) tidak valid', 'error');
                        return;
                      }
                      await onRestoreBackup(parsed);
                      showToast('Seluruh data berhasil dipulihkan dari file Backup & disinkronkan ke Cloud!');
                    } catch (err: any) {
                      showToast('Gagal membaca file Backup (.json)', 'error');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {onResetDefault && (
            <button
              type="button"
              onClick={() => setDeleteConfirm({ type: 'reset_all', id: 'reset', name: 'Sync Data' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.14)',
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                padding: '7px 13px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.12)'
              }}
              title="Clear cache lokal dan reload data terbaru dari database"
            >
              <RefreshCw size={13} />
              <span>Sync Data</span>
            </button>
          )}

          <button
            onClick={async () => {
              try {
                await onAdminLogout();
              } catch (err: any) {
                showToast(err.message || 'Gagal keluar dari sesi admin', 'error');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            <span>Logout Admin</span>
          </button>
        </div>
      </div>
    </>
  );
}
