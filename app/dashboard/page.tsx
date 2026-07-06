'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID, Customer, Booking } from '@/lib/supabase';
import { PageHeader, Card, StatTile, HeatBadge, LoadingState, Button } from '@/components/ui';
import { Flame, Users, CalendarCheck, PoundSterling, Plus, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import TrendChart, { TrendPoint } from '@/components/TrendChart';

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: custData }, { data: bookData }] = await Promise.all([
        supabase
          .from('detailing_customers')
          .select('*')
          .eq('org_id', DEFAULT_ORG_ID)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('detailing_bookings')
          .select('*')
          .eq('org_id', DEFAULT_ORG_ID)
          .order('scheduled_time', { ascending: true })
          .limit(500),
      ]);
      setCustomers(custData || []);
      setBookings(bookData || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const newToday = customers.filter((c) => new Date(c.created_at).getTime() > cutoff).length;
  const hotLeads = customers.filter((c) => c.heat === 'HOT').length;
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.scheduled_time).getTime() > Date.now() && b.status !== 'CANCELLED'
  );
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.price || 0), 0);
  const conversionRate = customers.length > 0
    ? Math.round((bookings.length / customers.length) * 100)
    : 0;

  const recentLeads = customers.slice(0, 5);
  const todayBookings = upcomingBookings.filter((b) => {
    const d = new Date(b.scheduled_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const nextBookings = upcomingBookings.slice(0, 5);

  // Build 30-day trend data
  const trendData: TrendPoint[] = [];
  for (let i = 29; i >= 0; i -= 3) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayLeads = customers.filter((c) => {
      const cd = new Date(c.created_at);
      return cd <= day && cd > new Date(day.getTime() - 3 * 24 * 60 * 60 * 1000);
    }).length;
    const dayRevenue = bookings
      .filter((b) => {
        const bd = new Date(b.created_at);
        return bd <= day && bd > new Date(day.getTime() - 3 * 24 * 60 * 60 * 1000) && (b.status === 'CONFIRMED' || b.status === 'COMPLETED');
      })
      .reduce((s, b) => s + (b.price || 0), 0);
    trendData.push({
      date: day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      leads: dayLeads,
      revenue: dayRevenue,
    });
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of leads, bookings, and revenue"
        action={
          <Link href="/leads">
            <Button icon={<Plus size={15} />}>New Lead</Button>
          </Link>
        }
      />

      <div className="page-content-pad">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatTile label="New Leads (24h)" value={newToday} accent="var(--blue)" icon={<Users size={17} />} delay={0} />
          <StatTile label="Hot Leads" value={hotLeads} accent="var(--hot)" icon={<Flame size={17} />} delay={0.05} />
          <StatTile
            label="Upcoming Bookings"
            value={upcomingBookings.length}
            accent="var(--teal)"
            icon={<CalendarCheck size={17} />}
            delay={0.1}
          />
          <StatTile
            label="Total Revenue"
            value={totalRevenue}
            isCurrency
            accent="var(--warm)"
            icon={<PoundSterling size={17} />}
            delay={0.15}
          />
        </div>

        <div className="responsive-grid-2-wide" style={{ marginBottom: 20 }}>
          <Card delay={0.2} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Last 30 Days</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Leads and revenue trend</p>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--teal)' }} /> Leads
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--blue)' }} /> Revenue
                </span>
              </div>
            </div>
            <TrendChart data={trendData} />
          </Card>

          <Card delay={0.25} style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={15} color="var(--teal)" />
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Today's Schedule</h3>
            </div>
            {todayBookings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Nothing booked today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayBookings.map((b) => (
                  <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--teal)',
                        minWidth: 48,
                      }}
                    >
                      {new Date(b.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service_name}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-hairline)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Conversion Rate</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, conversionRate)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--blue))', borderRadius: 3 }}
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{conversionRate}%</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="responsive-grid-2-lead">
          <Card delay={0.3} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Leads</h3>
              <Link href="/leads" style={{ fontSize: 12.5, color: 'var(--teal)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowUpRight size={13} />
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No leads yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentLeads.map((c, idx) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + idx * 0.04 }}>
                    <Link
                      href={`/leads/${c.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '11px 12px',
                        borderRadius: 8,
                      }}
                      className="lead-row"
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, textTransform: 'capitalize' }}>
                          {c.source} · {c.phone}
                        </div>
                      </div>
                      <HeatBadge heat={c.heat} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          <Card delay={0.35} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Upcoming Bookings</h3>
              <Link href="/bookings" style={{ fontSize: 12.5, color: 'var(--teal)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowUpRight size={13} />
              </Link>
            </div>
            {nextBookings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No upcoming bookings.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nextBookings.map((b, idx) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.04 }}
                    style={{
                      padding: '11px 12px',
                      borderRadius: 8,
                      borderLeft: '2px solid var(--teal)',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.service_name || 'Service'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(b.scheduled_time).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {b.price ? ` · £${b.price}` : ''}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`
        .lead-row:hover { background: var(--bg-hover); }
      `}</style>
    </div>
  );
}
