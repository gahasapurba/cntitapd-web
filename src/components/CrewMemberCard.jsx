import React, { useState } from 'react';
import { Crown, Sparkles, UserCheck } from 'lucide-react';

function formatWaNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

export default function CrewMemberCard({ member, onClick, compact = false }) {
  const [imageError, setImageError] = useState(false);

  const getBorderColor = (role) => {
    if (role === 'Pembina') return 'rgba(255, 184, 0, 0.8)';
    if (role === 'Ketua') return 'rgba(255, 184, 0, 0.6)';
    if (role === 'Wakil Ketua') return 'rgba(56, 189, 248, 0.6)';
    if (role.startsWith('Sekben')) return 'rgba(192, 132, 252, 0.6)';
    return 'rgba(56, 189, 248, 0.4)';
  };

  const getBadgeStyle = (role) => {
    if (role === 'Pembina') return { background: 'rgba(255, 184, 0, 0.2)', color: '#fde047', border: '1px solid rgba(255, 184, 0, 0.5)' };
    if (role === 'Ketua') return { background: 'rgba(255, 184, 0, 0.2)', color: '#fde047', border: '1px solid rgba(255, 184, 0, 0.4)' };
    if (role === 'Wakil Ketua') return { background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.4)' };
    if (role.startsWith('Sekben')) return { background: 'rgba(192, 132, 252, 0.2)', color: '#e9d5ff', border: '1px solid rgba(192, 132, 252, 0.4)' };
    return { background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.4)' };
  };

  return (
    <div
      onClick={onClick}
      className="glass-panel glass-panel-hover crew-member-card"
      style={{
        padding: compact ? '14px 18px' : '20px 24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${getBorderColor(member.role)}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Photo Avatar Frame */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: compact ? '50px' : '64px',
            height: compact ? '50px' : '64px',
            borderRadius: '12px',
            padding: '2px',
            background: 'linear-gradient(135deg, #FFB800 0%, #38bdf8 50%, #c084fc 100%)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#040914',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {member.image && !imageError ? (
                <img
                  src={member.image}
                  alt={member.name}
                  onError={() => setImageError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '1.4rem' }}>
                  {member.avatar || '👤'}
                </div>
              )}
            </div>
          </div>

          {member.role === 'Pembina' && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              borderRadius: '50%',
              padding: '3px',
              display: 'flex',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              <Crown size={12} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              ...getBadgeStyle(member.role)
            }}>
              {member.role}
            </span>
            {member.badge && member.role !== 'Pembina' && member.role !== 'Ketua' && member.role !== 'Wakil Ketua' && (
              <span style={{ fontSize: '0.7rem', color: 'var(--mandiri-gold)', fontWeight: 700, fontFamily: 'monospace' }}>
                {member.badge}
              </span>
            )}
          </div>

          <h3 style={{
            fontSize: compact ? '0.88rem' : '1.05rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {member.name}
          </h3>

          <p style={{
            fontSize: '0.78rem',
            color: 'var(--neon-cyan)',
            fontWeight: 600,
            marginTop: '2px'
          }}>
            {member.title}
          </p>

          {!compact && member.motto && (
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              marginTop: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              "{member.motto}"
            </p>
          )}

          {/* Optional WhatsApp Quick Contact Button */}
          {member.whatsapp && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
              <a
                href={`https://wa.me/${formatWaNumber(member.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  color: '#25d366',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '0.78rem' }}>💬</span>
                <span>Hubungi WA</span>
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
