import path from 'node:path';

import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';

import * as schema from '@/models/Schema';
import { Env } from './Env';

let drizzle_db: NeonHttpDatabase<typeof schema> | undefined;
const DATABASE_URL = Env.DATABASE_URL!;
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && DATABASE_URL) {
  const sql = neon(DATABASE_URL);
  drizzle_db = drizzle(sql, { schema });
  
  await migrate(drizzle_db, {
    migrationsFolder: path.join(process.cwd(), 'migrations'),
  });
} else {
  // Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
  const global = globalThis as unknown as { 
    drizzle?: NeonHttpDatabase<typeof schema>; 
  };

  if (!global.drizzle) {
    const sql = neon(DATABASE_URL);
    global.drizzle = drizzle(sql, { schema });
  }

  drizzle_db = global.drizzle;
  
  await migrate(drizzle_db, {
    migrationsFolder: path.join(process.cwd(), 'migrations'),
  });
}

if (!drizzle_db) {
  throw new Error('Database connection could not be established');
}

export const db = drizzle_db;