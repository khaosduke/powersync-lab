//import { useAuthContext } from '@/contexts/AuthContext'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '../features/auth/AuthStore'


SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const state = useAuthStore((state) => state.state)

  useEffect(() => {
    if (
      state === "signedInReady" ||
      state === "signedOut" ||
      state === "error"
    ) {
      void SplashScreen.hideAsync()
    }
  }, [state])

  return null

}