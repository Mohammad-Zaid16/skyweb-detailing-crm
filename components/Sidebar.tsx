'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wrench,
  Settings,
  Car,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { useIsMobile } from '@/lib/useIsMobile';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/automations', label: 'Automations', icon: Zap },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  // Close drawer automatically on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') return null;

  const Logo = (
    <motion.div
      whileHover={{ scale: 1.06, rotate: 3 }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        background: 'linear-gradient(135deg, var(--teal), var(--blue))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 16px -4px rgba(0,229,184,0.4)',
      }}
    >
      <Car size={19} color="#050508" strokeWidth={2.4} />
    </motion.div>
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: collapsed && !isMobile ? '10px' : '12px 12px',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              minHeight: 44,
            }}
            className="nav-item"
            title={collapsed && !isMobile ? label : undefined}
          >
            {active && (
              <motion.div
                layoutId="active-nav-bg"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--bg-hover)',
                  borderRadius: 8,
                  borderLeft: '2px solid var(--teal)',
                }}
              />
            )}
            <Icon size={17} strokeWidth={2} color={active ? 'var(--teal)' : 'var(--text-muted)'} style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
            {(!collapsed || isMobile) && (
              <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>{label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // ── Mobile: sticky top bar + slide-out drawer ──────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Logo}
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>SkyWeb</span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="touch-target"
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 9,
              color: 'var(--text-secondary)',
            }}
          >
            <Menu size={19} />
          </button>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 90,
                }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '80%',
                  maxWidth: 300,
                  background: 'var(--bg-surface)',
                  borderRight: '1px solid var(--border-hairline)',
                  zIndex: 95,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {Logo}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>SkyWeb</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Detailing CRM
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="touch-target"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <NavLinks onNavigate={() => setDrawerOpen(false)} />

                <div style={{ padding: '12px', borderTop: '1px solid var(--border-hairline)' }}>
                  {userEmail && (
                    <div style={{ padding: '6px 10px 10px', fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      width: '100%',
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Desktop: persistent collapsible sidebar (unchanged behaviour) ──────
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: collapsed ? '28px 0 20px' : '28px 24px 20px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {Logo}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>SkyWeb</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Detailing CRM
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NavLinks />

      <div style={{ padding: '12px', borderTop: '1px solid var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!collapsed && userEmail && (
          <div style={{ padding: '6px 10px 2px', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userEmail}
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '8px 10px',
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 12.5,
            width: '100%',
          }}
          className="logout-btn"
        >
          <LogOut size={14} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '8px 10px',
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}
          className="collapse-btn"
        >
          {!collapsed && <span>Collapse</span>}
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <style>{`
        .nav-item:hover { color: var(--text-primary) !important; }
        .collapse-btn:hover { background: var(--bg-hover); color: var(--text-primary) !important; }
        .logout-btn:hover { background: var(--hot-glow); color: var(--hot) !important; }
      `}</style>
    </motion.aside>
  );
}
