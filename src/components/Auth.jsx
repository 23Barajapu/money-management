import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Auth({ initialMessage = '' }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'signup_otp', 'forgot', 'reset_otp', 'new_password'
  const [otpToken, setOtpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(initialMessage ? { text: initialMessage, type: 'error' } : { text: '', type: '' });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      setMessage({ text: error.message || 'Terjadi kesalahan!', type: 'error' });
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Email sudah terdaftar!');
        }
        
        setMode('signup_otp');
        setMessage({ text: 'Registrasi sukses! Masukkan kode OTP dari email Anda. (Periksa folder Spam jika tidak masuk)', type: 'success' });
      } else if (mode === 'signup_otp') {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otpToken,
          type: 'signup'
        });
        if (error) throw error;
        setMessage({ text: 'Verifikasi sukses! Akun aktif.', type: 'success' });
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMode('reset_otp');
        setMessage({ text: 'Kode reset terkirim! Periksa inbox email Anda. (Periksa folder Spam jika tidak masuk)', type: 'success' });
      } else if (mode === 'reset_otp') {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otpToken,
          type: 'recovery'
        });
        if (error) throw error;
        setMode('new_password');
        setMessage({ text: 'Kode terverifikasi! Masukkan password baru Anda.', type: 'success' });
      } else if (mode === 'new_password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMode('signin');
        setMessage({ text: 'Password berhasil diperbarui! Silakan masuk.', type: 'success' });
      }
    } catch (error) {
      setMessage({ text: error.message || 'Terjadi kesalahan!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Buat akun untuk sinkronisasi cloud';
      case 'signup_otp': return 'Verifikasi kode pendaftaran Anda';
      case 'forgot': return 'Masukkan email untuk merestart password';
      case 'reset_otp': return 'Verifikasi kode reset dari email Anda';
      case 'new_password': return 'Buat password baru Anda';
      default: return 'Masuk untuk sinkronisasi cloud';
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          Money <span>Management</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {getSubtitle()}
        </p>

        {message.text && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1.25rem', 
            fontSize: '0.85rem',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${message.type === 'error' ? 'var(--expense-color)' : 'var(--income-color)'}`,
            color: message.type === 'error' ? 'var(--expense-color)' : 'var(--income-color)'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuthSubmit}>
          {/* Email Field (Visible in signin, signup, forgot, reset_otp) */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot' || mode === 'reset_otp') && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={mode === 'reset_otp'} // Lock email during OTP verification
              />
            </div>
          )}

          {/* OTP Token Field (Visible in signup_otp, reset_otp) */}
          {(mode === 'signup_otp' || mode === 'reset_otp') && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Kode Verifikasi (OTP)</label>
              <input
                type="text"
                placeholder="e.g. 12345678"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                required
                maxLength="8"
                pattern="\d{6,8}"
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
              />
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--expense-color)', marginTop: '0.5rem', textAlign: 'center', fontWeight: '500' }}>
                *Penting: Periksa folder <strong>Spam / Promosi</strong> jika email OTP belum masuk ke inbox utama.
              </span>
            </div>
          )}

          {/* Password Field (Visible in signin, signup, new_password) */}
          {(mode === 'signin' || mode === 'signup' || mode === 'new_password') && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Lock size={14} /> {mode === 'new_password' ? 'Password Baru' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn-submit" disabled={loading} style={{ marginBottom: '0.75rem' }}>
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : mode === 'signin' ? (
              'Masuk'
            ) : mode === 'signup' ? (
              'Daftar Sekarang'
            ) : mode === 'forgot' ? (
              'Kirim OTP Reset'
            ) : mode === 'new_password' ? (
              'Perbarui Password'
            ) : (
              'Verifikasi Kode'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        {mode === 'signin' && (
          <>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setMessage({ text: '', type: '' }); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Lupa Password?
              </button>
            </div>

            <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: 1 }}></div>
              <span style={{ position: 'relative', background: '#0b0f19', padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', zIndex: 2 }}>ATAU</span>
            </div>

            <button 
              onClick={handleGoogleLogin} 
              className="btn-submit" 
              disabled={loading} 
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-primary)',
                marginBottom: '1.5rem'
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '0.5rem' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Masuk dengan Google
            </button>
          </>
        )}

        {/* Mode Switchers */}
        {(mode === 'signin' || mode === 'signup') ? (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mode === 'signup' ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button 
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage({ text: '', type: '' }); }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent-color)', 
                cursor: 'pointer', 
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              {mode === 'signup' ? 'Masuk' : 'Daftar'}
            </button>
          </div>
        ) : (
          /* Show back button for verification or forgot modes */
          mode !== 'signup_otp' && (
            <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={() => { setMode('signin'); setMessage({ text: '', type: '' }); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer', 
                  fontWeight: 600
                }}
              >
                Kembali ke Login
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
