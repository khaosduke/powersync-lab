import dotenv from "dotenv"
import "dotenv/config"
import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"
import { Database } from "../../supabase/generated/db_types"

//Ensure supabase session pooler DB URL is used, throws an error if it's not found
dotenv.config({
  path: ".env.development.local",
})

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})