import { Kysely, sql } from "kysely"

export async function seed(db: Kysely<any>) {
  await sql`
    grant select, insert, update, delete on public.lists to authenticated;
    grant select, insert, update, delete on public.todos to authenticated;
    grant select, insert, update, delete on public.lists to service_role;
    grant select, insert, update, delete on public.todos to service_role;
   `.execute(db)
}