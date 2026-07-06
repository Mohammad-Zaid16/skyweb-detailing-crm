'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, ServiceItem } from '@/lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, Button, Spinner } from '@/components/ui';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Clock, PoundSterling, Plus, Pencil, Trash2, X, Wrench } from 'lucide-react';

const emptyForm = { name: '', description: '', price_from: '', price_to: '', duration_minutes: '120' };

export default function ServicesPage() {
  const { showToast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadServices() {
    const { data } = await supabase
      .from('detailing_services')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID)
      .order('price_from', { ascending: true });
    setServices(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(s: ServiceItem) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description || '',
      price_from: String(s.price_from ?? ''),
      price_to: String(s.price_to ?? ''),
      duration_minutes: String(s.duration_minutes),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      org_id: DEFAULT_ORG_ID,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_from: form.price_from ? parseFloat(form.price_from) : null,
      price_to: form.price_to ? parseFloat(form.price_to) : null,
      duration_minutes: parseInt(form.duration_minutes) || 120,
    };

    if (editingId) {
      await supabase.from('detailing_services').update(payload).eq('id', editingId);
    } else {
      await supabase.from('detailing_services').insert(payload);
    }

    setSaving(false);
    setModalOpen(false);
    await loadServices();
    showToast(editingId ? 'Service updated' : 'Service added', 'success');
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    await supabase.from('detailing_services').delete().eq('id', deleteConfirm.id);
    setDeleting(false);
    setDeleteConfirm(null);
    await loadServices();
    showToast('Service deleted', 'success');
  }

  async function toggleActive(s: ServiceItem) {
    setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
    await supabase.from('detailing_services').update({ active: !s.active }).eq('id', s.id);
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Your service catalog and pricing"
        action={
          <Button onClick={openAddModal} icon={<Plus size={15} />}>
            Add Service
          </Button>
        }
      />

      <div className="page-content-pad">
        {services.length === 0 ? (
          <EmptyState
            message="No services configured yet. Add your first service to start quoting automatically."
            icon={<Wrench size={22} />}
            action={
              <Button onClick={openAddModal} icon={<Plus size={15} />}>
                Add Service
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            <AnimatePresence>
              {services.map((s, idx) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card hoverable style={{ padding: 22, opacity: s.active ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</h3>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEditModal(s)} className="icon-btn" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(s)} className="icon-btn icon-btn-danger" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                        {s.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <PoundSterling size={13} />
                        {s.price_from}
                        {s.price_to && s.price_to !== s.price_from ? `–${s.price_to}` : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} /> {s.duration_minutes} min
                      </span>
                    </div>
                    <button
                      onClick={() => toggleActive(s)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: s.active ? 'var(--teal-glow)' : 'rgba(86,86,103,0.15)',
                        color: s.active ? 'var(--teal)' : 'var(--text-muted)',
                        border: 'none',
                      }}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
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
                maxWidth: 440,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glow)',
                borderRadius: 16,
                padding: 26,
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editingId ? 'Edit Service' : 'Add Service'}</h3>
                <button onClick={() => setModalOpen(false)} className="modal-close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ModalField label="Service Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Full Detail" />
                <ModalField
                  label="Description"
                  value={form.description}
                  onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Brief description of what's included"
                  textarea
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <ModalField label="Price From (£)" value={form.price_from} onChange={(v) => setForm((f) => ({ ...f, price_from: v }))} type="number" />
                  <ModalField label="Price To (£)" value={form.price_to} onChange={(v) => setForm((f) => ({ ...f, price_to: v }))} type="number" />
                </div>
                <ModalField
                  label="Duration (minutes)"
                  value={form.duration_minutes}
                  onChange={(v) => setForm((f) => ({ ...f, duration_minutes: v }))}
                  type="number"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
                  {editingId ? 'Save Changes' : 'Add Service'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete this service?"
        message={`"${deleteConfirm?.name}" will be permanently removed from your catalog. Existing bookings that reference it keep their recorded price and name.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleting}
      />

      <style>{`
        .icon-btn {
          width: 26px; height: 26px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-elevated); border: none; color: var(--text-secondary);
        }
        .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .icon-btn-danger:hover { background: var(--hot-glow); color: var(--hot); }
        @media (max-width: 768px) {
          .icon-btn { width: 40px; height: 40px; border-radius: 9px; }
        }
      `}</style>
    </div>
  );
}

function ModalField({
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
