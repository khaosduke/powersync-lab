import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { SplashScreenController } from '@/components/SplashScreen'
import { useAuthStore } from '@/features/auth/AuthStore'
import AuthProvider from '@/providers/AuthProvider'
import { useColorScheme } from 'react-native'

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const authState = useAuthStore((state) => state.state)

  if (
    authState === "booting" ||
    authState === "loadingClaims" ||
    authState === "signedInNoClaims"
  ) {
    return null
  }


  return (
    <Stack>
      <Stack.Protected guard={authState === "signedInReady"}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={authState === "signedOut"}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <AuthProvider>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="auto" />
    </AuthProvider>
    
  )
}