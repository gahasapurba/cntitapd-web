import React from 'react';
import { findMatchingRole, getTenureRoles } from '../utils/memberQuotaUtils';
import { useAdminPortal } from './AdminPortalContext';

export default function AdminSummaryBar() {
  const {
    activeTenure,
    aspirasiList,
    divisions,
    events,
    forms,
    isDark,
    kudosList,
    members,
    roleQuotas,
    submissions,
    tenureRoles,
    tenures
  } = useAdminPortal();

  return (
    <>
      {(() => {
        const activeTenureId = activeTenure?.id || '';
        const scopedMembers = activeTenureId ? members.filter((m: any) => m.tenureId === activeTenureId) : members;
        const scopedEvents = activeTenureId
          ? events.filter((e: any) => e.tenureId === activeTenureId || (!e.tenureId && divisions.find((d: any) => d.id === e.divisionId)?.tenureId === activeTenureId))
          : events;
        const completedEvents = scopedEvents.filter((e: any) => e.status === 'Completed').length;
        const eventPercent = scopedEvents.length > 0 ? Math.round((completedEvents / scopedEvents.length) * 100) : 0;
        const totalRab = scopedEvents.reduce((acc: any, e: any) => acc + Number(e.totalRab || 0), 0);

        const scopedForms = activeTenureId ? forms.filter((f: any) => f.tenureId === activeTenureId) : forms;
        const scopedFormIds = new Set(scopedForms.map((f: any) => f.id));
        const scopedSubs = activeTenureId
          ? submissions.filter((s: any) => s.tenureId === activeTenureId || scopedFormIds.has(s.formId))
          : submissions;
        const acceptedSubs = scopedSubs.filter((s: any) => s.status === 'Accepted').length;
        const pendingSubs = scopedSubs.filter((s: any) => !s.status || s.status === 'Submitted').length;

        const tenureLabel = activeTenure?.code || activeTenure?.title || 'Aktif';

        // Top recipient of kudos
        const recipientCounts: Record<string, any> = {};
        kudosList.forEach((k: any) => {
          const rec = (k.recipient || '').trim();
          if (rec) recipientCounts[rec] = (recipientCounts[rec] || 0) + 1;
        });
        const topKudosRecipient = Object.entries(recipientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belum ada';

        // Breakdown personel dinamis berdasarkan role yang ada pada periode/tenure ini
        const currentTenureRoles = (activeTenureId
          ? getTenureRoles(activeTenureId, roleQuotas, tenureRoles)
          : (tenures.length > 0 ? getTenureRoles(tenures[0]?.id, roleQuotas, tenureRoles) : [])
        ).sort((a, b) => (Number(a.level ?? 5) - Number(b.level ?? 5)) || (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)));

        const roleCounts = [];
        if (currentTenureRoles.length > 0) {
          const accountedMemberIds = new Set();
          currentTenureRoles.forEach(r => {
            const matchedMembers = scopedMembers.filter((m: any) => {
              if (m.roleId && m.roleId === r.id) return true;
              const matched = findMatchingRole(m, currentTenureRoles);
              return matched ? matched.id === r.id : (m.role || '').toLowerCase().trim() === r.name.toLowerCase().trim();
            });
            matchedMembers.forEach((m: any) => accountedMemberIds.add(m.id));
            roleCounts.push({ name: r.name, count: matchedMembers.length });
          });

          const unassigned = scopedMembers.filter((m: any) => !accountedMemberIds.has(m.id));
          if (unassigned.length > 0) {
            roleCounts.push({ name: 'Lainnya', count: unassigned.length });
          }
        } else {
          const dynamicMap: Record<string, any> = {};
          scopedMembers.forEach((m: any) => {
            const rName = (m.role || m.title || 'Personel').trim();
            dynamicMap[rName] = (dynamicMap[rName] || 0) + 1;
          });
          Object.entries(dynamicMap).forEach(([name, count]) => {
            roleCounts.push({ name, count });
          });
        }

        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--mandiri-gold)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Personel ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {scopedMembers.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2px 6px',
                  alignItems: 'center'
                }}
              >
                {roleCounts.length > 0 ? (
                  roleCounts.map((rc, idx) => (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span>
                        <strong style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>{rc.count}</strong> {rc.name}
                      </span>
                      {idx < roleCounts.length - 1 && (
                        <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span>Belum ada role di periode ini</span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Realisasi Event ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {completedEvents}/{scopedEvents.length} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>({eventPercent}%)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {scopedEvents.length - completedEvents} Agenda Upcoming / Berjalan
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Total RAB ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                Rp {(totalRab / 1000000).toFixed(1)} Jt
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Akumulasi {scopedEvents.length} Event Periode {tenureLabel}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Data Respon ({tenureLabel})
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {scopedSubs.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Respon</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: '#10b981' }}>{acceptedSubs} Diterima</strong> • {pendingSubs} Perlu Review
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px 16px', borderLeft: '4px solid #f43f5e' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Apresiasi & Aspirasi
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                {kudosList.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kudos</span> • {aspirasiList.length} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ide</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Top: {topKudosRecipient}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
