import React from 'react';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { formatToIndonesianDate, formatWibEventRange, getDeadlineStatus } from '../../../utils/dateUtils';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function EventSummaryCard() {
  const {
    connectedForm,
    effectiveIsLimited,
    effectiveMaxQuota,
    event,
    isDark,
    isFormClosed,
    isLuckyDrawEnabled,
    totalPendaftar
  } = useRegistrationStats();

  return (
    <>
      <div className="glass-panel" style={{
        padding: '22px 24px',
        border: '1.5px solid var(--mandiri-blue)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {(() => {
            const s = event?.startDate || event?.date || '';
            const e = event?.endDate || s;
            const sRawDate = s.slice(0, 10);
            const eRawDate = e.slice(0, 10);

            let eventDateDisplay = 'Tanggal Agenda';
            if (/^\d{4}-\d{2}-\d{2}$/.test(sRawDate) && /^\d{4}-\d{2}-\d{2}$/.test(eRawDate)) {
              if (sRawDate === eRawDate) {
                eventDateDisplay = formatToIndonesianDate(sRawDate);
              } else {
                eventDateDisplay = formatWibEventRange(sRawDate, eRawDate);
              }
            } else if (s || e) {
              eventDateDisplay = formatWibEventRange(s, e, event?.date || 'Tanggal Agenda');
            }

            let eventTimeDisplay = null;
            if (event?.time && event.time !== 'WIB') {
              eventTimeDisplay = event.time;
            } else {
              const sHasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
              if (sHasTime) {
                const sTime = s.includes('T') ? s.split('T')[1]?.slice(0, 5) : s.match(/\d{2}:\d{2}/)?.[0];
                const eTime = e.includes('T') ? e.split('T')[1]?.slice(0, 5) : e.match(/\d{2}:\d{2}/)?.[0];
                if (sTime && eTime && sTime !== eTime) {
                  eventTimeDisplay = `${sTime} - ${eTime} WIB`;
                } else if (sTime) {
                  eventTimeDisplay = `${sTime} WIB`;
                }
              }
            }

            return (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 184, 0, 0.15)', border: '1px solid var(--mandiri-gold)', color: 'var(--mandiri-gold)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  <Sparkles size={13} />
                  <span>{isLuckyDrawEnabled ? 'Dashboard Analitik & Undian Acara' : 'Dashboard Analitik Acara'}</span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.25 }}>
                  {event.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--mandiri-gold)" />
                    <span>{eventDateDisplay}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--neon-cyan)" />
                    <span>{event.location || 'Direktorat IT Bank Mandiri'}</span>
                  </div>
                  {eventTimeDisplay && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#10b981" />
                      <span>{eventTimeDisplay}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Connected Form Pill Banner */}
          {connectedForm ? (
            <div style={{
              background: isFormClosed
                ? (isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2')
                : 'rgba(56, 189, 248, 0.08)',
              border: isFormClosed
                ? '1px solid rgba(239, 68, 68, 0.35)'
                : '1px solid rgba(56, 189, 248, 0.35)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              maxWidth: '340px',
              width: '100%'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: isFormClosed ? '#f87171' : 'var(--neon-cyan)',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '3px'
              }}>
                🔗 Formulir Pendaftaran Terhubung
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {connectedForm.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {effectiveIsLimited && effectiveMaxQuota > 0 ? `Kuota Form: ${effectiveMaxQuota} Peserta` : 'Kuota Form: Tanpa Batas'} • {(() => {
                  if (isFormClosed) {
                    const dl = connectedForm.deadline ? getDeadlineStatus(connectedForm.deadline) : null;
                    if (dl?.isExpired) {
                      return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Ditutup (Batas Waktu Berakhir)</span>;
                    }
                    return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Formulir Ditutup</span>;
                  }
                  const isQuotaFull = effectiveIsLimited && effectiveMaxQuota > 0 && totalPendaftar >= effectiveMaxQuota;
                  if (isQuotaFull) {
                    return <span style={{ color: '#f87171', fontWeight: 700 }}>🔒 Kuota Penuh</span>;
                  }
                  return <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Pendaftaran Dibuka</span>;
                })()}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 184, 0, 0.08)',
              border: '1px dashed var(--mandiri-gold)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.76rem',
              color: 'var(--mandiri-gold)'
            }}>
              ⚠️ Event ini belum terhubung ke Formulir Pendaftaran khusus.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
