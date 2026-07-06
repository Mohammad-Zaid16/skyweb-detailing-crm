'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-browser';
import { Car, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // The reset link from email establishes a temporary session via URL hash — Supabase handles this automatically on load
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });
    // Also check immediately in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/dashboard'), 1800);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--teal), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', boxShadow: '0 8px 24px -6px rgba(0,229,184,0.4)',
            }}
          >
            <Car size={28} color="#050508" strokeWidth={2.4} />
          </motion.div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Set a new password</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Choose something secure</p>
        </div>

        <div className="glass-panel" style={{ borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-card)' }}>
          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '12px 0' }}>
              <CheckCircle2 size={36} color="var(--teal)" style={{ marginBottom: 14 }} />
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Password updated — redirecting you now...</p>
            </motion.div>
          ) : !sessionReady ? (
            <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Spinner size={20} />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Verifying your reset link...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  New Password
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
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: 9,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)', fontSize: 13.5, outline: 'none',
                    }}
                    className="auth-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: 9,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)', fontSize: 13.5, outline: 'none',
                    }}
                    className="auth-input"
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', marginBottom: 16, background: 'var(--hot-glow)', borderRadius: 8, fontSize: 12, color: 'var(--hot)' }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '11px', borderRadius: 9,
                  background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
                  color: '#052018', fontWeight: 700, fontSize: 14, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <Spinner size={15} /> : 'Update Password'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>

      <style>{`.auth-input:focus { border-color: var(--teal) !important; }`}</style>
    </div>
  );
}
