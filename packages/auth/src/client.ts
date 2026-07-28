import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Client-side Supabase client (for use in client components)
export const createBrowserClient = () =>
  createSupabaseBrowserClient(supabaseUrl!, supabaseAnonKey!);
