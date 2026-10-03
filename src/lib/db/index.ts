import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Astro injects env vars into import.meta.env, but CLI tools use process.env
const dbUrl = (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL) 
  || (typeof process !== 'undefined' && process.env?.DATABASE_URL)
  || '';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;

  if (!dbUrl) {
    console.warn('[DB] Warning: No DATABASE_URL connection string provided.');
    // Return a proxy that fails gracefully on execution rather than module load
    return new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'then') return undefined; // don't look like a promise
        return () => {
          throw new Error('Database is unconfigured: DATABASE_URL environment variable is missing.');
        };
      }
    });
  }

  pool = new Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 6000,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export const db = new Proxy({} as any, {
  get(_, prop) {
    const target = getDb();
    const val = (target as any)[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  }
}) as ReturnType<typeof drizzle<typeof schema>>;
