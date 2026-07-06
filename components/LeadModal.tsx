'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Customer } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { X } from 'lucide-react';

const SOURCE_OPTIONS = ['website', 'whatsapp', 'instagram', 'facebook', 'google', 'referral', 'manual'];
const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'booking_requested', label: 'Booking Requested' },
  { value: 'confirmed', label: 'Confirmed' },
];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  postcode: '',
  source: 'manual',
  status: 'new',
  notes: '',
  opt_in_whatsapp: true,
  opt_in_email: true,
};

export default function LeadModal({
  open,
  onClose,
  onSaved,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customer?: Customer | null;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        postcode: customer.postcode || '',
        source: customer.source,
        status: customer.status || 'new',
        notes: customer.notes || '',
        opt_in_whatsapp: customer.opt_in_whatsapp,
        opt_in_email: customer.opt_in_email,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [customer, open]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      org_id: DEFAULT_ORG_ID,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      postcode: form.postcode.trim() || null,
      source: form.source,
      status: form.status,
      notes: form.notes.trim() || null,
      opt_in_whatsapp: form.opt_in_whatsapp,
      opt_in_email: form.opt_in_email,
    };

    const result = customer
      ? await supabase.from('detailing_customers').update(payload).eq('id', customer.id)
      : await supabase.from('detailing_customers').insert({ ...payload, score: 30, heat: 'COOL' });

    setSaving(false);

    if (result.error) {
      setError(result.error.message.includes('duplicate') ? 'A lead with this phone number already exists.' : result.error.message);
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
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
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
              width: '100%',
              maxWidth: 480,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)',
              borderRadius: 16,
              padding: 26,
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{customer ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={onClose} className="modal-close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Full Name" value={form.name} onChange={(v) => update('name', v)} placeholder="e.g. James Whitfield" />
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} placeholder="07700 123456" />
                <Field label="Email" value={form.email} onChange={(v) => update('email', v)} type="email" placeholder="optional" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Postcode" value={form.postcode} onChange={(v) => update('postcode', v)} placeholder="e.g. SW1A 1AA" />
                <SelectField
                  label="Source"
                  value={form.source}
                  onChange={(v) => update('source', v)}
                  options={SOURCE_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </div>
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) => update('status', v)}
                options={STATUS_OPTIONS}
              />
              <Field
                label="Service Interest / Notes"
                value={form.notes}
                onChange={(v) => update('notes', v)}
                placeholder="e.g. Full Detail, BMW 3 Series"
                textarea
              />

              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.opt_in_whatsapp} onChange={(e) => update('opt_in_whatsapp', e.target.checked)} />
                  WhatsApp opt-in
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.opt_in_email} onChange={(e) => update('opt_in_email', e.target.checked)} />
                  Email opt-in
                </label>
              </div>
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
              <Button onClick={handleSave} loading={saving} disabled={!form.name.trim() || !form.phone.trim()}>
                {customer ? 'Save Changes' : 'Add Lead'}
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)',
          color: 'var(--text-primary)', fontSize: 13, outline: 'none',
        }}
        className="modal-input"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
