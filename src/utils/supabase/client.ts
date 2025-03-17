import { createBrowserClient } from '@supabase/ssr';

import { Env } from '@/libs/Env';
import type { Database } from '@/types/db';

// Define a function to create a Supabase client for client-side operations
export const createClient = () =>
  createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    Env.NEXT_PUBLIC_SUPABASE_URL!,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
