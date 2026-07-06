'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Customer } from '@/lib/supabase';
import { PageHeader, Card, HeatBadge, LoadingState, EmptyState, Button } from '@/components/ui';
import LeadModal from '@/components/LeadModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Search, LayoutGrid, List, Users, Phone, Mail, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

const STATUS_COLUMNS = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'booking_requested', label: 'Booking Requested' },
  { key: 'confirmed', label: 'Confirmed' },
];

export default function LeadsPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [heatFilter, setHeatFilter] = useState<string>('ALL');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function loadCustomers() {
    const { data } = await supabase
      .from('detailing_customers')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID)
      .order('score', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query) ||
        (c.email || '').toLowerCase().includes(query.toLowerCase());
      const matchesHeat = heatFilter === 'ALL' || c.heat === heatFilter;
      return matchesQuery && matchesHeat;
    });
  }, [customers, query, heatFilter]);

  const heatCounts = {
    ALL: customers.length,
    HOT: customers.filter((c) => c.heat === 'HOT').length,
    WARM: customers.filter((c) => c.heat === 'WARM').length,
    COOL: customers.filter((c) => c.heat === 'COOL').length,
    COLD: customers.filter((c) => c.heat === 'COLD').length,
  };

  async function updateStatus(customerId: string, newStatus: string) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)));
    await supabase.from('detailing_customers').update({ status: newStatus }).eq('id', customerId);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((c) => c.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleBulkStatusChange(newStatus: string) {
    const ids = Array.from(selected);
    setCustomers((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, status: newStatus } : c)));
    await supabase.from('detailing_customers').update({ status: newStatus }).in('id', ids);
    showToast(`${ids.length} lead${ids.length > 1 ? 's' : ''} moved to ${newStatus.replace('_', ' ')}`, 'success');
    clearSelection();
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from('detailing_customers').delete().in('id', ids);
    setBulkDeleting(false);
    setBulkDeleteConfirm(false);
    if (error) {
      showToast('Could not delete some leads.', 'error');
      return;
    }
    showToast(`${ids.length} lead${ids.length > 1 ? 's' : ''} deleted`, 'success');
    clearSelection();
    await loadCustomers();
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${customers.length} total customers`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 3, borderRadius: 9 }}>
              <ViewToggleBtn active={view === 'table'} onClick={() => setView('table')} icon={<List size={14} />} label="Table" />
              <ViewToggleBtn active={view === 'kanban'} onClick={() => setView('kanban')} icon={<LayoutGrid size={14} />} label="Kanban" />
            </div>
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>
              Add Lead
            </Button>
          </div>
        }
      />

      <div className="page-content-pad">
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 8,
              padding: '8px 12px',
              flex: 1,
              minWidth: 220,
              maxWidth: 320,
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search name, phone, email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
            />
          </div>

          {(['ALL', 'HOT', 'WARM', 'COOL', 'COLD'] as const).map((h) => (
            <motion.button
              key={h}
              whileTap={{ scale: 0.96 }}
              onClick={() => setHeatFilter(h)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
                border: '1px solid ' + (heatFilter === h ? 'var(--teal)' : 'var(--border-hairline)'),
                background: heatFilter === h ? 'var(--teal-glow)' : 'transparent',
                color: heatFilter === h ? 'var(--teal)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {h === 'ALL' ? 'All' : h.charAt(0) + h.slice(1).toLowerCase()} ({heatCounts[h]})
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected.size > 0 && view === 'table' && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{ marginBottom: 14 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  background: 'var(--teal-glow)',
                  border: '1px solid var(--teal)',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>{selected.size} selected</span>
                <div style={{ width: 1, height: 16, background: 'var(--border-glow)' }} />
                <select
                  onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value)}
                  value=""
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                  }}
                >
                  <option value="">Move to...</option>
                  {STATUS_COLUMNS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--hot)',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  onClick={clearSelection}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none' }}
                >
                  <X size={13} /> Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <EmptyState
            message="No leads match your filters."
            icon={<Users size={22} />}
            action={
              customers.length === 0 ? (
                <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>
                  Add Your First Lead
                </Button>
              ) : undefined
            }
          />
        ) : view === 'table' ? (
          <TableView customers={filtered} selected={selected} onToggleSelect={toggleSelect} onSelectAll={selectAll} />
        ) : (
          <KanbanView customers={filtered} onStatusChange={updateStatus} />
        )}
      </div>

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => { loadCustomers(); showToast('Lead added', 'success'); }} />
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title={`Delete ${selected.size} lead${selected.size > 1 ? 's' : ''}?`}
        message="This will permanently remove the selected leads and all their linked bookings, files, and history. This cannot be undone."
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
        loading={bulkDeleting}
      />
    </div>
  );
}

function ViewToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: 600,
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--teal)' : 'var(--text-secondary)',
        border: 'none',
      }}
    >
      {icon} {label}
    </button>
  );
}

function TableView({
  customers,
  selected,
  onToggleSelect,
  onSelectAll,
}: {
  customers: Customer[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}) {
  const allSelected = customers.length > 0 && customers.every((c) => selected.has(c.id));

  return (
    <>
      <Card style={{ overflow: 'hidden' }} className="desktop-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-hairline)' }}>
              <th style={{ padding: '12px 16px', width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} />
              </th>
              {['Name', 'Phone', 'Service Interest', 'Source', 'Score', 'Heat', 'Added'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, idx) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                style={{
                  borderBottom: '1px solid var(--border-hairline)',
                  background: selected.has(c.id) ? 'var(--teal-glow)' : 'transparent',
                }}
                className="table-row"
              >
                <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => onToggleSelect(c.id)} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }} onClick={() => (window.location.href = `/leads/${c.id}`)}>
                  {c.name}
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.phone}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.notes || '—'}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.source}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{c.score}</td>
                <td style={{ padding: '14px 20px' }}>
                  <HeatBadge heat={c.heat} />
                </td>
                <td style={{ padding: '14px 20px', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <style>{`.table-row:hover { background: var(--bg-hover); }`}</style>
      </Card>

      {/* Mobile card list — swaps in via CSS below 768px, no duplicate data fetching */}
      <div className="mobile-card-list" style={{ flexDirection: 'column', gap: 10 }}>
        {customers.map((c, idx) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
            <Card style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => onToggleSelect(c.id)}
                  style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
                />
                <Link href={`/leads/${c.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                    <HeatBadge heat={c.heat} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <span>{c.phone}</span>
                    {c.notes && <span style={{ color: 'var(--text-muted)' }}>{c.notes}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-hairline)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{c.source}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{c.score}/100</span>
                  </div>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ── Drag-and-drop Kanban ───────────────────────────────────────────────────────

function DraggableLeadCard({ customer }: { customer: Customer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: customer.id });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <Card hoverable style={{ padding: 14, cursor: 'grab' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Link
            href={`/leads/${customer.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 13.5, fontWeight: 600 }}
          >
            {customer.name}
          </Link>
          <HeatBadge heat={customer.heat} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Phone size={11} /> {customer.phone}
          </span>
          {customer.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={11} /> {customer.email}
            </span>
          )}
        </div>
        {customer.notes && (
          <div style={{ marginTop: 8, fontSize: 11, padding: '3px 8px', background: 'var(--bg-elevated)', borderRadius: 5, display: 'inline-block', color: 'var(--text-secondary)' }}>
            {customer.notes}
          </div>
        )}
      </Card>
    </div>
  );
}

function DroppableColumn({ id, label, count, children }: { id: string; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 10 }}>
          {count}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 120,
          padding: 6,
          borderRadius: 10,
          background: isOver ? 'var(--teal-glow)' : 'transparent',
          border: isOver ? '1.5px dashed var(--teal)' : '1.5px dashed transparent',
          transition: 'all 0.15s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function KanbanView({ customers, onStatusChange }: { customers: Customer[]; onStatusChange: (id: string, status: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as string;
    const customer = customers.find((c) => c.id === active.id);
    if (customer && (customer.status || 'new') !== newStatus) {
      onStatusChange(active.id as string, newStatus);
    }
  }

  const activeCustomer = customers.find((c) => c.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-scroll">
        {STATUS_COLUMNS.map((col) => {
          const items = customers.filter((c) => (c.status || 'new') === col.key);
          return (
            <DroppableColumn key={col.key} id={col.key} label={col.label} count={items.length}>
              <AnimatePresence>
                {items.map((c) => (
                  <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DraggableLeadCard customer={c} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeCustomer ? (
          <div style={{ width: 260 }}>
            <Card style={{ padding: 14, boxShadow: 'var(--shadow-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{activeCustomer.name}</span>
                <HeatBadge heat={activeCustomer.heat} />
              </div>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
