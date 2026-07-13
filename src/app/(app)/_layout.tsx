import { usePowerSyncStore } from '@/lib/powersync/powersync_store';
import { PowerSyncProvider } from '@/providers/PowerSyncProvider';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// IMPORTANT:
//
// PowerSync must complete its initial synchronization before any
// repositories query the local database.
//
// Rendering screens before initialization can result in an empty
// SQLite database on first install, causing model stores to load
// empty state until a later refresh.
//
// Therefore the authenticated application is gated on
// PowerSync initialization.




export default function AppLayout() {
  
  const powerSyncState = usePowerSyncStore((store) => store.state);
  const powerSyncError = usePowerSyncStore((store) => store.error);

  const initializePowerSync = usePowerSyncStore(
    (store) => store.initialize
  );

  useEffect(() => {
    void initializePowerSync();
  }, [initializePowerSync]);

  if (
    powerSyncState === 'idle' ||
    powerSyncState === 'initializing'
  ) {
    return (
      <View>
        <ActivityIndicator />
        <Text>Loading local data...</Text>
      </View>
    );
  }

  if (powerSyncState === 'error') {
    return (
      <View>
        <Text>Unable to initialize PowerSync.</Text>
        <Text>{powerSyncError}</Text>
      </View>
    );
  }

  return (
    <PowerSyncProvider>
      <Stack />
    </PowerSyncProvider>
  );
}
