
import { createClient } from "@supabase/supabase-js";
import { LargeSecureStore } from "./secure_store";

import 'react-native-get-random-values';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

const storage = new LargeSecureStore()

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage:storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});