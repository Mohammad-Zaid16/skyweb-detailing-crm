'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, FREE_TIER_STORAGE_BYTES, formatBytes } from '@/lib/supabase';
import { HardDrive } from 'lucide-react';

export default function StorageUsageBar() {
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('detailing_files').select('file_size_bytes');
      const total = (data || []).reduce((sum, f) => sum + (f.file_size_bytes || 0), 0);
      setTotalBytes(total);
    })();
  }, []);

  if (totalBytes === null) return null;

  const pct = Math.min(100, (totalBytes / FREE_TIER_STORAGE_BYTES) * 100);
  const isWarning = pct > 70;
  const isCritical = pct > 90;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5 }}>
      <HardDrive size={13} color="var(--text-muted)" />
      <div style={{ width: 90, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          style={{
            height: '100%',
            background: isCritical ? 'var(--hot)' : isWarning ? 'var(--warm)' : 'var(--teal)',
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ color: 'var(--text-muted)' }}>
        {formatBytes(totalBytes)} / 1GB {isWarning && '(free tier)'}
      </span>
    </div>
  );
}
