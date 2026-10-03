import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Astro injects env vars into import.meta.env, but CLI tools use process.env
const dbUrl = (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL) 
  || (typeof process !== 'undefined' && process.env?.DATABASE_URL);

if (!dbUrl) {
  throw new Error("No database connection string was provided");
}

const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });
