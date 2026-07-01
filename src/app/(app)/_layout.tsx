import { useSystem } from '@/lib/powersync/powersync_system';
import { PowerSyncProvider } from '@/providers/PowerSyncProvider';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AppLayout() {
  
  const powersyncSystem = useSystem();
  useEffect(() => {
    // Initialize the PowerSync system when the app starts
    powersyncSystem.init();
  }, []);
  
  // This renders the navigation stack for all authenticated app routes.
  return ( 
    <PowerSyncProvider>
      <Stack/>
    </PowerSyncProvider>
  )
}
