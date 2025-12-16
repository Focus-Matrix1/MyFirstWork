
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Check if credentials are configured to prevent crash
const isConfigured = SUPABASE_URL && SUPABASE_URL.startsWith('http');

if (!isConfigured) {
    console.warn('Supabase is not configured. Cloud features will not work.');
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
