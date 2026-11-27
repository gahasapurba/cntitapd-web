import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatDeadlineWib, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPicker() {
  const {
    activeForms,
    events,
    isDark,
    onSelectFormUrl,
    registrationCounts,
    selectedFormId,
    setErrors,
    setFileData,
    setFormData,
    setIsSubmitted,
    setSelectedFormId
  } = useDynamicFormContext();

  return (
    <>
      {activeForms.length > 1 && (
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pilih Formulir yang Ingin Diisi:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {activeForms.map((f: any) => {
              const isSelected = f.id === selectedFormId;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFormId(f.id);
                    if (onSelectFormUrl) onSelectFormUrl(f.id);
                    setFormData({});
                    setFileData({});
                    setErrors({});
                    setIsSubmitted(false);
                  }}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                    background: isSelected ? (isDark ? 'rgba(255,184,0,0.08)' : '#fffbeb') : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(255,184,0,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge-cyan" style={{ fontSize: '0.68rem' }}>
                        {f.category || 'Formulir'}
                      </span>
                      {(() => {
                        const formQuota = getUnifiedFormQuota(f, events, registrationCounts);
                        if (!formQuota.isLimited || formQuota.maxQuota <= 0) return null;
                        const isFull = formQuota.isFull;
                        return (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isFull
                              ? (isDark ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6')
                              : (isDark ? 'rgba(6, 182, 212, 0.15)' : '#e0f2fe'),
                            color: isFull
                              ? (isDark ? '#f43f5e' : '#be123c')
                              : (isDark ? '#06b6d4' : '#0369a1'),
                            border: `1px solid ${isFull
                              ? (isDark ? 'rgba(244, 63, 94, 0.4)' : '#fca5a5')
                              : (isDark ? 'rgba(6, 182, 212, 0.4)' : '#7dd3fc')}`
                          }}>
                            {isFull
                              ? `🔒 ${formQuota.isConnected ? 'Kuota Acara Penuh' : 'Kuota Penuh'} (${formQuota.count}/${formQuota.maxQuota})`
                              : `👥 ${formQuota.isConnected ? 'Acara' : 'Kuota'}: ${formQuota.count}/${formQuota.maxQuota} Terisi`
                            }
                          </span>
                        );
                      })()}
                    </div>
                    {(() => {
                      const dl = getDeadlineStatus(f.deadline);
                      if (dl.isExpired) {
                        return (
                          <span className="badge-red" style={{ fontSize: '0.66rem' }}>
                            Ditutup ({dl.formatted})
                          </span>
                        );
                      }
                      if (dl.isToday) {
                        return (
                          <span className="badge-gold" style={{ fontSize: '0.66rem' }}>
                            ⚠️ Hari Terakhir!
                          </span>
                        );
                      }
                      return (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          Deadline: {formatDeadlineWib(f.deadline)}
                        </span>
                      );
                    })()}
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {f.subtitle}
                  </p>
                  {(() => {
                    const isFull = getUnifiedFormQuota(f, events, registrationCounts).isFull;
                    const isClosed = f.isOpen === false || getDeadlineStatus(f.deadline).isExpired;
                    const cardLabel = isSelected
                      ? (isClosed ? '✓ Sedang Ditampilkan (Ditutup)' : '✓ Sedang Ditampilkan')
                      : isClosed
                        ? '🔒 Ditutup (Lihat Detail)'
                        : (isFull ? '🔒 Kuota Penuh (Lihat Detail)' : 'Buka Formulir');
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-card)', fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--mandiri-gold)' : ((isFull || isClosed) ? '#f43f5e' : 'var(--text-muted)') }}>
                        <span>{cardLabel}</span>
                        <ChevronRight size={14} />
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
