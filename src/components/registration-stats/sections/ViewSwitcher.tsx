import React from 'react';
import { FileSpreadsheet, Trophy } from 'lucide-react';
import { useRegistrationStats } from '../RegistrationStatsContext';

export default function ViewSwitcher() {
  const {
    activeView,
    eventWinners,
    isLuckyDrawEnabled,
    setActiveView
  } = useRegistrationStats();

  return (
    <>
      {isLuckyDrawEnabled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--input-bg)',
          padding: '5px',
          borderRadius: 'var(--radius-full)',
          maxWidth: '460px',
          margin: '0 auto',
          width: '100%',
          border: '1px solid var(--border-card)'
        }}>
          <button
            onClick={() => setActiveView('stats')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px clamp(10px, 2.5vw, 16px)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: 'clamp(0.75rem, 2.4vw, 0.85rem)',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'stats' ? 'var(--mandiri-gold)' : 'transparent',
              color: activeView === 'stats' ? '#040914' : 'var(--text-muted)',
              boxShadow: activeView === 'stats' ? '0 4px 12px rgba(255,184,0,0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Statistik & QR</span>
          </button>

          <button
            onClick={() => setActiveView('luckydraw')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px clamp(10px, 2.5vw, 16px)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: 'clamp(0.75rem, 2.4vw, 0.85rem)',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeView === 'luckydraw' ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'transparent',
              color: activeView === 'luckydraw' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeView === 'luckydraw' ? '0 4px 14px rgba(168,85,247,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Trophy size={15} />
            <span>Undian ({eventWinners.length})</span>
          </button>
        </div>
      )}
    </>
  );
}
