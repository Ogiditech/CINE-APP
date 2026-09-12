import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Cache connection in serverless environment
let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/cinebook";

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  if (!dbInstance) {
    dbInstance = drizzle(poolInstance, { schema });
  }

  return dbInstance;
}

export const db = getDb();
export { schema };
