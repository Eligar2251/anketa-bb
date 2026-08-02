'use client';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const GLOBAL_KEY = '__character_sheet_supabase_singleton__';

export function getSupabase() {
  if (typeof window === 'undefined') return null;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  if (!window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return window[GLOBAL_KEY];
}