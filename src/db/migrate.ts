import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ No DATABASE_URL or DATABASE_URL_UNPOOLED provided.");
    process.exit(1);
  }

  console.log("⚡ Connecting to Neon PostgreSQL for migrations...");
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log("🔄 Executing migrations from ./drizzle folder...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
