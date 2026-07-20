import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Pendaftaran sukses! Cek email Anda untuk konfirmasi.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage({ text: error.message || 'Terjadi kesalahan!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          Money <span>Management</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {isSignUp ? 'Buat akun untuk sinkronisasi cloud' : 'Masuk untuk sinkronisasi cloud'}
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

        <form onSubmit={handleAuth}>
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
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ marginBottom: '0.75rem' }}>
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              isSignUp ? 'Daftar Sekarang' : 'Masuk'
            )}
          </button>
        </form>

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

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setMessage({ text: '', type: '' }); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-color)', 
              cursor: 'pointer', 
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Masuk' : 'Daftar'}
          </button>
        </div>
      </div>
    </div>
  );
}
