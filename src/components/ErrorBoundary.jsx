import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error in tab:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetTab) {
      this.props.onResetTab();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '700px',
          margin: '60px auto',
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.12)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <AlertCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Terjadi Kendala Memuat Halaman
          </h2>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.6, margin: 0 }}>
            Sistem mendeteksi kendala saat merender komponen. Silakan muat ulang halaman atau kembali ke beranda utama.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              <span>Muat Ulang Halaman</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Home size={15} />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
