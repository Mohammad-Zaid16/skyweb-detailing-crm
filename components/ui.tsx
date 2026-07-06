'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="page-header-pad"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      <div>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, letterSpacing: '-0.025em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 5 }}>{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function Card({
  children,
  style,
  hoverable = false,
  delay = 0,
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  hoverable?: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={
        hoverable
          ? { y: -3, boxShadow: 'var(--shadow-elevated)', borderColor: 'var(--border-focus)' }
          : undefined
      }
      className={className}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 0.2s ease',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeatBadge({ heat }: { heat: string }) {
  const map: Record<string, { bg: string; fg: string; label: string; dot: string }> = {
    HOT: { bg: 'var(--hot-glow)', fg: 'var(--hot)', label: 'Hot', dot: 'var(--hot)' },
    WARM: { bg: 'var(--warm-glow)', fg: 'var(--warm)', label: 'Warm', dot: 'var(--warm)' },
    COOL: { bg: 'var(--blue-glow)', fg: 'var(--cool)', label: 'Cool', dot: 'var(--cool)' },
    COLD: { bg: 'rgba(86,86,103,0.15)', fg: 'var(--cold)', label: 'Cold', dot: 'var(--cold)' },
  };
  const s = map[heat] || map.COLD;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 600,
        background: s.bg,
        color: s.fg,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
      {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    new: { bg: 'var(--blue-glow)', fg: 'var(--blue)' },
    CONFIRMED: { bg: 'var(--teal-glow)', fg: 'var(--teal)' },
    PENDING: { bg: 'var(--warm-glow)', fg: 'var(--warm)' },
    COMPLETED: { bg: 'rgba(154,154,176,0.12)', fg: 'var(--text-secondary)' },
    CANCELLED: { bg: 'var(--hot-glow)', fg: 'var(--hot)' },
  };
  const s = map[status] || { bg: 'rgba(86,86,103,0.15)', fg: 'var(--text-muted)' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 600,
        background: s.bg,
        color: s.fg,
        textTransform: 'capitalize',
      }}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
      color: '#052018',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-glow)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
  };
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: size === 'sm' ? '7px 13px' : '9px 18px',
        borderRadius: 9,
        fontSize: size === 'sm' ? 12.5 : 13.5,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s ease',
        ...variants[variant],
      }}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </motion.button>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{
        width: size,
        height: size,
        border: '2px solid rgba(255,255,255,0.25)',
        borderTopColor: 'currentColor',
        borderRadius: '50%',
      }}
    />
  );
}

export function StatTile({
  label,
  value,
  accent,
  icon,
  delay = 0,
  isCurrency = false,
}: {
  label: string;
  value: number;
  accent?: string;
  icon?: ReactNode;
  delay?: number;
  isCurrency?: boolean;
}) {
  return (
    <Card hoverable delay={delay} style={{ padding: '20px 22px', flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: accent || 'var(--text-primary)' }}>
            <AnimatedCounter value={value} prefix={isCurrency ? '£' : ''} />
          </div>
        </div>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: accent ? `${accent}18` : 'var(--bg-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent || 'var(--text-secondary)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ message, icon, action }: { message: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '72px 20px', textAlign: 'center' }}
    >
      {icon && (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: action ? 18 : 0 }}>{message}</div>
      {action}
    </motion.div>
  );
}

export function SkeletonTile({ height = 90 }: { height?: number }) {
  return <div className="skeleton" style={{ height, flex: 1, minWidth: 180, borderRadius: 14 }} />;
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 20px' }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 10, width: '25%' }} />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div style={{ padding: '20px 40px' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
      <Card style={{ overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ borderBottom: i < 4 ? '1px solid var(--border-hairline)' : 'none' }}>
            <SkeletonRow />
          </div>
        ))}
      </Card>
    </div>
  );
}
