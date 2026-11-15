import React, { useState } from 'react';
import { Crown, Sparkles, UserCheck } from 'lucide-react';

function formatWaNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

// Helper to ensure role/division colors are vibrant and clearly visible on dark backgrounds
export function getAdaptiveRoleColor(color, isDark = true) {
  if (!color) return isDark ? '#38bdf8' : '#0284c7';
  if (!isDark) return color;
  
  // In dark theme, check if color is too dark (like #00529B, #003d79, or deep navy)
  const hex = color.startsWith('#') ? color.replace('#', '') : '';
  if (hex && (hex.length === 3 || hex.length === 6)) {
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // If color is dark (YIQ < 130), brighten it for dark theme
    if (yiq < 130) {
      if (b >= r) return '#38bdf8'; // Sky cyan for blue tones
      if (r > b && r > g) return '#fb7185'; // Rose for red tones
      if (g > r) return '#34d399'; // Emerald for green tones
      return '#38bdf8';
    }
  }
  return color;
}

export default function CrewMemberCard({ member, onClick, compact = false, theme }) {
  const [imageError, setImageError] = useState(false);
  const isDark = theme ? theme === 'dark' : (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true);

  const roleColor = getAdaptiveRoleColor(member?.color, isDark);

  const getBorderColor = () => {
    return isDark ? `${roleColor}80` : (member?.color || 'rgba(56, 189, 248, 0.4)');
  };

  const getBadgeStyle = () => {
    return {
      background: isDark ? `${roleColor}22` : `${roleColor}14`,
      color: roleColor,
      border: `1px solid ${roleColor}55`
    };
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
        border: `1px solid ${getBorderColor()}`,
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
              ...getBadgeStyle()
            }}>
              {member.role}
            </span>
          </div>

          <h3 style={{
            fontSize: compact ? '0.92rem' : '1.05rem',
            fontWeight: 800,
            color: isDark ? '#f8fafc' : '#0a1128',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0
          }}>
            {member.name}
          </h3>

          {member.motto && (
            <p style={{
              fontSize: '0.74rem',
              color: isDark ? '#cbd5e1' : '#475569',
              fontStyle: 'italic',
              marginTop: '4px',
              marginBottom: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35
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
                  background: isDark ? 'rgba(37, 211, 102, 0.15)' : 'rgba(37, 211, 102, 0.12)',
                  border: isDark ? '1px solid rgba(37, 211, 102, 0.4)' : '1px solid rgba(37, 211, 102, 0.5)',
                  color: isDark ? '#25d366' : '#16a34a',
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
