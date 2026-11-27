import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { listAdminProfiles, assignAdminRole, revokeAdminRole } from '../lib/supabase';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  division_admin: 'Admin Divisi'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--input-bg)',
  border: '1px solid var(--border-card)',
  color: 'var(--text-main)',
  fontSize: '0.88rem'
};

/**
 * Super admin panel to grant or revoke admin access. Accounts themselves are created in
 * Supabase Authentication; this panel attaches a role (and division for division admins).
 */
export default function AdminAccountsPanel({ divisions = [], currentUserId, showToast }) {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('division_admin');
  const [divisionId, setDivisionId] = useState('');
  const [error, setError] = useState('');

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      setAdmins(await listAdminProfiles());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const divisionName = (id) => divisions.find(d => d.id === id)?.name || '-';

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Masukkan email akun yang valid.');
      return;
    }
    if (role === 'division_admin' && !divisionId) {
      setError('Pilih divisi untuk Admin Divisi.');
      return;
    }
    setIsSaving(true);
    try {
      await assignAdminRole(email.trim(), role, role === 'division_admin' ? divisionId : null, displayName.trim());
      showToast?.(`Akses ${ROLE_LABELS[role]} diberikan ke ${email.trim()}`);
      setEmail('');
      setDisplayName('');
      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (admin) => {
    if (!window.confirm(`Cabut akses admin untuk ${admin.email}?`)) return;
    try {
      await revokeAdminRole(admin.userId);
      showToast?.(`Akses admin ${admin.email} dicabut`);
      await loadAdmins();
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={20} color="var(--mandiri-blue)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>Beri Akses Admin</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Buat akun terlebih dahulu di Supabase → Authentication → Users, lalu masukkan email akun tersebut di sini.
          Admin Divisi hanya dapat mengelola pengurus, acara, formulir, pendaftaran, dan galeri divisinya.
        </p>
        <form onSubmit={handleAssign} noValidate style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Email akun
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@bankmandiri.co.id" style={inputStyle} autoComplete="off" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Nama tampilan
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Opsional" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Peran
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="division_admin">{ROLE_LABELS.division_admin}</option>
              <option value="super_admin">{ROLE_LABELS.super_admin}</option>
            </select>
          </label>
          {role === 'division_admin' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Divisi
              <select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} style={inputStyle}>
                <option value="">Pilih divisi</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: isSaving ? 'wait' : 'pointer',
                background: 'var(--mandiri-blue)', color: '#ffffff', fontWeight: 700, opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={16} />}
              Simpan Akses
            </button>
          </div>
        </form>
        {error && <div role="alert" style={{ color: '#dc2626', fontSize: '0.84rem' }}>{error}</div>}
      </div>

      <div className="glass-panel" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: 'var(--text-main)' }}>Daftar Admin ({admins.length})</h3>
        {isLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Memuat daftar admin...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {admins.map(admin => (
              <div
                key={admin.userId}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                  padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', background: 'var(--bg-card)'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {admin.displayName || admin.email}
                    {admin.userId === currentUserId && <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}> (Anda)</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {admin.email} • {ROLE_LABELS[admin.role]}
                    {admin.role === 'division_admin' && ` • ${divisionName(admin.divisionId)}`}
                  </div>
                </div>
                {admin.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(admin)}
                    aria-label={`Cabut akses ${admin.email}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
                      borderRadius: 'var(--radius-full)', border: '1px solid rgba(244, 63, 94, 0.35)',
                      background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                    Cabut Akses
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
