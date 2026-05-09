import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SessionRow = {
  id: string;
  day: string;
  day_order: number;
  time_est: string;
  title: string;
  description: string | null;
  type: string;
  requires_tier: string | null;
  is_active: boolean;
  is_recurring: boolean;
  scheduled_for: string | null;
  discord_link: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  member_email: string;
  member_name: string | null;
  clerk_user_id: string | null;
  call_type: string;
  preferred_time: string;
  topic: string | null;
  status: string;
  admin_notes: string | null;
  scheduled_at: string | null;
  slot_id: string | null;
  zoom_link: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySlot = {
  id: string;
  date: string;
  time_est: string;
  duration_minutes: number;
  call_type: string;
  is_booked: boolean;
  booking_id: string | null;
  created_at: string;
};
