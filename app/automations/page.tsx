'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, DEFAULT_ORG_ID } from '@/lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState } from '@/components/ui';
import { Zap, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';

type AutomationLog = {
  id: string;
  org_id: string;
  workflow_name: string;
  trigger_type: string | null;
  status: string;
  error_message: string | null;
  payload: any;
  created_at: string;
};

const WORKFLOW_META: Record<string, { label: string; schedule: string; description: string }> = {
  'detailing-intake': {
    label: 'Lead Intake',
    schedule: 'Real-time (webhook)',
    description: 'Captures leads from WhatsApp, website, Google, Instagram, and Facebook',
  },
  'detailing-booking-confirm': {
    label: 'Booking Confirmation',
    schedule: 'Real-time (webhook)',
    description: 'Confirms bookings, syncs Google Calendar, notifies customer and owner',
  },
  'detailing-followup': {
    label: 'Follow-Up Sequence',
    schedule: 'Every 2 hours',
    description: 'Sends personalised follow-up messages to pending leads',
  },
  'detailing-digest': {
    label: 'Daily Digest',
    schedule: 'Daily at 8:00 AM',
    description: 'Sends daily performance summary to the business owner',
  },
};

export default function AutomationsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('detailing_automation_logs')
        .select('*')
        .eq('org_id', DEFAULT_ORG_ID)
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  const workflowNames = Object.keys(WORKFLOW_META);
  const grouped = workflowNames.map((name) => {
    const runs = logs.filter((l) => l.workflow_name === name);
    const lastRun = runs[0];
    const failedCount = runs.filter((r) => r.status !== 'SUCCESS').length;
    return { name, runs, lastRun, failedCount };
  });

  const totalRuns = logs.length;
  const totalFailed = logs.filter((l) => l.status !== 'SUCCESS').length;
  const successRate = totalRuns > 0 ? Math.round(((totalRuns - totalFailed) / totalRuns) * 100) : 100;

  return (
    <div>
      <PageHeader title="Automations" subtitle="Status of your AI-powered workflows" />

      <div className="page-content-pad">
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <Card style={{ padding: '18px 22px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Executions</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{totalRuns}</div>
          </Card>
          <Card style={{ padding: '18px 22px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Success Rate</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: successRate >= 95 ? 'var(--teal)' : 'var(--warm)' }}>
              {successRate}%
            </div>
          </Card>
          <Card style={{ padding: '18px 22px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Failed Runs</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: totalFailed > 0 ? 'var(--hot)' : 'var(--text-primary)' }}>
              {totalFailed}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
          {grouped.map((g, idx) => {
            const meta = WORKFLOW_META[g.name];
            const isHealthy = g.failedCount === 0;
            return (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card style={{ padding: 20 }} hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: isHealthy ? 'var(--teal-glow)' : 'var(--hot-glow)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Zap size={16} color={isHealthy ? 'var(--teal)' : 'var(--hot)'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{meta.schedule}</div>
                      </div>
                    </div>
                    {isHealthy ? (
                      <CheckCircle2 size={17} color="var(--teal)" />
                    ) : (
                      <XCircle size={17} color="var(--hot)" />
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                    {meta.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--border-hairline)' }}>
                    <span>{g.runs.length} runs logged</span>
                    <span>
                      {g.lastRun
                        ? `Last: ${new Date(g.lastRun.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                        : 'No runs yet'}
                    </span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Activity size={15} color="var(--teal)" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Automation History</h3>
          </div>
          {logs.length === 0 ? (
            <EmptyState message="No automation runs logged yet. They'll appear here once your n8n workflows start executing." icon={<Clock size={22} />} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.slice(0, 15).map((log, idx) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 4px',
                    borderBottom: idx < 14 ? '1px solid var(--border-hairline)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 size={14} color="var(--teal)" />
                    ) : (
                      <XCircle size={14} color="var(--hot)" />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {WORKFLOW_META[log.workflow_name]?.label || log.workflow_name}
                    </span>
                    {log.trigger_type && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        via {log.trigger_type}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
