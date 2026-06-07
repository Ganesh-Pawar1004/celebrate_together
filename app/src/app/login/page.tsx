'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './page.module.css';

type Mode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.location.href = '/dashboard';
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setMessage('Supabase not configured yet — for now, explore the app in demo mode!');
      setLoading(false);
      return;
    }

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login/reset-password`,
      });
      if (err) setError(err.message);
      else setMessage('Password reset link sent to your inbox!');
    } else if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setMessage('Check your email to confirm your account!');
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else window.location.href = '/dashboard';
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.logo} aria-label="Go home">🎊</Link>
          <h1 className={styles.title}>
            {mode === 'signin' ? 'Welcome back!' : mode === 'signup' ? 'Join CelebrateTogether' : 'Reset password'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'signin'
              ? 'Sign in to manage your celebrations.'
              : mode === 'signup'
              ? 'Create an account to save and track your surprises.'
              : 'Enter your email address to receive a recovery link.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={styles.switchBtn}
                style={{ fontSize: 'var(--text-xs)' }}
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className={styles.errorMsg} role="alert">{error}</p>
          )}
          {message && (
            <p className={styles.successMsg} role="status">{message}</p>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={loading}
            aria-busy={loading}
            style={{ width: '100%' }}
          >
            {loading
              ? (mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending link...')
              : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
          </button>
        </form>

        <div className={styles.dividerRow}>
          <hr className="divider" style={{ flex: 1, margin: 0 }} />
          <span className={styles.orText}>or</span>
          <hr className="divider" style={{ flex: 1, margin: 0 }} />
        </div>

        <button
          type="button"
          className="btn btn--ghost"
          style={{ width: '100%' }}
          onClick={() => window.location.href = '/create'}
        >
          Continue without account →
        </button>

        <p className={styles.switchMode}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
