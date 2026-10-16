import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rqoehhdrinpdiabufqwj.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2VoaGRyaW5wZGlhYnVmcXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4Mjk5NzksImV4cCI6MjEwNjQwNTk3OX0.UDWAWRV0BPQkBpz7VFxCk9XpEw-7aFNRagn8Frm947Q';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'https://placeholder.supabase.co'
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
