import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set in environment variables');
  console.error('Please add SUPABASE_URL to your .env file');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

console.log('✅ Supabase configuration loaded');
console.log(`   URL: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabaseAdmin = supabase;
