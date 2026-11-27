import { Lock, ArrowLeft } from 'lucide-react';

/** Shown in place of admin-only pages (such as live registration stats) to visitors without an admin session. */
export default function AdminOnlyNotice({ isLoading = false, onLogin, onBack }) {
  return (
    <section style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', width: '100%' }}>
      <div
        className="glass-panel"
        style={{ padding: '32px 28px', borderRadius: 'var(--radius-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}
      >
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--badge-bg)', color: 'var(--mandiri-blue)' }}>
          <Lock size={24} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>
          {isLoading ? 'Memeriksa sesi admin...' : 'Halaman khusus admin'}
        </h2>
        {!isLoading && (
          <>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Statistik pendaftaran dan pengundian doorprize memuat data pribadi peserta, sehingga hanya dapat dibuka
              oleh pengurus yang sudah masuk ke Admin Portal.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onLogin}
                style={{
                  padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none',
                  background: 'var(--mandiri-blue)', color: '#ffffff', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Masuk sebagai Admin
              </button>
              <button
                type="button"
                onClick={onBack}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                  borderRadius: 'var(--radius-full)', border: '1px solid var(--border-card)',
                  background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
                Kembali ke Acara
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
