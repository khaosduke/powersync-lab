import { defineConfig } from "kysely-ctl"
import { db } from "../src/lib/kysely_database"

export default defineConfig({
  kysely: db,

  migrations: {
    migrationFolder: "../migrations",
  },

  seeds: {
    seedFolder: "../seeds",
  },
})