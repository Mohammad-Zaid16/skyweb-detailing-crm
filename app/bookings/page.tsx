'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Booking, Customer } from '@/lib/supabase';
import { PageHeader, Card, StatusBadge, LoadingState, EmptyState, Button } from '@/components/ui';
import BookingModal from '@/components/BookingModal';
import { CalendarDays, List, ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile';

type BookingWithCustomer = Booking & { customer?: Customer };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [monthOffset, setMonthOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  async function loadBookings() {
    const { data: bookData } = await supabase
      .from('detailing_bookings')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID)
      .order('scheduled_time', { ascending: true });

    if (bookData && bookData.length > 0) {
      const custIds = [...new Set(bookData.map((b) => b.customer_id))];
      const { data: custData } = await supabase.from('detailing_customers').select('*').in('id', custIds);
      const custMap = new Map((custData || []).map((c) => [c.id, c]));
      setBookings(bookData.map((b) => ({ ...b, customer: custMap.get(b.customer_id) })));
    } else {
      setBookings([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function openNewBooking() {
    setEditingBooking(null);
    setModalOpen(true);
  }

  function openEditBooking(b: Booking) {
    setEditingBooking(b);
    setModalOpen(true);
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={`${bookings.length} total bookings`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 3, borderRadius: 9 }}>
              <ToggleBtn active={view === 'list'} onClick={() => setView('list')} icon={<List size={14} />} label="List" />
              <ToggleBtn active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays size={14} />} label="Calendar" />
            </div>
            <Button onClick={openNewBooking} icon={<Plus size={15} />}>
              New Booking
            </Button>
          </div>
        }
      />

      <div className="page-content-pad">
        {bookings.length === 0 ? (
          <EmptyState
            message="No bookings yet."
            icon={<CalendarDays size={22} />}
            action={
              <Button onClick={openNewBooking} icon={<Plus size={15} />}>
                Create First Booking
              </Button>
            }
          />
        ) : view === 'list' ? (
          <ListView bookings={bookings} onEdit={openEditBooking} />
        ) : (
          <CalendarView bookings={bookings} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
        )}
      </div>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadBookings}
        booking={editingBooking}
      />
    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
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

function ListView({ bookings, onEdit }: { bookings: BookingWithCustomer[]; onEdit: (b: Booking) => void }) {
  const grouped = bookings.reduce((acc, b) => {
    const day = new Date(b.scheduled_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(b);
    return acc;
  }, {} as Record<string, BookingWithCustomer[]>);

  return (
    <>
      {Object.entries(grouped).map(([day, items], groupIdx) => (
        <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIdx * 0.05 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {day}
          </div>
          <Card style={{ overflow: 'hidden' }}>
            {items.map((b, idx) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                }}
                className="booking-row-group"
              >
                <Link
                  href={b.customer ? `/leads/${b.customer.id}` : '#'}
                  style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--teal)', minWidth: 56 }}>
                    {new Date(b.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.service_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.customer?.name || 'Unknown customer'} · {b.customer?.phone}
                    </div>
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {b.price && <span style={{ fontSize: 13, fontWeight: 600 }}>£{b.price}</span>}
                  <StatusBadge status={b.status} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(b);
                    }}
                    className="edit-booking-btn"
                    title="Edit booking"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </motion.div>
      ))}
      <style>{`
        .booking-row-group:hover { background: var(--bg-hover); }
        .edit-booking-btn {
          width: 28px; height: 28px; border-radius: 7px;
          background: var(--bg-elevated); border: none; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
        }
        .edit-booking-btn:hover { background: var(--bg-hover); color: var(--teal); }
        @media (max-width: 768px) {
          .edit-booking-btn { width: 40px; height: 40px; border-radius: 9px; }
        }
      `}</style>
    </>
  );
}

function CalendarView({
  bookings,
  monthOffset,
  setMonthOffset,
}: {
  bookings: BookingWithCustomer[];
  monthOffset: number;
  setMonthOffset: (fn: (n: number) => number) => void;
}) {
  const isMobile = useIsMobile();
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookingsByDay: Record<number, BookingWithCustomer[]> = {};
  bookings.forEach((b) => {
    const d = new Date(b.scheduled_time);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!bookingsByDay[day]) bookingsByDay[day] = [];
      bookingsByDay[day].push(b);
    }
  });

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const heatColors = ['var(--teal)', 'var(--blue)', 'var(--violet)', 'var(--warm)'];

  // ── Mobile: agenda list for the visible month instead of a cramped grid ──
  if (isMobile) {
    const daysWithBookings = Object.keys(bookingsByDay)
      .map(Number)
      .sort((a, b) => a - b);

    return (
      <Card style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{monthLabel}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setMonthOffset((n) => n - 1)} className="cal-nav-btn touch-target">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setMonthOffset((n) => n + 1)} className="cal-nav-btn touch-target">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {daysWithBookings.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            No bookings this month.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {daysWithBookings.map((day) => {
              const dayDate = new Date(year, month, day);
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              return (
                <div key={day}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? 'var(--teal)' : 'var(--text-muted)', marginBottom: 8 }}>
                    {dayDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {isToday && ' · Today'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {bookingsByDay[day].map((b, i) => (
                      <div
                        key={b.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 9,
                          background: 'var(--bg-elevated)',
                          borderLeft: `2px solid ${heatColors[i % heatColors.length]}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {new Date(b.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {b.price && <span style={{ fontSize: 12.5, fontWeight: 600 }}>£{b.price}</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>
                          {b.service_name} · {b.customer?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          .cal-nav-btn {
            width: 36px; height: 36px; border-radius: 7px;
            background: var(--bg-elevated); border: 1px solid var(--border-hairline);
            color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
          }
          .cal-nav-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        `}</style>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{monthLabel}</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMonthOffset((n) => n - 1)} className="cal-nav-btn">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMonthOffset((n) => n + 1)} className="cal-nav-btn">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, idx) => {
          const dayBookings = day ? bookingsByDay[day] || [] : [];
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.008 }}
              style={{
                minHeight: 76,
                borderRadius: 9,
                padding: '6px 7px',
                background: day ? 'var(--bg-elevated)' : 'transparent',
                border: isToday ? '1px solid var(--teal)' : '1px solid transparent',
              }}
            >
              {day && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--teal)' : 'var(--text-secondary)', marginBottom: 4 }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayBookings.slice(0, 2).map((b, i) => (
                      <div
                        key={b.id}
                        style={{
                          fontSize: 9.5,
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: `${heatColors[i % heatColors.length]}22`,
                          color: heatColors[i % heatColors.length],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                        }}
                      >
                        {new Date(b.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} {b.service_name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>+{dayBookings.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .cal-nav-btn {
          width: 30px; height: 30px; border-radius: 7px;
          background: var(--bg-elevated); border: 1px solid var(--border-hairline);
          color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
        }
        .cal-nav-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
      `}</style>
    </Card>
  );
}
