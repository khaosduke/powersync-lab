import { create } from "zustand";

type AuthState = 
    | "booting"
    | "loadingClaims"
    | "signedOut"
    | "signedInNoClaims"
    | "signedInReady"
    | "error";

interface AuthStore {
  state: AuthState;
  user: any | null;
  claims: any | null;

  setState: (state: AuthState) => void;
  setUser: (user: any | null) => void;
  setClaims: (claims: any | null) => void;
  reset: () => void;
}    

export const useAuthStore = create<AuthStore>((set) => ({
  state: "booting",
  user: null,
  claims: null,

  setState: (state) => set({ state }),
  setUser: (user) => set({ user }),
  setClaims: (claims) => set({ claims }),
  reset: () => set({ state: "signedOut", user: null, claims: null }),
}));
