'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-browser';
import { Car, Mail, Lock, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 24px -6px rgba(0,229,184,0.4)',
            }}
          >
            <Car size={28} color="#050508" strokeWidth={2.4} />
          </motion.div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>SkyWeb Detailing CRM</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-panel" style={{ borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 9,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                  className="auth-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 9,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                  className="auth-input"
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  marginBottom: 16,
                  background: 'var(--hot-glow)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--hot)',
                }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
                color: '#052018',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Spinner size={15} /> : 'Sign In'}
            </motion.button>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 20 }}>
          Contact your administrator if you need access.
        </p>
      </motion.div>

      <style>{`
        .auth-input:focus { border-color: var(--teal) !important; }
      `}</style>
    </div>
  );
}
