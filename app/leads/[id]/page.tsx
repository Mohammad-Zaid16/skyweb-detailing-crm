'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Customer, Vehicle, Booking, Interaction, FileRecord } from '@/lib/supabase';
import { Card, HeatBadge, StatusBadge, LoadingState, Button } from '@/components/ui';
import FileUpload from '@/components/FileUpload';
import FilePreviewGrid from '@/components/FilePreviewGrid';
import LeadModal from '@/components/LeadModal';
import BookingModal from '@/components/BookingModal';
import VehicleModal from '@/components/VehicleModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Phone, Mail, MapPin, Car, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteLeadConfirmOpen, setDeleteLeadConfirmOpen] = useState(false);
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFiles = useCallback(async () => {
    const { data } = await supabase
      .from('detailing_files')
      .select('*')
      .eq('customer_id', id)
      .order('uploaded_at', { ascending: false });
    setFiles(data || []);
  }, [id]);

  const loadAll = useCallback(async () => {
    const [{ data: cust }, { data: veh }, { data: book }, { data: inter }] = await Promise.all([
      supabase.from('detailing_customers').select('*').eq('id', id).single(),
      supabase.from('detailing_vehicles').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('detailing_bookings').select('*').eq('customer_id', id).order('scheduled_time', { ascending: false }),
      supabase.from('detailing_interactions').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    ]);
    setCustomer(cust);
    setVehicles(veh || []);
    setBookings(book || []);
    setInteractions(inter || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      await loadAll();
      await loadFiles();
      setLoading(false);
    })();
  }, [id, loadAll, loadFiles]);

  function openAddVehicle() {
    setEditingVehicle(null);
    setVehicleModalOpen(true);
  }

  function openEditVehicle(v: Vehicle) {
    setEditingVehicle(v);
    setVehicleModalOpen(true);
  }

  async function handleDeleteVehicle() {
    if (!deleteVehicleConfirm) return;
    setDeleting(true);
    await supabase.from('detailing_vehicles').delete().eq('id', deleteVehicleConfirm.id);
    setDeleting(false);
    setDeleteVehicleConfirm(null);
    await loadAll();
    showToast('Vehicle removed', 'success');
  }

  async function handleDeleteLead() {
    setDeleting(true);
    const { error } = await supabase.from('detailing_customers').delete().eq('id', id);
    setDeleting(false);
    if (error) {
      showToast('Could not delete lead — it may have linked records.', 'error');
      return;
    }
    showToast('Lead deleted', 'success');
    router.push('/leads');
  }

  if (loading) return <LoadingState />;
  if (!customer) return <div style={{ padding: 40 }}>Lead not found.</div>;

  return (
    <div>
      <div className="page-content-pad" style={{ paddingBottom: 0 }}>
        <button
          onClick={() => router.push('/leads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={15} /> Back to Leads
        </button>
      </div>

      <div className="page-content-pad" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>{customer.name}</h1>
            <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 13.5, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={13} /> {customer.phone}
              </span>
              {customer.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={13} /> {customer.email}
                </span>
              )}
              {customer.postcode && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} /> {customer.postcode}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <HeatBadge heat={customer.heat} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>
              {customer.score}
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)} icon={<Pencil size={13} />}>
              Edit
            </Button>
            <button onClick={() => setDeleteLeadConfirmOpen(true)} className="delete-lead-btn touch-target" title="Delete lead">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="responsive-grid-2">
          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Car size={15} /> Vehicles
              </h3>
              <Button variant="secondary" size="sm" onClick={openAddVehicle} icon={<Plus size={13} />}>
                Add
              </Button>
            </div>
            {vehicles.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No vehicle on file.</div>
            ) : (
              vehicles.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {v.colour || 'Colour n/a'} · {v.reg_plate || 'No plate on file'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEditVehicle(v)} className="icon-btn" title="Edit vehicle">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setDeleteVehicleConfirm(v)} className="icon-btn icon-btn-danger" title="Delete vehicle">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Lead Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <Row label="Source" value={customer.source} />
              <Row label="Status" value={customer.status} />
              <Row label="WhatsApp opt-in" value={customer.opt_in_whatsapp ? 'Yes' : 'No'} />
              <Row label="Email opt-in" value={customer.opt_in_email ? 'Yes' : 'No'} />
              <Row
                label="Last contact"
                value={customer.last_contact_at ? new Date(customer.last_contact_at).toLocaleDateString('en-GB') : 'Never'}
              />
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 20 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Bookings</h3>
              <Button variant="secondary" size="sm" onClick={() => setBookingModalOpen(true)} icon={<Plus size={13} />}>
                New Booking
              </Button>
            </div>
            {bookings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No bookings yet.</div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.service_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(b.scheduled_time).toLocaleString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {b.price && <span style={{ fontSize: 13, fontWeight: 600 }}>£{b.price}</span>}
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div style={{ marginTop: 20 }}>
          <Card style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Interaction History</h3>
            {interactions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No interactions logged.</div>
            ) : (
              interactions.map((i) => (
                <div key={i.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize', color: 'var(--teal)' }}>
                      {i.channel}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {new Date(i.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{i.message_preview}</div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div style={{ marginTop: 20 }}>
          <Card style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={15} /> Files & Photos
            </h3>
            <FileUpload customerId={customer.id} onUploaded={loadFiles} />
            <FilePreviewGrid files={files} onDeleted={loadFiles} />
          </Card>
        </div>
      </div>

      <LeadModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => {
          loadAll();
          showToast('Lead updated', 'success');
        }}
        customer={customer}
      />
      <BookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSaved={() => {
          loadAll();
          showToast('Booking created', 'success');
        }}
        presetCustomerId={customer.id}
      />
      <VehicleModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onSaved={() => {
          loadAll();
          showToast(editingVehicle ? 'Vehicle updated' : 'Vehicle added', 'success');
        }}
        customerId={customer.id}
        vehicle={editingVehicle}
      />
      <ConfirmDialog
        open={deleteLeadConfirmOpen}
        title="Delete this lead?"
        message={`This will permanently remove ${customer.name} and all linked bookings, files, and interaction history. This cannot be undone.`}
        onConfirm={handleDeleteLead}
        onCancel={() => setDeleteLeadConfirmOpen(false)}
        loading={deleting}
      />
      <ConfirmDialog
        open={!!deleteVehicleConfirm}
        title="Remove this vehicle?"
        message={`This will remove ${deleteVehicleConfirm?.make || ''} ${deleteVehicleConfirm?.model || ''} from this lead's profile.`}
        onConfirm={handleDeleteVehicle}
        onCancel={() => setDeleteVehicleConfirm(null)}
        loading={deleting}
      />

      <style>{`
        .icon-btn {
          width: 24px; height: 24px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-elevated); border: none; color: var(--text-secondary);
        }
        .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .icon-btn-danger:hover { background: var(--hot-glow); color: var(--hot); }
        .delete-lead-btn {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-elevated); border: 1px solid var(--border-glow); color: var(--text-secondary);
        }
        .delete-lead-btn:hover { background: var(--hot-glow); color: var(--hot); border-color: var(--hot); }
        @media (max-width: 768px) {
          .icon-btn { width: 40px; height: 40px; border-radius: 9px; }
          .delete-lead-btn { width: 44px; height: 44px; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
