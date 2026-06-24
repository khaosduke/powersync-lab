import { Kysely, sql } from 'kysely'

//todos demo schma for lab

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	// up migration code goes here...
	// note: up migrations are mandatory. you must implement this function.
	// For more info, see: https://kysely.dev/docs/migrations

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

	await sql`
		create table
		public.todos (
			id uuid not null default gen_random_uuid (),
			created_at timestamp with time zone not null default now(),
			completed_at timestamp with time zone null,
			description text not null,
			completed boolean not null default false,
			created_by uuid null,
			completed_by uuid null,
			list_id uuid not null,
			constraint todos_pkey primary key (id),
			constraint todos_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null,
			constraint todos_completed_by_fkey foreign key (completed_by) references auth.users (id) on delete set null,
			constraint todos_list_id_fkey foreign key (list_id) references lists (id) on delete cascade
		) tablespace pg_default;
	`.execute(db)

	await sql` 
		-- Grant Data API access so supabase-js can read and write these tables.
		grant select, insert, update, delete on public.lists to authenticated;
		grant select, insert, update, delete on public.todos to authenticated;
		grant select, insert, update, delete on public.lists to service_role;
		grant select, insert, update, delete on public.todos to service_role;

		-- Enable Row Level Security and add policies so each user can only access their own data.
		alter table public.lists enable row level security;
		alter table public.todos enable row level security;
	`.execute(db)

	await sql`
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

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	// down migration code goes here...
	// note: down migrations are optional. you can safely delete this function.
	// For more info, see: https://kysely.dev/docs/migrations
}
