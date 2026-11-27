import React from 'react';
import { Search, X } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function StatusTracker() {
  const {
    dynamicSearchKeysString,
    forms,
    getStatusBadgeStyle,
    hasConfiguredIndex,
    isDark,
    isTracking,
    matchedSubmissions,
    setStatusQuery,
    statusQuery,
    trackingActiveForms,
    trimmedStatusQuery
  } = useDynamicFormContext();

  return (
    <>
      {trackingActiveForms.length > 0 && (
        <section id="status-tracker-section" style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{
            padding: '32px',
            border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-cyan" style={{ fontSize: '0.68rem', marginBottom: '6px' }}>
                  Transparansi Seleksi & Registrasi
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                  🔍 Cek Status Pendaftaran & Seleksi Saya
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Sudah pernah mengisi formulir? Ketik <strong>{hasConfiguredIndex ? `${dynamicSearchKeysString} lengkap atau ID Pendaftaran (sub-...)` : 'ID Pendaftaran (sub-...)'}</strong> Anda untuk melihat progres seleksi & catatan panitia.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.74rem',
                  lineHeight: 1.45,
                  color: 'var(--neon-cyan)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ flexShrink: 0, marginTop: '1px' }}>🔒</span>
                  <span><strong>Privasi Terjamin:</strong> Sistem menggunakan pencarian eksak (Exact Match) pada {hasConfiguredIndex ? `Indeks Pencarian (${dynamicSearchKeysString}) & ID Unik pendaftaran` : 'ID Pendaftaran (sub-...)'}. Pencarian parsial atau Nama Umum sengaja diblokir demi melindungi privasi seluruh pelamar.</span>
                </div>

                {/* Section: Berlaku Untuk & Indeks Pencarian Form */}
                {trackingActiveForms.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '10px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: isDark ? 'rgba(255, 184, 0, 0.06)' : 'rgba(255, 184, 0, 0.08)',
                    border: '1px solid rgba(255, 184, 0, 0.3)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      fontWeight: 800,
                      color: 'var(--mandiri-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <span>📋 Berlaku Untuk :</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                      {trackingActiveForms.map((f: any) => {
                        const searchIndexFields = (f.fields || []).filter((fld: any) => Boolean(fld.isSearchIndex));
                        const indexLabels = searchIndexFields.map((fld: any) => fld.label || 'Indeks Pencarian');

                        return (
                          <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: 'var(--mandiri-gold)', fontWeight: 800, flexShrink: 0 }}>•</span>
                            <div style={{ color: 'var(--text-main)', wordBreak: 'break-word', flex: 1 }}>
                              <strong>Form {f.title}</strong>
                              {' — '}
                              <span style={{ color: 'var(--text-muted)' }}>Indeks Pencarian : </span>
                              <span style={{
                                color: indexLabels.length > 0 ? 'var(--neon-cyan)' : 'var(--mandiri-gold)',
                                fontWeight: 700
                              }}>
                                {indexLabels.length > 0
                                  ? `${indexLabels.join(', ')} atau ID Pendaftaran (sub-...)`
                                  : 'ID Pendaftaran (sub-...)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={hasConfiguredIndex ? `Ketik ${dynamicSearchKeysString} lengkap Anda atau ID Pendaftaran (sub-...)` : 'Ketik ID Pendaftaran Anda (misal: sub-1731...)'}
                value={statusQuery}
                onChange={(e) => setStatusQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 38px 12px 42px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1.5px solid var(--input-border)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              {statusQuery && (
                <button
                  type="button"
                  onClick={() => setStatusQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {statusQuery.trim().length > 0 && statusQuery.trim().length < 3 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '6px' }}>
                Ketik minimal 3 karakter {hasConfiguredIndex ? dynamicSearchKeysString : 'ID Pendaftaran'} Anda...
              </div>
            )}

            {trimmedStatusQuery.length >= 3 && !isTracking && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {matchedSubmissions.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--input-bg)',
                    border: '1px dashed var(--border-card)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    Tidak ditemukan data pendaftaran dengan kunci <strong>"{statusQuery}"</strong>. Sistem menggunakan pencarian eksak (Exact Match), pastikan Anda memasukkan {hasConfiguredIndex ? `${dynamicSearchKeysString} lengkap atau ID Pendaftaran (sub-...)` : 'ID Pendaftaran (sub-...)'} yang persis sesuai saat mendaftar.
                  </div>
                ) : (
                matchedSubmissions.map((sub: any) => {
                  const statusText = sub.status || 'Baru Masuk';
                  const badge = getStatusBadgeStyle(statusText);
                  const dataEntries = Object.entries(sub.data || {});
                  const primaryIdentity = dataEntries.slice(0, 3).map(([, v]) => String(v)).filter(Boolean).join(' • ');

                  return (
                    <div
                      key={sub.id}
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--input-bg)',
                        border: `1.5px solid ${badge.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            ID: {sub.id} • {formatWibTimestamp(sub.createdAt || sub.submittedAt).exact || sub.submittedAt || sub.createdAt}
                          </span>
                          <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                            {forms.find((f: any) => f.id === sub.formId)?.title || sub.formTitle || 'Formulir'}
                          </h4>
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          <span>{badge.icon}</span>
                          <span>Status: {badge.label}</span>
                        </span>
                      </div>

                      {primaryIdentity && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <strong>Pendaftar:</strong> {primaryIdentity}
                        </div>
                      )}

                      {sub.adminNotes ? (
                        <div style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                          borderLeft: '3px solid var(--neon-cyan)',
                          fontSize: '0.82rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.5
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '2px' }}>
                            💬 Catatan / Informasi dari Panitia CNT IT APD:
                          </div>
                          <div>{sub.adminNotes}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Belum ada catatan tambahan dari panitia. Pantau secara berkala untuk pembaruan jadwal wawancara atau pengumuman seleksi.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>
      )}
    </>
  );
}
