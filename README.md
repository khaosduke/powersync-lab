# PowerSync Lab

A reusable Expo template for building **offline-first React Native applications** with Supabase authentication, PowerSync synchronization, Kysely repositories, and Zustand state management.

This repository demonstrates a complete application foundation rather than an isolated PowerSync example. It includes:

- Supabase authentication and session restoration
- Protected Expo Router routes
- PowerSync database initialization
- Explicit first-sync handling for fresh installations
- PowerSync lifecycle state maintained with Zustand
- Local-first reads and writes
- Repository-based persistence
- Pull-based Zustand model stores
- Supabase migrations, seeds, RLS, and sync rules

The included `lists` and `todos` models are deliberately small. They are reference implementations that can be replaced with application-specific models.

---

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Supabase Authentication
- Supabase PostgreSQL
- PowerSync
- OP-SQLite
- Kysely
- Zustand
- Kysely CLI

---

## Core Architecture

This template follows a few strict rules:

1. **Supabase owns authentication and the backend PostgreSQL database.**
2. **PowerSync owns local SQLite synchronization.**
3. **The local PowerSync database is the application's immediate source of truth.**
4. **Repositories own database access.**
5. **Zustand stores own UI-facing state and workflows.**
6. **Screens render state and dispatch actions.**
7. **Screens do not contain SQL or persistence logic.**
8. **Zustand does not replace or duplicate the complete local database.**

```text
Screen
  │
  ▼
Zustand Store
  │
  ▼
Repository
  │
  ▼
Kysely / PowerSync
  │
  ▼
Local SQLite
  │
  ▼
PowerSync Synchronization
  │
  ▼
Supabase PostgreSQL
```

Reads and writes happen against local SQLite first. PowerSync synchronizes those changes with Supabase independently of the immediate UI workflow.

---

## Features

- Expo Router route groups
- Supabase session restoration
- Zustand authentication state machine
- Authenticated route protection
- PowerSync initialization inside authenticated routes
- Explicit initial synchronization
- Fresh-install synchronization support
- PowerSync lifecycle state stored in Zustand
- Local-first SQLite reads and writes
- Offline operation
- Automatic upload queue processing
- Kysely repository layer
- Pull-based Zustand model stores
- Clear loading and error states
- Supabase migrations and seeds
- Row Level Security support
- Android and iOS development builds

---

## Authentication Architecture

Authentication is isolated from application models and synchronization logic.

The authentication engine is responsible for:

- Restoring an existing Supabase session
- Listening for authentication changes
- Loading claims
- Updating the Zustand auth store
- Moving the application through predictable startup states

```text
Application Startup
        │
        ▼
AuthProvider
        │
        ▼
AuthEngine
        │
        ▼
Zustand Auth Store
        │
        ▼
Expo Router Guard
```

Screens do not call Supabase authentication directly.

### Authentication States

```text
booting
   │
   ├── no session ───────────────► signedOut
   │
   └── session found
           │
           ▼
   signedInNoClaims
           │
           ▼
      loadingClaims
           │
           ├── claims loaded ────► signedInReady
           ├── no claims ────────► signedInNoClaims
           └── failure ──────────► error
```

The UI responds to explicit authentication state instead of inferring startup progress from nullable values.

---

## PowerSync System

A singleton PowerSync system owns the local persistence infrastructure.

It creates and exposes:

- The PowerSync database
- The OP-SQLite adapter
- The PowerSync application schema
- The Supabase connector
- The Kysely database interface

React code accesses the system through the PowerSync provider or system hook.

```ts
const system = useSystem();
```

Repositories and other non-React code can import the singleton directly.

```ts
import { system } from "@/lib/powersync/powersync_system";
```

This keeps repositories independent of React and prevents hooks from being used outside components.

---

## PowerSync State with Zustand

PowerSync performs synchronization, but the UI still needs a stable representation of its lifecycle.

This template maintains PowerSync status in a dedicated Zustand store.

The store does **not** synchronize the database itself. It records the state reported by PowerSync and exposes that state to the application.

A typical state shape looks like this:

```ts
type PowerSyncState = {
  initialized: boolean;
  connected: boolean;
  connecting: boolean;
  syncing: boolean;
  initialSyncComplete: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
};
```

The store answers questions such as:

- Has the local database initialized?
- Has PowerSync connected?
- Is synchronization currently running?
- Has the first synchronization completed?
- Is the app currently offline?
- Did synchronization fail?
- When did the last successful sync occur?

### Responsibility Boundary

```text
PowerSync System
    │
    │ emits connection and sync status
    ▼
PowerSync Zustand Store
    │
    │ exposes stable application state
    ▼
Screens and Components
```

The Zustand store is a **status projection**, not the synchronization engine.

It should not:

- Reimplement PowerSync
- Store the complete database
- Maintain another upload queue
- Decide which rows PowerSync downloads
- Replace local SQLite
- Duplicate model records unnecessarily

It should:

- Record initialization state
- Record connection state
- Record active synchronization state
- Record initial-sync completion
- Record synchronization failures
- Allow the UI to render startup, offline, and error states

---

## Authenticated PowerSync Initialization

PowerSync is mounted inside the authenticated Expo Router route group.

```text
Root Layout
    │
    ├── signed out
    │      └── Login Route
    │
    └── signed in
           └── Authenticated Layout
                  │
                  └── PowerSyncProvider
```

This prevents PowerSync from connecting before a valid authenticated session exists.

The authenticated layout owns the application-level startup sequence:

```text
Authenticated Layout Mounted
          │
          ▼
Initialize PowerSync Database
          │
          ▼
Register Status Listener
          │
          ▼
Connect PowerSync
          │
          ▼
Request / Await Initial Synchronization
          │
          ▼
Update PowerSync Zustand Store
          │
          ▼
Load Required Model Stores
          │
          ▼
Render Authenticated Application
```

This initialization belongs at the authenticated application boundary, not inside an individual screen.

---

## Fresh Installation and Initial Synchronization

A fresh installation begins with an empty local SQLite database.

The application must not assume that mounting a screen or subscribing to a store will automatically populate the database immediately.

The authenticated layout explicitly starts PowerSync and tracks the first synchronization.

```text
Fresh Install
    │
    ▼
Empty SQLite Database
    │
    ▼
Authenticated Layout Starts PowerSync
    │
    ▼
PowerSync Downloads Authorized Rows
    │
    ▼
Initial Sync Completes
    │
    ▼
Model Stores Load Their Working Sets
    │
    ▼
Existing Data Appears
```

This prevents the failure mode where the application remains empty until the user performs a local write that accidentally triggers additional synchronization activity.

The first sync is part of application boot, not a side effect of user interaction.

### Initial Sync vs Background Sync

**Initial sync**

Determines whether a new or cleared installation has received its initial authorized dataset.

**Background sync**

Continues for the authenticated session and propagates later backend and local changes.

The app may block some authenticated screens until the initial sync completes. Temporary network loss after the initial sync should not normally prevent the user from continuing to work with local data.

---

## Zustand Model Stores

Each persisted model may have a Zustand store.

A model store owns the UI-facing state for that model, including:

- Current working set
- Selected record
- Loading state
- Error state
- Filters or pagination state
- Workflow actions
- Repository calls

Example:

```ts
type TodoStore = {
  todos: Todo[];
  selectedTodo: Todo | null;
  loading: boolean;
  error: string | null;

  loadTodos: () => Promise<void>;
  loadTodo: (id: string) => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  updateTodo: (id: string, changes: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  clear: () => void;
};
```

The store calls the repository and updates its working set.

```text
Screen Action
     │
     ▼
Zustand Store Action
     │
     ▼
Repository Mutation
     │
     ▼
Local SQLite
     │
     ▼
Store Refreshes Working Set
```

---

## Pull-Based Store Loading

This template generally uses **explicit pull-based loading** for model stores.

A route, screen, or workflow decides when data should load or refresh.

```ts
useEffect(() => {
  void loadTodos();
}, [loadTodos]);
```

When data must wait for the initial synchronization:

```ts
useEffect(() => {
  if (!initialSyncComplete) {
    return;
  }

  void loadTodos();
}, [initialSyncComplete, loadTodos]);
```

PowerSync keeps the local database synchronized. Zustand exposes bounded snapshots needed by the current UI.

The two systems do not need to become one permanent live subscription graph.

### Why Pull-Based Loading?

Explicit loading provides:

- Predictable workflow boundaries
- Easier debugging
- Fewer hidden subscriptions
- Clear loading behavior
- Clear refresh behavior
- Reduced memory use
- Better control over large datasets
- Easier testing
- Less coupling between PowerSync and UI components

Live queries remain useful for screens that genuinely need continuous reactive updates. They should be introduced deliberately rather than used automatically for every model.

---

## PowerSync Is the Database; Zustand Is the Working Set

PowerSync and Zustand solve different problems.

### PowerSync contains the complete local dataset

```text
PowerSync SQLite
├── 20,000 todos
├── 2,000 lists
├── Pending local mutations
└── Synchronized backend state
```

### Zustand contains what the current workflow needs

```text
TodoStore
├── Current page: 25 todos
├── Selected todo: 1
├── Current filter
├── Loading state
└── Error state
```

Do not load an entire large table into Zustand merely because it exists locally.

Production applications should prefer:

- Pagination
- Filtered queries
- Record-by-ID queries
- Search-specific result sets
- Bounded working sets
- Workflow-specific store slices

Small tutorial models may load complete tables for clarity.

---

## Repository Layer

Repositories own database access.

A repository may:

- Select records
- Insert records
- Update records
- Delete records
- Execute joins
- Apply database filters
- Map database rows into application types

A repository should not contain:

- React hooks
- Zustand state
- Navigation
- Screen state
- UI messages
- Route decisions

```text
Repository
    │
    ▼
Kysely
    │
    ▼
PowerSync SQLite
```

Example:

```ts
export class TodoRepo {
  async getAll(): Promise<Todo[]> {
    return system.kysely
      .selectFrom("todos")
      .selectAll()
      .execute();
  }

  async getById(id: string): Promise<Todo | undefined> {
    return system.kysely
      .selectFrom("todos")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
}
```

Repositories should remain small, testable, and independent of presentation code.

---

## Screen Responsibilities

Screens should be thin.

A screen should:

- Select values from Zustand
- Render components
- Dispatch store actions
- Handle navigation
- Display loading and error states

A screen should not:

- Execute SQL
- Import Kysely
- Construct PowerSync queries
- Call Supabase database APIs directly
- Reimplement synchronization state
- Own persistent application data

```tsx
export default function TodoScreen() {
  const todos = useTodoStore((state) => state.todos);
  const loading = useTodoStore((state) => state.loading);
  const loadTodos = useTodoStore((state) => state.loadTodos);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  if (loading) {
    return <ActivityIndicator />;
  }

  return <TodoList todos={todos} />;
}
```

---

## Project Structure

```text
.
├── migrations/
├── seeds/
├── supabase/
├── sync-rules.yaml
├── package.json
├── app.json
└── src/
    ├── app/
    │   ├── _layout.tsx
    │   ├── login.tsx
    │   ├── +not-found.tsx
    │   └── (app)/
    │       ├── _layout.tsx
    │       └── ...
    │
    ├── components/
    ├── contexts/
    ├── features/
    │   ├── auth/
    │   │   ├── AuthEngine.ts
    │   │   └── AuthStore.ts
    │   └── models/
    │       ├── lists/
    │       │   ├── ListRepo.ts
    │       │   └── ListStore.ts
    │       └── todos/
    │           ├── TodoRepo.ts
    │           └── TodoStore.ts
    ├── lib/
    │   ├── powersync/
    │   │   ├── powersync_system.ts
    │   │   ├── powersync_app_schema.ts
    │   │   ├── powersync_supabase_connector.ts
    │   │   └── ...
    │   ├── supabase/
    │   │   └── ...
    │   ├── kysely_database.ts
    │   ├── local_dev_store.ts
    │   └── secure_store.ts
    ├── providers/
    │   ├── AuthProvider.tsx
    │   └── PowerSyncProvider.tsx
    └── styles/
```

The exact tree may evolve, but the dependency direction should remain stable.

---

## Database Ownership

### Supabase PostgreSQL

The remote authoritative database.

It owns:

- Durable backend storage
- Row Level Security
- Authentication-linked authorization
- Tables, constraints, indexes, and database functions

### PowerSync

The synchronization layer.

It owns:

- Downloading authorized rows
- Maintaining local SQLite state
- Tracking local mutations
- Uploading writes
- Synchronization status

### Kysely

The query and migration layer.

It owns:

- Typed local queries
- Repository queries
- PostgreSQL migrations
- Development seeds

### Zustand

The application state layer.

It owns:

- Authentication state
- PowerSync lifecycle state
- Current model working sets
- Loading state
- Error state
- Selected records
- Workflow actions

Zustand does not own persistent database truth.

---

## Migrations and Seeds

Kysely owns database migrations and seed scripts.

```text
migrations/
seeds/
```

Recommended development workflow:

```text
Edit Schema
    │
    ▼
Create Migration
    │
    ▼
Apply Migration to Local Supabase
    │
    ▼
Update PowerSync Application Schema
    │
    ▼
Update Synchronization Rules
    │
    ▼
Regenerate Database Types
    │
    ▼
Update Repositories and Stores
```

Keep these synchronized:

1. PostgreSQL schema
2. PowerSync client schema
3. PowerSync synchronization rules
4. Generated database types
5. Repository interfaces

---

## Synchronization Rules

The root-level `sync-rules.yaml` determines which rows synchronize to each authenticated user.

Synchronization rules are part of the application's authorization design.

A row existing in PostgreSQL does not automatically mean it should be downloaded to every client.

When adding a synchronized model:

1. Create the PostgreSQL table.
2. Add appropriate Row Level Security policies.
3. Add the model to the PowerSync application schema.
4. Add the required synchronization rules.
5. Create or update the repository.
6. Create or update the Zustand store.
7. Verify fresh-install synchronization.
8. Verify offline writes.
9. Verify upload after reconnection.

---

## Environment Variables

Create an environment file in the project root.

Depending on the project convention, this may be `.env`, `.env.local`, or `.env.development.local`.

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

Server-side development tools may additionally require:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Use the actual PostgreSQL port reported by the local Supabase CLI instance.

Never place these values in an Expo client environment:

- Supabase service-role keys
- Database administrator passwords
- Private PowerSync service credentials
- Other server-only secrets

Only variables prefixed with `EXPO_PUBLIC_` are intended to be bundled into the client.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/khaosduke/powersync-lab.git
cd powersync-lab
```

Install dependencies:

```bash
npm install
```

Configure the required environment variables.

Start Expo:

```bash
npm start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

Run the web target:

```bash
npm run web
```

Run linting:

```bash
npm run lint
```

---

## Native Development Build Requirement

This project uses native SQLite and PowerSync packages, including OP-SQLite.

It should be run through a native development build rather than relying exclusively on Expo Go.

```bash
npm run android
```

or:

```bash
npm run ios
```

After adding or changing native dependencies, rebuild the application.

For iOS, install pods when required:

```bash
npx pod-install
```

---

## Local Supabase Development

Start the local Supabase services:

```bash
supabase start
```

Then apply migrations using the project's Kysely migration workflow.

Local Supabase ports may change between instances or configurations. Confirm the actual PostgreSQL port printed by the Supabase CLI and ensure `DATABASE_URL` points to that port.

The mobile client must also be able to reach local Supabase services from the target simulator or physical device.

Remember:

- `127.0.0.1` inside an Android emulator is not always the host machine.
- A physical device must use a network-reachable host address.
- Local firewall rules may block access.
- Supabase Auth URLs and PowerSync development configuration must match the environment being tested.

---

## Adding a New Model

### 1. Add a PostgreSQL migration

Create the table, indexes, constraints, and ownership fields.

### 2. Add Row Level Security

Define which authenticated users may read and modify each row.

### 3. Update PowerSync synchronization rules

Ensure authorized rows are downloaded to the correct clients.

### 4. Update the PowerSync application schema

```ts
const medications = new Table({
  name: column.text,
  concentration: column.text,
  quantity: column.integer,
  created_by: column.text,
  created_at: column.text,
});
```

### 5. Create the repository

```text
src/features/models/medications/MedicationRepo.ts
```

### 6. Create the Zustand store

```text
src/features/models/medications/MedicationStore.ts
```

### 7. Load the model deliberately

Decide whether the model should load:

- After initial synchronization
- When entering a route
- When opening a workflow
- When the user requests refresh
- Through a deliberate live query

### 8. Keep the screen thin

The screen should consume store state and dispatch store actions.

---

## Example Model Store

```ts
import { create } from "zustand";
import { todoRepo } from "./TodoRepo";

type TodoStore = {
  todos: Todo[];
  selectedTodo: Todo | null;
  loading: boolean;
  error: string | null;

  loadTodos: () => Promise<void>;
  selectTodo: (id: string) => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  updateTodo: (
    id: string,
    changes: UpdateTodoInput,
  ) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reset: () => void;
};

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  selectedTodo: null,
  loading: false,
  error: null,

  loadTodos: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const todos = await todoRepo.getAll();

      set({
        todos,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load todos.",
      });
    }
  },

  selectTodo: async (id) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const selectedTodo = await todoRepo.getById(id);

      set({
        selectedTodo: selectedTodo ?? null,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load todo.",
      });
    }
  },

  createTodo: async (input) => {
    await todoRepo.create(input);
    await get().loadTodos();
  },

  updateTodo: async (id, changes) => {
    await todoRepo.update(id, changes);
    await get().loadTodos();
  },

  deleteTodo: async (id) => {
    await todoRepo.delete(id);
    await get().loadTodos();
  },

  reset: () => {
    set({
      todos: [],
      selectedTodo: null,
      loading: false,
      error: null,
    });
  },
}));
```

The repository persists. The store coordinates.

---

## Example PowerSync Store

```ts
import { create } from "zustand";

type PowerSyncStore = {
  initialized: boolean;
  connected: boolean;
  connecting: boolean;
  syncing: boolean;
  initialSyncComplete: boolean;
  lastSyncedAt: Date | null;
  error: string | null;

  setInitialized: (initialized: boolean) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setInitialSyncComplete: (
    initialSyncComplete: boolean,
  ) => void;
  setLastSyncedAt: (lastSyncedAt: Date | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const usePowerSyncStore =
  create<PowerSyncStore>((set) => ({
    initialized: false,
    connected: false,
    connecting: false,
    syncing: false,
    initialSyncComplete: false,
    lastSyncedAt: null,
    error: null,

    setInitialized: (initialized) => set({ initialized }),
    setConnected: (connected) => set({ connected }),
    setConnecting: (connecting) => set({ connecting }),
    setSyncing: (syncing) => set({ syncing }),

    setInitialSyncComplete: (initialSyncComplete) =>
      set({ initialSyncComplete }),

    setLastSyncedAt: (lastSyncedAt) =>
      set({ lastSyncedAt }),

    setError: (error) => set({ error }),

    reset: () =>
      set({
        initialized: false,
        connected: false,
        connecting: false,
        syncing: false,
        initialSyncComplete: false,
        lastSyncedAt: null,
        error: null,
      }),
  }));
```

The provider updates these fields using PowerSync's real status and connection lifecycle.

---

## Startup Rendering

The application should distinguish between:

- Authentication boot
- PowerSync initialization
- Initial synchronization
- Normal authenticated operation
- Offline authenticated operation
- Fatal startup failure

```tsx
const initialized = usePowerSyncStore(
  (state) => state.initialized,
);

const initialSyncComplete = usePowerSyncStore(
  (state) => state.initialSyncComplete,
);

const error = usePowerSyncStore(
  (state) => state.error,
);

if (error) {
  return <StartupError message={error} />;
}

if (!initialized || !initialSyncComplete) {
  return <StartupLoadingScreen />;
}

return <Slot />;
```

Temporary disconnection after the initial sync should not normally make an offline-first application unusable.

```text
Initial sync incomplete + no local data
    └── Show startup synchronization state

Initial sync complete + network disconnected
    └── Continue using local data offline
```

---

## Sign-Out Cleanup

A complete sign-out workflow may include:

1. Disconnect PowerSync.
2. Stop status listeners.
3. Clear model working sets.
4. Reset the PowerSync Zustand store.
5. Clear or replace the local database when required by the security model.
6. Sign out of Supabase.
7. Return to the unauthenticated route group.

Whether the local database must be deleted depends on the application's threat model and device-sharing requirements.

Applications containing sensitive or multi-tenant data should not allow one authenticated user to inherit another user's synchronized local dataset.

---

## Offline Behavior

```text
User Action
    │
    ▼
Write to Local SQLite
    │
    ▼
UI Refreshes Immediately
    │
    ▼
PowerSync Queues Mutation
    │
    ├── offline ──► remains queued
    │
    └── online ───► uploaded to Supabase
```

Network access should not be placed directly on the critical path of ordinary local data entry.

Test the application under:

- Normal connectivity
- No connectivity at startup
- Connectivity lost after initial sync
- Connectivity restored after local writes
- Fresh installation
- Cleared application storage
- Expired authentication session
- Upload failure
- Multiple devices modifying related data

---

## Testing Checklist

### Authentication

- Existing session restores on cold boot
- Signed-out users reach the login route
- Signed-in users reach authenticated routes
- Claims load correctly
- Sign-out disconnects PowerSync
- Auth changes update the Zustand store

### PowerSync Startup

- PowerSync initializes after authentication
- Status listeners register once
- A fresh installation performs initial synchronization
- Existing rows appear without requiring a local write
- Initial-sync completion is reflected in Zustand
- Initialization errors are visible to the UI

### Offline Operation

- Existing local data remains readable offline
- Local writes succeed offline
- Pending writes upload after reconnection
- The UI reflects disconnected status without becoming unusable
- Repeated reconnects do not create duplicate listeners

### Model Stores

- Stores load through repositories
- Loading state begins and ends correctly
- Errors are surfaced
- Mutations refresh the required working set
- Reset clears user-specific in-memory data
- Stores do not execute SQL directly

### Authorization

- Users receive only rows allowed by synchronization rules
- PostgreSQL Row Level Security blocks unauthorized access
- A second user cannot see the previous user's working set
- Sign-out cleanup matches the application's security requirements

---

## Tutorial Models

The repository uses `lists` and `todos` to demonstrate:

- One-to-many relationships
- Local inserts
- Local updates
- Local deletes
- Authenticated ownership
- Synchronization rules
- Repository boundaries
- Zustand working sets
- Initial data loading

They are examples, not architectural requirements.

To adapt the template:

1. Remove the tutorial screens.
2. Remove the tutorial stores and repositories.
3. Replace the PostgreSQL migrations.
4. Replace the PowerSync schema.
5. Replace `sync-rules.yaml`.
6. Add application-specific models.
7. Preserve the architectural boundaries.

---

## What This Template Is Not

This project is not:

- A complete production security policy
- A replacement for understanding Row Level Security
- A substitute for application-specific conflict handling
- A full ORM
- A requirement to store every database row in Zustand
- A requirement to use live queries everywhere
- A generic backend API abstraction
- A reason to call Supabase directly from every screen

It is a clean foundation for building authenticated, offline-first applications without mixing every concern into React components.

---

## Design Summary

```text
Supabase Auth
    └── establishes identity

PowerSync
    └── synchronizes authorized data

SQLite
    └── serves as immediate local persistence

Kysely
    └── provides structured database access

Repositories
    └── own persistence operations

Zustand PowerSync Store
    └── exposes synchronization lifecycle

Zustand Model Stores
    └── expose bounded UI working sets

Screens
    └── render state and dispatch actions
```

In plain terms:

> PowerSync stores and synchronizes the data. Repositories access it. Zustand organizes what the current workflow needs. Screens render it.

---

## Contributing

Preserve the dependency direction:

```text
UI
  ↓
Zustand Store
  ↓
Repository
  ↓
Kysely / PowerSync
  ↓
SQLite
```

Avoid introducing:

- SQL inside screens
- Supabase database calls inside components
- React hooks inside repositories
- Persistent truth duplicated in Zustand
- PowerSync initialization inside individual model screens
- Hidden startup side effects that only run after user interaction

Pull requests, bug reports, and architectural improvements are welcome.

---
## Misc Notes
The seeds and migrations may not be absolutely correct, conceptually, the seeds should be static data and migrations get introduced and changed as the project continues. You will notice there is no take down for each migration, this is merely a template to get you started and for any production app you should fill in the missing pieces appropriately. Happy hacking. 
___

## License

MIT

---

## Author

**Wilfredo Crespo**

Programmer, paramedic, and builder of practical software for real-world workflows.

GitHub: [khaosduke](https://github.com/khaosduke)
