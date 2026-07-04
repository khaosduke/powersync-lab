import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { SplashScreenController } from '@/components/SplashScreen'
import { useAuthStore } from '@/features/auth/AuthStore'
import AuthProvider from '@/providers/AuthProvider'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
//TODO: Ensure splash screen has a timeout and is hidden when the app is ready to render. Currently, the splash screen is hidden too early, causing a flash of white before the app renders.
//TODO: If the timeout has been reached, show an error, in other words, the splash screen was there for say 30 seconds 


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
        <GestureHandlerRootView>
          <RootNavigator />
          <StatusBar style="auto" />
        </GestureHandlerRootView>
    </AuthProvider>
    
  )
}