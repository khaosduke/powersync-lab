// src/features/auth/AuthEngine.ts
import { supabase } from '@/lib/supabase/supabase'
import { useAuthStore } from './AuthStore'

/**
 * AuthEngine
 *
 * Responsibilities:
 * -----------------
 * AuthEngine contains the non-React authentication machinery for the app.
 * It is responsible for synchronizing Supabase Auth with the Zustand AuthStore.
 *
 * Architecture:
 * -------------
 * Supabase Auth
 *      ↓
 * AuthEngine
 *      ↓
 * Zustand AuthStore
 *      ↓
 * AuthProvider
 *      ↓
 * Route Guards / UI
 *
 * AuthEngine:
 * -----------
 * Owns the actual authentication workflow:
 * - bootstrapping persisted sessions
 * - subscribing to Supabase auth changes
 * - loading claims
 * - signing out
 * - mutating the Zustand AuthStore
 *
 * AuthProvider:
 * -------------
 * Acts only as the React adapter around AuthEngine.
 * It should mount the auth subscription, run bootstrapAuth(), clean up the
 * subscription on unmount, and expose auth actions through AuthContext.
 *
 * AuthContext:
 * ------------
 * Exists only to expose auth actions to the UI, currently signOut().
 * It does not store auth state.
 *
 * AuthStore:
 * ----------
 * Zustand is the source of truth for UI-facing auth state.
 * Components should read auth state from AuthStore using selectors.
 *
 * Auth State Machine:
 * -------------------
 * booting
 *   Initial startup. The app has not yet checked for a persisted session.
 *
 * signedOut
 *   No valid Supabase session exists.
 *
 * signedInNoClaims
 *   A valid Supabase session exists, but claims have not been loaded yet.
 *
 * loadingClaims
 *   Claims are actively being fetched from Supabase.
 *
 * signedInReady
 *   Session and claims are loaded. Protected routes may render.
 *
 * error
 *   Session or claims flow failed in a way the app should not ignore.
 *
 * Startup Flow:
 * -------------
 * bootstrapAuth()
 *   -> booting
 *   -> getSession()
 *
 * If no session:
 *   -> reset()
 *   -> signedOut
 *
 * If session exists:
 *   -> setUser(session.user)
 *   -> clear claims
 *   -> signedInNoClaims
 *   -> loadClaims()
 *   -> loadingClaims
 *   -> signedInReady
 *
 * Auth Change Flow:
 * -----------------
 * subscribeToAuthChanges()
 *   -> listens to Supabase onAuthStateChange()
 *
 * If session removed:
 *   -> reset()
 *   -> signedOut
 *
 * If session detected:
 *   -> setUser(session.user)
 *   -> clear claims
 *   -> signedInNoClaims
 *   -> loadClaims()
 *   -> signedInReady
 *
 * Design Rules:
 * -------------
 * - Supabase is the source of truth for the real auth session.
 * - AuthEngine is the only place that talks directly to Supabase Auth.
 * - AuthEngine is the only non-store layer that mutates AuthStore.
 * - Zustand AuthStore is the source of truth for UI auth state.
 * - AuthProvider should stay thin and act only as the React lifecycle adapter.
 * - AuthContext should expose actions, not state.
 * - Route guards should only allow protected routes when state is
 *   "signedInReady".
 *
 * Useful Invariants:
 * ------------------
 * signedOut:
 *   user === null
 *   claims === null
 *
 * signedInNoClaims / loadingClaims:
 *   user !== null
 *   claims === null
 *
 * signedInReady:
 *   user !== null
 *   claims !== null
 */



async function loadClaims() {
  const store = useAuthStore.getState()

  store.setState("loadingClaims")

  const { data, error } = await supabase.auth.getClaims()

  if (error) {
    console.error("Error fetching claims:", error)
    store.setClaims(null)
    store.setState("error")
    return
  }

  store.setClaims(data?.claims ?? null)
  store.setState("signedInReady")
  console.log('AUTH STATE CHANGE:', useAuthStore.getState().state)
}

export async function bootstrapAuth() {
  const store = useAuthStore.getState()

  store.setState("booting")

  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    store.reset()
    return
  }

  store.setUser(data.session.user)
  store.setClaims(null)
  store.setState("signedInNoClaims")

  await loadClaims()
}

export function subscribeToAuthChanges() {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const store = useAuthStore.getState()

    if (!session?.user) {
      store.reset()
      console.log('No active session');
      console.log('AUTH STATE CHANGE:', useAuthStore.getState().state)
      return
    }

    store.setUser(session.user)
    store.setClaims(null)
    store.setState("signedInNoClaims")

    void loadClaims()
  })

  return () => subscription.unsubscribe()
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error)
    useAuthStore.getState().setState("error")
    return
  }

  useAuthStore.getState().reset()
}