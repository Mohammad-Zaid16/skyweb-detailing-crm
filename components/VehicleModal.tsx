'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Vehicle } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { X } from 'lucide-react';

const SIZE_OPTIONS = ['small', 'medium', 'large', 'suv', 'van'];

const emptyForm = { make: '', model: '', year: '', colour: '', reg_plate: '', size: 'medium', notes: '' };

export default function VehicleModal({
  open,
  onClose,
  onSaved,
  customerId,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customerId: string;
  vehicle?: Vehicle | null;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setForm({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year ? String(vehicle.year) : '',
        colour: vehicle.colour || '',
        reg_plate: vehicle.reg_plate || '',
        size: vehicle.size || 'medium',
        notes: vehicle.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [vehicle, open]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.make.trim() && !form.model.trim()) {
      setError('Enter at least a make or model.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      customer_id: customerId,
      org_id: DEFAULT_ORG_ID,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? parseInt(form.year) : null,
      colour: form.colour.trim() || null,
      reg_plate: form.reg_plate.trim().toUpperCase() || null,
      size: form.size,
      notes: form.notes.trim() || null,
    };

    const result = vehicle
      ? await supabase.from('detailing_vehicles').update(payload).eq('id', vehicle.id)
      : await supabase.from('detailing_vehicles').insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="modal-sheet"
            style={{
              width: '100%', maxWidth: 420, background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)', borderRadius: 16, padding: 26,
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button onClick={onClose} className="modal-close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Make" value={form.make} onChange={(v) => update('make', v)} placeholder="e.g. BMW" />
                <Field label="Model" value={form.model} onChange={(v) => update('model', v)} placeholder="e.g. 3 Series" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Year" value={form.year} onChange={(v) => update('year', v)} type="number" placeholder="2022" />
                <Field label="Colour" value={form.colour} onChange={(v) => update('colour', v)} placeholder="e.g. Black" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Registration" value={form.reg_plate} onChange={(v) => update('reg_plate', v)} placeholder="e.g. LX22 ABC" />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Size
                  </label>
                  <select
                    value={form.size}
                    onChange={(e) => update('size', e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 9,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                    }}
                    className="modal-input"
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Field label="Notes" value={form.notes} onChange={(v) => update('notes', v)} placeholder="Optional notes" textarea />
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '9px 12px', background: 'var(--hot-glow)', borderRadius: 8, fontSize: 12, color: 'var(--hot)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {vehicle ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 9,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit',
          }}
          className="modal-input"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 9,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
          className="modal-input"
        />
      )}
      <style>{`.modal-input:focus { border-color: var(--teal) !important; }`}</style>
    </div>
  );
}
