'use client';

import { useEffect, useState } from 'react';
import { supabase, DEFAULT_ORG_ID, Organization } from '@/lib/supabase';
import { PageHeader, Card, LoadingState, Button } from '@/components/ui';
import StorageUsageBar from '@/components/StorageUsageBar';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    whatsapp_number: '',
    calendar_email: '',
    timezone: 'Europe/London',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('detailing_organizations').select('*').eq('id', DEFAULT_ORG_ID).single();
      if (data) {
        setOrg(data);
        setForm({
          name: data.name || '',
          owner_name: data.owner_name || '',
          owner_email: data.owner_email || '',
          owner_phone: data.owner_phone || '',
          whatsapp_number: data.whatsapp_number || '',
          calendar_email: data.calendar_email || '',
          timezone: data.timezone || 'Europe/London',
        });
      }
      setLoading(false);
    })();
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('detailing_organizations').update(form).eq('id', DEFAULT_ORG_ID);
    setSaving(false);
    if (error) {
      showToast('Could not save changes.', 'error');
      return;
    }
    showToast('Settings saved', 'success');
  }

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Organization profile and integrations"
        action={
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        }
      />

      <div className="page-content-pad" style={{ maxWidth: 640 }}>
        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Business Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Business Name" value={form.name} onChange={(v) => update('name', v)} />
            <FormField label="Owner Name" value={form.owner_name} onChange={(v) => update('owner_name', v)} />
            <FormField label="Owner Email" value={form.owner_email} onChange={(v) => update('owner_email', v)} type="email" />
            <FormField label="Owner Phone" value={form.owner_phone} onChange={(v) => update('owner_phone', v)} />
          </div>
        </Card>

        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Integrations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField
              label="WhatsApp Number"
              value={form.whatsapp_number}
              onChange={(v) => update('whatsapp_number', v)}
              hint="Used by your n8n automation workflows to send/receive messages"
            />
            <FormField
              label="Calendar Email"
              value={form.calendar_email}
              onChange={(v) => update('calendar_email', v)}
              hint="The Google account your bookings sync to"
            />
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 9,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-primary)',
                  fontSize: 13.5,
                  outline: 'none',
                }}
                className="settings-input"
              >
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Dublin">Europe/Dublin</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Karachi">Asia/Karachi</option>
              </select>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Storage Usage</h3>
          <StorageUsageBar />
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
            You're on the Supabase free tier — 1GB total storage. Images are automatically compressed on upload to stretch this further.
          </p>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Plan</h3>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 8,
              background: 'var(--teal-glow)',
              color: 'var(--teal)',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {org?.plan || 'basic'}
          </div>
        </Card>
      </div>

      <style>{`.settings-input:focus { border-color: var(--teal) !important; }`}</style>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 9,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-hairline)',
          color: 'var(--text-primary)',
          fontSize: 13.5,
          outline: 'none',
        }}
        className="settings-input"
      />
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}
