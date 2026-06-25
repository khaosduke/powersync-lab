import { Kysely, sql } from "kysely"

export async function seed(db: Kysely<any>) {
  await sql`
    alter table public.lists enable row level security;
    alter table public.todos enable row level security;

    create policy "owned lists" on public.lists
    for all to authenticated
    using (auth.uid() = owner_id);

    create policy "todos in owned lists" on public.todos
    for all to authenticated
    using (
        auth.uid() in (
        select lists.owner_id from public.lists where lists.id = todos.list_id
        )
        );
   `.execute(db)
}