'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { supabase, FileRecord, FILES_BUCKET, getFileUrl, formatBytes } from '@/lib/supabase';
import { FileText, Image as ImageIcon, Trash2, Download } from 'lucide-react';

export default function FilePreviewGrid({ files, onDeleted }: { files: FileRecord[]; onDeleted: () => void }) {
  async function handleDelete(file: FileRecord) {
    await supabase.storage.from(FILES_BUCKET).remove([file.file_path]);
    await supabase.from('detailing_files').delete().eq('id', file.id);
    onDeleted();
  }

  if (files.length === 0) {
    return <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 0' }}>No files uploaded yet.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
      <AnimatePresence>
        {files.map((f) => {
          const isImage = f.file_type.startsWith('image/');
          const url = getFileUrl(f.file_path);
          return (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-elevated)',
                aspectRatio: '1',
              }}
              className="file-tile"
            >
              {isImage ? (
                <img src={url} alt={f.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileText size={26} color="var(--text-muted)" />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '0 6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                    {f.file_name}
                  </span>
                </div>
              )}

              <div className="file-overlay">
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="file-action-btn">
                  <Download size={13} />
                </a>
                <button onClick={() => handleDelete(f)} className="file-action-btn file-action-btn-danger">
                  <Trash2 size={13} />
                </button>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '3px 6px',
                  background: 'rgba(0,0,0,0.6)',
                  fontSize: 9,
                  color: 'var(--text-secondary)',
                }}
              >
                {formatBytes(f.file_size_bytes)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        .file-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center; gap: 6;
          background: rgba(0,0,0,0); opacity: 0;
          transition: all 0.15s ease;
        }
        .file-tile:hover .file-overlay { opacity: 1; background: rgba(0,0,0,0.55); }
        .file-action-btn {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          color: white; border: none;
        }
        .file-action-btn:hover { background: rgba(255,255,255,0.28); }
        .file-action-btn-danger:hover { background: var(--hot); }
        @media (max-width: 768px) {
          /* On touch devices there's no hover state, so the overlay must show its actions
             persistently rather than only on hover — otherwise the buttons are unreachable. */
          .file-overlay { opacity: 1; background: rgba(0,0,0,0.35); }
          .file-action-btn { width: 38px; height: 38px; }
        }
      `}</style>
    </div>
  );
}
