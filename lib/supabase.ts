
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Please paste your Supabase Project URL and Anon Key here
const SUPABASE_URL = 'https://pzbhluqbhpwcocqfmrcp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6YmhsdXFiaHB3Y29jcWZtcmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjUxNzgsImV4cCI6MjA4MDI0MTE3OH0.vswx9pFnia38Zp0_6CBVtTpecV1d6ZdkWk_MgLnQrnA';
// ---------------------

// Check if credentials are configured to prevent crash
const isConfigured = SUPABASE_URL.startsWith('http');

if (!isConfigured) {
    console.warn('Supabase is not configured. Cloud features will not work. Please update lib/supabase.ts');
}

// Use placeholder URL if not configured to prevent "Invalid supabaseUrl" error on startup
const validUrl = isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co';
const validKey = isConfigured ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase = createClient(validUrl, validKey);

/**
 * SQL SETUP INSTRUCTIONS:
 * Run this in your Supabase SQL Editor to create the backups table:
 * 
 * create table backups (
 *   user_id uuid references auth.users not null primary key,
 *   data jsonb,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * alter table backups enable row level security;
 * create policy "Users can all their own backup" on backups for all using (auth.uid() = user_id);
 */
