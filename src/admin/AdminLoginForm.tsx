import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { loginSchema, type LoginValues } from './validation/schemas';

interface AdminLoginFormProps {
  /** Signs in with Supabase Auth; rejects with a user-facing message. */
  onLogin: (email: string, password: string) => Promise<unknown>;
  showToast: (message: string, type?: string) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f43f5e', fontSize: '0.75rem', marginTop: '5px', fontWeight: 600 }}>
      <AlertCircle size={13} />
      <span>{message}</span>
    </div>
  );
}

/**
 * Admin sign-in form (react-hook-form + zod). Errors appear on submit and a field's error clears
 * as soon as it is edited.
 */
export default function AdminLoginForm({ onLogin, showToast }: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const {
    register,
    handleSubmit,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginEmail: '', loginPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  });

  const submit = handleSubmit(async ({ loginEmail, loginPassword }) => {
    setLoginError('');
    try {
      await onLogin(loginEmail, loginPassword);
      resetField('loginPassword');
      showToast('Berhasil masuk! Selamat datang di Admin Portal', 'success');
    } catch (err) {
      const message = (err as Error)?.message || 'Gagal memverifikasi kredensial';
      setLoginError(message);
      showToast(message, 'error');
    }
  });

  return (
    <>
      {loginError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid #f43f5e',
          color: '#f43f5e',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {loginError}
        </div>
      )}

      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Email Admin <span style={{ color: '#f43f5e' }}>*</span>
          </label>
          <input
            type="email"
            autoComplete="username"
            placeholder="nama@bankmandiri.co.id"
            disabled={isSubmitting}
            {...register('loginEmail', { onChange: () => clearErrors('loginEmail') })}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input-bg)',
              border: `1.5px solid ${errors.loginEmail ? '#f43f5e' : 'var(--border-card)'}`,
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '0.9rem',
              opacity: isSubmitting ? 0.7 : 1
            }}
          />
          <FieldError message={errors.loginEmail?.message} />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Password <span style={{ color: '#f43f5e' }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan Password"
              disabled={isSubmitting}
              {...register('loginPassword', { onChange: () => clearErrors('loginPassword') })}
              style={{
                width: '100%',
                padding: '11px 44px 11px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--input-bg)',
                border: `1.5px solid ${errors.loginPassword ? '#f43f5e' : 'var(--border-card)'}`,
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '0.9rem',
                opacity: isSubmitting ? 0.7 : 1
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
              title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError message={errors.loginPassword?.message} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: isSubmitting ? 'rgba(255, 184, 0, 0.75)' : 'var(--mandiri-gold)',
            color: '#040914',
            padding: '13px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.95rem',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            transition: 'all 0.2s ease',
            opacity: isSubmitting ? 0.85 : 1
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Memverifikasi Kredensial...</span>
            </>
          ) : (
            <>
              <KeyRound size={17} />
              <span>Masuk ke Dashboard</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
