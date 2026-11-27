import React from 'react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function AcceptedAnnouncement() {
  const {
    acceptedList,
    acceptedPage,
    currentForm,
    forms,
    isDark,
    setAcceptedPage
  } = useDynamicFormContext();

  return (
    <>
      {(() => {
        if (!currentForm?.showAnnouncement || acceptedList.length === 0) return null;

        const ACCEPTED_PER_PAGE = 8;
        const totalAcceptedPages = Math.ceil(acceptedList.length / ACCEPTED_PER_PAGE) || 1;
        const safeAcceptedPage = Math.min(Math.max(1, acceptedPage), totalAcceptedPages);
        const paginatedAccepted = acceptedList.slice(
          (safeAcceptedPage - 1) * ACCEPTED_PER_PAGE,
          safeAcceptedPage * ACCEPTED_PER_PAGE
        );

        return (
          <section style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            <div
              className="glass-panel"
              style={{
                padding: '32px',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                background: isDark
                  ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.08), rgba(15, 29, 53, 0.9))'
                  : 'linear-gradient(145deg, #ecfdf5, #ffffff)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.16)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#10b981',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}
                  >
                    🎉 Hall of Welcome • Pengumuman Resmi
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                    Selamat Datang Peserta & Crew Terpilih ({acceptedList.length})
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Daftar rekan-rekan Insan IT APD yang telah resmi dinyatakan <strong>Lolos Seleksi / Terdaftar</strong> pada program dan rekrutmen CNT IT APD.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px'
                }}
              >
                {paginatedAccepted.map((sub: any) => {
                  const { participantName, participantDetail } = sub;

                  return (
                    <div
                      key={sub.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderLeft: '4px solid #10b981',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: '#10b981'
                            }}
                          >
                            ✓ Diterima
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {formatWibTimestamp(sub.createdAt || sub.submittedAt).exact || sub.submittedAt || sub.createdAt}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
                          {participantName}
                        </div>

                        {participantDetail && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontWeight: 700, marginBottom: '4px' }}>
                            {participantDetail}
                          </div>
                        )}

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📋 {forms.find((f: any) => f.id === sub.formId)?.title || sub.formTitle || 'Formulir'}
                        </div>
                      </div>

                      {sub.adminNotes && (
                        <div
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                            border: '1px dashed rgba(16, 185, 129, 0.35)',
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            lineHeight: 1.45
                          }}
                        >
                          <strong style={{ color: '#10b981', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                            📌 Info Onboarding:
                          </strong>
                          {sub.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Hall of Welcome */}
              {totalAcceptedPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Halaman <strong>{safeAcceptedPage}</strong> dari <strong>{totalAcceptedPages}</strong> ({acceptedList.length} peserta lolos)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={safeAcceptedPage === 1}
                      onClick={() => setAcceptedPage((prev: any) => Math.max(1, prev - 1))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeAcceptedPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: safeAcceptedPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: safeAcceptedPage === 1 ? 0.45 : 1
                      }}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalAcceptedPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setAcceptedPage(pg)}
                        style={{
                          minWidth: '28px',
                          height: '28px',
                          padding: '0 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: pg === safeAcceptedPage ? '#10b981' : 'var(--input-bg)',
                          color: pg === safeAcceptedPage ? '#ffffff' : 'var(--text-main)',
                          border: pg === safeAcceptedPage ? 'none' : '1px solid var(--border-card)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={safeAcceptedPage === totalAcceptedPages}
                      onClick={() => setAcceptedPage((prev: any) => Math.min(totalAcceptedPages, prev + 1))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: safeAcceptedPage === totalAcceptedPages ? 'var(--text-dim)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: safeAcceptedPage === totalAcceptedPages ? 'not-allowed' : 'pointer',
                        opacity: safeAcceptedPage === totalAcceptedPages ? 0.45 : 1
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}
    </>
  );
}
