'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { supabase, FILES_BUCKET, MAX_FILE_SIZE_BYTES, DEFAULT_ORG_ID, formatBytes } from '@/lib/supabase';
import { Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import { Spinner } from './ui';

type Props = {
  customerId?: string;
  bookingId?: string;
  onUploaded: () => void;
};

const CATEGORY_OPTIONS = ['photo', 'invoice', 'estimate', 'other'];

export default function FileUpload({ customerId, bookingId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError('');
    const files = Array.from(fileList);

    for (const file of files) {
      // Reject unsupported types up front — no wasted bandwidth on a doomed upload
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        setError(`${file.name}: only JPG, PNG, WebP, or PDF allowed.`);
        continue;
      }

      let uploadFile: File | Blob = file;

      // Compress images client-side before upload — stretches the free tier's 1GB a long way
      if (file.type.startsWith('image/') && file.size > 300 * 1024) {
        setProgress(`Compressing ${file.name}...`);
        try {
          uploadFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });
        } catch {
          uploadFile = file; // fall back to original if compression fails
        }
      }

      if (uploadFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`${file.name}: exceeds 5MB limit even after compression (${formatBytes(uploadFile.size)}).`);
        continue;
      }

      setProgress(`Uploading ${file.name}...`);
      setUploading(true);

      const ext = file.name.split('.').pop();
      const path = `${DEFAULT_ORG_ID}/${customerId || 'general'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(FILES_BUCKET).upload(path, uploadFile, {
        contentType: file.type,
      });

      if (uploadErr) {
        setError(`${file.name}: ${uploadErr.message}`);
        setUploading(false);
        continue;
      }

      await supabase.from('detailing_files').insert({
        org_id: DEFAULT_ORG_ID,
        customer_id: customerId || null,
        booking_id: bookingId || null,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size_bytes: uploadFile.size,
        category: file.type === 'application/pdf' ? 'invoice' : 'photo',
      });
    }

    setUploading(false);
    setProgress('');
    onUploaded();
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: dragging ? 'var(--teal)' : 'var(--border-hairline)',
          background: dragging ? 'var(--teal-glow)' : 'var(--bg-elevated)',
        }}
        style={{
          border: '1.5px dashed var(--border-hairline)',
          borderRadius: 12,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Spinner size={20} />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{progress}</span>
          </div>
        ) : (
          <>
            <Upload size={22} color="var(--text-muted)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Drop files here or click to upload
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              JPG, PNG, WebP, or PDF — max 5MB per file
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              padding: '9px 12px',
              background: 'var(--hot-glow)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--hot)',
            }}
          >
            <AlertTriangle size={14} />
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--hot)' }}>
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
