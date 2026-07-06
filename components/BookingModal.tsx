'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Booking, Customer, ServiceItem } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { X } from 'lucide-react';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const emptyForm = {
  customer_id: '',
  service_id: '',
  service_name: '',
  date: '',
  time: '10:00',
  address: '',
  postcode: '',
  price: '',
  status: 'CONFIRMED',
  notes: '',
};

export default function BookingModal({
  open,
  onClose,
  onSaved,
  booking,
  presetCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  booking?: Booking | null;
  presetCustomerId?: string;
}) {
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: custData }, { data: svcData }] = await Promise.all([
        supabase.from('detailing_customers').select('*').eq('org_id', DEFAULT_ORG_ID).order('name'),
        supabase.from('detailing_services').select('*').eq('org_id', DEFAULT_ORG_ID).eq('active', true).order('name'),
      ]);
      setCustomers(custData || []);
      setServices(svcData || []);
    })();
  }, [open]);

  useEffect(() => {
    if (booking) {
      const d = new Date(booking.scheduled_time);
      setForm({
        customer_id: booking.customer_id,
        service_id: booking.service_id || '',
        service_name: booking.service_name || '',
        date: d.toISOString().slice(0, 10),
        time: d.toTimeString().slice(0, 5),
        address: booking.address || '',
        postcode: booking.postcode || '',
        price: String(booking.price ?? ''),
        status: booking.status,
        notes: booking.notes || '',
      });
    } else {
      setForm({ ...emptyForm, customer_id: presetCustomerId || '' });
    }
    setError('');
  }, [booking, presetCustomerId, open]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleServiceSelect(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    update('service_id', serviceId);
    if (svc) {
      update('service_name', svc.name);
      update('price', String(svc.price_from ?? ''));
    }
  }

  async function handleSave() {
    if (!form.customer_id) {
      setError('Please select a customer.');
      return;
    }
    if (!form.service_name.trim()) {
      setError('Please select or enter a service.');
      return;
    }
    if (!form.date) {
      setError('Please pick a date.');
      return;
    }

    setSaving(true);
    setError('');

    const scheduledTime = new Date(`${form.date}T${form.time}:00`);
    const endTime = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000);

    const payload = {
      org_id: DEFAULT_ORG_ID,
      customer_id: form.customer_id,
      service_id: form.service_id || null,
      service_name: form.service_name.trim(),
      scheduled_time: scheduledTime.toISOString(),
      end_time: endTime.toISOString(),
      address: form.address.trim() || null,
      postcode: form.postcode.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    const result = booking
      ? await supabase.from('detailing_bookings').update(payload).eq('id', booking.id)
      : await supabase.from('detailing_bookings').insert({ ...payload, source: 'crm_manual' });

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
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{booking ? 'Edit Booking' : 'New Booking'}</h3>
              <button onClick={onClose} className="modal-close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => update('customer_id', e.target.value)}
                  style={selectStyle}
                  className="modal-input"
                  disabled={!!presetCustomerId && !booking}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Service</label>
                <select value={form.service_id} onChange={(e) => handleServiceSelect(e.target.value)} style={selectStyle} className="modal-input">
                  <option value="">Custom / select from catalog...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (£{s.price_from}
                      {s.price_to && s.price_to !== s.price_from ? `–${s.price_to}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {!form.service_id && (
                <Field label="Custom Service Name" value={form.service_name} onChange={(v) => update('service_name', v)} placeholder="e.g. Full Detail" />
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Date" value={form.date} onChange={(v) => update('date', v)} type="date" />
                <Field label="Time" value={form.time} onChange={(v) => update('time', v)} type="time" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Address" value={form.address} onChange={(v) => update('address', v)} placeholder="Street address" />
                <Field label="Postcode" value={form.postcode} onChange={(v) => update('postcode', v)} placeholder="SW1A 1AA" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Price (£)" value={form.price} onChange={(v) => update('price', v)} type="number" />
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)} style={selectStyle} className="modal-input">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
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
                {booking ? 'Save Changes' : 'Create Booking'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 9,
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-hairline)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

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
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ ...selectStyle, resize: 'none', fontFamily: 'inherit' }}
          className="modal-input"
        />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={selectStyle} className="modal-input" />
      )}
      <style>{`.modal-input:focus { border-color: var(--teal) !important; }`}</style>
    </div>
  );
}
