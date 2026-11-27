import React from 'react';
import { Download, X } from 'lucide-react';
import { formatWibEventRange } from '../../utils/dateUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function ExecutiveReportModal() {
  const {
    activeTenure,
    aspirasiList,
    divisions,
    events,
    galleries,
    kudosList,
    members,
    reportTenureId,
    setReportTenureId,
    setShowExecutiveReportModal,
    showExecutiveReportModal,
    tenures
  } = useAdminPortal();

  return (
    <>
      {showExecutiveReportModal && (() => {
        const selectedReportTenureId = reportTenureId || activeTenure?.id || tenures[0]?.id || '';
        const selectedReportTenure = tenures.find((t: any) => t.id === selectedReportTenureId) || activeTenure || tenures[0];

        const reportEvents = events.filter((e: any) => e.tenureId === selectedReportTenureId || (!e.tenureId && divisions.find((d: any) => d.id === e.divisionId)?.tenureId === selectedReportTenureId));
        const reportMembers = members.filter((m: any) => m.tenureId === selectedReportTenureId);
        const reportGalleries = galleries.filter((g: any) => g.tenureId === selectedReportTenureId || (!g.tenureId && divisions.find((d: any) => d.id === g.divisionId || d.name === g.division)?.tenureId === selectedReportTenureId));

        const completedEvents = reportEvents.filter((e: any) => e.status === 'Completed').length;
        const eventPercent = reportEvents.length > 0 ? Math.round((completedEvents / reportEvents.length) * 100) : 0;
        const totalRab = reportEvents.reduce((acc: any, e: any) => acc + Number(e.totalRab || 0), 0);
        const coreLeaders = reportMembers.filter((m: any) => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro');
        const realizedAspirasi = aspirasiList.filter((a: any) => a.status === 'Sudah Direalisasikan').length;

        return (
          <div className="executive-report-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div className="glass-panel modal-container executive-report-container" style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px',
              border: '1.5px solid var(--mandiri-gold)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Modal Top Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
                <div>
                  <span className="badge-gold" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                    Executive Summary & LPJ Resmi
                  </span>
                  <h2 style={{ fontSize: 'clamp(1.15rem, 4vw, 1.45rem)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Laporan Pertanggungjawaban & Progres CNT IT APD
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Periode: <strong>{selectedReportTenure?.title || selectedReportTenure?.code || 'Kepengurusan'}</strong>{selectedReportTenure?.themeTagline ? ` • Tema: "${selectedReportTenure.themeTagline}"` : ''}
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={selectedReportTenureId}
                    onChange={(e) => setReportTenureId(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--input-bg)',
                      border: '1.5px solid var(--mandiri-gold)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {tenures.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        Periode {t.code || t.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={15} />
                    <span>🖨️ Cetak / Simpan PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExecutiveReportModal(false)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 1. Key Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(135px, 42vw, 170px), 1fr))', gap: '10px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL PERSONEL</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{reportMembers.length} Orang</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{reportMembers.filter((m: any) => m.category === 'pembina').length} Pembina • 4 Divisi & BPH Inti</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>REALISASI KEGIATAN</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{completedEvents}/{reportEvents.length} ({eventPercent}%)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{reportGalleries.length} Dokumentasi Galeri</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL ANGGARAN (RAB)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--neon-cyan)', marginTop: '4px' }}>Rp {(totalRab / 1000000).toFixed(1)} Jt</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rp {totalRab.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>INDEKS PARTISIPASI</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--mandiri-gold)', marginTop: '4px' }}>{kudosList.length} Kudos</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{aspirasiList.length} Aspirasi ({realizedAspirasi} Terealisasi)</div>
                </div>
              </div>

              {/* 2. Tabel Realisasi Kegiatan & Anggaran */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  I. Rekapitulasi Kegiatan & Rencana Anggaran Biaya (RAB)
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '580px' }}>
                    <thead>
                      <tr style={{ background: 'var(--input-bg)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Nama Kegiatan</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Divisi</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Jadwal</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Peserta</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)' }}>Status</th>
                        <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-card)', textAlign: 'right' }}>Total RAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Belum ada kegiatan yang terdaftar di database untuk periode ini.
                          </td>
                        </tr>
                      ) : (
                        reportEvents.map((evt: any) => (
                          <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text-main)' }}>{evt.title}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.divisionName}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.date || formatWibEventRange(evt.startDate, evt.endDate)}</td>
                            <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{evt.peserta || evt.kpi}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: evt.status === 'Completed' ? '#10b981' : 'var(--mandiri-gold)'
                              }}>
                                {evt.status === 'Completed' ? '✓ Selesai' : evt.status}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                              Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Susunan Pimpinan & Ketua Divisi */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                  II. Susunan Dewan Pembina, Pengurus Inti & Ketua Divisi (Pimpro)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(170px, 45vw, 220px), 1fr))', gap: '10px' }}>
                  {coreLeaders.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                      Belum ada susunan pengurus/pimpinan yang terdaftar pada periode ini.
                    </div>
                  ) : (
                    coreLeaders.map((ldr: any) => (
                      <div key={ldr.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--mandiri-gold)', textTransform: 'uppercase' }}>{ldr.role}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{ldr.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{ldr.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
