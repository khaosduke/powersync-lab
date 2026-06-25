// seeds/0001_lists.ts

import { Kysely, sql } from "kysely"

export async function seed(db: Kysely<any>) {
  await sql`
    create table
        public.lists (
            id uuid not null default gen_random_uuid (),
            created_at timestamp with time zone not null default now(),
            name text not null,
            owner_id uuid not null,
            constraint lists_pkey primary key (id),
            constraint lists_owner_id_fkey foreign key (owner_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;
  `.execute(db)
}