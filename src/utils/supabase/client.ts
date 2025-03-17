import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';
import { Env } from '@/libs/Env';

// Define a function to create a Supabase client for client-side operations
export const createClient = () =>
  createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    Env.NEXT_PUBLIC_SUPABASE_URL!,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );