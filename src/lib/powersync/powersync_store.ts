import { create } from 'zustand';

import { system } from '@/lib/powersync/powersync_system';

type PowerSyncState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'error';

interface PowerSyncStore {
  state: PowerSyncState;
  error: string | null;

  initialize: () => Promise<void>;
  clearError: () => void;
}

export const usePowerSyncStore = create<PowerSyncStore>((set, get) => ({
  state: 'idle',
  error: null,

  initialize: async () => {
    const currentState = get().state;

    // Prevent duplicate initialization, including React Strict Mode.
    if (
      currentState === 'initializing' ||
      currentState === 'ready'
    ) {
      return;
    }

    set({
      state: 'initializing',
      error: null,
    });

    try {
      await system.init();

      // connect() starts synchronization, but this ensures the initial
      // download has completed before model stores query SQLite.
      await system.powersync.waitForFirstSync();

      set({
        state: 'ready',
        error: null,
      });
    } catch (error) {
      set({
        state: 'error',
        error: error instanceof Error
          ? error.message
          : String(error),
      });
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));