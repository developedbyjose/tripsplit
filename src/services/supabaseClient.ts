import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables. Fallback to mock values to prevent crash if not yet set.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mockproject.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockKey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
