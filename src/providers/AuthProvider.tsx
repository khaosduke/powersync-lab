// src/providers/AuthProvider.tsx
import { AuthContext } from '@/contexts/AuthContext'
import {
  bootstrapAuth,
  signOut,
  subscribeToAuthChanges,
} from '@/features/auth/AuthEngine'
import { PropsWithChildren, useEffect } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges()
    void bootstrapAuth()

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ signOut }}>
      {children}
    </AuthContext.Provider>
  )
}