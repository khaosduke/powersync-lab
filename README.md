# Expo Zustand Auth

A lightweight authentication starter template for Expo applications using:

- Expo
- React Native
- Supabase Auth
- Zustand
- TypeScript

This project exists because authentication is one of the first hurdles every Expo application encounters, yet most examples are tightly coupled to a specific application.

The goal of this template is to provide a clean, reusable authentication foundation that can be dropped into any Expo project and extended as needed.

---

## Features

- Supabase Authentication
- Zustand as the single source of truth
- Auth state machine for predictable state transitions
- Session restoration on cold boot
- Claims loading support
- Splash screen driven by auth state
- Minimal boilerplate
- TypeScript support
- Expo Router compatible

---

## Philosophy

Instead of scattering authentication state across components, contexts, hooks, and effects, this template centralizes auth into a Zustand store.

The application responds to authentication state changes and updates the store accordingly.

UI should react to the store.

This creates a predictable authentication flow and eliminates many common race conditions that occur during startup.

---

## Authentication State Machine

The auth store transitions through several states:

```text
booting
    ↓
loadingClaims
    ↓
signedOut
    OR
signedInNoClaims
    OR
signedInReady
    OR
error
```

### States

| State | Description |
|---------|-------------|
| booting | Initial application startup |
| loadingClaims | Session found, claims loading |
| signedOut | User not authenticated |
| signedInNoClaims | User authenticated but claims unavailable |
| signedInReady | User authenticated and ready |
| error | Authentication failure |

---

## Installation

Clone the repository:

```bash
git clone https://github.com/khaosduke/expo-zustand-auth.git
cd expo-zustand-auth
```

Install dependencies:

```bash
npm install
```

or

```bash
pnpm install
```

or

```bash
yarn
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values can be found in your Supabase Dashboard:

```text
Project Settings
    → API
```

### Important

The application will not function without valid Supabase credentials.

Do not commit service role keys or other sensitive credentials.

Only the public project URL and anonymous key should be used in an Expo client application.

---

## Supabase Setup

1. Create a Supabase project.
2. Navigate to:

```text
Authentication
    → Providers
```

3. Enable the authentication providers you want to support.
4. Copy your Project URL and Anon Key.
5. Add them to your `.env` file.

---

## Running the App

Start the Expo development server:

```bash
npx expo start
```

Run Android:

```bash
npx expo run:android
```

Run iOS:

```bash
npx expo run:ios
```

---

## Project Structure

```text
src/
├── features/
│   └── auth/
│       ├── AuthStore.ts
│       ├── AuthEngine.ts
│       └── ...
│
├── providers/
│   └── AuthProvider.tsx
│
├── lib/
│   └── supabase.ts
│
└── app/
    └── routes...
```

---

## Auth Flow

1. Application starts
2. AuthProvider initializes
3. Existing Supabase session is restored
4. Zustand store enters `loadingClaims`
5. Claims are fetched
6. Store transitions to:
   - `signedInReady`
   - `signedInNoClaims`
   - `signedOut`
   - `error`
7. UI renders based on auth state

---

## Why Zustand?

Zustand provides:

- Minimal boilerplate
- Simple API
- Excellent TypeScript support
- No reducers
- No actions files
- Easy testing
- Easy extraction into reusable libraries

For authentication state, it is often simpler than Redux and more predictable than spreading auth logic across multiple React Context providers.

---

## Extending the Template

Common additions include:

- Role-based authorization
- User profile management
- Organization support
- Multi-tenant applications
- OAuth providers
- Password reset flows
- Offline persistence
- Feature flags
- Analytics
- Audit logging

---

## Intended Use

This repository is intended as a reusable authentication foundation.

Start here, verify authentication works, then build application-specific features on top.

Potential use cases:

- SaaS applications
- Internal tools
- Mobile applications
- EMS software
- Inventory systems
- CRM platforms
- Field service applications

---

## Contributing

Pull requests are welcome.

If you discover a bug, have a suggestion, or want to improve the template, please open an issue.

---

## Author

**Wilfredo Crespo**

Paramedic, software developer, and creator of Expo Zustand Auth.

GitHub: https://github.com/khaosduke

---

## License

MIT

NOTES
Now requires, kysely, kysely-ctl as a dep