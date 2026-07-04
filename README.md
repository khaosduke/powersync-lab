# Expo PowerSync Template

A production-ready Expo template for building **offline-first React Native applications** using modern tooling and a clean, layered architecture.

## Stack

- ⚡ Expo
- 🔐 Supabase Authentication
- 🔄 PowerSync
- 🗄️ Kysely
- 🧠 Zustand
- 📱 Expo Router
- 🟦 TypeScript

---

# Philosophy

This template was built around a few simple ideas:

- Authentication should be isolated.
- Persistence should be isolated.
- UI should not know SQL.
- PowerSync should be the source of truth.
- Zustand should manage application state—not duplicate the database.
- Boilerplate should be generated whenever possible.

The result is an architecture that scales well while remaining easy to understand.

---

# Features

- ✅ Expo Router
- ✅ Supabase Authentication
- ✅ Offline-first PowerSync synchronization
- ✅ Local SQLite database
- ✅ Kysely query builder
- ✅ Zustand state management
- ✅ Feature-oriented architecture
- ✅ Automatic model scaffolding
- ✅ Strong separation of concerns

---

# Architecture

## Authentication

Authentication is completely isolated from the rest of the application.

```text
AuthProvider
      │
      ▼
Auth Engine
      │
      ▼
Zustand Auth Store
      │
      ▼
Application
```

The authentication engine is responsible for:

- Restoring sessions
- Listening for authentication changes
- Loading claims
- Updating the Zustand store

Screens never communicate directly with Supabase Authentication.

---

## PowerSync

PowerSync owns local persistence and synchronization.

```text
PowerSync
      │
      ▼
SQLite
      │
      ▼
Kysely
```

A singleton `System` owns:

- PowerSync database
- Kysely instance
- Supabase connector

React components access the system using:

```ts
const system = useSystem();
```

Non-React code should import the singleton directly:

```ts
import { system } from "@/lib/powersync/powersync_system";
```

This keeps repositories independent of React while avoiding violations of the Rules of Hooks.

---

# Project Structure

```text
src/

    app/

    components/

    providers/

        AuthProvider.tsx
        PowerSyncProvider.tsx

    lib/

        auth/

        powersync/

            powersync_system.ts
            powersync_app_schema.ts
            powersync_supabase_connector.ts

    features/

        auth/

        models/

            todos/

                TodoRepo.ts
                TodoStore.ts

            lists/

                ListRepo.ts
                ListStore.ts
```

---

# Model Architecture

Every persisted model follows the same structure.

```text
features/models/<model>/

    ModelRepo.ts
    ModelStore.ts
```

Example:

```text
features/models/todos/

    TodoRepo.ts
    TodoStore.ts
```

---

## Repository Layer

Repositories own **database access only**.

Responsibilities:

- Read
- Create
- Update
- Delete

Repositories should **not** contain:

- React
- Zustand
- Navigation
- UI logic
- Screen logic

```text
Repository
      │
      ▼
PowerSync
      │
      ▼
SQLite
```

---

## Zustand Store

Stores own **application state**.

Responsibilities:

- Loading state
- Error state
- Current working set
- Calling repository methods

Stores should **never** own persistence.

---

## Screens

Screens should remain as thin as possible.

Their responsibilities are simply to:

- Display state
- Dispatch actions

Screens should never contain SQL.

---

# Working Set Philosophy

PowerSync is the **complete local database**.

Zustand is **not**.

Instead, Zustand represents only the application's **current working set**.

```text
PowerSync

20,000 rows

      │

Repository

query

      │

Zustand

Current page
10 rows

Selected item
1 row

Loading state
Error state
Filters
```

This keeps memory usage low while allowing PowerSync to remain the application's source of truth.

For simplicity, this template may temporarily load an entire table.

Production applications should instead prefer:

- Pagination
- Filtered queries
- Querying individual records
- Bounded working sets

---

# Data Flow

Application dependencies always flow downward.

```text
Screen

      │

Zustand Store

      │

Repository

      │

PowerSync / Kysely

      │

SQLite
```

---

# Model Generator

This template includes a TypeScript model generator.

Generate a new model:

```bash
npm run generate:model todo
```

Example output:

```text
src/

    features/

        models/

            todos/

                TodoRepo.ts

                TodoStore.ts
```

The generator reads directly from:

```text
src/lib/powersync/powersync_app_schema.ts
```

Example schema:

```ts
const todos = new Table({
    description: column.text,
    completed: column.integer,
    completed_by: column.text,
    created_by: column.text,
    list_id: column.text
});
```

From that definition the generator creates:

- Repository
- Zustand Store
- Matching TypeScript interface

This keeps every model consistent throughout the project.

---

# Installation

Clone the repository:

```bash
git clone <repo-url>
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

---

# Development

The project includes TypeScript development scripts powered by **tsx**.

Example:

```bash
npm run generate:model todo
```

Additional developer tooling can be added over time, such as:

- Schema verification
- Synchronization verification
- Seed generation
- Migration helpers

---

# Contributing

The project intentionally follows strict architectural boundaries.

When adding a new model:

1. Define the PowerSync table.
2. Run the model generator.
3. Implement repository CRUD.
4. Implement store workflows.
5. Keep screens free of persistence logic.

Following this pattern keeps the codebase consistent and easy to maintain.

---

# License

MIT

---

# Author

## Wilfredo Crespo

*Programmer. Paramedic. Building software to solve real-world problems through practical engineering and thoughtful design.*