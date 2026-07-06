import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default org — single-tenant for now, becomes dynamic when scaling to multiple detailers
export const DEFAULT_ORG_ID = 'b2000000-0000-0000-0000-000000000001';

export type Customer = {
  id: string;
  org_id: string;
  name: string;
  phone: string;
  email: string | null;
  postcode: string | null;
  source: string;
  status: string;
  score: number;
  heat: 'HOT' | 'WARM' | 'COOL' | 'COLD';
  opt_in_whatsapp: boolean;
  opt_in_email: boolean;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  customer_id: string;
  org_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  reg_plate: string | null;
  size: string;
  notes: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  org_id: string;
  customer_id: string;
  vehicle_id: string | null;
  service_id: string | null;
  service_name: string | null;
  scheduled_time: string;
  end_time: string | null;
  address: string | null;
  postcode: string | null;
  status: string;
  price: number | null;
  notes: string | null;
  calendar_event_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type ServiceItem = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  duration_minutes: number;
  active: boolean;
  created_at: string;
};

export type Interaction = {
  id: string;
  org_id: string;
  customer_id: string | null;
  booking_id: string | null;
  channel: string;
  direction: string;
  message_preview: string | null;
  processed: boolean;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  owner_name: string | null;
  owner_email: string;
  owner_phone: string | null;
  whatsapp_number: string | null;
  calendar_email: string | null;
  timezone: string;
  plan: string;
  active: boolean;
};

export type FileRecord = {
  id: string;
  org_id: string;
  customer_id: string | null;
  booking_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  category: string;
  uploaded_at: string;
};

export const FILES_BUCKET = 'detailing-files';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — matches bucket policy, protects free tier's 1GB total
export const FREE_TIER_STORAGE_BYTES = 1024 * 1024 * 1024; // 1GB Supabase free tier ceiling

export function getFileUrl(path: string): string {
  const { data } = supabase.storage.from(FILES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
